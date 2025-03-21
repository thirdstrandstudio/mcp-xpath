#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import xpath from "xpath";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { z } from 'zod';
import puppeteer from 'puppeteer';

const parser = new DOMParser();

const XPathArgumentsSchema = z.object({
    xml: z.string().describe("The XML content to query"),
    query: z.string().describe("The XPath query to execute"),
    mimeType: z.string()
    .describe("The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)")
    .default("text/html")
});

const XPathWithUrlArgumentsSchema = z.object({
    url: z.string().url().describe("The URL to fetch XML/HTML content from"),
    query: z.string().describe("The XPath query to execute"),
    mimeType: z.string()
    .describe("The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)")
    .default("text/html")
});

// Create server instance
const server = new Server(
    {
        name: "mcp_xpath",
        version: "0.6.2"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);


function resultToString(result: string | number | boolean | Node | Node[] | null): string {
    if (result === null) {
        return "null";
    } else if (Array.isArray(result)) {
        return result.map(resultToString).join("\n");
    } else if (typeof result === 'object' && result.nodeType !== undefined) {
        // Handle DOM nodes
        if (result.nodeType === 1) { // Element node
            const serializer = new XMLSerializer();
            return serializer.serializeToString(result);
        } else if (result.nodeType === 2) { // Attribute node
            return `${result.nodeName}="${result.nodeValue}"`;
        } else if (result.nodeType === 3) { // Text node
            return result.nodeValue || "";
        } else {
            // Default fallback for other node types
            try {
                const serializer = new XMLSerializer();
                return serializer.serializeToString(result);
            } catch (e) {
                return String(result);
            }
        }
    } else {
        return String(result);
    }
}
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "xpath",
                description: "Select query XML content using XPath",
                inputSchema: {
                    type: "object",
                    properties: {
                        xml: {
                            type: "string",
                            description: "The XML content to query",
                        },
                        query: {
                            type: "string",
                            description: "The XPath query to execute",
                        },
                        mimeType: {
                            type: "string",
                            description: "The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)",
                            default: "text/html"
                        }
                    },
                    required: ["xml", "query"],
                },
            },
            {
                name: "xpathwithurl",
                description: "Fetch content from a URL and select query it using XPath",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The URL to fetch XML/HTML content from",
                        },
                        query: {
                            type: "string",
                            description: "The XPath query to execute",
                        },
                        mimeType: {
                            type: "string",
                            description: "The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)",
                            default: "text/html"
                        }
                    },
                    required: ["url", "query"],
                },
            }
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "xpath") {
            const { xml, query, mimeType } = XPathArgumentsSchema.parse(args);

            try {
                // Parse XML
                const firstOpeningTag = xml.indexOf("<");
                const lastClosingTag = xml.lastIndexOf(">");
                const sanitizedXml = xml.substring(firstOpeningTag, lastClosingTag + 1);
                const parsedXml = parser.parseFromString(sanitizedXml, mimeType);
                
                // Check for parsing errors
                const errors = xpath.select('//parsererror', parsedXml);
                if (Array.isArray(errors) && errors.length > 0) {
                    return {
                        content: [{ type: "text", text: "XML parsing error: " + resultToString(errors[0]) }]
                    };
                }
                
                const result = xpath.select(query, parsedXml);
                
                // If result is an empty array, provide more information
                if (Array.isArray(result) && result.length === 0) {
                    return {
                        content: [{ type: "text", text: "No nodes matched the query." }]
                    };
                }
                
                return {
                    content: [{ type: "text", text: resultToString(result) }]
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `Error processing XPath query: ${errorMessage}` }]
                };
            }
        } else if (name === "xpathwithurl") {
            const { url, query, mimeType } = XPathWithUrlArgumentsSchema.parse(args);
            
            // Launch puppeteer browser
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            try {
                // Navigate to the URL and wait until network is idle
                await page.goto(url, { waitUntil: 'networkidle0' });
                
                // Get the rendered HTML
                const xml = await page.content();
                
                // Parse XML
                const parsedXml = parser.parseFromString(xml, mimeType);
                
                // Check for parsing errors
                const errors = xpath.select('//parsererror', parsedXml);
                if (Array.isArray(errors) && errors.length > 0) {
                    return {
                        content: [{ type: "text", text: "XML parsing error: " + resultToString(errors[0]) }]
                    };
                }
                
                const result = xpath.select(query, parsedXml);
                
                // If result is an empty array, provide more information
                if (Array.isArray(result) && result.length === 0) {
                    return {
                        content: [{ type: "text", text: "No nodes matched the query." }]
                    };
                }
                
                return {
                    content: [{ type: "text", text: resultToString(result) }]
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `Error processing XPath query: ${errorMessage}` }]
                };
            } finally {
                // Make sure to close the browser
                await browser.close();
            }
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Invalid arguments: ${error.errors
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(", ")}`
            );
        }
        throw error;
    }
});

// Start the server
async function main() {
    try {
        console.error("Starting XPATH MCP Server...");
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("XPATH MCP Server running on stdio");
    } catch (error) {
        console.error("Error during startup:", error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
