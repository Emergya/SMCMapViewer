require("./URLFeatureProvider.js");

/**
 * Base class to create a WFS provider
 * @class
 * @extends SMC.providers.URLFeatureProvider
 * @mixes L.Mixin.Events
 * @param {SMC.providers.WFSProvider~options} options - The configuration for the class
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.providers.WFSProvider = SMC.providers.URLFeatureProvider.extend(
    /** @lends SMC.providers.WFSProvider# */
    {
       /**
        * @typedef {Object} SMC.providers.WFSProvider~options
        * @property {SMC.providers.WFSProvider~requestParams} requestParams - Default wfs request parameters
        * @property {string} serverURL=null - The wfs server url path parameter
        * @property {string} bbox=null - The bbox parameter
        */
        options: {
            /** @typedef {Object} SMC.providers.WFSProvider~requestParams - Default wfs request parameters
             * @property {string} service="wfs" - Default wfs service
             * @property {string} version="1.1.0" - Default wfs version
             * @property {string} request="GetFeature" - Default wfs request
             * @property {string} typeName="namespace:featuretype" - Default wfs typename
             * @property {string} featureID=null - Default wfs feature id
             * @property {string} count=null - Default wfs count parameter
             * @property {string} maxFeatures=null - Default wfs max features parameter
             * @property {string} sortBy=null - Default wfs sort by parameter
             * @property {string} propertyName=null - Default wfs property name parameter
             * @property {string} srsName="EPSG:4326" - Default wfs coordinate reference system parameter
             * @property {string} cqlFilter=null - Default wfs cql filter parameter
             * @property {string} outputFormat="text/javascript" - Default wfs output format parameter
             * @property {string} format_options=null - Default wfs format options parameter
             */
            requestParams:{
                service: "wfs",
                version: "1.1.0",
                request: "GetFeature",
                typeName: "namespace:featuretype",
                featureID: null,
                count: null,
                maxFeatures: null,
                sortBy: null,
                propertyName: null,
                srsName: "EPSG:4326",
                cql_filter: null,
                outputFormat: "text/javascript",
                format_options: null
            },
            serverURL: null,
            bbox: null,
            
        },
        /**
         * Initialize the class with options parameter
         * @param {object} options - default options
         */
        initialize: function(options) {
            L.Util.setOptions(this, options);
        },
        /**
         * Send WFS request to get the features
         * @param {object} bounds - bounds from features
         * @returns {object} Deferred object from jQuery
         */
        doFeaturesLoading: function(bounds) {
        	var jsonpRandom = this._makeid();
        	this.options.format_options = "callback:" + jsonpRandom;

            if (this.options.serverURL !== null) {
                var requestData = {
                    url: this.options.serverURL,
                    data: this.getParamsFromOptions(),
                    jsonpCallback: jsonpRandom,
                    type: "GET",
                    dataType: "jsonp",
                    jsonp: false
                };

                

                if(bounds) {
                    this.options.requestParams.cql_filter = requestData.data.cql_filter;
                    this.options.bbox = 'bbox(the_geom,' 
                        + bounds[1]+ ','
                        + bounds[0]+ ','
                        + bounds[3]+ ','
                        + bounds[2]
                        +')';
                    if(requestData.data.cql_filter){
                       requestData.data.cql_filter =  this.options.requestParams.cql_filter + ' AND ' + this.options.bbox;
                    }
                    else{
                        requestData.data.cql_filter = this.options.bbox;
                    }
              
                  
                }
               

                return $.ajax(requestData);
            }
            return $.Deferred();
        },

        /**
         * Get params from options attributes
         * @returns {object} Object with the wfs params to send
         */
        getParamsFromOptions: function() {
            var params = {};
            for (var option in this.options.requestParams) {
                
                if(this.options[option]){
                     params[option] = this.options[option];
                }
                else if (this.options.requestParams[option] !== null && option != 'cql_filter'){
                    params[option] = this.options.requestParams[option];
                }
                

            }
            return params;
        },

        /**
         * Method to get an id
         * @private
         */
        _makeid: function(){
        	var text = "";
        	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        	for( var i=0; i < 5; i++ )
    	        text += possible.charAt(Math.floor(Math.random() * possible.length));
        	return text;
    	}
    }
);
/**
 * API factory method for ease creation of wfs provider.
 * @params {Object} options - Options to initialize the WFS provider
 */
SMC.wfsProvider = function(options) {
    return new SMC.providers.WFSProvider(options);
};
