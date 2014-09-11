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
SMC.layers.WMSLayer = L.TileLayer.WMS.extend(
    /** @lends SMC.layers.WMSLayer# */
    {

         /**
         * Initialize the class with options parameter
         * @param {object} options - default options
         */
        initialize: function(options) {
            if (!options.url || typeof(options.url) !== "string") {
                throw new Error("SMC.layers.WMSLayer::initialize: options must contain an url attribute of type string.");
            }
            L.TileLayer.WMS.prototype.initialize.call(this, options.url, options);
            SMC.layers.SingleLayer.prototype.initialize.call(this, options);
        },


        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
        onAdd: function(map) {
            L.TileLayer.WMS.prototype.onAdd.call(this, map);
            SMC.layers.SingleLayer.prototype.onAdd.call(this, map);
        },

         /**
         * Load a layer's data
         */
        load: function() {
            if (this._needsload) {
                this._update();
                this._needsload = false;
            }
        },

         /**
         * Unload a layer's data
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
SMC.wmsLayer = function(options) {
    return new SMC.layers.WMSLayer(options);
};
