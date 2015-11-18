var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../scripts/typings/babylon.min.d.ts" />

var CloudMaterial = (function (_super) {
    __extends(CloudMaterial, _super);
    function CloudMaterial(name, scene) {
        _super.call(this, name, scene);
        this.name = name;

        this._scene = scene;
        scene.materials.push(this);

        this.texture = null;
        this.fogColor = BABYLON.Color3.FromInts(69, 132, 180);
        this.fogNear = -100;
        this.fogFar = 3000;
    }
    CloudMaterial.prototype.needAlphaBlending = function () {
        return true;
    };

    CloudMaterial.prototype.needAlphaTesting = function () {
        return false;
    };

    CloudMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();

        if (this.texture && !this.texture.isReady) {
            return false;
        }

        this._effect = engine.createEffect("./shaders/clouds", ["position", "uv"], ["worldViewProjection", "fogColor", "fogNear", "fogFar"], ["textureSampler"], "");

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    CloudMaterial.prototype.bind = function (world, mesh) {
        this._effect.setMatrix('worldViewProjection', world.multiply(this._scene.getTransformMatrix()));

        this._effect.setFloat('fogNear', this.fogNear);
        this._effect.setFloat('fogFar', this.fogFar);
        this._effect.setColor3('fogColor', this.fogColor);

        this._effect.setTexture('textureSampler', this.texture);
    };

    CloudMaterial.prototype.dispose = function () {
        if (this.texture) {
            this.texture.dispose();
            this.texture = undefined;
        }

        this.baseDispose();
    };
    return CloudMaterial;
})(BABYLON.Material);

var MOTION_FACTOR = 0.005;

//var MOTION_FACTOR = 1;
var DEPTH = 500;
var WIDTH = 4000;
var OFFSET = 3000;
var COUNT = 100;
var MIN_WEBGL_FPS = 25.0;
var FRAME_MEASURE = 15.0;
var CANVAS_HEIGHT = 400;

