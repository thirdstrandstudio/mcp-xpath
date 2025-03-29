# XPath MCP Server

[![Third Strand Studio](https://img.shields.io/badge/Third%20Strand%20Studio-Visit%20Us-blue)](https://thirdstrandstudio.com)


MCP Server for executing XPath queries on XML content.

![image](https://github.com/user-attachments/assets/369045f3-1cdb-4204-9c62-0f5f32636262)

[![smithery badge](https://smithery.ai/badge/@thirdstrandstudio/mcp-xpath)](https://smithery.ai/server/@thirdstrandstudio/mcp-xpath)

## Tools

1. `xpath`
   - Query XML content using XPath expressions
   - Inputs:
     - `xml` (string): The XML content to query
     - `query` (string): The XPath query to execute
     - `mimeType` (optional, string): The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)
   - Returns: The result of the XPath query as a string

2. `xpathwithurl`
   - Fetch content from a URL and query it using XPath expressions
   - Inputs:
     - `url` (string): The URL to fetch XML/HTML content from
     - `query` (string): The XPath query to execute
     - `mimeType` (optional, string): The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)
   - Returns: The result of the XPath query as a string

## Installation

### Installing via Smithery

To install mcp-xpath for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@thirdstrandstudio/mcp-xpath):

```bash
npx -y @smithery/cli install @thirdstrandstudio/mcp-xpath --client claude
```

```bash
# Install dependencies
npm install

# Build the package
npm run build
```

## Setup

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### npx

```json
{
  "mcpServers": {
    "xpath": {
      "command": "npx",
      "args": [
        "@thirdstrandstudio/mcp-xpath"
      ]
    }
  }
}
```

#### Direct Node.js

```json
{
  "mcpServers": {
    "xpath": {
      "command": "node",
      "args": [
        "/path/to/mcp-xpath/dist/index.js"
      ]
    }
  }
}
```

Replace `/path/to/mcp-xpath` with the actual path to your repository.


## Examples

### Query XML content

```javascript
// Select all <item> elements from XML
const result = await callTool("xpath", {
  xml: "<root><item>value1</item><item>value2</item></root>",
  query: "//item/text()",
  mimeType: "text/xml"
});
```

### Query HTML content

```javascript
// Get all links from HTML
const result = await callTool("xpath", {
  xml: "<html><body><a href='link1.html'>Link 1</a><a href='link2.html'>Link 2</a></body></html>",
  query: "//a/@href",
  mimeType: "text/html"
});
```

### Query URL content

```javascript
// Get all links from a webpage
const result = await callTool("xpathwithurl", {
  url: "https://example.com",
  query: "//a/@href",
  mimeType: "text/html"
});
```

## Development

```bash
# Install dependencies
npm install

# Start the server in development mode
npm start
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
