require("./AggregatingHistoryLayer.js");
require("../layers.js");
require("../../LayerLoader.js");

/**
 * Class formed by the aggregation of several history layers.
 *
 * @class
 * @extends SMC.layers.SingleLayer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.history.DataHistoryLayer = SMC.layers.SingleLayer.extend(
	/** @lends SMC.layers.history.DataHistoryLayer# */
	{
		_historyLayers: {},
		_timer: null,
		_node: null,

		initialize: function(options) {
			L.Util.setOptions(this, options);
			L.LayerGroup.prototype.initialize.call(this, options);
			SMC.layers.SingleLayer.prototype.initialize.apply(this, options);


		},

		/**
         * Method to create an HTML node for the name of the layer.
         * @returns {String} HTML code representing the code to be added to the layer's entry in the layer tree.
         */
		createNodeHTML: function() {
			this._historyLayers = this.orderLayers();
			var layers = this._historyLayers;

			var node = document.createElement("div");
			var label = document.createElement('label'),
				input,
				checked = this.getMap().hasLayer(this);

			input = document.createElement('input');
			input.type = 'checkbox';
			input.defaultChecked = checked;
			var name = document.createElement('span');
			name.innerHTML = ' ' + (this.options.label || this.options.typeName);

			label.appendChild(input);
			label.appendChild(name);

			label.style.cursor = "pointer";

			label.onchange = function(event) {
				self._clickOnLayer(node);
			};

			var sliderControl = document.createElement("div");
			sliderControl.style.marginLeft = '10px';
			sliderControl.style.marginTop = '5px';


			var sliderControlLabel = document.createElement("span");
			sliderControlLabel.style.float = 'left';
			sliderControl.innerHTML += '<input id="interval_' + this._leaflet_id + '" name="interval_' + this._leaflet_id + '" min="0" max="' + (this.options.layersConfig.length - 1) + '" type="range" step="1" value="0"/>';
			sliderControl.className = 'leaflet-bar leaflet-update-interval ';

			var time = sliderControl.children[0].value;

			var play_pause = document.createElement("i");
			play_pause.style.float = 'left';
			play_pause.style.marginLeft = '10px';
			play_pause.style.marginTop = '5px';
			play_pause.className = 'fa fa-play';
			play_pause.style.cursor = "pointer";

			this._addTimeData(time);
			this._showLabel(sliderControlLabel);

			var self = this;
			L.DomEvent.addListener(sliderControl, 'mousedown', L.DomEvent.stopPropagation);
			L.DomEvent.addListener(sliderControl, 'mouseup', function() {
				time = sliderControl.children[0].value;
				self.showTimeData(time);
				self._showLabel(sliderControlLabel);
				L.DomEvent.stopPropagation;
			});
			L.DomEvent.addListener(sliderControl, 'touchstart', L.DomEvent.stopPropagation);
			L.DomEvent.addListener(sliderControl, 'touchend', L.DomEvent.stopPropagation);

			sliderControl.appendChild(sliderControlLabel);
			sliderControl.appendChild(play_pause);
			node.appendChild(label);
			node.appendChild(sliderControl);

			play_pause.onclick = function() {
				self._onPlayPause(node, time);
			};
			this._node = node;
			return node;

		},

		orderLayers: function() {
			var layers;
			var exists = true;
			for (var d in this._aggregatingLayers) {
				var date = this._aggregatingLayers[d].options.date;
				if (!date) {
					exists = false;
					break;
				}
			}

			if (!exists) {
				layers = this._aggregatingLayers;

			} else {

				var layersObj = {};
				var layersArray = [];
				for (var l in this._aggregatingLayers) {
					layersArray.push(this._aggregatingLayers[l]);
				}

				layersArray.sort(function(a, b) {
					return (a.options.date - b.options.date)
				});

				for (var i = 0; i < layersArray.length; i++) {
					if (!layersObj[layersArray[i].options.date]) {
						layersObj[layersArray[i].options.date] = layersArray[i];
					} else {
						layersObj[layersArray[i].options.label] = layersArray[i];
					}
				}
				layers = layersObj;
			}
			return layers;

		},

		/**
         * Method to add the layer in the map
         * @param {SMC.Map} map - Map to be added
         */
		addTo: function(map) {
			SMC.layers.aggregation.AggregatingLayer.prototype.addTo.call(this, map);
		},

		/**
         * Method to get the map
         * @returns {SMC.Map} map - Map layer
         */
		getMap: function() {
			SMC.layers.aggregation.AggregatingLayer.prototype.getMap.call(this, arguments);
			return map;
		},

		showTimeData: function(time, add) {
			var i = 0;
			var data = this._historyLayers;
			if (time % 1 !== 0) {
				time = time - (time % 1);
			}
			for (var d in data) {
				// if (i == time && data[d].actual) {
				// 	break;
				// }

				
					if (data[d].actual) {
							data[d].onRemove(this.getMap());
							data[d].actual = false;

					}

					if (i == time) {
						if (!data[d].actual) {
							data[d]._slidermove = true;
							data[d].actual = true;
							data[d].onAdd(this.getMap());

							//recalculate canvas position for geometry layers (important)
							this.getMap().fire("slidermove");
						}
					}



					i++;

				}
			



		},

		_addTimeData: function(time) {
			var i = 0;
			var data = this._historyLayers;
			for (var d in data) {

				if (i == time) {
					this.getMap().addLayer(data[d]);
					this._historyLayers[d].actual = true;
				}
				i++;

			}

		},

		_showLabel: function(sliderControlLabel) {
			var data = this._historyLayers;
			for (var d in data) {
				if (data[d].actual) {
					sliderControlLabel.innerHTML = data[d].options.label || data[d].options.typeName;
				}
			}
		},

		_clickOnLayer: function(node) {
			var pause = node.getElementsByClassName('fa fa-pause')[0];
			if (pause) {
				this._onPlayPause(node);
			}
			var data = this._historyLayers;
			if (node.children[1].style.display != 'none') {
				node.children[1].style.display = 'none';
				node.children[0].checked = false;
				for (var d in data) {
					if (data[d].actual) {
						data[d].onRemove(map);
					}
				}
			} else {
				node.children[1].style.display = 'block';
				node.children[0].checked = true;
				for (var d in data) {
					if (data[d].actual) {
						data[d].onAdd(map);
					}
				}
			}

		},

		_onPlayPause: function(node, time) {
			var data = this._historyLayers;

			var maxValue = node.children[1].children[0].max;
			var sliderControlLabel = node.children[1].children[1];

			if (node.children[1].children[2].className == 'fa fa-play') {
				node.children[1].children[2].className = 'fa fa-pause';
				if (node.children[1].children[0].value == maxValue) {
					node.children[1].children[0].value = 0;
				}


				var i = parseFloat(node.children[1].children[0].value);
				var self = this;
				this._timer = setInterval(function() {
					i += parseFloat(node.children[1].children[0].step);
					self.showTimeData(i);
					self._showLabel(sliderControlLabel);
					if (i < maxValue) {
						node.children[1].children[0].value = i;

					} else {
						clearInterval(self._timer);
						node.children[1].children[2].className = 'fa fa-play';
						node.children[1].children[0].value = maxValue;

					}

				}, this.options.time);

			} else {

				node.children[1].children[2].className = 'fa fa-play';
				clearInterval(this._timer);
			}
		},

		/**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be removed
         */
		onRemove: function(map) {
			var data = this._historyLayers;
			for (var d in data) {
				if (data[d].actual) {
					data[d]._slidermove = false;
					data[d].onRemove(map);

				}

			}

		},

		/**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
		onAdd: function(map) {
			SMC.layers.aggregation.AggregatingLayer.prototype.addTo.call(this, map);
			var value;
			if (this._node != null) {
				value = this._node.children[1].children[0].value;
			} else
				value = 0;

			var data = this._historyLayers;
			for (var d in data) {
				if (data[d].actual) {
					data[d]._slidermove = false;
					data[d].onAdd(map);

				}
			}

		

		}



	});