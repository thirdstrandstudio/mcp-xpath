# XPath MCP Server

MCP Server for executing XPath queries on XML content.

## Tools

1. `select`
   - Query XML content using XPath expressions
   - Inputs:
     - `xml` (string): The XML content to query
     - `query` (string): The XPath query to execute
     - `mimeType` (optional, string): The MIME type (e.g. text/xml, application/xml, text/html, application/xhtml+xml)
   - Returns: The result of the XPath query as a string

## Installation

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
        "@jayarrowz/mcp-xpath"
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


## Development

```bash
# Install dependencies
npm install

# Start the server in development mode
npm start
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository. 