export const goodResponse = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dct="http://purl.org/dc/terms/"
  xmlns:gmd="http://www.isotc211.org/2005/gmd"
  xmlns:gml="http://www.opengis.net/gml"
  xmlns:ows="http://www.opengis.net/ows"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:mc="http://schema.mapcolonies.com/raster" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
  <csw:SearchStatus timestamp="2025-07-16T12:31:47Z"/>
  <csw:SearchResults numberOfRecordsMatched="1" numberOfRecordsReturned="1" nextRecord="0" recordSchema="http://schema.mapcolonies.com/raster" elementSet="full">
    <mc:MCRasterRecord>
      <mc:classification>6</mc:classification>
      <mc:creationDateUTC>2025-06-18T09:59:01Z</mc:creationDateUTC>
      <mc:footprint>{"type":"Polygon","coordinates":[[[-179.99999999121445,-89.99999949967895],[-179.99999992746538,89.99999992249352],[179.99999994714307,89.9999999471431],[179.99999994714307,-89.9999999471431],[-179.99999999121445,-89.99999949967895]]],"bbox":[-179.99999999121445,-89.9999999471431,179.99999994714307,89.9999999471431]}</mc:footprint>
      <mc:id>60321a0d-2fb4-4727-a27a-aca9bd0bad9f</mc:id>
      <mc:imagingTimeBeginUTC>2025-06-01T09:54:00Z</mc:imagingTimeBeginUTC>
      <mc:imagingTimeEndUTC>2025-06-09T09:54:00Z</mc:imagingTimeEndUTC>
      <mc:ingestionDate>2025-06-18T14:07:15Z</mc:ingestionDate>
      <mc:insertDate>2025-06-18T09:59:01Z</mc:insertDate>
      <mc:links scheme="WMS" name="test_product-Orthophoto" description="">https://example.com/api/raster/v1/service?REQUEST=GetCapabilities</mc:links>
      <mc:links scheme="WMS_BASE" name="test_product-Orthophoto" description="">https://example.com/api/raster/v1/wms</mc:links>
      <mc:links scheme="WMTS" name="test_product-Orthophoto" description="">https://example.com/api/raster/v1/wmts/1.0.0/WMTSCapabilities.xml</mc:links>
      <mc:links scheme="WMTS_KVP" name="test_product-Orthophoto" description="">https://example.com/api/raster/v1/service?REQUEST=GetCapabilities&amp;SERVICE=WMTS</mc:links>
      <mc:links scheme="WMTS_BASE" name="test_product-Orthophoto" description="">https://example.com/api/raster/v1/wmts</mc:links>
      <mc:links scheme="WFS" name="test_product-Orthophoto" description="">https://query-int.mapcolonies.net/api/raster/v1/layer-parts/wfs?request=GetCapabilities</mc:links>
      <mc:maxHorizontalAccuracyCE90>500</mc:maxHorizontalAccuracyCE90>
      <mc:maxResolutionDeg>0.02197265625</mc:maxResolutionDeg>
      <mc:maxResolutionMeter>2445.98</mc:maxResolutionMeter>
      <mc:minHorizontalAccuracyCE90>4000</mc:minHorizontalAccuracyCE90>
      <mc:minResolutionDeg>0.0439453125</mc:minResolutionDeg>
      <mc:minResolutionMeter>4891.97</mc:minResolutionMeter>
      <mc:producerName>AVILTD</mc:producerName>
      <mc:productBBox>-179.999999991214452,-89.999999947143095,179.999999947143067,89.999999947143095</mc:productBBox>
      <mc:productId>test_product</mc:productId>
      <mc:productName>test_product</mc:productName>
      <mc:productStatus>PUBLISHED</mc:productStatus>
      <mc:productType>Orthophoto</mc:productType>
      <mc:productVersion>3.0</mc:productVersion>
      <mc:region>world</mc:region>
      <mc:sensors>OTHER</mc:sensors>
      <mc:SRS>4326</mc:SRS>
      <mc:SRSName>WGS84GEO</mc:SRSName>
      <mc:mimeType>image/jpeg</mc:mimeType>
      <mc:transparency>OPAQUE</mc:transparency>
      <mc:type>RECORD_RASTER</mc:type>
      <mc:updateDateUTC>2025-06-25T09:48:42Z</mc:updateDateUTC>
      <ows:BoundingBox crs="urn:x-ogc:def:crs:EPSG:6.11:4326" dimensions="2">
        <ows:LowerCorner>-89.9999999471431 -179.99999999121445</ows:LowerCorner>
        <ows:UpperCorner>89.9999999471431 179.99999994714307</ows:UpperCorner>
      </ows:BoundingBox>
    </mc:MCRasterRecord>
  </csw:SearchResults>
