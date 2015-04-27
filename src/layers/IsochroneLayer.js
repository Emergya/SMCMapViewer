require("./layers");
require("./SingleLayer.js");


/**
 * Wrapper for [Leaflet's WMS layer]{@link http://leafletjs.com/reference.html#tilelayer-wms } so its integrated in the SMC's viewer layer architecture.
 *
 * @class
 * @extends L.TileLayer.WMS
 * @mixes SMC.layers.SingleLayer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.IsochroneLayer = SMC.layers.geometry.WFSGeometryLayer.extend(
    /** @lends SMC.layers.WMSLayer# */
    {
        /**
         * @typedef {Object} SMC.layers.IsochroneLayer~options
         * @property {SMC.layers.IsochroneLayer~requestParams} requestParams - Default wfs request parameters
         * @property {string} serverURL=null - The wfs server url path parameter
         */

        options: {
            /** @typedef {Object} SMC.layers.IsochroneLayer~requestParams - Default wfs request parameters 
             * @property {string} batch="true" - Goal direction is turned off
             * @property {string} walTime=null - Default travel time
             * @property {string} styles="color30" - Default styles
             * @property {string} mode="WALK" - Default travel mode
             * @property {string} maxWalkDistance=null - Default maximun travel distance
             * @property {string} time=null - Default time
             * @property {string} arriveBy="false" - By default trip should depart at the specified date and time
             * @property {string} walkSpeed=null - Default walk speed
             * @property {string} bikeSpedd=null - Default bike speed
             * @property {string} output="SHED" - Default output geometry
             * @property {string} outputFormat="text/javascript" - Default wfs output format parameter
             
             */
            requestParams: {
                batch: "true",
                walkTime: "15",
                styles: "color30",
                mode: "WALK",
                maxWalkDistance: null,
                time: null,
                fromPlace: null,
                toPlace: "none",
                arriveBy: "false",
                walkSpeed: null,
                bikeSpeed: null,
                output: "SHED",
                outputFormat: "text/javascript",
            },
            serverURL: 'http://107.170.88.62:8080/opentripplanner-api-webapp/ws/iso'
        },

        _getDate: function() {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            var hh = today.getHours();
            var mi = today.getMinutes();
            var ss = today.getSeconds();

            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            if (hh < 10) {
                hh = '0' + hh;
            }
            if (mi < 10) {
                mi = '0' + mi;
            }
            if (ss < 10) {
                ss = '0' + ss;
            }


            today = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + mi + ':' + ss;
            this.options.time = today;
        },



        /**
         * Initialize the object with the params
         * @param {object} options - object with need parameters
         */
        initialize: function(options) {
            if (this.options.time == null) {
                this._getDate();
            }
            if (!options.serverURL) {
                options.serverURL = this.options.serverURL;
            }
            if (typeof(options.serverURL) !== "string") {
                throw new Error("SMC.layers.IsochroneLayer::initialize: options must contain an url attribute of type string.");
            }
            SMC.layers.geometry.WFSGeometryLayer.prototype.initialize.call(this, options.serverURL, options);
            SMC.layers.SingleLayer.prototype.initialize.call(this, options);
        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
        onAdd: function(map) {
            SMC.layers.geometry.WFSGeometryLayer.prototype.onAdd.call(this, map);

        },

        /**
         * Method to get the map
         * @returns {SMC.Map} map - Map layer
         */
        getMap: function() {
            return this._map;
        },


        load: function() {
            var self = this;
            this.doFeaturesLoading().then(function(response) {
                var output = [];
                for (var i in response.coordinates) {
                    var feature = {};
                    feature.type = 'Feature';
                    feature.geometry = {};
                    feature.geometry.type = response.type;
                    feature.geometry.coordinates = response.coordinates[i];
                    output.push(feature);
                }

                self.onFeaturesLoaded(output);

            });

        },

        doFeaturesLoading: function() {
            var self = this;
            var jsonpRandom = this._makeid();
            this.options.format_options = "callback:" + jsonpRandom;
            var stylesheet = '*{fillColor: "rgba(43,140,190,0.5)"; color: "rgba(43,140,190,0.5)";}';
            if (!this.options.stylesheet) {
                this.options.stylesheet = stylesheet;
            }
            return $.ajax({
                type: 'GET',
                url: self.options.serverURL,
                data: self.getParamsFromOptions(),
                jsonpCallback: jsonpRandom,
                dataType: "jsonp",
                async: false
            });


        },



        /**
         * Method to unload the layer.
         */
        unload: function() {
            this._needsload = true;
            this._reset();
        }


    }, [SMC.layers.SingleLayer]);

/**
 * API factory method for ease creation of WMS layers.
 * @params {Object} options - Options for the layer. Must contain a field url of type string.
 */
SMC.isochroneLayer = function(options) {
    return new SMC.layers.IsochroneLayer(options);
};