require("./LayerTreeNode.js");
/**
 * Base class for make a layer tree folder.
 * @class
 * @extends SMC.controls.layerTree.LayerTreeNode
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.controls.layerTree.LayerTreeFolder = SMC.controls.layerTree.LayerTreeNode.extend({

    options: {
        /**
         * Layer tree leaf label.
         * @property {string} label - label layer tree.
         */
        label: null
    },
    /**
     * Initialize the object with the params
     * @param {object} options - object with need parameters
     */
    initialize: function(options) {
        L.Util.setOptions(this, options);
    },

    createNodeHTML: function() {
        return this.options.label;
    }
});
