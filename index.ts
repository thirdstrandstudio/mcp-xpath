#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Xslt, XmlParser } from 'xslt-processor';
import { z } from 'zod';

// Initialize XML parser and XSLT processor
const xmlParser = new XmlParser();
const xslt = new Xslt();

// Define Zod schemas for validation
const TransformArgumentsSchema = z.object({
  xml: z.string().describe("The XML content to transform"),
  xslt: z.string().describe("The XSLT stylesheet to apply to the XML")
});

const XPathArgumentsSchema = z.object({
  xml: z.string().describe("The XML content to query"),
  query: z.string().describe("The XPath query to execute")
});

// Create server instance
const server = new Server(
  {
    name: "xpath-xslt-processor",
    version: "0.6.2"
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "transform",
        description: "Transform XML content using an XSLT stylesheet",
        inputSchema: {
          type: "object",
          properties: {
            xml: {
              type: "string",
              description: "The XML content to transform",
            },
            xslt: {
              type: "string",
              description: "The XSLT stylesheet to apply to the XML",
            },
          },
          required: ["xml", "xslt"],
        },
      },
      {
        name: "xpath",
        description: "Query XML content using XPath",
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
          },
          required: ["xml", "query"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "transform") {
      const { xml, xslt: xsltString } = TransformArgumentsSchema.parse(args);
      
      // Parse XML and XSLT
      const parsedXml = xmlParser.xmlParse(xml);
      const parsedXslt = xmlParser.xmlParse(xsltString);

      // Apply transformation
      const result = await xslt.xsltProcess(parsedXml, parsedXslt);
      
      return {
        content: [{ type: "text", text: result }],
      };
    } 
    else if (name === "xpath") {
      const { xml, query } = XPathArgumentsSchema.parse(args);
      
      // Parse XML
      const parsedXml = xmlParser.xmlParse(xml);
      
      try {
        // Use XSLT to extract the XPath result
        const xsltTemplate = `
          <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="xml" omit-xml-declaration="yes"/>
            <xsl:template match="/">
              <result>
                <xsl:copy-of select="${query}"/>
              </result>
            </xsl:template>
          </xsl:stylesheet>
        `;
        
        const parsedXslt = xmlParser.xmlParse(xsltTemplate);
        const result = await xslt.xsltProcess(parsedXml, parsedXslt);
        
        return { 
          content: [{ type: "text", text: result }] 
        };
      } catch (xpathError) {
        // If the XPath can't be evaluated via XSLT (e.g., if it returns a string/number/boolean)
        // Try an alternative approach
        const valueXsltTemplate = `
          <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="text"/>
            <xsl:template match="/">
              <xsl:value-of select="${query}"/>
            </xsl:template>
          </xsl:stylesheet>
        `;
        
        const parsedValueXslt = xmlParser.xmlParse(valueXsltTemplate);
        const valueResult = await xslt.xsltProcess(parsedXml, parsedValueXslt);
        
        return { 
          content: [{ type: "text", text: valueResult }] 
        };
      }
    } 
    else {
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
    console.error("Starting XSLT MCP Server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("XSLT MCP Server running on stdio");
  } catch (error) {
    console.error("Error during startup:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
