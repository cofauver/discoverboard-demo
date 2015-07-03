'use strict';

app.filter('autolinker', function () {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return function (text, target, otherProp) {
        return text.replace(urlPattern, '<a target="' + target + '" href="$&">$&</a>');
    };
});
