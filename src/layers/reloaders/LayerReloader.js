require("./reloaders.js");

/**
 * Layer reloader. Allows setting triggers so a layer's data can be re-retrieved from its original data.
 *
 * Intended for being mixed in into a SMC.layer.SingleLayer.
 *
 * @class
 * @extends L.Class
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.reloaders.LayerReloader = L.Class.extend(
    /** @lends SMC.layers.reloaders.LayerReloader# */
    {
        _triggers: [],

        initialize: function(options) {
            if (options.reloadTriggers && options.reloadTriggers.length > 0) {
                for (var i = 0; i < options.reloadTriggers.length; i++) {
                    var trigger = options.reloadTriggers[i];
                    this.addReloadTrigger(trigger);
                }
            }
        },

        /**
         * Load a layer's data
         * @abstract
         */
        load: function() {
            throw new Error("SMC.layers.reloaders.LayerReloader::load method must be implemented by an inheriting class");
        },

        /**
         * Unload a layer's data
         * @abstract
         */
        unload: function() {
            throw new Error("SMC.layers.reloaders.LayerReloader::unload method must be implemented by an inheriting class");
        },

        /**
         * Method to reload the trigger
         * @param {object} trigger - trigger to reliad the control
         */
        addReloadTrigger: function(trigger) {
            if (typeof trigger.type !== "undefined") {
                trigger = this._createTriggerFromConfig(trigger);
            }

            this._triggers.push(trigger);
            trigger.on("reloadTriggered", this._onReloadTriggered, this);
            trigger.initTrigger();
        },

        _createTriggerFromConfig: function(triggerConfig) {
            if (!triggerConfig.type || typeof triggerConfig.type !== "string") {
                throw new Error("SMC.layers.reloaders.LayerReloader::_createTriggerFromConfig: triggerConfig must include a type field (string)");
            }

            var triggerClass = SMC.Util.getClass(triggerConfig.type);

            var triggerConstructor = SMC.Util.getConstructor(triggerClass);

            return triggerConstructor(triggerConfig.params);
        },

        _onReloadTriggered: function() {
            // Reloads the layer.
            this.unload();
            this.load();
        }
    });
