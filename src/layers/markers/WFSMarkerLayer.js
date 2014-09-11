require("./MarkerLayer.js");
require("../../providers/WFSProvider.js");
require("../EditableLayer.js");

/**
 * Layer for all SMC map viewer's WFS layers rendered using markers.
 * @class
 * @extends SMC.layers.markers.MarkerLayer
 * @mixes SMC.providers.WFSProvider
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.layers.markers.WFSMarkerLayer = SMC.layers.markers.MarkerLayer.extend(
    /** @lends SMC.layers.markers.WFSMarkerLayer# */
    {

        initialize: function(options) {
            SMC.layers.markers.MarkerLayer.prototype.initialize.call(this, options);
            SMC.providers.WFSProvider.prototype.initialize.call(this, options);
        },

        /**
         * Method to load the features into marker layer
         * @param {Object} features - Features to be loaded
         */
        onFeaturesLoaded: function(features) {
            this.addMarkerFromFeature(features);
        },

        /**
         * Retrieves the features from its source.
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
 * API factory method for ease creation of wfs marker layer.
 * @param {Object} options - Options for wfs the provider.
 */
SMC.wfsMarkerLayer = function(options) {
    return new SMC.layers.markers.WFSMarkerLayer(options);
};
