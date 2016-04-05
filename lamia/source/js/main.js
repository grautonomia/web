$(function () {
    $('[data-toggle-menu]').click(function (e) {
        e.preventDefault();
        $('[data-menu]').slideToggle();
    });

    // Article references handling
    var footnotes    = $('.footnotes');
    var footnotesSep = $('.footnotes-sep');
    var ctrls        = $('.footnote-ctrls');
    var toggleEl     = $('[data-toggle-footnotes]');

    // If there are footnotes
    if ($('.footnotes').find('li').length) {
        ctrls.removeClass('hide');
        ctrls.detach().insertBefore(footnotesSep);

        toggleEl.click(function () {
            var old = $(this).find('span').html();
            $(this).find('span').html($(this).data('toggle-footnotes'));
            $(this).data('toggle-footnotes', old);
            $(this).find('[data-toggle-icon]').toggleClass('fa-angle-up fa-angle-down');
            footnotes.toggle();
            footnotesSep.toggle();
        }).click();

        // Hide footnotes when clicked on ↩
        $('.footnote-backref').click(function () {
            toggleEl.click();
        });

        // Show footnotes and jump
        $('.footnote-ref > a').click(function (e) {
            if (footnotes.is(':hidden')) {
                e.preventDefault();
                toggleEl.click();

                // Hack for waiting repaint
                setTimeout(function () {
                    $(document).scrollTop($($(e.target).attr('href')).offset().top);
                }, 0);
            }
        });
    }

    // Remove brackets from references
    $('[id^=fnref]').each(function (i, el) {
        $(this).html($(this).html().replace(/[\[\]]/g, ''));
    });

    // Tooltips
    $('[data-tooltip]').each(function () {
        var content;

        if ($(this).attr('data-tooltip-content')) {
            content = $($(this).attr('data-tooltip-content')).html();
        }

        $(this).tooltipster({
            speed: 200,
            interactiveTolerance: 200,
            position: 'bottom',
            theme: 'tooltipster-gra',
            offsetY: -10,
            content: content || null,
            contentAsHTML: !!content,
            interactive: !!content,
        });
    });
});
