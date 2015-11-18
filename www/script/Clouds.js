var TSSite;
(function (TSSite) {
    var reqAnimationFrame = window.requestAnimationFrame || window.msRequestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || function (cb) {
        setTimeout(cb, (1000.0 / 60.0));
    };

    var Cloud = (function () {
        function Cloud(element) {
            this._el = element;
            this._curLeft = 0;

            var $e = $(element);
            this._max = parseFloat($e.data('max'));
            this._speed = parseFloat($e.data('speed'));
            this._min = parseFloat($e.data('left'));
        }
        Object.defineProperty(Cloud.prototype, "max", {
            get: function () {
                return this._max;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Cloud.prototype, "element", {
            get: function () {
                return this._el;
            },
            enumerable: true,
            configurable: true
        });

        Cloud.prototype.tick = function (windowWidth, dt) {
            var magnitude = dt / 60.0;

            var left = this._curLeft;
            left += (this._speed * (dt * magnitude));
            if (left > this._max) {
                left = this._min;
            }

            this._curLeft = left;
            $(this._el).css({ left: left });
        };
        return Cloud;
    })();
    TSSite.Cloud = Cloud;

    var Clouds = (function () {
        function Clouds() {
            this._clouds = [];
            this._last = -1;
        }
        Clouds.prototype.add = function (layer) {
            this._clouds.push(layer);
        };

        Clouds.prototype.addRange = function (layers) {
            for (var i = 0; i < layers.length; i++) {
                this._clouds.push(layers[i]);
            }
        };

        Clouds.prototype.start = function () {
            //if (!this._interval) {
            //    //this._interval = setInterval(() => this.tick(), (1000.0 / 60.0));
            //}
            var _this = this;
            //this._last = +new Date;
            reqAnimationFrame(function (time) {
                return _this.tick(time);
            });
        };

        Clouds.prototype.stop = function () {
            //if (this._interval) {
            //    clearInterval(this._interval);
            //    this._interval = 0;
            //}
        };

        Clouds.prototype.tick = function (time) {
            var _this = this;
            var dt = time - this._last;
            this._last = time;
            var windowWidth = $(window).width();
            reqAnimationFrame(function (time) {
                return _this.tick(time);
            });
            for (var i = 0; i < this._clouds.length; i++) {
                var cloud = this._clouds[i];
                cloud.tick(windowWidth, dt);
            }
        };
        return Clouds;
    })();
    TSSite.Clouds = Clouds;
})(TSSite || (TSSite = {}));

$(function () {
    var c = new TSSite.Clouds();
    for (var i = 1; i <= 4; i++) {
        var cloud = new TSSite.Cloud(document.querySelector('#clouds' + i));
        c.add(cloud);
    }

    c.start();
});
//# sourceMappingURL=Clouds.js.map
