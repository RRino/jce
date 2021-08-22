//wfePopup.requireLangPack();

var ColorPicker = {
    settings: {},
    init: function() {
        var self = this,
            ed = wfePopup.editor,
            color = wfePopup.getWindowArg('input_color') || '#FFFFFF',
            doc = ed.getDoc();

        // get stylesheets from editor
        var stylesheets = [];

        if (doc.styleSheets.length) {
            $.each(doc.styleSheets, function(i, s) {
                if (s.href && s.href.indexOf('tiny_mce') == -1) {
                    stylesheets.push(s);
                }
            });
        }

        $('#tmp_color').val(color).colorpicker($.extend(this.settings, {
            dialog: true,
            stylesheets: stylesheets,
            custom_colors: ed.getParam('colorpicker_custom_colors'),
            labels: {
                'name' : ed.getLang('colorpicker.name', 'Name')
            }
        })).on('colorpicker:insert', function() {
            return ColorPicker.insert();
        }).on('colorpicker:close', function() {
            return wfePopup.close();
        });

        $('button#insert').button({
            icons: {
                primary: 'uk-icon-check'
            }
        });

        // show body
        $('#jce').css('display', 'block');

    },
    /**
     * Insert selected colorpicker value
     */
    insert: function() {
        var color = $("#colorpicker_color").val(),
            f = wfePopup.getWindowArg('func');


        if (color) {
            color = '#' + color;
        }

        wfePopup.restoreSelection();

        if (f) {
            f(color);
        }

        wfePopup.close();
    }
};
wfePopup.onInit.add(ColorPicker.init, ColorPicker);