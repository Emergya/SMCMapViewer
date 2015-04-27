require("./layerTree.js");
/**
 * Base class for layer tree controls.
 * @class
 * @extends L.Control
 * @param {SMC.controls.layerTree.LayerTreeControl~options} options - The configuration for the class
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.controls.layerTree.LayerTreeControl = L.Control.extend(
    /** @lends SMC.controls.layerTree.LayerTreeControl# */
    {
        /**
         * @typedef {Object} SMC.controls.layerTree.LayerTreeControl~options
         * @property {boolean} collapsed=true - Default collapsed value
         * @property {string} position='topright' - Default position value
         * @property {boolean} autoZIndex=true - Default autoZIndex value
         */
        options: {
            collapsed: true,
            position: 'topright',
            autoZIndex: true
        },
        /**
         * Initialize the object with the params
         * @param {SMC.layers} baseLayers - Layers as a base layers
         * @param {Object} options - Object with extra information
         */
        initialize: function(baseLayers, options) {
            L.Util.setOptions(this, options);

            this._baseLayers = [];
            this._layers = {};
            this._parents = {};
            this._lastZIndex = 0;
            this._handlingClick = false;
            this._groupList = [];
            this._domGroups = [];

            for (var i in baseLayers) {
                this._addLayer(baseLayers[i], i);
            }

        },

        /**
         * Method to get the map
         * @returns {SMC.Map} map - Map layer
         */
        getMap: function() {
            return this._map;
        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         * @returns {object} Tree control container
         */
        onAdd: function(map) {
            this._initLayout();
            this._update();

            map
                .on('layeradd', this._onLayerChange, this)
                .on('layerremove', this._onLayerChange, this);


            return this._container;
        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be removed
         */
        onRemove: function(map) {
            map
                .off('layeradd', this._onLayerChange)
                .off('layerremove', this._onLayerChange);
        },

        /**
         * Method to add layer as a base layer
         * @param {SMC.layers} layer - Layer to be added
         * @param {String} name - Layer name
         */
        addBaseLayer: function(layer, name) {
            this._addLayer(layer, name);
            this._update();
            return this;
        },

        /**
         * Method to add layer as an overlay layer
         * @function
         * @param {SMC.layers} layer - Layer to be added
         * returns {object} Tree control
         */
        addOverlay: function(layer) {
            this._methodRecursive(layer);
            this._update();
            return this;
        },

        /**
         * Method to remove a layer from the map
         * @param {SMC.layers} layer - Layer to be removed
         * returns {object} Tree control
         */
        removeLayer: function(layer) {
            var id = L.Util.stamp(layer);
            delete this._layers[id];
            this._update();
            return this;
        },

        _initLayout: function() {
            var className = 'leaflet-control-layers',
                container = this._container = L.DomUtil.create('div', className);

            //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
            container.setAttribute('aria-haspopup', true);

            if (!L.Browser.touch) {
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.on(container, 'wheel', L.DomEvent.stopPropagation);
            } else {
                L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
            }

            var form = this._form = L.DomUtil.create('form', className + '-list');

            if (this.options.collapsed) {
                if (!L.Browser.android) {
                    L.DomEvent
                        .on(container, 'mouseover', this._expand, this)
                        .on(container, 'mouseout', this._collapse, this);
                }
                var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
                link.href = '#';
                link.title = 'Layers';

                if (L.Browser.touch) {
                    L.DomEvent
                        .on(link, 'click', L.DomEvent.stop)
                        .on(link, 'click', this._expand, this);
                } else {
                    L.DomEvent.on(link, 'focus', this._expand, this);
                }

                this._map.on('click', this._collapse, this);
                // TODO keyboard accessibility
            } else {
                this._expand();
            }

            this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
            this._separator = L.DomUtil.create('div', className + '-separator', form);
            this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

            container.appendChild(form);
        },

        _addLayer: function(layer, name) {
            var id = L.Util.stamp(layer);

            this._layers[id] = {
                layer: layer,
                name: name,
                overlay: false
            };

            if (this.options.autoZIndex && layer.setZIndex) {
                this._lastZIndex++;
                layer.setZIndex(this._lastZIndex);
            }
        },

        _update: function() {
            if (!this._container) {
                return;
            }

            this._baseLayersList.innerHTML = '';
            this._overlaysList.innerHTML = '';
            this._domGroups.length = 0;

            var baseLayersPresent = false,
                overlaysPresent = false,
                i, obj;

            for (i in this._layers) {
                obj = this._layers[i];
                this._addItem(obj);
                overlaysPresent = overlaysPresent || obj.overlay;
                baseLayersPresent = baseLayersPresent || !obj.overlay;
            }


            var map = this.getMap();

            if (map) {
                for (var j in map._layers) {
                    obj = map._layers[j];
                    if (obj instanceof SMC.layers.aggregation.MultiModeLayer) {
                        obj._initializeTree();
                    }

                }
            }

            this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
        },

        _methodRecursive: function(layer) {
            var id = L.Util.stamp(layer);
            var name = "";
            if (layer.createNodeHTML) {
                name = layer.createNodeHTML();
            } else {
                name = layer.options.label;
            }
            if (!this._layers[id]) {
                var element = {
                    name: name,
                    layer: layer,
                    overlay: true,
                    parent: null
                };
                if (layer.loadLayers) {
                    this._parents[id] = element;
                } else {
                    this._layers[id] = element;

                }

                if (layer.parent) {
                    element.parent = L.Util.stamp(layer.parent);
                    this._methodRecursive(layer.parent);
                } else if (layer.options.parent) {
                    element.parent = layer.options.parent;
                    this._methodRecursive(this._parents[element.parent].layer);
                }

            }
            if (this.options.autoZIndex && layer.setZIndex) {
                this._lastZIndex++;
                layer.setZIndex(this._lastZIndex);
            }
        },

        _onLayerChange: function(e) {
            if (e.layer instanceof L.Marker) {
                // We don't want to trigger tree rebuilding when adding each marker of a layer.
                return;
            }

            if (e.layer._slidermove) {
                return;
            }
            if (e.layer._group) {
                if (e.layer._group._slidermove)
                    return;
            }


            var obj = this._layers[L.Util.stamp(e.layer)];
            if (e.layer.deleteTree) {
                delete this._layers[L.Util.stamp(e.layer)];
                this._update();
                return;
            }

            if (e.layer._map) {
                if (!obj) {
                    if (e.layer.options && e.layer.options.label) {
                        this._methodRecursive(e.layer);
                        this._update();
                    }
                } else {
                    var type = obj.overlay ?
                        (e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
                        (e.type === 'layeradd' ? 'baselayerchange' : null);
                    if (type) {
                        this._map.fire(type, obj);
                    }
                }

                if (!this._handlingClick) {
                    this._update();
                }
            } else {
                if (!this._handlingClick) {
                    delete this._layers[L.Util.stamp(e.layer)];
                    this._update();
                }
            }

        },



        // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
        _createRadioElement: function(name, checked) {

            var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
            if (checked) {
                radioHtml += ' checked="checked"';
            }
            radioHtml += '/>';

            var radioFragment = document.createElement('div');
            radioFragment.innerHTML = radioHtml;

            return radioFragment.firstChild;
        },

        _getLabel: function(obj) {
            var label = document.createElement('label'),
                input,
                checked = this._map.hasLayer(obj.layer);

            if (obj.overlay) {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'leaflet-control-layers-selector';
                input.id = obj.layer._leaflet_id;
                input.defaultChecked = checked;
                L.DomEvent.on(input, 'click', this._onInputClick, this);
            } else {
                input = this._createRadioElement('leaflet-base-layers', checked);
                L.DomEvent.on(input, 'click', this._onRadioClick, this);
            }

            input.layerId = L.Util.stamp(obj.layer);

            if (obj.layer && obj.layer.createNodeHTML) {
                var nodeContent = obj.layer.createNodeHTML();
                if (nodeContent) {
                    obj.name = nodeContent;
                }

            }

            var name = document.createElement('span');
            //name.innerHTML = ' ' + obj.name;
            if (typeof obj.name == 'string') {
                name.innerHTML = ' ' + obj.name;
            } else {
                name.appendChild(obj.name);
            }
            if (obj.layer instanceof SMC.layers.geometry.SolrGeometryHistoryLayer) {
                label = document.createElement('div');
                label.appendChild(name);
                return label;
            }

            label.appendChild(input);
            label.appendChild(name);

            return label;
        },

        _getGroupContainer: function(obj) {
            var groupContainer = document.createElement('div');
            groupContainer.className = 'leaflet-control-layers-group';
            groupContainer.id = 'leaflet-control-layers-group-' + L.Util.stamp(obj.layer);
            // Create span folder title
            var groupLabel = this._getGroupLabel(obj);
            // Add folder label to group container
            groupContainer.appendChild(groupLabel);

            return groupContainer;
        },

        _getGroupLabel: function(obj) {
            var groupLabel = document.createElement('span');
            groupLabel.className = 'leaflet-control-layers-group-name';
            groupLabel.appendChild(obj.name);

            return groupLabel;
        },

        _getGroupContent: function(obj) {
            var groupContent = document.createElement('div');
            groupContent.className = 'leaflet-control-layers-group-content';
            if (obj.name.className.indexOf("open") == -1) {
                groupContent.style.display = 'none';
            }

            return groupContent;
        },

        _addItemRecursively: function(obj) {
            if (obj.parent) {
                var parent = this._parents[obj.parent];
                this._addItemRecursively(parent);
                if (obj.layer.loadedLayers) {
                    var folderId = L.Util.stamp(obj.layer);
                    if (!this._domGroups[folderId]) {
                        var parentDom = this._getParentDom(obj.parent);
                        var parentContent = parentDom.getElementsByClassName(
                            "leaflet-control-layers-group-content")[0];
                        this._addFolderToOverlays(obj, parentContent);
                    }
                } else {
                    // It's a layer
                    this._addLayerToOverlays(obj);
                }
            } else {
                if (obj.layer.loadedLayers) {
                    // It's a folder
                    var folderId = L.Util.stamp(obj.layer);
                    if (!this._domGroups[folderId]) {
                        this._addFolderToOverlays(obj);
                    }
                } else {
                    // It's a layer
                    this._addLayerToOverlays(obj);
                }
            }
        },

        _addFolderToOverlays: function(obj, parent) {
            // Create group container div
            var groupContainer = this._getGroupContainer(obj);
            // Create group content div
            groupContent = this._getGroupContent(obj);
            // Add group content to group container
            groupContainer.appendChild(groupContent);
            // Add group container to container
            if (parent) {
                parent.appendChild(groupContainer);
            } else {
                container.appendChild(groupContainer);
            }
            // Add group container to domGroups
            this._domGroups[L.Util.stamp(obj.layer)] = groupContainer;
        },

        _getParentDom: function(id) {
            var parent = null;
            for (el in this._domGroups) {
                var groupId = this._domGroups[el].id.split("-")[4];
                if (groupId == id) {
                    parent = this._domGroups[el];
                }
            }
            return parent;
        },

        _addLayerToOverlays: function(obj) {
            var label = this._getLabel(obj);
            if (obj.parent) {
                var parent = this._getParentDom(obj.parent);
                var parentContent = parent.getElementsByClassName("leaflet-control-layers-group-content")[0];
                parentContent.appendChild(label);
            } else {
                container.appendChild(label);
            }
        },

        _addItem: function(obj) {
            var label = this._getLabel(obj);
            if (obj.overlay) {
                container = this._overlaysList;
                this._addItemRecursively(obj);
            } else {
                container = this._baseLayersList;
                container.appendChild(label);
            }

            return label;
        },

        _onInputClick: function() {
            var i, input, obj,
                inputs = $('input[type=checkbox]', this._from),
                inputsLen = inputs.length;

            this._handlingClick = true;

            for (i = 0; i < inputsLen; i++) {
                input = inputs[i];
                obj = this._layers[input.layerId];
                if (obj) {
                    if (input.checked && !this._map.hasLayer(obj.layer)) {
                        this._map.addLayer(obj.layer);
                    } else if (!input.checked && this._map.hasLayer(obj.layer)) {
                        this._map.removeLayer(obj.layer);
                    }
                }
            }
            this._handlingClick = false;
        },

        _onRadioClick: function() {
            var i, input, obj,
                inputs = $('input[type=radio]', this._from),
                inputsLen = inputs.length;

            this._handlingClick = true;

            for (i = 0; i < inputsLen; i++) {
                input = inputs[i];
                obj = this._layers[input.layerId];
                if (obj) {
                    if (input.checked && !this._map.hasLayer(obj.layer)) {
                        this._map.addLayer(obj.layer);
                    } else if (!input.checked && this._map.hasLayer(obj.layer)) {
                        this._map.removeLayer(obj.layer);
                    }
                }
            }
            this._handlingClick = false;
        },

        _expand: function() {
            L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
        },

        _collapse: function() {
            this._container.className = this._container.className.replace(' leaflet-control-layers-expanded',
                '');
        }
    }
);
/**
 * API factory method for ease creation of LayerTreeControl.
 * @param {Object} baseLayer - Javascript object with base layer name and its layer
 * @param {Object} overlays - Javascript object with overalys layer name ans its layer
 * @param {Object} options - Javascript object with the options params
 */
SMC.layerTreeControl = function(baseLayers, overlays, options) {
    return new SMC.controls.layerTree.LayerTreeControl(baseLayers, overlays, options);
};