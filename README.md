# MCP XSLT Server

A Model Context Protocol (MCP) server for XML transformations and XPath queries.

## Features

- Transform XML using XSLT stylesheets
- Execute XPath queries on XML documents
- Compatible with the Model Context Protocol (MCP)

## Installation

```bash
npm install @modelcontextprotocol/server-xslt
```

## Usage

### As a CLI tool

```bash
npx mcp-server-xslt
```

## MCP Tools

The server implements two MCP tools:

### transform

Transform XML using an XSLT stylesheet.

Parameters:
- `xml`: The XML content to transform
- `xslt`: The XSLT stylesheet to apply

Example:
```json
{
  "name": "transform",
  "params": {
    "xml": "<root><item>value</item></root>",
    "xslt": "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"><xsl:template match=\"/\"><result><xsl:value-of select=\"/root/item\"/></result></xsl:template></xsl:stylesheet>"
  }
}
```

### xpath

Execute an XPath query on XML content.

Parameters:
- `xml`: The XML content to query
- `query`: The XPath query to execute

Example:
```json
{
  "name": "xpath",
  "params": {
    "xml": "<root><item>value</item></root>",
    "query": "/root/item/text()"
  }
}
```

## Development

### Running Tests

```bash
npm test
```

### Building the Package

```bash
npm run build
```

## Implementation Details

This server is built using:

- The Model Context Protocol TypeScript SDK
- `xslt-processor` library for XML processing and XSLT transformations
- Zod for parameter validation

## License

MIT
 
