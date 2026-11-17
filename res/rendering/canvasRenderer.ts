console.log("Loading canvasRenderer");

import * as Buttons from "../document/buttons.js";
import { ObjectSelectionController } from "../document/documentUtilities.js";
import { Followable, Renderable } from "../types.js";
import Vector2 from "../vector2.js";
import { DrawingTools } from "./drawingTools.js";

export class CanvasRenderer {
    public readonly camera: Camera;
    public readonly drawingTools: DrawingTools;
    private isRunning: boolean;
    private renderables: Renderable[];

    constructor(public readonly context: CanvasRenderingContext2D, cameraPos: Vector2 = Vector2.zero, cameraZoom: number = 100, cameraMinZoom: number = 10, cameraMaxZoom: number = 500) {
        this.isRunning = false;
        this.renderables = [];
        this.camera = new Camera(this, cameraPos, cameraZoom, cameraMinZoom, cameraMaxZoom, 5);
        this.drawingTools = new DrawingTools(context, this.camera);

        this.add({
            draw(canvasRenderer: CanvasRenderer) {
                const ctx = canvasRenderer.context;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            }
        });
    }

    start() {
        this.isRunning = true;
        this.render(0);
    }

    stop() {
        this.isRunning = false;
    }

    add(renderable: Renderable) {
        this.renderables.push(renderable);
        if (renderable.onCanvasAdded)
            renderable.onCanvasAdded(this);
    }

    remove(renderable: Renderable) {
        const index = this.renderables.indexOf(renderable);
        if (index > -1)
            this.renderables.splice(index, 1);

        if (renderable.onCanvasRemoved)
            renderable.onCanvasRemoved(this);
    }

    render(step: DOMHighResTimeStamp) {
        const canvas = this.context.canvas;
        const canvasParent = canvas.parentElement!;
        const style = window.getComputedStyle(canvasParent, null);

        canvas.height = parseInt(style.getPropertyValue("height"));
        canvas.width = parseInt(style.getPropertyValue("width"));

        this.renderables.forEach(rn => {
            this.context.save();
            rn.draw(this, step);
            this.context.restore();
        });

        if (this.isRunning)
            window.requestAnimationFrame(this.render.bind(this));
    }
}

export class Camera {
    public allowMovement: boolean;

    private targetObjectPosition: Followable | null;
    private _zoom: number;

    private _isMouseDown: boolean;
    private _mouseMoved: boolean;
    private clickedPos: Vector2;
    private cameraPosOnMouseDown: Vector2;

    constructor(private canvasRenderer: CanvasRenderer, private _pos: Vector2, private defaultZoom: number, private minZoom: number, private maxZoom: number, private zoomStep: number) {
        this.targetObjectPosition = null;

        this._zoom = this.defaultZoom;

        const canvas = canvasRenderer.context.canvas;

        this._isMouseDown = false;
        this._mouseMoved = false;
        this.allowMovement = true;
        this.clickedPos = Vector2.zero;
        this.cameraPosOnMouseDown = Vector2.zero;

        canvas.addEventListener("mousedown", ev => { this.onInputStart(new Vector2(ev.offsetX, ev.offsetY)); });
        canvas.addEventListener("touchstart", ev => { this.onInputStart(this.getTouchPosition(ev)); });
        canvas.addEventListener("mousemove", ev => { this.onMove(new Vector2(ev.offsetX, ev.offsetY), canvas); });
        canvas.addEventListener("touchmove", ev => { this.onMove(this.getTouchPosition(ev), canvas); });
        canvas.addEventListener("wheel", ev => { this.onWheel(ev) })
        document.addEventListener("mouseup", () => { this.onMouseUp(canvas) });
    }

    get zoom() {
        return this._zoom;
    }

    set zoom(n: number) {
        this._zoom = n;

        if (this._zoom < this.minZoom)
            this._zoom = this.minZoom;
        else if (this._zoom > this.maxZoom)
            this._zoom = this.maxZoom;
    }