</csw:GetRecordsResponse>
`;

export const goodResponseMultilayer = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dct="http://purl.org/dc/terms/"
  xmlns:gmd="http://www.isotc211.org/2005/gmd"
  xmlns:gml="http://www.opengis.net/gml"
  xmlns:ows="http://www.opengis.net/ows"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:mc="http://schema.mapcolonies.com/raster" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
  <csw:SearchStatus timestamp="2025-07-16T12:31:47Z"/>
  <csw:SearchResults numberOfRecordsMatched="1" numberOfRecordsReturned="1" nextRecord="0" recordSchema="http://schema.mapcolonies.com/raster" elementSet="full">
    <mc:MCRasterRecord>
      <mc:classification>6</mc:classification>
      <mc:creationDateUTC>2025-06-18T09:59:01Z</mc:creationDateUTC>
      <mc:footprint>{"type":"Polygon","coordinates":[[[-179.99999999121445,-89.99999949967895],[-179.99999992746538,89.99999992249352],[179.99999994714307,89.9999999471431],[179.99999994714307,-89.9999999471431],[-179.99999999121445,-89.99999949967895]]],"bbox":[-179.99999999121445,-89.9999999471431,179.99999994714307,89.9999999471431]}</mc:footprint>
      <mc:id>60321a0d-2fb4-4727-a27a-aca9bd0bad9f</mc:id>
      <mc:imagingTimeBeginUTC>2025-06-01T09:54:00Z</mc:imagingTimeBeginUTC>
      <mc:imagingTimeEndUTC>2025-06-09T09:54:00Z</mc:imagingTimeEndUTC>
      <mc:ingestionDate>2025-06-18T14:07:15Z</mc:ingestionDate>
      <mc:insertDate>2025-06-18T09:59:01Z</mc:insertDate>
      <mc:links scheme="WMS" name="Can you do a logi run?" description="">https://example.com/api/raster/v1/service?REQUEST=GetCapabilities</mc:links>
      <mc:links scheme="WMS_BASE" name="Can you do a logi run?" description="">https://example.com/api/raster/v1/wms</mc:links>
      <mc:links scheme="WMTS" name="Can you do a logi run?" description="">https://example.com/api/raster/v1/wmts/1.0.0/WMTSCapabilities.xml</mc:links>
      <mc:links scheme="WMTS_KVP" name="Can you do a logi run?" description="">https://example.com/api/raster/v1/service?REQUEST=GetCapabilities&amp;SERVICE=WMTS</mc:links>
      <mc:links scheme="WMTS_BASE" name="Can you do a logi run?" description="">https://example.com/api/raster/v1/wmts</mc:links>
      <mc:links scheme="WFS" name="Can you do a logi run?" description="">https://query-int.mapcolonies.net/api/raster/v1/layer-parts/wfs?request=GetCapabilities</mc:links>
      <mc:maxHorizontalAccuracyCE90>500</mc:maxHorizontalAccuracyCE90>
      <mc:maxResolutionDeg>0.02197265625</mc:maxResolutionDeg>
      <mc:maxResolutionMeter>2445.98</mc:maxResolutionMeter>
      <mc:minHorizontalAccuracyCE90>4000</mc:minHorizontalAccuracyCE90>
      <mc:minResolutionDeg>0.0439453125</mc:minResolutionDeg>
      <mc:minResolutionMeter>4891.97</mc:minResolutionMeter>
      <mc:producerName>AVILTD</mc:producerName>
      <mc:productBBox>-179.999999991214452,-89.999999947143095,179.999999947143067,89.999999947143095</mc:productBBox>
      <mc:productId>LogiRun</mc:productId>
      <mc:productName>Can you do a logi run ?</mc:productName>
      <mc:productStatus>PUBLISHED</mc:productStatus>
      <mc:productType>Ronin</mc:productType>
      <mc:productVersion>3.0</mc:productVersion>
      <mc:region>world</mc:region>
      <mc:sensors>OTHER</mc:sensors>
      <mc:SRS>4326</mc:SRS>
      <mc:SRSName>WGS84GEO</mc:SRSName>
      <mc:mimeType>image/jpeg</mc:mimeType>
      <mc:transparency>OPAQUE</mc:transparency>
      <mc:type>RECORD_RASTER</mc:type>
      <mc:updateDateUTC>2025-06-25T09:48:42Z</mc:updateDateUTC>
      <ows:BoundingBox crs="urn:x-ogc:def:crs:EPSG:6.11:4326" dimensions="2">
        <ows:LowerCorner>-89.9999999471431 -179.99999999121445</ows:LowerCorner>
        <ows:UpperCorner>89.9999999471431 179.99999994714307</ows:UpperCorner>
      </ows:BoundingBox>
    </mc:MCRasterRecord>
  </csw:SearchResults>
</csw:GetRecordsResponse>
`;

