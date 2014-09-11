require("./GeometryLayer.js");
require("../../providers/WFSProvider.js");

/**
 * Base class for layers using a WFS provider to get the features
 *
 * @class
 * @abstract
 * @extends SMC.layers.geometry.GeometryLayer
 * @mixes SMC.providers.WFSProvider
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.geometry.WFSGeometryLayer = SMC.layers.geometry.GeometryLayer.extend(
    /** @lends SMC.layers.geometry.WFSGeometryLayer# */
    {

        /**
         * Initialize the object with the params
         * @param {object} options - object with need parameters
         */
        initialize: function(options) {
            SMC.layers.geometry.GeometryLayer.prototype.initialize.call(this, options);
            SMC.providers.WFSProvider.prototype.initialize.call(this, options);
            L.Util.setOptions(this, options);
            this.setZIndex(1000);
        },

        /**
         * Method to load the features on the map
         * @param {Object} features - Features to be loaded
         */
        onFeaturesLoaded: function(features) {
            this.addGeometryFromFeatures(features);
        },

        /**
         * Method to load the layer on the map
         */
        load: function() {
            this.loadFeatures();
        },

        /**
         * Method to create an HTML node for the name of the layer.
         * @returns {String} HTML code representing the code to be added to the layer's entry in the layer tree.
         */
        createNodeHTML: function() {
            return this.options.label || this.options.typeName;
        }
        
    }, [SMC.providers.WFSProvider]);

/**
 * API factory method for easy creation of wfs geometry layer.
 * @params {Object} options - Options to initialize the WFS 
 */
SMC.wfsGeometryLayer = function(options) {
    return new SMC.layers.geometry.WFSGeometryLayer(options);
};