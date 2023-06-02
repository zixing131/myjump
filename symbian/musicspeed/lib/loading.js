$.extend({
    showLoading: function () {
        if ($(".loading").length == 0) {
            var html = '<div class="loading"><div class="container"><span></span><span></span><span></span><span></span><span>' +
                '</span><span></span><span></span><span></span></div></div>';
            $('body').append(html);
        }
        else {
            $(".loading").show();
        }
    },
    hideLoading: function () {
        $(".loading").hide();
    },
});