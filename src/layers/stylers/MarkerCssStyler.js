require("./Styler.js");
require("../../../lib/LeafletHtmlIcon.js");
var Mustache = require("../../../lib/mustache.js/mustache.js");

/**
 * Parser of MarkerCSS, for user with SMC Viewer's marker layers.
 *
 * @class
 * @extends SMC.layers.stylers.Styler
 * @mixin SMC.layers.stylers.MarkerCssStyler
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.stylers.MarkerCssStyler = SMC.layers.stylers.Styler.extend(
    /** @lends SMC.layers.stylers.MarkerCssStyler# */
    {
        /**
         * Initialize the object with the params
         * @param {object} options - default options
         */
        initialize: function(options) {
            this._parser_url = SMC.BASE_URL + "resources/parser.txt";
            SMC.layers.stylers.Styler.prototype.initialize.apply(this, arguments);
        },

        /**
         * Adds style properties to the received features, so the can be represented as intended by the style for the layer.
         * @param {object} feature - An object that represents the geometry element being styled.
         * @param {string} zoom - Number that represents the level zoom to apply the style.
         * @returns {object} style from the marker
         */
        applyStyle: function(feature, zoom) {
            var properties = feature.properties;
            var style = this._createStyles(feature, zoom);
            if (!style) {
                style = "";
            }

            feature._style = style;


            var icon, width, height, anchorLeft, anchorTop;

            width = style.markerWidth || 0;
            height = style.markerHeight || 0;

            anchorLeft = style.anchorLeft || 0;
            anchorTop = style.anchorTop || 0;

            var disableClustering = !!style.disableClustering;
            var opacity = style.opacity ? style.opacity : 1;
            //var visible = !style.invisible ? true : false;
            // var visible;
            // if(style.invisible == 'false'){
            //     visible = true;
            // }else
            // visible = false;

            if (style.iconUrl) {
                // Load normal marker icon with the specified url.


                icon = new L.icon({
                    iconUrl: style.iconUrl,
                    iconSize: [width, height],
                    iconAnchor: [anchorLeft, anchorTop]
                });

            } else if (style.templateUrl) {
                // Load the given page from its url in an iframe.

                icon = new L.HtmlIcon({
                    //html: "<iframe src=" + style.templateUrl + ' style=" border: none;width:' + width + 'px;height:' + height + 'px;margin-top:-' + anchorTop + 'px;margin-left:-' + anchorLeft + 'px"></iframe>',
                    html: this._createHTMLElement("iframe", {
                        "src": style.templateUrl
                    }, {
                        "border": "none",
                        "width": {
                            value: width,
                            units: "px"
                        },
                        "height": {
                            value: height,
                            units: "px",
                        },
                        "margin-top": {
                            value: "-" + anchorTop,
                            units: "px"
                        },
                        "margin-left": {
                            value: "-" + anchorLeft,
                            units: "px"
                        }
                    })
                });


            } else if (style.htmlTemplate) {
                // Load the template into the marker.
                // TODO: "inflate the template" using mustache.
                var data = {};
                for (var propKey in properties) {
                    data[propKey] = properties[propKey];
                }


                var output = Mustache.render(style.htmlTemplate, data);


                //var container = '<div style=" width:' + width + 'px;height:' + height + 'px;margin-top:-' + anchorTop + 'px;margin-left:-' + anchorLeft + 'px">' + output + "</div>";

                icon = new L.HtmlIcon({
                    html: this._createHTMLElement("div", {

                    }, {
                        "width": {
                            value: width,
                            units: "px"
                        },
                        "height": {
                            value: height,
                            units: "px",
                        },
                        "margin-top": {
                            value: "-" + anchorTop,
                            units: "px"
                        },
                        "margin-left": {
                            value: "-" + anchorLeft,
                            units: "px"
                        }
                    }, output),

                });

            } else if (style.iconClassName) {

                icon = new L.HtmlIcon({
                    //html: '<div class="'+style.iconClassName+'" style=" border: none;width:' + width + 'px;height:' + height + 'px;margin-top:-' + anchorTop + 'px;margin-left:-' + anchorLeft + 'px"></div>',
                    html: this._createHTMLElement("div", {
                        "class": style.iconClassName
                    }, {
                        "border": "none",
                        "width": {
                            value: width,
                            units: "px"
                        },
                        "height": {
                            value: height,
                            units: "px",
                        },
                        "margin-top": {
                            value: anchorTop,
                            units: "px"
                        },
                        "margin-left": {
                            value: anchorLeft,
                            units: "px"
                        }
                    }),

                });
            } else {
                icon = new L.icon({
                    iconUrl: L.Icon.Default.imagePath + "/marker-icon.png",
                    iconAnchor: [13, 41]
                });
            }

            return {
                icon: icon,
                disableClustering: disableClustering,
                opacity: opacity
            };

        },

        _createHTMLElement: function(elementType, attributes, styles, content) {

            if (!content) {
                content = "";
            }

            var attributesString = "";
            for (var attrKey in attributes) {
                attributesString += attrKey + '="' + attributes[attrKey] + '"';
            }

            var stylesString = "";
            for (var styleKey in styles) {
                var style = styles[styleKey];
                if (!style) {
                    continue;
                } else if (typeof style == "object") {
                    if (style.value) {
                        stylesString += styleKey + ":" + style.value;
                        if (style.units) {
                            stylesString += style.units;
                        }
                        stylesString += ";";
                    }
                } else {
                    stylesString += styleKey + ":" + style;
                    stylesString += ";";
                }

            }


            return "<" + elementType + " " + attributesString + " style=\"position:absolute;" + stylesString + "\">" + content + "</" + elementType + ">";
        },

        /**
         * Adds style popup to the received features, so the can be represented as intended by the style for the layer.
         * @param {object} marker - An object that represents the geometry element being styled.
         * @param {string} zoom - Number that represents the level zoom to apply the style.
         */
        addPopUp: function(marker, zoom) {

            if (marker.popup) {
                marker.unbindPopup();
            }
            var style = null;
            if(marker.feature && marker.feature._style){
                style = marker.feature._style;
            }else{
                style = "";
            }
            var offsetLeft = style.popUpOffsetLeft || 0;
            var offsetTop = style.popUpOffsetTop || 0;


            var content, propKey;
            var data = {};
            if (style.popUpTemplate) {


                content = this._contentFromTemplate(marker.feature, style.popUpTemplate);

            } else if (style.popUpUrl) {
                content = "<iframe src=" + style.popUpUrl + "/>";

            } else if (style.noPopUp) {
                marker.unbindPopup();

            } else {
                // Default template, one entry per field;
                content = this._contentFromTemplate(marker.feature, "");
            }
            var offset = [offsetLeft, offsetTop];
            if (content) {
                marker.bindPopup(content, {
                    offset: offset
                });
            }
        }
    });
