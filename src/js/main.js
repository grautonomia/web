$(function () {
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
