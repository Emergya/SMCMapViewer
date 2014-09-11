require("./layers");
require("./SingleLayer.js");

/**
 * Wrapper for [Leaflet's WMS layer]{@link http://leafletjs.com/reference.html#tilelayer}
 * so its integrated in the SMC's viewer layer architecture.
 *
 * @class
 * @extends L.TileLayer
 * @mixes SMC.layers.SingleLayer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.TileLayer = L.TileLayer.extend(
    /** @lends SMC.layers.TileLayer# */
    {

         /**
         * Initialize the class with options parameter
         * @param {object} options - default options
         */
        initialize: function(options) {
            if (!options.url || typeof(options.url) !== "string") {
                throw new Error("SMC.layers.TileLayer::initialize: options must contain an url attribute of type string.");
            }
            L.TileLayer.prototype.initialize.call(this, options.url, options);
            SMC.layers.SingleLayer.prototype.initialize.call(this, options);
        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
        onAdd: function(map) {
            L.TileLayer.prototype.onAdd.call(this, map);
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
            this._reset();
            this._needsload = true;
        }
    }, [SMC.layers.SingleLayer]);

/**
 * API factory method for ease creation of tile layers.
 * @params {Object} options - Options for the layer.
 */
SMC.tileLayer = function(options) {
    return new SMC.layers.TileLayer(options);
};
