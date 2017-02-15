/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    var fmts = {
        'p': 'advanced.paragraph',
        'address': 'advanced.address',
        'pre': 'advanced.pre',
        'h1': 'advanced.h1',
        'h2': 'advanced.h2',
        'h3': 'advanced.h3',
        'h4': 'advanced.h4',
        'h5': 'advanced.h5',
        'h6': 'advanced.h6',
        'div': 'advanced.div',
        'div_container': 'advanced.div_container',
        'blockquote': 'advanced.blockquote',
        'code': 'advanced.code',
        'samp': 'advanced.samp',
        'span': 'advanced.span',
        'section': 'advanced.section',
        'article': 'advanced.article',
        'aside': 'advanced.aside',
        'figure': 'advanced.figure',
        'dt': 'advanced.dt',
        'dd': 'advanced.dd'
    };

    tinymce.create('tinymce.plugins.FormatSelectPlugin', {
        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            var nodes = [];

            // map format options to array of node names
            each(ed.getParam('formatselect_blockformats', fmts, 'hash'), function (v, k) {
                nodes.push(k.toUpperCase());
            });

            function isFormat(n) {
                return tinymce.inArray(n.nodeName, nodes);
            }

            ed.onNodeChange.add(function (ed, cm, n) {
                var c = cm.get('formatselect'),
                    p;

                    

                // select font
                if (c) {
                    p = ed.dom.getParent(n, isFormat);

                    if (p) {
                        c.select(p.nodeName.toLowerCase());
                    } else {
                        c.select("");
                    }
                }
            });
        },

        createControl: function (n, cf) {
            if (n === "formatselect") {
                return this._createBlockFormats();
            }
        },

        _createBlockFormats: function () {
            var self = this,
                ed = this.editor,
                c, PreviewCss = tinymce.util.PreviewCss;

            c = ed.controlManager.createListBox('formatselect', {
                title: 'advanced.block',
                onselect: function (v) {
                    ed.execCommand('FormatBlock', false, v);
                    return false;
                }
            });

            if (c) {
                each(ed.getParam('formatselect_blockformats', fmts, 'hash'), function (v, k) {
                    c.add(ed.translate(v, k), k, {
                        'class': 'mce_formatPreview mce_' + k,
                        style: function () {
                            return PreviewCss(ed, {
                                'block': k
                            });
                        }
                    });
                });
            }

            return c;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('formatselect', tinymce.plugins.FormatSelectPlugin);
})();