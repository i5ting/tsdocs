/// <reference path="/scripts/jquery-2.1.0.intellisense.js" />
$(function () {
    var hashNavTargets = [];
    $('.has-hash-nav').each(function (index, item) {
        var selector = $(item).data('hash-nav');
        hashNavTargets[selector] = item;
    });

    function scrollTo(selector) {
        var target = hashNavTargets[selector];
        if (target) {
            // handle adaptive layout
            var $nav = $('nav');
            var topVal = $nav.css('top');
            if (topVal)
                topVal = parseInt(topVal.substring(0, topVal.length - 1));
            else
                topVal = 0;
            var offset = $nav.outerHeight() + parseInt(topVal);

            // Now animate
            $('html, body').animate({ scrollTop: $(target).offset().top - offset + 2 }, 250, 'swing');
        }
    }

    $('a').each(function (index, item) {
        var $item = $(item);
        var href = $item.attr('href');
        if (!href)
            return;

        var index = href.indexOf('#');
        if (index !== -1) {
            var ref = href.substring(index + 1);
            $item.click(function (e) {
                scrollTo(ref);
            });
        }
    });

    var currentLoc = window.location.hash;
    if (currentLoc && currentLoc.length > 0) {
        currentLoc = currentLoc.substring(1);
        scrollTo(currentLoc);
    }


    var knownClasses = ['show-learn', 'show-play', 'show-dl', 'show-int'];
    $('div.subnav').each(function (index, e) {
        var item = $(e);
        var ownerTag = item.data('owner');
        var classTag = item.data('hover-class');
        var allowClick = item.data('allow-click');
        var owner = $(ownerTag);
        owner.hover(function onEnter(e) {
            knownClasses.forEach(function (kc) {
                $('nav').removeClass(kc);
            });
            $('nav').addClass(classTag);
        }, function onExit(e) {
            
        }).click(function () {
            if (allowClick && allowClick.toString() === 'true')
                return true;

            knownClasses.forEach(function (kc) {
                $('nav').removeClass(kc);
            });
            $('nav').addClass(classTag);
            return false;
        });
    });

    // special case play to hide subnav
});