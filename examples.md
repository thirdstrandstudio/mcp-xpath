# MCP XSLT Server Examples

This document provides examples of how to use the MCP XSLT server.

## XSLT Transformation Example

### Input XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="cooking">
    <title lang="en">Everyday Italian</title>
    <author>Giada De Laurentiis</author>
    <year>2005</year>
    <price>30.00</price>
  </book>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>
```

### XSLT Stylesheet
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <html>
  <body>
    <h2>My Book Collection</h2>
    <table border="1">
      <tr bgcolor="#9acd32">
        <th>Title</th>
        <th>Author</th>
        <th>Year</th>
        <th>Price</th>
      </tr>
      <xsl:for-each select="bookstore/book">
      <tr>
        <td><xsl:value-of select="title"/></td>
        <td><xsl:value-of select="author"/></td>
        <td><xsl:value-of select="year"/></td>
        <td><xsl:value-of select="price"/></td>
      </tr>
      </xsl:for-each>
    </table>
  </body>
  </html>
</xsl:template>
</xsl:stylesheet>
```

### MCP Command
```json
{
  "command": "transform",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "xslt": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\">...</xsl:stylesheet>"
  }
}
```

## XPath Query Examples

### Simple XPath Queries

1. Select all book titles:
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "//title"
  }
}
```

2. Select the title of the first book:
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "/bookstore/book[1]/title"
  }
}
```

3. Count the number of books:
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "count(/bookstore/book)"
  }
}
```

4. Select books with a price greater than 35:
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "/bookstore/book[price > 35]"
  }
}
```

5. Select all books published after 2004:
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "/bookstore/book[year > 2004]"
  }
}
```

### Complex XPath Queries

1. Select book titles with the category attribute equal to "web":
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "/bookstore/book[@category='web']/title"
  }
}
```

2. Select the average price of all books:
```json
{
  "command": "xpath",
  "parameters": {
    "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bookstore>...</bookstore>",
    "query": "sum(/bookstore/book/price) div count(/bookstore/book)"
  }
}
``` 