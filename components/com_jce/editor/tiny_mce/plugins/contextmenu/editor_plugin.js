/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    var Event = tinymce.dom.Event,
        DOM = tinymce.DOM;

    /**
     * This plugin a context menu to TinyMCE editor instances.
     *
     * @class tinymce.plugins.ContextMenu
     */
    tinymce.create('tinymce.plugins.ContextMenu', {
        /**
         * Initializes the plugin, this will be executed after the plugin has been created.
         * This call is done before the editor instance has finished it's initialization so use the onInit event
         * of the editor instance to intercept that event.
         *
         * @method init
         * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
         * @param {string} url Absolute URL to where the plugin is located.
         */
        init: function (ed) {
            var self = this,
                showMenu, contextmenuNeverUseNative, realCtrlKey, hideMenu;

            self.editor = ed;

            contextmenuNeverUseNative = ed.settings.contextmenu_never_use_native;

            var isNativeOverrideKeyEvent = function (e) {
                return e.ctrlKey && !contextmenuNeverUseNative;
            };

            var isMacWebKit = function () {
                return tinymce.isMac && tinymce.isWebKit;
            };

            var isImage = function (elm) {
                return elm && elm.nodeName === 'IMG';
            };

            /**
             * This event gets fired when the context menu is shown.
             *
             * @event onContextMenu
             * @param {tinymce.plugins.ContextMenu} sender Plugin instance sending the event.
             * @param {tinymce.ui.DropMenu} menu Drop down menu to fill with more items if needed.
             */
            self.onContextMenu = new tinymce.util.Dispatcher(this);

            hideMenu = function (e) {
                hide(ed, e);
            };

            showMenu = ed.onContextMenu.add(function (ed, e) {
                // Block TinyMCE menu on ctrlKey and work around Safari issue
                if ((realCtrlKey !== 0 ? realCtrlKey : e.ctrlKey) && !contextmenuNeverUseNative) {
                    return;
                }

                Event.cancel(e);

                /**
                 * This takes care of a os x native issue where it expands the selection
                 * to the word at the caret position to do "lookups". Since we are overriding
                 * the context menu we also need to override this expanding so the behavior becomes
                 * normalized. Firefox on os x doesn't expand to the word when using the context menu.
                 */
                if (isMacWebKit() && e.button === 2 && !isNativeOverrideKeyEvent(e) && ed.selection.isCollapsed()) {                    
                    if (!isImage(e.target)) {
                        ed.selection.placeCaretAt(e.clientX, e.clientY);
                    }
                }

                // Select the image if it's clicked. WebKit would other wise expand the selection
                if (isImage(e.target)) {
                    ed.selection.select(e.target);
                }

                self._getMenu(ed, e).showMenu(e.clientX || e.pageX, e.clientY || e.pageY);

                Event.add(ed.getDoc(), 'click', hideMenu);

                ed.nodeChanged();
            });

            ed.onRemove.add(function () {
                if (self._menu) {
                    self._menu.removeAll();
                }
            });

            function hide(ed, e) {
                realCtrlKey = 0;

                // Since the contextmenu event moves
                // the selection we need to store it away
                if (e && e.button == 2) {
                    realCtrlKey = e.ctrlKey;
                    return;
                }

                if (self._menu) {
                    self._menu.removeAll();
                    self._menu.destroy();
                    Event.remove(ed.getDoc(), 'click', hideMenu);
                    self._menu = null;
                }
            }

            ed.onMouseDown.add(hide);
            ed.onKeyDown.add(hide);
            ed.onKeyDown.add(function (ed, e) {
                if (e.shiftKey && !e.ctrlKey && !e.altKey && e.keyCode === 121) {
                    Event.cancel(e);
                    showMenu(ed, e);
                }
            });
        },

        _getMenu: function (ed, e) {
            var self = this,
                m = self._menu,
                se = ed.selection,
                col = se.isCollapsed(),
                am, p;

                var el = e.target;

                if (!el || el.nodeName === "BODY") {
                    el = se.getNode() || ed.getBody();
                }

            if (m) {
                m.removeAll();
                m.destroy();
            }

            p = DOM.getPos(ed.getContentAreaContainer());

            m = ed.controlManager.createDropMenu('contextmenu', {
                offset_x: p.x + ed.getParam('contextmenu_offset_x', 0),
                offset_y: p.y + ed.getParam('contextmenu_offset_y', 0),
                constrain: 1,
                keyboard_focus: true
            });

            self._menu = m;

            m.addSeparator();

            am = m.addMenu({
                title: 'contextmenu.align'
            });

            am.add({
                title: 'contextmenu.left',
                icon: 'justifyleft',
                cmd: 'JustifyLeft'
            });

            am.add({
                title: 'contextmenu.center',
                icon: 'justifycenter',
                cmd: 'JustifyCenter'
            });

            am.add({
                title: 'contextmenu.right',
                icon: 'justifyright',
                cmd: 'JustifyRight'
            });

            am.add({
                title: 'contextmenu.full',
                icon: 'justifyfull',
                cmd: 'JustifyFull'
            });

            self.onContextMenu.dispatch(self, m, el, col);

            return m;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('contextmenu', tinymce.plugins.ContextMenu);
})();