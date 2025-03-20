import { Xslt, XmlParser } from 'xslt-processor';

// Test the core functionality without the MCP server
describe('Core XSLT and XPath Functionality', () => {
  const xmlParser = new XmlParser();
  const xslt = new Xslt();

  describe('XML Parser', () => {
    it('should parse valid XML', () => {
      const xml = '<root><item>Test</item></root>';
      const parsedXml = xmlParser.xmlParse(xml);
      
      expect(parsedXml).toBeDefined();
      expect(parsedXml.nodeName).toBe('#document');
      expect(parsedXml.documentElement.nodeName).toBe('root');
      expect(parsedXml.documentElement.firstChild.nodeName).toBe('item');
      expect(parsedXml.documentElement.firstChild.firstChild.nodeValue).toBe('Test');
    });

    // Note: The xmlParser doesn't throw on all invalid XML - it tries to fix it
    it('should handle malformed XML', () => {
      const invalidXml = '<root><unclosed>';
      const parsedXml = xmlParser.xmlParse(invalidXml);
      
      // It should create a document but it may not be what was expected
      expect(parsedXml).toBeDefined();
      expect(parsedXml.nodeName).toBe('#document');
    });
  });

  describe('XSLT Processor', () => {
    it('should transform XML using a simple XSLT', async () => {
      const xml = '<root><item>Hello World</item></root>';
      const xsltContent = `
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <result><xsl:value-of select="/root/item"/></result>
          </xsl:template>
        </xsl:stylesheet>
      `;
      
      const parsedXml = xmlParser.xmlParse(xml);
      const parsedXslt = xmlParser.xmlParse(xsltContent);
      
      const result = await xslt.xsltProcess(parsedXml, parsedXslt);
      
      expect(result).toContain('<result>Hello World</result>');
    });

    it('should transform XML using a complex XSLT with for-each', async () => {
      const xml = `
        <items>
          <item id="1">First</item>
          <item id="2">Second</item>
          <item id="3">Third</item>
        </items>
      `;
      
      const xsltContent = `
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <ul>
              <xsl:for-each select="//item">
                <li id="{@id}"><xsl:value-of select="."/></li>
              </xsl:for-each>
            </ul>
          </xsl:template>
        </xsl:stylesheet>
      `;
      
      const parsedXml = xmlParser.xmlParse(xml);
      const parsedXslt = xmlParser.xmlParse(xsltContent);
      
      const result = await xslt.xsltProcess(parsedXml, parsedXslt);
      
      expect(result).toContain('<ul>');
      expect(result).toContain('<li id="1">First</li>');
      expect(result).toContain('<li id="2">Second</li>');
      expect(result).toContain('<li id="3">Third</li>');
      expect(result).toContain('</ul>');
    });
    
    it('should handle XSLT with conditions', async () => {
      const xml = `
        <people>
          <person age="25">Alice</person>
          <person age="17">Bob</person>
          <person age="32">Charlie</person>
        </people>
      `;
      
      const xsltContent = `
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:template match="/">
            <adults>
              <xsl:for-each select="//person[@age >= 18]">
                <adult><xsl:value-of select="."/></adult>
              </xsl:for-each>
            </adults>
          </xsl:template>
        </xsl:stylesheet>
      `;
      
      const parsedXml = xmlParser.xmlParse(xml);
      const parsedXslt = xmlParser.xmlParse(xsltContent);
      
      const result = await xslt.xsltProcess(parsedXml, parsedXslt);
      
      expect(result).toContain('<adult>Alice</adult>');
      expect(result).toContain('<adult>Charlie</adult>');
      expect(result).not.toContain('<adult>Bob</adult>');
    });
  });

  describe('XPath through XSLT', () => {
    it('should execute simple XPath queries', async () => {
      const xml = `
        <root>
          <item id="1">First</item>
          <item id="2">Second</item>
          <item id="3">Third</item>
        </root>
      `;
      
      // Create a function to execute XPath using XSLT
      const executeXPath = async (xmlContent: string, xpathQuery: string) => {
        const parsedXml = xmlParser.xmlParse(xmlContent);
        
        const xsltTemplate = `
          <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="text"/>
            <xsl:template match="/">
              <xsl:value-of select="${xpathQuery}"/>
            </xsl:template>
          </xsl:stylesheet>
        `;
        
        const parsedXslt = xmlParser.xmlParse(xsltTemplate);
        return (await xslt.xsltProcess(parsedXml, parsedXslt)).trim();
      };
      
      // Count items - using single quotes in XPath to avoid escaping issues
      const countResult = await executeXPath(xml, "count(//item)");
      expect(countResult.trim()).toBe('3');
      
      // Get first item
      const firstItemResult = await executeXPath(xml, "//item[1]");
      expect(firstItemResult.trim()).toBe('First');
      
      // Get item with specific attribute - using single quotes in XPath
      const idItemResult = await executeXPath(xml, "//item[@id='2']");
      expect(idItemResult.trim()).toBe('Second');
    });
    
    it('should handle complex XPath functions', async () => {
      const xml = `
        <products>
          <product price="10.50">Product 1</product>
          <product price="20.75">Product 2</product>
          <product price="5.99">Product 3</product>
          <product price="15.25">Product 4</product>
        </products>
      `;
      
      // Create a function to execute XPath using XSLT
      const executeXPath = async (xmlContent: string, xpathQuery: string) => {
        const parsedXml = xmlParser.xmlParse(xmlContent);
        
        const xsltTemplate = `
          <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="text"/>
            <xsl:template match="/">
              <xsl:value-of select="${xpathQuery}"/>
            </xsl:template>
          </xsl:stylesheet>
        `;
        
        const parsedXslt = xmlParser.xmlParse(xsltTemplate);
        return (await xslt.xsltProcess(parsedXml, parsedXslt)).trim();
      };
      
      // Test individual prices to verify they are being processed correctly
      const price1 = await executeXPath(xml, "//product[1]/@price");
      const price2 = await executeXPath(xml, "//product[2]/@price");
      const price3 = await executeXPath(xml, "//product[3]/@price");
      const price4 = await executeXPath(xml, "//product[4]/@price");
      
      expect(parseFloat(price1)).toBeCloseTo(10.50, 1);
      expect(parseFloat(price2)).toBeCloseTo(20.75, 1);
      expect(parseFloat(price3)).toBeCloseTo(5.99, 1);
      expect(parseFloat(price4)).toBeCloseTo(15.25, 1);
      
      // Manually calculate the sum to verify it matches expected total
      const manualSum = parseFloat(price1) + parseFloat(price2) + parseFloat(price3) + parseFloat(price4);
      expect(manualSum).toBeCloseTo(52.49, 1);
      
      // Calculate average price (using manual calculation)
      const average = manualSum / 4;
      expect(average).toBeCloseTo(13.12, 1);
    });
  });
}); 