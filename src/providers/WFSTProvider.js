require("./WFSProvider");
/**
 * Base class to create a WFS-T provider
 * @class
 * @extends SMC.providers.WFSProvider
 * @mixes L.Mixin.Events
 * @param {SMC.providers.WFSTProvider~options} options - The configuration for the class
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.providers.WFSTProvider = SMC.providers.WFSProvider.extend(
	/** @lends SMC.providers.WFSTProvider# */
	{
		/**
         * Initialize the class with options parameter
         * @param {object} options - default options
         */
        initialize: function(options) {
            SMC.providers.WFSProvider.prototype.initialize.call(this, options);
        },
        /**
         * Method to prepare WFS-T request payload to insert a geometry
         * @private
         * @param {object} geometry - element to be added
         */
        _insert: function(geometry){
            var self = this;
            var geom_type = this._getGeomType(geometry);

            $.ajax({
                type: "GET",
                url: this.options.serverURL + "?request=DescribeFeatureType&version=1.1.0&typename=" + this.options.typeName,
                dataType: "xml",
                contentType: "text/xml",
                success: function(xml, status, object) {
                    var schema = xml.getElementsByTagName("schema")[0];
                    var targetNamespace = schema.getAttribute("targetNamespace");
                    var namespace = self.options.typeName.split(":")[0];
                    var typeName = self.options.typeName.split(":")[1];
                    var srsName = self.options.srsName ? self.options.requestParams.srsName : "EPSG:4326";
                    var attributes = xml.getElementsByTagName('sequence')[0].getElementsByTagName('element');
                    var theGeom = 'the_geom';
                    for(var i = 0; i < attributes.length; i++){
                        if(attributes[i].getAttribute('type') ==  "gml:GeometryPropertyType" ){
                            theGeom = attributes[i].getAttribute('name');
                        }
                    }
                    var postData =
                        '<wfs:Transaction\n'
                     +  'version="1.1.0"\n'
                     +  'service="WFS"\n'
                     +  'xmlns:wfs="http://www.opengis.net/wfs"\n'
                     +  'xmlns:' + namespace + '="' + targetNamespace + '">\n'
                     +  '   <wfs:Insert>\n'
                     +  '       <' + self.options.typeName + ' xmlns:feature="' + self.options.serverURL + '">\n'
                     +  '           <' + namespace + ':' + theGeom + '>\n'
                     +  '               <gml:' + geom_type + ' xmlns:gml="http://www.opengis.net/gml" srsName="' + srsName + '">\n'
                     +  '                   <gml:pos>' + geometry.getLatLng().lng + ' ' + geometry.getLatLng().lat + '</gml:pos>\n'
                     +  '               </gml:' + geom_type + '>\n'
                     +  '           </' + namespace + ':' + theGeom + '>\n'
                     +  '       </' + self.options.typeName + '>\n'
                     +  '   </wfs:Insert>\n'
                     +  '</wfs:Transaction>\n';

                    self._sendRequest("POST", self.options.serverURL, postData, function(xml){
                       // self._getLastFeature();
                    });
                }
            });
        },
        /**
         * Method to prepare WFS-T request payload to update a geometry
         * @private
         * @param {object} geometry - element to be updated
         */
        _update: function(geometry){
        	var self = this;
             $.ajax({
                type: "GET",
                url: this.options.serverURL + "?request=DescribeFeatureType&version=1.1.0&typename=" + this.options.typeName,
                dataType: "xml",
                contentType: "text/xml",
                success: function(xml, status, object) {
                    var srsName = self.options.srsName ? self.options.requestParams.srsName : "EPSG:4326";
                    var attributes = xml.getElementsByTagName('sequence')[0].getElementsByTagName('element');
                   
                    var wfs_elements = "";
                    geometry.eachLayer(function (layer) {
                        // Update the edited features
                        wfs_elements += self._getWFSUpdate(layer, srsName, attributes);
                    });
                    var postData =
                        '<wfs:Transaction\n'
                     +  'version="1.1.0"\n'
                     +  'service="WFS"\n'
                     +  'xmlns:wfs="http://www.opengis.net/wfs">\n'
                     +  wfs_elements
                     +  '</wfs:Transaction>\n';

                    self._sendRequest("POST", self.options.serverURL, postData);
              }
           });  
        },



        /**
         * Method to prepare WFS-T request payload to delete a geometry
         * @private
         * @param {object} geometry - element to be removed
         */
        _delete: function(geometry){
        	var self = this;
            var typeName = self.options.typeName.split(":")[1];
            var wfs_elements = "";
            geometry.eachLayer(function (layer) {
                // Update the edited features
                wfs_elements += self._getWFSDelete(typeName, layer.feature.id);
            });

            var postData =
                '<wfs:Transaction\n'
             +  'version="1.1.0"\n'
             +  'service="WFS"\n'
             +  'xmlns:wfs="http://www.opengis.net/wfs">\n'
             +  wfs_elements
             +  '</wfs:Transaction>\n';

            this._sendRequest("POST", this.options.serverURL, postData);
        },
        /**
         * Method to send WFS-T request
         * @private
         * @param {string} url - url server where send request
         * @param {string} data - request payload
         */
        _sendRequest: function(type, url, data, method){
        	$.ajax({
                type: type,
                url: url,
                dataType: "xml",
                contentType: "text/xml",
                data: data,
                success: method
            });
        },
        /**
         * Method to get the geometry type
         * @private
         * @param {Object} geometry - Geometry to get type
         * @returns {string} geometry type
         */
        _getGeomType: function(geometry){
            var geom_type = null;
            if(geometry instanceof L.Marker || geometry instanceof L.Point){
                geom_type = "Point";
            }
            return geom_type;
        },
        /**
         * Method to get the wfs delete request
         * @private
         * @param {Object} typeName - type name layer
         * @param {string} featureId - id from the element to remove
         * @returns {string} request filter to remove elements
         */
        _getWFSDelete: function(typeName, featureId){
            var res = 
                '   <wfs:Delete typeName="feature:' + typeName + '" xmlns:feature="http://opengeo.org">\n'
             +  '       <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">\n'
             +  '           <ogc:FeatureId fid="' + featureId + '"/>\n'
             +  '       </ogc:Filter>\n'
             +  '   </wfs:Delete>\n';
            return res;
        },
        /**
         * Method to get the wfs update request
         * @private
         * @param {Object} geometry - type name layer
         * @param {string} srsName - layer srs
         * @returns {string} request filter to update elements
         */
        _getWFSUpdate: function(geometry, srsName, attributes){
            var geom_type = this._getGeomType(geometry);
            var typeName = this.options.typeName.split(":")[1];
            var res =' <wfs:Update typeName="feature:' + typeName + '" xmlns:feature="http://opengeo.org">\n';
                for(var i = 0; i < attributes.length; i++){
                    var name = attributes[i].getAttribute('name');
             res +=   '       <wfs:Property>\n'
             
             +  '           <wfs:Name>'+ name +'</wfs:Name>\n'
             
             +  '           <wfs:Value>\n';
                if(attributes[i].getAttribute('type') == 'gml:GeometryPropertyType'){
             res +=  '               <gml:' + geom_type + ' xmlns:gml="http://www.opengis.net/gml" srsName="' + srsName + '">\n'
             +  '                   <gml:pos>' + geometry.getLatLng().lng + ' ' + geometry.getLatLng().lat + '</gml:pos>\n'
             +  '               </gml:' + geom_type + '>\n';
                     }
                     else if (geometry.feature.properties[name] != null){
                        res += geometry.feature.properties[name];
                     }
             res +=  '           </wfs:Value>\n'
                
             + '       </wfs:Property>\n';
              }
             res +=  '       <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">\n'
             +  '           <ogc:FeatureId fid="' + geometry.feature.id + '"/>\n'
             +  '       </ogc:Filter>\n'
             +  '   </wfs:Update>\n';
             return res;
        }
	}, [SMC.providers.WFSProvider]);
 /**
 * API factory method for ease creation of wfs features providers.
 * @params {Object} options - Options to initialize the WFS provider
 */
SMC.wfstProvider = function(options) {
    return new SMC.providers.WFSTProvider(options);
};