    get pos() {
        if (this.targetObjectPosition)
            return this.targetObjectPosition.locate();

        return this._pos;
    }

    set pos(value: Vector2) {
        if (this.targetObjectPosition)
            this.unfollowObject();

        this._pos = value;
    }

    get objectBeingFollowed() {
        if (this.targetObjectPosition)
            return this.targetObjectPosition;

        return null;
    }

    get isMouseDown() {
        return this._isMouseDown;
    }

    get mouseMoved() {
        return this._mouseMoved;
    }

    nextZoom(): void {
        this.zoom += this.zoomStep;
    }

    previousZoom(): void {
        this.zoom -= this.zoomStep;
    }

    resetZoom(): void {
        this.zoom = this.defaultZoom;
    }

    getWorldPosFromCanvas(canvasPos: Vector2): Vector2 {
        const canvas = this.canvasRenderer.context.canvas;

        const posX = this.pos.x - (canvas.width / 2 - canvasPos.x) / this.zoom;
        const posY = this.pos.y + (canvas.height / 2 - canvasPos.y) / this.zoom;

        return new Vector2(posX, posY);
    }

    getCanvasPosFromWorld(worldPos: Vector2): Vector2 {
        const canvas = this.canvasRenderer.context.canvas;

        const posX = (worldPos.x - this.pos.x) * this.zoom + canvas.width / 2;
        const posY = -((worldPos.y - this.pos.y) * this.zoom - canvas.height / 2);

        return new Vector2(posX, posY);
    }


    followObject(object: Followable): void {
        this.targetObjectPosition = object;

        this.changeButtonText(false);
    }

    unfollowObject(): void {
        this.changeButtonText(true);

        this.targetObjectPosition = null;
    }

    focusOrigin(): void {
        this.pos = Vector2.zero;
    }

    getTouchPosition(ev: TouchEvent): Vector2 {
        const touchTarget = <Element>ev.targetTouches[0].target;
        const rect = touchTarget.getBoundingClientRect();
        const x = ev.targetTouches[0].pageX - rect.left;
        const y = ev.targetTouches[0].pageY - rect.top;

        return new Vector2(x, y);
    }

    private changeButtonText(isFollowing: boolean): void {
        const followButton = Buttons.getButtonById("follow-button")!;

        if (ObjectSelectionController.selectedObject == this.objectBeingFollowed && !isFollowing) {
            followButton.swapToAltImg();
            followButton.swapToAltTitle();
        } else {
            followButton.swapToDefaultImg();
            followButton.swapToDefaultTitle();
        }
    }

    private onInputStart(cursorCoordinates: Vector2) {
        this._isMouseDown = true;
        this._mouseMoved = false;
        this.clickedPos = cursorCoordinates;
        this.cameraPosOnMouseDown = this.pos;
    }

    private onMove(cursorCoordinates: Vector2, canvas: HTMLCanvasElement) {
        if (this.isMouseDown) {
            if (this.allowMovement)
                //this.cameraPosOnMouseDown + inverseY(this.clickedPos - cursorCoordinates) / this.zoom
                this.pos = this.cameraPosOnMouseDown.add(this.clickedPos.sub(cursorCoordinates).inverseY().div(this.zoom));

            canvas.style.cursor = "move";

            if (!Vector2.equals(this.cameraPosOnMouseDown, this.pos)) {
                this._mouseMoved = true;
                this.unfollowObject();
            }
        }

        //DEBUG: Display cursos canvas position
        //console.log(cursorCoordinates);

        //DEBUG: Display cursos world position
        //console.log();
    }

    private onMouseUp(canvas: HTMLCanvasElement) {
        if (!this.isMouseDown)
            return;

        this._isMouseDown = false;
        canvas.style.cursor = "default";
    }

    private onWheel(e: WheelEvent) {
        if (e.deltaY < 0)
            this.nextZoom();
        else
            this.previousZoom();
    }
}