export const partialResponse = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dct="http://purl.org/dc/terms/"
  xmlns:gmd="http://www.isotc211.org/2005/gmd"
  xmlns:gml="http://www.opengis.net/gml"
  xmlns:ows="http://www.opengis.net/ows"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:mc="http://schema.mapcolonies.com/raster" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
  <csw:SearchStatus timestamp="2025-07-16T12:31:47Z"/>
  <csw:SearchResults numberOfRecordsMatched="1" numberOfRecordsReturned="1" nextRecord="0" recordSchema="http://schema.mapcolonies.com/raster" elementSet="full">
    <mc:MCRasterRecord>
      <mc:classification>6</mc:classification>
      <mc:creationDateUTC>2025-06-18T09:59:01Z</mc:creationDateUTC>
      <mc:footprint>{"type":"Polygon","coordinates":[[[-179.99999999121445,-89.99999949967895],[-179.99999992746538,89.99999992249352],[179.99999994714307,89.9999999471431],[179.99999994714307,-89.9999999471431],[-179.99999999121445,-89.99999949967895]]],"bbox":[-179.99999999121445,-89.9999999471431,179.99999994714307,89.9999999471431]}</mc:footprint>
      <mc:id>60321a0d-2fb4-4727-a27a-aca9bd0bad9f</mc:id>
      <mc:maxResolutionDeg>0.02197265625</mc:maxResolutionDeg>
      <mc:maxResolutionMeter>2445.98</mc:maxResolutionMeter>
      <mc:minHorizontalAccuracyCE90>4000</mc:minHorizontalAccuracyCE90>
      <mc:minResolutionDeg>0.0439453125</mc:minResolutionDeg>
      <mc:minResolutionMeter>4891.97</mc:minResolutionMeter>
      <mc:producerName>AVILTD</mc:producerName>
      <mc:productBBox>-179.999999991214452,-89.999999947143095,179.999999947143067,89.999999947143095</mc:productBBox>
      <mc:SRS>4326</mc:SRS>
      <mc:SRSName>WGS84GEO</mc:SRSName>
      <mc:transparency>OPAQUE</mc:transparency>
      <mc:type>RECORD_RASTER</mc:type>
      <mc:updateDateUTC>2025-06-25T09:48:42Z</mc:updateDateUTC>
      <ows:BoundingBox crs="urn:x-ogc:def:crs:EPSG:6.11:4326" dimensions="2">
        <ows:LowerCorner>-89.9999999471431 -179.99999999121445</ows:LowerCorner>
        <ows:UpperCorner>89.9999999471431 179.99999994714307</ows:UpperCorner>
      </ows:BoundingBox>
    </mc:MCRasterRecord>
  </csw:SearchResults>
</csw:GetRecordsResponse>
`;

export const emptyResponse = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- pycsw 2.7.dev0 -->
<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dct="http://purl.org/dc/terms/"
  xmlns:gmd="http://www.isotc211.org/2005/gmd"
  xmlns:gml="http://www.opengis.net/gml"
  xmlns:ows="http://www.opengis.net/ows"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:mc="http://schema.mapcolonies.com/raster" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
  <csw:SearchStatus timestamp="2025-07-16T12:31:47Z"/>
  <csw:SearchResults numberOfRecordsMatched="0" numberOfRecordsReturned="0" nextRecord="0" recordSchema="http://schema.mapcolonies.com/raster" elementSet="full">
  </csw:SearchResults>
</csw:GetRecordsResponse>
`;
