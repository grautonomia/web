$(function () {
    // Article references handling
    var footnotes = $('.footnotes');
    var ctrls     = $('.footnote-ctrls');
    var toggleEl  = $('[data-toggle-footnotes]');

    if ($('.footnotes').find('li').length) {
        ctrls.removeClass('hide');
        ctrls.detach().insertBefore(footnotes);

        toggleEl.click(function () {
            var old = $(this).find('span').html();
            $(this).find('span').html($(this).data('toggle-footnotes'));
            $(this).data('toggle-footnotes', old);
            $(this).find('[data-toggle-icon]').toggleClass('fa-angle-up fa-angle-down');
            footnotes.toggle();
        }).click();

        // Hide footnotes when clicked on ↩
        $('[href^=#fnref]').click(function () {
            toggleEl.click();
        });

        // Show footnotes and jump
        $('.footnoteRef').click(function (e) {
            if (footnotes.is(':hidden')) {
                e.preventDefault();
                toggleEl.click();
                setTimeout(function () { $(e.target).click(); }, 0);
            }
        });
    }

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
