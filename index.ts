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

const parser = new DOMParser();

const SelectArgumentsSchema = z.object({
    xml: z.string().describe("The XML content to query"),
    query: z.string().describe("The XPath query to execute"),
    mimeType: z.string().describe("The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)")
});

// Create server instance
const server = new Server(
    {
        name: "xpath",
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
                name: "select",
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
            }
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "select") {
            const { xml, query, mimeType } = SelectArgumentsSchema.parse(args);

            // Parse XML
            const parsedXml = parser.parseFromString(xml, mimeType);
            const result = xpath.select(query, parsedXml)?.toString();

            return {
                content: [{ type: "text", text: JSON.stringify(result) }]
            };
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