var CloudsView = (function () {
    function CloudsView() {
        this.lastTick = 0;
        this.webGLCanceled = false;
        this.running = false;
        this.forceWebGL = false;
        this.renderFps = [];
        this.startTime = Date.now();
        this.target = document.querySelector('#cloud-render');
        this.engine = new BABYLON.Engine(this.target, false);
        this.scene = new BABYLON.Scene(this.engine);
        this._drawCallback = this.draw.bind(this);

        this.createBackgroundTexture();

        this._camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, -64, 0), this.scene);
        this._camera.fov = 30;
        this._camera.minZ = 1;
        this._camera.maxZ = 1000;

        this._material = new CloudMaterial('cloudTexture', this.scene);
        this._material.texture = new BABYLON.Texture('cloud10.png', this.scene, true, false);

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.init();
    }
    CloudsView.isSupported = function () {
        return BABYLON.Engine.isSupported();
    };

    CloudsView.prototype.createBackgroundTexture = function () {
        var bg = new BABYLON.Layer('back0', null, this.scene);
        bg.texture = new BABYLON.DynamicTexture('dynamic texture', 512, this.scene, true);
        var textureContext = bg.texture.getContext();
        var size = bg.texture.getSize();

        textureContext.clearRect(0, 0, size.width, size.height);

        var gradient = textureContext.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#62bbff');
        gradient.addColorStop(1, '#96ddff');

        textureContext.fillStyle = gradient;
        textureContext.fillRect(0, 0, 512, 512);
        bg.texture.update();
    };

    CloudsView.prototype.start = function () {
        this.running = true;
        this.lastTick = Date.now();

        requestAnimationFrame(this._drawCallback);
    };

    CloudsView.prototype.resume = function () {
        if (this.forceWebGL || !this.shouldCancelWebGL()) {
            this.running = true;
            this.renderFps = [];
            this.lastTick = Date.now();
            requestAnimationFrame(this._drawCallback);
        }
    };

    CloudsView.prototype.init = function () {
        /// <summary> Creates the clouds geometry </summary>
        var indices = [];
        var positions = [];
        var uvs = [];
        var size = 128;
        var count = COUNT;

        for (var i = 0; i < count; i++) {
            var scaling = Math.random() * 1.5 + 0.5;
            var transform = BABYLON.Matrix.Scaling(scaling, scaling, 1.0);
            transform = transform.multiply(BABYLON.Matrix.RotationZ(Math.random() * Math.PI));
            transform = transform.multiply(BABYLON.Matrix.Translation(-Math.random() * WIDTH + OFFSET, -Math.random() * 100, Math.random() * DEPTH));

            var halfSize = size / 2.0;
            var pos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-halfSize, -halfSize, 0), transform);
            positions.push(pos.x, pos.y, pos.z);
            uvs.push(0.0, 0.0);

            pos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(halfSize, -halfSize, 0), transform);
            positions.push(pos.x, pos.y, pos.z);
            uvs.push(1.0, 0.0);

            pos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(halfSize, halfSize, 0), transform);
            positions.push(pos.x, pos.y, pos.z);
            uvs.push(1.0, 1.0);

            pos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-halfSize, halfSize, 0), transform);
            positions.push(pos.x, pos.y, pos.z);
            uvs.push(0.0, 1.0);

            indices.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
        }

        this._mesh = new BABYLON.Mesh("Clouds", this.scene);
        this._mesh.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind);
        this._mesh.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind);
        this._mesh.setIndices(indices);
        this._mesh.material = this._material;
    };

    CloudsView.prototype.shouldCancelWebGL = function () {
        var result = false;

        // get at least n frames for testing
        if (this.renderFps.length === FRAME_MEASURE) {
            var avgFps = this.renderFps.reduce(function (prev, cur) {
                return prev + cur;
            }, 0.0) / FRAME_MEASURE;

            if (avgFps < MIN_WEBGL_FPS) {
                result = true;
                this.webGLCanceled = true;
            }
        }

        return result;
    };

    CloudsView.prototype.measureRenderTime = function () {
        var curTick = Date.now();
        if (this.lastTick === 0) {
            this.lastTick = curTick;
            return;
        }

        var dt = curTick - this.lastTick;
        var fps = Math.min(1000 / dt, 60.0);
        this.renderFps.push(fps);
        while (this.renderFps.length > FRAME_MEASURE)
            this.renderFps.splice(0, 1);

        this.lastTick = curTick;
    };

    CloudsView.prototype.draw = function () {
        this._camera.position.x = ((Date.now() - this.startTime) * MOTION_FACTOR) % (WIDTH - OFFSET);
        this.scene.render();

        this.measureRenderTime();
        if (this.running && (this.forceWebGL || !this.shouldCancelWebGL())) {
            requestAnimationFrame(this._drawCallback);
        } else {
            if (this.webGLCanceled && !this.forceWebGL)
                $('#panorama-1').addClass('hide-webgl');
        }
    };

    CloudsView.prototype.onWindowResize = function () {
        this.engine.resize();
    };

    CloudsView.prototype.stop = function () {
        this.running = false;
    };
    return CloudsView;
})();

$(function () {
    var view;
    if (CloudsView.isSupported()) {
        // preload to avoid flicker on load
        var matPromise = WinJS.xhr({ url: "/cloud10.png" });
        var fragPromise = WinJS.xhr({ url: "/shaders/clouds.fragment.fx" });
        var vertPromise = WinJS.xhr({ url: "/shaders/clouds.vertex.fx" });

        WinJS.Promise.join([matPromise, fragPromise, vertPromise]).then(function () {
            view = new CloudsView();
            view.start();
        });

        // allows rendering to be forced when disabled due to low FPS
        $('#clickToForceWebGl').click(function (e) {
            $('#panorama-1').removeClass('hide-webgl');
            view.forceWebGL = true;
            view.start();

            return false;
        });
    } else {
        $('#panorama-1').addClass('hide-webgl').addClass('webgl-not-supported');
        return;
    }

    // Disables rendering when not on the webgl carousel page
    var isCurrentPan1 = false;
    $('#home-panorama').on('slide.bs.carousel', function (e, ui) {
        if (e.relatedTarget.id === 'panorama-1') {
            view.resume();
            isCurrentPan1 = true;
        }
    }).on('slid.bs.carousel', function (e, ui) {
        if (isCurrentPan1) {
            isCurrentPan1 = false;
        } else {
            view.stop();
        }
    });
});
//# sourceMappingURL=Clouds-Babylon.js.map
