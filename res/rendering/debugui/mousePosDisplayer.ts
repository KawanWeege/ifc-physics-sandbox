import { DebugUIItem } from "./debugUIItem.js";
import { CanvasRenderer, Camera } from "../canvasRenderer.js";
import Vector2 from "../../vector2.js";

export class MousePositionDisplayer extends DebugUIItem{
    private mouseMoved: ((ev: MouseEvent) => void) | null;
    private touchMoved: ((ev: TouchEvent) => void) | null;

    constructor(pos: Vector2, private isWorld: boolean = false){
        super(pos);

        this.mouseMoved = null;
        this.touchMoved = null;
    }

    onCanvasAdded(cR: CanvasRenderer){
        this.mouseMoved = (ev: MouseEvent) => this.updateString(new Vector2(ev.offsetX, ev.offsetY), cR.camera);
        this.touchMoved = (ev: TouchEvent) => this.updateString(cR.camera.getTouchPosition(ev), cR.camera);

        cR.context.canvas.addEventListener("mousemove", this.mouseMoved);
        cR.context.canvas.addEventListener("touchmove", this.touchMoved);
    }

    onCanvasRemoved(cR: CanvasRenderer){
        if(this.mouseMoved)
            cR.context.canvas.removeEventListener("mousemove", this.mouseMoved);

        if(this.touchMoved)
            cR.context.canvas.removeEventListener("touchmove", this.touchMoved);

        this.mouseMoved = null;
        this.touchMoved = null;
    }

    draw(cR: CanvasRenderer, step?: number | undefined): void {
        super.draw(cR);
    }

    private updateString(pos: Vector2, cam: Camera){
        this.displayedString = `Mouse Position on ${this.isWorld ? "World" : "Canvas"}: ${this.isWorld ? cam.getWorldPosFromCanvas(pos) : pos}`
    }
}