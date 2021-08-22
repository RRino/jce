/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

// String functions
(function ($) {
    var standalone = (typeof wfePopup === "undefined");

    // uid counter
    var counter = 0;

    /**
     Generates an unique ID.
     @method uid
     @return {String} Virtually unique id.
     */
    function uid() {
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    var Wf = {
        i18n: {},
        language: '',
        options: {
            selectChange: $.noop,
            site: '',
            root: '',
            help: $.noop,
            alerts: ''
        },
        getURI: function (absolute) {
            if (!standalone) {
                return wfePopup.editor.documentBaseURI.getURI(absolute);
            }

            return (absolute) ? this.options.root : this.options.site;
        },
        init: function (options) {
            var self = this;

            $.extend(this.options, options);

            // add footer class
            $('.mceActionPanel, .actionPanel').addClass('uk-modal-footer');

            // ie flag
            if (/MSIE/.test(navigator.userAgent) || navigator.userAgent.indexOf('Trident/') !== -1 || navigator.userAgent.indexOf('Edge/') !== -1) {
                $('#jce').addClass('ie');
            }

            // create buttons
            $('button#insert, input#insert, button#update, input#update').button({
                icons: {
                    primary: 'uk-icon-check'
                }
            }).addClass('uk-button-primary');

            $('button#refresh, input#refresh').button({
                icons: {
                    primary: 'uk-icon-refresh'
                }
            });

            // add button actions
            $('#cancel').button({
                icons: {
                    primary: 'uk-icon-cancel'
                }
            });

            // go no further if standalone
            if (standalone) {
                return;
            }

            TinyMCE_Utils.fillClassList('classes');

            $('#apply').button({
                icons: {
                    primary: 'uk-icon-plus'
                }
            });

            $('#help').button({
                icons: {
                    primary: 'uk-icon-help'
                }
            }).on('click', function (e) {
                e.preventDefault();
                self.help();
            });

            // add button actions
            $('#cancel').on('click', function (e) {
                wfePopup.close();
                e.preventDefault();
            });

            // activate tabs
            $('#tabs').tabs();

            // create colour picker widgets
            this.createColourPickers();

            // create browser widgets
            this.createBrowsers();

            $('.uk-datalist').datalist({ loading: self.translate('message_load', 'Loading...') });

            // activate tooltips
            $('.hastip, .tip, .tooltip').tips();

            // set styles events
            $('#align, #clear, #dir').on('change', function () {
                self.updateStyles();
            });

            // set margin events
            $('input[id^="margin_"]').on('change', function () {
                self.updateStyles();
            });

            // setup border widget
            $('#border').borderWidget().on('border:change', function () {
                self.updateStyles();
            });

            // update styles on border change
            $('#border_width, #border_style, #border_color').on('change', function () {
                self.updateStyles();
            });

            $('#style').on('change', function () {
                self.setStyles();
            });

            // create constrainables around constrain checkbox
            $('.uk-constrain-checkbox').constrain();

            // equalize input values
            $('.uk-equalize-checkbox').equalize();

            // hide HTML4 only attributes
            if (wfePopup.editor.settings.schema === 'html5-strict' && wfePopup.editor.settings.validate) {
                $('.html4').hide().find(':input').prop('disabled', true);
            }

            // initialise repeatable elements
            $('.uk-repeatable').repeatable();

            $('body').on('keydown.tab', function (e) {
                if (e.keyCode === 9) {

                    // visible inputs and select2 combobox
                    var $navItems = $(':input:visible:enabled, span[role="combobox"]', this).not('input[type="file"]').filter(function () {
                        return this.getAttribute('tabindex') >= 0;
                    });

                    if (!$navItems.length) {
                        return;
                    }

                    // reset all tabindex values
                    $navItems.attr('tabindex', 0);

                    if (e.shiftKey) {
                        $navItems.reverse();
                    }

                    var endIndex = Math.max(0, $navItems.length - 1), idx = $navItems.index(e.target) + 1;

                    if (idx > endIndex) {
                        idx = 0;
                    }

                    $navItems.eq(idx).trigger('focus').attr('tabindex', 1);

                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            });

            // add scroll event to trigger datalist update
            $('.uk-tabs-panel').on('scroll.tabs', function (e) {
                $('select').trigger('datalist:position', e);
            });

            // prevent backspace out of window
            $('body').on('keydown.backspace', function (e) {
                if (e.keyCode === 8 && e.target) {

                    if (e.target && (e.target.nodeName === "INPUT" || e.target.nodeName === "SELECT" || e.target.nodeName === "TEXTAREA")) {
                        return;
                    }

                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            });

            // close on esc
            $('body').on('keyup.esc', function (e) {
                if (e.keyCode === 27) {
                    e.preventDefault();
                    e.stopPropagation();

                    // close an existing modal first
                    if ($('.uk-modal-close').length) {
                        $('.uk-modal-close').trigger('click');

                        return;
                    }

                    wfePopup.close();
                }
            });

            if (!standalone) {
                var ed = wfePopup.editor;

                if (ed.onUpdateMedia) {
                    function updateMedia(before, after) {
                        var basedir = $.fn.filebrowser.getbasedir();

                        before = Wf.String.path(basedir, before);
                        after = Wf.String.path(basedir, after);

                        ed.onUpdateMedia.dispatch(ed, { before: before, after: after });
                    }

                    $(window).ready(function () {
                        $('[data-filebrowser]').on('filebrowser:onfilerename filebrowser:onfolderrename', function (e, before, after) {
                            updateMedia(before, after);
                        }).on('filebrowser:onpaste', function (e, type, before, after) {
                            // only on cut/paste
                            if (type != 'moveItem') {
                                return;
                            }

                            updateMedia(before, after);
                        });
                    });
                }
            }
        },
        /**
         * Get the name of the plugin
         * @returns {String} Plugin name
         */
        getName: function () {
            return $('body').data('plugin');
        },
        getPath: function (plugin) {
            if (!standalone) {
                return wfePopup.editor.plugins[this.getName()].url;
            }

            return this.options.site + 'components/com_jce/editor/tiny_mce/plugins/' + this.getName();
        },
        loadLanguage: function () {
            if (!standalone) {
                var ed = wfePopup.editor,
                    u = ed.getParam('document_base_url') + 'components/com_jce/editor/tiny_mce';

                if (u && ed.settings.language && ed.settings.language_load !== false) {
                    u += '/langs/' + ed.settings.language + '_dlg.js';

                    if (!tinymce.ScriptLoader.isDone(u)) {
                        document.write('<script type="text/javascript" src="' + tinymce._addVer(u) + '"></script>');
                        tinymce.ScriptLoader.markDone(u);
                    }
                }
            }
        },
        help: function () {
            var ed = wfePopup.editor;

            ed.windowManager.open({
                url: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=help&lang=' + ed.settings.language + '&section=editor&category=' + this.getName(),
                title: ed.getLang('dlg.help', 'Help'),
                width: 896,
                height: 768,
                size: 'mce-modal-landscape-full',
                close_previous: 0
            });
        },

        createColourPickers: function () {
            var self = this,
                ed = wfePopup.editor,
                doc = ed.getDoc();

            $('input.color, input.colour').each(function () {
                var id = $(this).attr('id');
                var v = this.value;

                var elm = this;

                // remove # from value
                if (v && v.charAt(0) === "#") {
                    this.value = v.substr(1);
                    v = this.value;
                }

                if ($(this).siblings(':input').length) {
                    $(this).wrap('<span />');
                }

                $(this).parent('.uk-form-controls, td, span').addClass('uk-form-icon uk-form-icon-both').prepend('<i class="uk-icon-hashtag" />');

                var $picker = $('<button class="uk-button-link uk-icon-none uk-icon-colorpicker" title="' + self.translate('colorpicker') + '" aria-label="' + self.translate('colorpicker') + '" id="' + id + '_pick"></button>').insertAfter(this).attr('disabled', function () {
                    return $(elm).is(':disabled') ? true : null;
                });

                $(this).on('colorpicker:pick', function () {
                    var v = this.value;

                    if (v.charAt(0) !== "#") {
                        v = '#' + v;
                    }

                    $(this).next('.uk-icon-colorpicker').css('background-color', v);
                });

                $(this).on('change', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var v = this.value;

                    if (v && v.charAt(0) === "#") {
                        $(this).val(v.substr(1));
                    }

                    // default to black
                    if (v === "") {
                        v = "000000";
                    }

                    // toggle disabled
                    $(this).next('.uk-icon-colorpicker').attr('disabled', function () {
                        return elm.disabled ? true : null;
                    });

                    // fire event
                    $(this).trigger('colorpicker:pick', '#' + v);
                }).trigger('change');

                var colorpicker_custom_colors = ed.getParam('colorpicker_custom_colors', '');
                var colorpicker_type = ed.getParam('colorpicker_type', '');

                if (colorpicker_type === "simple" && colorpicker_custom_colors.length) {

                    if (typeof colorpicker_custom_colors === "string") {
                        colorpicker_custom_colors = colorpicker_custom_colors.split(',');
                    }

                    var html = '<div role="listbox" tabindex="0" class="wf-colorpicker-simple-colors">';

                    $.each(colorpicker_custom_colors, function (i, col) {
                        if (col.length == 4) {
                            col = col + col.substr(1);
                        }

                        html += '<div style="background-color:' + col + '" data-color="' + col + '" title="' + col + '"><span aria-hidden="true" aria-label="' + col + '"></span></div>';
                    });

                    html += '</div>';

                    $picker.tips({
                        trigger: 'click',
                        position: 'bottom center',
                        content: '<div id="colorpicker" aria-label="Colorpicker" title="Color Picker">' + html + '</div>',
                        className: 'wf-colorpicker wf-colorpicker-simple',
                        opacity: 1
                    }).on('tooltip:show', function () {
                        $('#colorpicker').on('click', '.wf-colorpicker-simple-colors > div', function (e) {
                            var col = $(e.target).data('color');

                            if (col) {
                                $(elm).val(col).trigger('change');
                                $picker.trigger('tooltip:close');
                            }
                        });
                    });
                } else {
                    // get stylesheets from editor
                    var stylesheets = [];

                    if (doc.styleSheets.length) {
                        $.each(doc.styleSheets, function (i, s) {
                            // only load template stylesheets, not from tinymce plugins
                            if (s.href && s.href.indexOf('tiny_mce') == -1) {
                                stylesheets.push(s);
                            }
                        });
                    }

                    var settings = $.extend(ColorPicker.settings, {
                        widget: $picker,
                        labels: {
                            picker_tab: 'Picker',
                            title: 'Color Picker',
                            palette_tab: 'Palette',
                            palette: 'Web Colors',
                            named_tab: 'Named',
                            named: 'Named Colors',
                            template_tab: 'Template',
                            template: 'Template Colors',
                            color: 'Color',
                            apply: 'Apply',
                            name: 'Name'
                        },
                        stylesheets: stylesheets,
                        custom_colors: colorpicker_custom_colors
                    });

                    $(this).colorpicker(settings);
                }
            });
        },
        createBrowsers: function (el, callback, filter) {
            var self = this;

            if (el) {
                $(el).addClass('browser').addClass(filter || '');
            }

            $('input.browser').add(el).each(function () {
                var input = this;

                filter = (function (el) {
                    if ($(el).hasClass('image') || $(el).hasClass('images')) {
                        return 'images';
                    }
                    if ($(el).hasClass('html')) {
                        return 'html';
                    }
                    if ($(el).hasClass('media')) {
                        return 'media';
                    }
                    return 'files';
                })(this);

                $(this).parent('td, .uk-form-controls').addClass('uk-form-icon uk-form-icon-flip');

                var map = {
                    'images': 'picture',
                    'html': 'file-text',
                    'files': 'file-text',
                    'media': 'film'
                };

                $('<button class="uk-icon uk-icon-' + map[filter] + ' uk-button uk-button-link" title="' + self.translate('browse', 'Browse for Files') + '" aria-label="' + self.translate('browse', 'Browse for Files') + '"></button>').on('click', function (e) {
                    e.preventDefault();

                    return wfePopup.execCommand('mceFileBrowser', true, {
                        "callback": callback || $(input).attr('id'),
                        "value": input.value,
                        "filter": $(this).attr('data-filter') || filter,
                        "caller": self.getName(),
                        "window": window
                    });

                }).insertAfter(this);
            });
        },
        getLanguage: function () {
            if (!this.language) {
                var s = $('body').attr('lang') || 'en';

                if (s.length > 2) {
                    s = s.substr(0, 2);
                }

                this.language = s;
            }

            return this.language;
        },
        /**
         * Resize o to fit into container c
         * @param {Object} o Width / Height Object pair
         * @param {Object} c Width / Height Object pair
         */
        sizeToFit: function (o, c) {
            var x = c.width;
            var y = c.height;
            var w = o.width;
            var h = o.height;

            var ratio = x / w;

            if (w / h > ratio) {
                h = h * (x / w);
                w = x;
                if (h > y) {
                    w = w * (y / h);
                    h = y;
                }
            } else {
                w = w * (y / h);
                h = y;
                if (w > x) {
                    h = h * (x / w);
                    w = x;
                }
            }

            return {
                width: Math.round(w),
                height: Math.round(h)
            };
        },
        /**
         * Adds a language pack, this gets called by the loaded language files like en.js.
         *
         * @method addI18n
         * @param {String} p Prefix for the language items. For example en.myplugin
         * @param {Object} o Name/Value collection with items to add to the language group.
         * @source TinyMCE EditorManager.js
         * @copyright Copyright 2009, Moxiecode Systems AB
         * @licence GNU / LGPL 2 - http://www.gnu.org/copyleft/lesser.html
         *
         * Modified for JQuery
         */
        addI18n: function (p, o) {
            var i18n = this.i18n;

            if ($.type(p) == 'string') {
                $.each(o, function (k, o) {
                    i18n[p + '.' + k] = o;
                });
            } else {
                $.each(p, function (lc, o) {
                    $.each(o, function (g, o) {
                        $.each(o, function (k, o) {
                            if (g === 'common')
                                i18n[lc + '.' + k] = o;
                            else
                                i18n[lc + '.' + g + '.' + k] = o;
                        });

                    });

                });
            }
        },
        translate: function (s, ds) {
            return wfePopup.getLang('dlg.' + s, ds || s);
        }
    };

    /**
     * Cookie Functions
     */
    Wf.Storage = {
        /**
         * Gets the raw data of a sessionStorage item by name.
         *
         * @method get
         * @param {String} n Name of item to retrive.
         * @param {String} s Default value to return.
         * @param {Function} fn Function to validate value against, return default if false
         * @return {String} Data string.
         */
        get: function (n, s, fn) {
            if (!window.sessionStorage) {
                return s;
            }

            var val = sessionStorage.getItem(n);

            v = unescape(val);

            if (typeof v == 'undefined') {
                return s;
            }

            if (fn && typeof fn === "function" && !fn(v)) {
                return s;
            }

            return v;
        },
        /**
         * Sets a raw sessionStorage string.
         *
         * @method set
         * @param {String} n Name of the item.
         * @param {String} v Raw item data.
         */
        set: function (n, v) {
            if (!window.sessionStorage) {
                return;
            }

            sessionStorage.setItem(n, v);
        }

    };
    // load Language
    Wf.loadLanguage();

    window.Wf = Wf;
})(jQuery);

if (typeof ColorPicker === 'undefined') {
    var ColorPicker = {
        settings: {}
    };
}
/* Compat */
AutoValidator = {
    validate: function () {
        return true;
    }
};