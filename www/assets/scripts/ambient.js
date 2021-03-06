var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "./document/documentUtilities", "./document/propertyEditor", "./physicsObjects", "./vector2"], function (require, exports, documentUtilities_1, propertyEditor_1, physicsObjects_1, vector2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    vector2_1 = __importDefault(vector2_1);
    console.log("Loading ambient");
    class Ambient {
        constructor() {
            this.objects = [];
            this.onMouseMove = null;
            this.onTouchMove = null;
            this.onMouseUpOnCanvas = null;
            this.onMouseUpOnDocument = null;
            this.onMouseDown = null;
            this.onTouchStart = null;
            this.draggingObject = null;
            this.onKeyDown = null;
            this.onKeyUp = null;
            this.snapToGrid = false;
            this.lastCursosPos = vector2_1.default.zero;
            this.simulator = null;
            this.canvasRenderer = null;
        }
        static fromJSON(json) {
            if (typeof json === "string") {
                return JSON.parse(json, function (key, value) {
                    return key === "" ? Ambient.fromJSON(value) : value;
                });
            }
            else {
                const loadedAmbient = new Ambient();
                json.objects.forEach(obj => physicsObjects_1.PhysicsObject.fromJSON(obj, loadedAmbient));
                return loadedAmbient;
            }
        }
        get name() {
            return "Ambiente";
        }
        toJSON() {
            const objectsArrayJson = [];
            this.objects.forEach(obj => objectsArrayJson.push(obj.toJSON()));
            return { objects: objectsArrayJson };
        }
        getObjectOnPosition(pos, convertToWorldPos) {
            if (convertToWorldPos && this.canvasRenderer)
                pos = this.canvasRenderer.camera.getWorldPosFromCanvas(pos);
            for (const obj of this.objects) {
                if (obj.isPositionInsideObject(pos))
                    return obj;
            }
            return null;
        }
        getPropertyEditorOptions() {
            const rows = [];
            this.objects.forEach(obj => rows.push(new propertyEditor_1.ObjectLocatorPropertyEditorOption(obj, "Objetos", 0)));
            return rows;
        }
        addObject(obj) {
            this.objects.push(obj);
        }
        getProperty() {
            return undefined;
        }
        getAllProperties() {
            return undefined;
        }
        draw(canvasRenderer) {
            this.objects.forEach(obj => obj.draw(canvasRenderer));
        }
        onCanvasAdded(canvasRenderer) {
            this.canvasRenderer = canvasRenderer;
            const canvas = canvasRenderer.context.canvas;
            const camera = canvasRenderer.camera;
            this.onMouseMove = (ev) => this.setCursor(camera, new vector2_1.default(ev.offsetX, -ev.offsetY), canvas);
            this.onTouchMove = (ev) => this.setCursor(camera, camera.getTouchPosition(ev), canvas);
            this.onMouseUpOnCanvas = (ev) => this.selectObject(camera, ev);
            this.onMouseUpOnDocument = () => this.stopDraggingObject(camera);
            this.onMouseDown = (ev) => this.dragObject(camera, new vector2_1.default(ev.offsetX, -ev.offsetY));
            this.onTouchStart = (ev) => this.dragObject(camera, camera.getTouchPosition(ev));
            this.onKeyDown = (ev) => this.setSnapToGrid(ev, true);
            this.onKeyUp = (ev) => this.setSnapToGrid(ev, false);
            canvas.addEventListener("mousemove", this.onMouseMove);
            canvas.addEventListener("touchmove", this.onTouchMove);
            canvas.addEventListener("mousedown", this.onMouseDown);
            canvas.addEventListener("touchstart", this.onTouchStart);
            canvas.addEventListener("mouseup", this.onMouseUpOnCanvas);
            document.addEventListener("mouseup", this.onMouseUpOnDocument);
            document.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("keyup", this.onKeyUp);
        }
        onCanvasRemoved(canvasRenderer) {
            this.canvasRenderer = null;
            const canvas = canvasRenderer.context.canvas;
            canvas.removeEventListener("mousemove", this.onMouseMove);
            canvas.removeEventListener("touchmove", this.onTouchMove);
            canvas.removeEventListener("mouseup", this.onMouseUpOnCanvas);
            canvas.removeEventListener("mousedown", this.onMouseDown);
            canvas.removeEventListener("touchstart", this.onTouchStart);
            document.removeEventListener("mouseup", this.onMouseUpOnDocument);
            document.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("keyup", this.onKeyUp);
        }
        onSimulatorAdded(simulator) {
            this.simulator = simulator;
        }
        simulate(step) {
            this.objects.forEach(object => object.simulate(step));
        }
        reset() {
            this.objects.forEach(object => object.reset());
        }
        setCursor(camera, cursorCoordinates, canvas) {
            if (!camera.isMouseDown) {
                const obj = this.getObjectOnPosition(new vector2_1.default(cursorCoordinates.x, -cursorCoordinates.y), true);
                canvas.style.cursor = (obj) ? "pointer" : "default";
            }
            else if (this.draggingObject && !vector2_1.default.equals(cursorCoordinates, this.lastCursosPos)) {
                canvas.style.cursor = "pointer";
                const objPos = this.draggingObject.getProperty("position");
                const cursorPos = new vector2_1.default(cursorCoordinates.x, -cursorCoordinates.y);
                const cursorWorldPos = camera.getWorldPosFromCanvas(cursorPos);
                const newPos = (this.snapToGrid) ? new vector2_1.default(Math.round(cursorWorldPos.x), Math.round(cursorWorldPos.y)) : cursorWorldPos;
                objPos.initialValue = newPos;
            }
            this.lastCursosPos = cursorCoordinates;
        }
        dragObject(camera, cursorCoordinates) {
            if (this.simulator && this.simulator.time > 0)
                return;
            const obj = this.getObjectOnPosition(new vector2_1.default(cursorCoordinates.x, -cursorCoordinates.y), true);
            if (obj) {
                this.draggingObject = obj;
                camera.allowMovement = false;
            }
        }
        stopDraggingObject(camera) {
            this.draggingObject = null;
            camera.allowMovement = true;
        }
        selectObject(camera, ev) {
            if (!camera.mouseMoved) {
                const clickedPos = new vector2_1.default(ev.offsetX, ev.offsetY);
                const obj = this.getObjectOnPosition(clickedPos, true);
                documentUtilities_1.ObjectSelectionController.selectObject(obj ? obj : this);
            }
        }
        setSnapToGrid(ev, value) {
            if (ev.key == "Shift")
                this.snapToGrid = value;
        }
    }
    exports.default = Ambient;
});
