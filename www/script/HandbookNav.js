/// <reference path="../scripts/typings/jquery/jquery.d.ts" />

// Used for Map polyfill.
var MapNode = (function () {
    function MapNode(key, value) {
        this.key = key;
        this.value = value;
    }
    return MapNode;
})();

// An incomplete ES6 Map polyfill.  Not optimized in any way.
var MapPolyfill = (function () {
    function MapPolyfill() {
        this._vals = [];
    }
    MapPolyfill.prototype.get = function (key) {
        var result = undefined;
        this._vals.forEach(function (node) {
            if (node.key === key) {
                result = node.value;
                return false;
            }
        });
        return result;
    };

    MapPolyfill.prototype.set = function (key, value) {
        var wasSet = false;
        this._vals.forEach(function (node) {
            if (node.key === key) {
                node.value = value;
                wasSet = true;
                return false;
            }
        });
        if (!wasSet) {
            var node = new MapNode(key, value);
            this._vals.push(node);
        }
    };

    MapPolyfill.prototype.has = function (key) {
        var result = false;
        this._vals.forEach(function (node) {
            if (node.key === key) {
                result = true;
                return false;
            }
        });
        return result;
    };
    return MapPolyfill;
})();

var ElementPosition = (function () {
    function ElementPosition(el, top) {
        this.el = el;
        this.top = top;
    }
    return ElementPosition;
})();

(function (global) {
    $(function () {
        var _Map;
        _Map = global.Map ? global.Map : MapPolyfill;
        var headers = $('h1, h2');
        var links = $('.hb-main a');

        var HeadersToLinks = new _Map();
        var LinksToHeaders = new _Map();
        var ElementPositions = [];
        var MainHeadersToChildren = new _Map();
        var ChildrenToMainHeaders = new _Map();
        var BodyPosition = new ElementPosition(document.querySelector('body'), 0);
        var LastShownUL = null;

        // Accommodate adaptive layout
        var TopPadding = 0;

        links.each(function (idx, el) {
            var $el = $(el);
            var hashNav = $el.attr('href').substring(1);
            var header = document.querySelector('h1[data-hash-nav="' + hashNav + '"], h2[data-hash-nav="' + hashNav + '"]');
            HeadersToLinks.set(header, el);
            LinksToHeaders.set(el, header);

            var parentUL = $el.parents('ul').first();
            var isParent = parentUL.hasClass('hb-main');
            if (isParent) {
                var siblingUL = $el.next('ul');
                MainHeadersToChildren.set(el, siblingUL[0]);
            } else {
                var parentA = $el.parents('ul').first().prev('a')[0];
                ChildrenToMainHeaders.set(el, parentA);
            }
        });

        function recalcHeaderPositions() {
            ElementPositions = [];
            headers.each(function (idx, el) {
                var pos = new ElementPosition(el, $(el).offset().top);
                ElementPositions.push(pos);
            });

            // Calculate adaptive layout offset
            var $nav = $('nav');
            var topVal = $nav.css('top');
            if (topVal)
                topVal = parseInt(topVal.substring(0, topVal.length - 1), 10);
            else
                topVal = 0;
            TopPadding = $nav.outerHeight() + topVal;
        }

        function findElementForScrollPosition(scrollTop) {
            var e = undefined;
            var cur = BodyPosition;

            ElementPositions.forEach(function (ep) {
                if (ep.top <= scrollTop && ep.top >= cur.top) {
                    cur = ep;
                }
            });

            return cur.el;
        }

        function resetForScroll() {
            var scrollTop = $(window).scrollTop();
            var el = findElementForScrollPosition(scrollTop + TopPadding);
            if (el.nodeName.toUpperCase()[0] === 'H') {
                var anchor = HeadersToLinks.get(el);
                if (anchor) {
                    links.removeClass('hb-active');
                    $(anchor).addClass('hb-active');
                }
            }

            var headerA = ChildrenToMainHeaders.get(anchor);
            var ulToShow = undefined;
            if (headerA) {
                ulToShow = MainHeadersToChildren.get(headerA); // ties to <h2>
            } else {
                ulToShow = MainHeadersToChildren.get(anchor); // the anchor ties to <h1>
            }

            $('.hb-sub').addClass('hidden-sub');
            if (ulToShow) {
                $(ulToShow).removeClass('hidden-sub');
                LastShownUL = ulToShow;
            } else {
                $(LastShownUL).removeClass('hidden-sub');
            }
        }

        recalcHeaderPositions();
        window.addEventListener('resize', function (e) {
            recalcHeaderPositions();
            resetForScroll();
        });

        window.addEventListener('scroll', function (e) {
            resetForScroll();
        });
    });
})(this);
//# sourceMappingURL=HandbookNav.js.map
