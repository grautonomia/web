$(function () {
    var locale  = $('html').attr('lang');
    var locales = {
        'ca': 'ca',
        'es': 'es'
    };

    // Reveal
    $(document).foundation().foundation('reveal', {
        animation: 'fade'
    });

    // Typography
    unorphan($("a, p, span, li, h1, h2, h3, h4, h5, h6").not('[data-dont-unorphan]'));

    if (locale in locales) {
        $('p, span, strong, em, li').not('[data-dont-hyphenate]').hyphenate(locales[locale]);
    } else {
        throw "Locale not found!";
    }
});
