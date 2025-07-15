export default `<!DOCTYPE qgis-layer-definition>
<qlr>
  <layer-tree-group name="" expanded="1" groupLayer="" checked="Qt::Checked">
    <customproperties>
      <Option />
    </customproperties>
    {% for layer in layers %}
    <layer-tree-layer legend_exp="" providerKey="wms" name="{{ layer.displayName }}"
      legend_split_behavior="0" id="{{ layer.id }}" patch_size="-1,-1"
      source="crs=EPSG:4326&amp;dpiMode=7&amp;featureCount=10&amp;format={{ layer.mimeType }}&amp;http-header:x-api-key={{ token }}&amp;layers={{ layer.wmtsLink.name }}&amp;styles=default&amp;tileMatrixSet=WorldCRS84&amp;tilePixelRatio=0&amp;url={{ layer.wmtsLink.url }}"
      expanded="1" checked="Qt::Checked">
      <customproperties>
        <Option />
      </customproperties>
    </layer-tree-layer>
    {% endfor %}
  </layer-tree-group>
  <maplayers>
    {% for layer in layers %}
    <maplayer autoRefreshMode="Disabled" autoRefreshTime="0" type="raster" legendPlaceholderImage=""
      maxScale="0" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0"
      refreshOnNotifyMessage="" refreshOnNotifyEnabled="0" minScale="1e+08">
      <extent>
        <xmin>{{ layer.boundingBox.minx }}</xmin>
        <ymin>{{ layer.boundingBox.miny }}</ymin>
        <xmax>{{ layer.boundingBox.maxx }}</xmax>
        <ymax>{{ layer.boundingBox.maxy }}</ymax>
      </extent>
      <wgs84extent>
        <xmin>{{ layer.boundingBox.minx }}</xmin>
        <ymin>{{ layer.boundingBox.miny }}</ymin>
        <xmax>{{ layer.boundingBox.maxx }}</xmax>
        <ymax>{{ layer.boundingBox.maxy }}</ymax>
      </wgs84extent>
      <id>{{ layer.id }}</id>
      <datasource>
        crs=EPSG:4326&amp;dpiMode=7&amp;featureCount=10&amp;format={{ layer.mimeType }}&amp;http-header:x-api-key={{ token }}&amp;layers={{ layer.wmtsLink.name }}&amp;styles=default&amp;tileMatrixSet=WorldCRS84&amp;tilePixelRatio=0&amp;url={{ layer.wmtsLink.url }}</datasource>
      <layername>{{ layer.wmtsLink.name }}</layername>
      <srs>
        <spatialrefsys nativeFormat="Wkt">
          <wkt>GEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble",MEMBER["World
            Geodetic System 1984 (Transit)"],MEMBER["World Geodetic System 1984
            (G730)"],MEMBER["World Geodetic System 1984 (G873)"],MEMBER["World Geodetic System 1984
            (G1150)"],MEMBER["World Geodetic System 1984 (G1674)"],MEMBER["World Geodetic System
            1984 (G1762)"],MEMBER["World Geodetic System 1984 (G2139)"],ELLIPSOID["WGS
            84",6378137,298.257223563,LENGTHUNIT["metre",1]],ENSEMBLEACCURACY[2.0]],PRIMEM["Greenwich",0,ANGLEUNIT["degree",0.0174532925199433]],CS[ellipsoidal,2],AXIS["geodetic
            latitude (Lat)",north,ORDER[1],ANGLEUNIT["degree",0.0174532925199433]],AXIS["geodetic
            longitude
            (Lon)",east,ORDER[2],ANGLEUNIT["degree",0.0174532925199433]],USAGE[SCOPE["Horizontal
            component of 3D system."],AREA["World."],BBOX[-90,-180,90,180]],ID["EPSG",4326]]</wkt>
          <proj4>+proj=longlat +datum=WGS84 +no_defs</proj4>
          <srsid>3452</srsid>
          <srid>4326</srid>
          <authid>EPSG:4326</authid>
          <description>WGS 84</description>
          <projectionacronym>longlat</projectionacronym>
          <ellipsoidacronym>EPSG:7030</ellipsoidacronym>
          <geographicflag>true</geographicflag>
        </spatialrefsys>
      </srs>
      <provider>wms</provider>
      <noData>
        <noDataList bandNo="1" useSrcNoData="0" />
      </noData>
      <flags>
        <Identifiable>1</Identifiable>
        <Removable>1</Removable>
        <Searchable>1</Searchable>
        <Private>0</Private>
      </flags>
      <mapTip enabled="1"></mapTip>
      <pipe>
        <provider>
          <resampling enabled="false" maxOversampling="2"
            zoomedInResamplingMethod="nearestNeighbour" zoomedOutResamplingMethod="nearestNeighbour" />
        </provider>
        <rasterrenderer opacity="1" nodataColor="" band="1" type="singlebandcolordata"
          alphaBand="-1">
          <rasterTransparency />
          <minMaxOrigin>
            <limits>None</limits>
            <extent>WholeRaster</extent>
            <statAccuracy>Estimated</statAccuracy>
            <cumulativeCutLower>0.02</cumulativeCutLower>
            <cumulativeCutUpper>0.98</cumulativeCutUpper>
            <stdDevFactor>2</stdDevFactor>
          </minMaxOrigin>
        </rasterrenderer>
        <brightnesscontrast gamma="1" brightness="0" contrast="0" />
        <huesaturation colorizeStrength="100" colorizeRed="255" colorizeGreen="128" saturation="0"
          colorizeOn="0" grayscaleMode="0" invertColors="0" colorizeBlue="128" />
        <rasterresampler maxOversampling="2" />
        <resamplingStage>resamplingFilter</resamplingStage>
      </pipe>
      <blendMode>0</blendMode>
    </maplayer>
    {% endfor %}
  </maplayers>
</qlr>
\n`;
