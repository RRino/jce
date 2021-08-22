(function ($, Wf) {
    var URL = {
        toAbsolute: function (url) {
            if (typeof tinyMCEPopup !== "undefined") {
                return wfePopup.editor.documentBaseURI.toAbsolute(url);
            }

            if (/http(s)?:\/\//.test(url)) {
                return url;
            }

            return Wf.getURI(true) + url.substr(0, url.indexOf('/'));
        },
        toRelative: function (url) {
            if (typeof tinyMCEPopup !== "undefined") {
                return wfePopup.editor.documentBaseURI.toRelative(url);
            }

            if (/http(s)?:\/\//.test(url)) {
                return url.substr(url.indexOf('/'));
            }

            return url;
        }

    };

    Wf.URL = $.URL = URL;

})(jQuery, Wf);
