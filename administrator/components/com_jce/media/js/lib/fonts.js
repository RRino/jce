(function($) {

    $(document).ready(function() {

        $('.fontlist').each(function() {
            var el = this;
            
            // trigger input change
            $('input[type="checkbox"]', this).on('click', function() {
                $('.fontlist').trigger('update');
            });
            
            $('input[type="text"]', this).on('change', function() {
                $('.fontlist').trigger('update');
            });

            // create close action
            $('.font-item-trash', this).on('click', function(e) {
                e.preventDefault();
                
                $(this).parents('.font-item').remove();
                $('.fontlist').trigger('update');
            });

            // create new action
            $('.font-item-plus', this).on('click', function(e) {
                e.preventDefault();
                
                $('.font-item[hidden]', el).clone(true).insertBefore(this).removeAttr('hidden').find('input').val("").first().focus();
            });

        }).on('update', function() {
            var data = {}, v = "";

            $('input[type="checkbox"]:checked', this).each(function() {
                var s = this.value.split('=');

                if (s.length === 2) {
                    data[s[0]] = s[1];
                }
            });

            $('.font-item', this).not('.hide').each(function() {
                var k = $('input:text', this).first().val(), v = $('input:text', this).last().val();
                
                if (k && v) {
                    data[k] = v;
                }
            });

            // pass through array of object
            if (!$.isEmptyObject(data)) {
               v = JSON.stringify([data]);
            }

            // serialize and return
            $('input[type="hidden"]', this).val(v).change();
        }).sortable({
            axis: 'y',
            items: '.font-item',
            update: function(event, ui) {
                $('.fontlist').trigger('update');
            },
            placeholder: "font-item-highlight",
            start: function(event, ui) {
                $(ui.placeholder).height($(ui.item).height()).width($(ui.item).width());
            }
        });
    });
})(jQuery);