require('./layerTree.js');
require("./LayerTreeControl.js");
/**
 * Base class for layer tree controls.
 * @class
 * @extends L.Class
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.controls.layerTree.LayerTreeNode = L.Class.extend(
    /** @lends SMC.controls.layerTree.LayerTreeNode# */
    {

        /**
         * Layer visibility property
         * @property {string} visible - layer visibility property
         * @default true
         */
        visible: true,

        /**
         * Initialize the object with the params
         * @param {object} options - default options
         */
        initialize: function(options) {
            L.Util.setOptions(this, options);
        },

        /**
         * Implementations of LayerTreeNode must contain an override of this method, so HTML nodes can be loaded from their source.
         * @abstract
         */
        createNodeHTML: function() {
            throw new Error("LayerTreeNode::createNodeHTML must be implemented by derivate classes.");
        },

        /**
         * Method to know if a layer is visible
         * @returns {Boolean} True if the layer is visible
         */
        isVisible: function() {
            return visible;
        },

        /**
         * Method to set the visibility of a tree node.
         * @method
         * @param {Boolean} visible - Boolean param to set visibilty true or false.
         */
        setVisible: function(visible) {
            visible = visible;
            // TODO: Handle visibility change.
        }
    }
);
