require("./layers");
require("./Layer.js");
require("./reloaders/LayerReloader.js");

/**
 * Base class for all SMC viewer layer which are both reloadable and aggregable in grouping layers.
 * @class
 * @extends SMC.layers.Layer
 * @abstract
 * @mixes SMC.layers.reloaders.LayerReloader
 * @mixin SMC.layers.SingleLayer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.SingleLayer = SMC.layers.Layer.extend(
    /** @lends SMC.layers.SingleLayer# */
    {

        /**
         * Initialize the object with the params
         * @param {object} options - object with need parameters
         */
        initialize: function(options) {
            L.Util.setOptions(this, options);
            SMC.layers.Layer.prototype.initialize.call(this, options);
            SMC.layers.reloaders.LayerReloader.prototype.initialize.call(this, options);
        },
        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
        onAdd: function(map) {
            this.map = map;
            this.load();
        },

        /**
         * Method to get the map
         * @returns {SMC.Map} map - Map layer
         */
        getMap: function() {
           return this.map;
        }

    }, [SMC.layers.reloaders.LayerReloader]);