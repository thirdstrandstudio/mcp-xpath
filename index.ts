#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import xpath from "xpath";
import { DOMParser } from "@xmldom/xmldom";
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

            // Parse XML
            const parsedXml = parser.parseFromString(xml, mimeType);
            const result = xpath.select(query, parsedXml);

            return {
                content: [{ type: "text", text: result?.toString() }]
            };
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
                const result = xpath.select(query, parsedXml);
                
                return {
                    content: [{ type: "text", text: result?.toString() }]
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
