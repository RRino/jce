/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function ($, tinymce) {

	var XHTMLXtrasDialog = {
		settings: {},

		getAttributes: function (n) {
			var ed = wfePopup.editor;

			var i, attrs = n.attributes, attribs = {};

			// map all attributes
			for (i = attrs.length - 1; i >= 0; i--) {
				var name = attrs[i].name, value = ed.dom.getAttrib(n, name);

				// skip internal, eg: _moz_resizing or data-mce-style
				if (name.charAt(0) === "_" || name.indexOf('-mce-') !== -1) {
					continue;
				}

				attribs[name] = value;
			}

			return attribs;
		},

		init: function () {
			var ed = wfePopup.editor,
				se = ed.selection,
				n = se.getNode(),
				element = wfePopup.getWindowArg('element');

			// get an element selection
			if (element) {
				n = ed.dom.getParent(n, element);
			}

			Wf.init();

			if (n && n !== ed.getBody()) {
				var attribs = this.getAttributes(n);

				if (!$.isEmptyObject(attribs)) {
					$(':input').each(function () {
						var k = $(this).attr('id');

						if (/on(click|dblclick)/.test(k)) {
							k = 'data-mce-' + k;
						}
						if (k === "classes") {
							k = 'class';
						}
						var v = attribs[k];

						if (typeof v !== "undefined") {
							// clean up class
							if (k === "class") {
								// clean value
								v = v.replace(/mce-item-(\w+)/gi, '').replace(/\s+/g, ' ');
								// trim
								v = $.trim(v);
							}

							$(this).val(v).trigger('change');

							delete attribs[k];
						}
					});

					var x = 0;

					// process remaining attributes
					$.each(attribs, function (k, v) {
						if (k === 'data-mouseover' || k === 'data-mouseout' || k.indexOf('on') === 0) {
							return true;
						}
						
						try {
							v = decodeURIComponent(v);
						} catch (e) { }

						var repeatable = $('.uk-repeatable').eq(0);

						if (x > 0) {
							$(repeatable).clone(true).appendTo($(repeatable).parent());
						}

						var elements = $('.uk-repeatable').eq(x).find('input, select');

						$(elements).eq(0).val(k);
						$(elements).eq(1).val(v);

						x++;
					});

					$('#insert').button('option', 'label', ed.getLang('update', 'Insert'));
				}
			}

			$('#remove').button({
				icons: {
					primary: 'uk-icon-minus-circle'
				}
			}).toggle(!!element);

			// hide HTML5 fields
			if (ed.settings.schema === 'html4' && ed.settings.validate === true) {
				$('input.html5').parents('.uk-form-row').hide();
			}

			// hide for non-form nodes
			if (!tinymce.is(n, ':input, form')) {
				$('input.form').parents('.uk-form-row').hide();
			}

			// hide for non-media nodes
			if (n.nodeName !== "IMG") {
				$('input.media').parents('.uk-form-row').hide();
			}

			$('.uk-form-controls select').datalist().trigger('datalist:update');

			// trigger datalist init/update
			$('.uk-datalist').trigger('datalist:update');
		},

		insert: function () {
			var ed = wfePopup.editor,
				se = ed.selection,
				n = se.getNode(),
				elm;

			wfePopup.restoreSelection();

			// get the element type (opener)
			var element = wfePopup.getWindowArg('element');

			var args = {}, attribs = this.getAttributes(n);

			$(':input').not('input[name]').each(function () {
				var k = $(this).attr('id'),
					v = $(this).val();

				if (/on(click|dblclick)/.test(k)) {
					k = 'data-mce-' + k;
				}

				if (k === 'classes') {
					k = 'class';
					v = $.trim(v);
				}

				args[k] = v;

				delete attribs[k];
			});

			// get custom attributes
			$('.uk-repeatable').each(function () {
				var elements = $('input, select', this);
				var key = $(elements).eq(0).val(),
					value = $(elements).eq(1).val();

				if (key) {
					args[key] = value;
					delete attribs[key];
				}
			});

			// remove any attributes left
			$.each(attribs, function (key, value) {
				args[key] = "";
			});

			// opened by an element button
			if (element) {
				if (n.nodeName.toLowerCase() == element) {
					elm = n;
				} else {
					elm = ed.dom.getParent(n, element);
				}

				ed.formatter.apply(element.toLowerCase(), args, elm);

				// probably Attributes
			} else {
				var isTextSelection = !se.isCollapsed() && se.getContent() == se.getContent({ format: 'text' });

				// is a body or text selection
				if (n == ed.getBody() || isTextSelection) {
					ed.formatter.apply('attributes', args);
					// attribute selection
				} else {
					ed.dom.setAttribs(n, args);
				}
			}

			ed.undoManager.add();
			wfePopup.close();
		},

		remove: function () {
			var ed = wfePopup.editor;

			var element = wfePopup.getWindowArg('element');

			if (element) {
				ed.formatter.remove(element);
				ed.undoManager.add();
			}

			wfePopup.close();
		},

		insertDateTime: function (id) {
			document.getElementById(id).value = this.getDateTime(new Date(), "%Y-%m-%dT%H:%M:%S");
		},

		getDateTime: function (d, fmt) {
			fmt = fmt.replace("%D", "%m/%d/%y");
			fmt = fmt.replace("%r", "%I:%M:%S %p");
			fmt = fmt.replace("%Y", "" + d.getFullYear());
			fmt = fmt.replace("%y", "" + d.getYear());
			fmt = fmt.replace("%m", this.addZeros(d.getMonth() + 1, 2));
			fmt = fmt.replace("%d", this.addZeros(d.getDate(), 2));
			fmt = fmt.replace("%H", "" + this.addZeros(d.getHours(), 2));
			fmt = fmt.replace("%M", "" + this.addZeros(d.getMinutes(), 2));
			fmt = fmt.replace("%S", "" + this.addZeros(d.getSeconds(), 2));
			fmt = fmt.replace("%I", "" + ((d.getHours() + 11) % 12 + 1));
			fmt = fmt.replace("%p", "" + (d.getHours() < 12 ? "AM" : "PM"));
			fmt = fmt.replace("%%", "%");

			return fmt;
		},

		addZeros: function (value, len) {
			var i;
			value = "" + value;

			if (value.length < len) {
				for (i = 0; i < (len - value.length); i++)
					value = "0" + value;
			}

			return value;
		}

	};

	window.XHTMLXtrasDialog = XHTMLXtrasDialog;
	wfePopup.onInit.add(XHTMLXtrasDialog.init, XHTMLXtrasDialog);

})(jQuery, wfe);