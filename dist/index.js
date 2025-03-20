#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Xslt, XmlParser } from 'xslt-processor';
import { z } from 'zod';
// Initialize XML parser and XSLT processor
const xmlParser = new XmlParser();
const xslt = new Xslt();
// Create an MCP server
const server = new McpServer({
    name: "xslt-processor",
    version: "0.6.2"
});
// Register the transform tool
server.tool("transform", {
    xml: z.string().describe("The XML content to transform"),
    xslt: z.string().describe("The XSLT stylesheet to apply to the XML")
}, async (params) => {
    try {
        // Parse XML and XSLT
        const parsedXml = xmlParser.xmlParse(params.xml);
        const parsedXslt = xmlParser.xmlParse(params.xslt);
        // Apply transformation
        const result = await xslt.xsltProcess(parsedXml, parsedXslt);
        return { content: [{ type: "text", text: result }] };
    }
    catch (error) {
        throw new Error(`XSLT transformation failed: ${error.message}`);
    }
});
// Register the xpath tool
server.tool("xpath", {
    xml: z.string().describe("The XML content to query"),
    query: z.string().describe("The XPath query to execute")
}, async (params) => {
    try {
        // Parse XML
        const parsedXml = xmlParser.xmlParse(params.xml);
        // Simplified approach - we'll convert XML to string representation and extract nodes
        // This is a workaround for the complex typing issues with XPath
        try {
            // Use XSLT to extract the XPath result
            // This creates a simple XSLT stylesheet that just outputs the XPath result
            const xsltTemplate = `
          <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="xml" omit-xml-declaration="yes"/>
            <xsl:template match="/">
              <result>
                <xsl:copy-of select="${params.query}"/>
              </result>
            </xsl:template>
          </xsl:stylesheet>
        `;
            const parsedXslt = xmlParser.xmlParse(xsltTemplate);
            const result = await xslt.xsltProcess(parsedXml, parsedXslt);
            return { content: [{ type: "text", text: result }] };
        }
        catch (xpathError) {
            // If the XPath can't be evaluated via XSLT (e.g., if it returns a string/number/boolean)
            // Try an alternative approach
            const valueXsltTemplate = `
          <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="text"/>
            <xsl:template match="/">
              <xsl:value-of select="${params.query}"/>
            </xsl:template>
          </xsl:stylesheet>
        `;
            const parsedValueXslt = xmlParser.xmlParse(valueXsltTemplate);
            const valueResult = await xslt.xsltProcess(parsedXml, parsedValueXslt);
            return { content: [{ type: "text", text: valueResult }] };
        }
    }
    catch (error) {
        throw new Error(`XPath query failed: ${error.message}`);
    }
});
// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
