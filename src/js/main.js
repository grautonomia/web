$(function () {
    var locale  = $('html').attr('lang');
    var locales = {
        'ca': 'ca',
        'es': 'es'
    };

    // Typography
    unorphan($("a, p, blockquote, span, li, h1, h2, h3, h4, h5, h6").not('[data-dont-unorphan]'), { br: true });

    if (locale in locales) {
        $('p, span, strong, em, ul > li').not('[data-dont-hyphenate], [data-dont-hyphenate] li, blockquote p').hyphenate(locales[locale]);
    } else {
        throw "Locale not found!";
    }

    // Foundation
    // $(document).foundation().foundation('reveal', {
    //     animation: 'fade'
    // });
});
