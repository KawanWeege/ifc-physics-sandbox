import { Renderable } from "../../types.js";
import Vector2 from "../../vector2.js";
import { CanvasRenderer } from "../canvasRenderer.js";

export class DebugUIItem implements Renderable{
    public active: boolean;
    protected displayedString: string;

    constructor(public pos: Vector2){
        this.active = true;
        this.displayedString = "";
    }

    onCanvasAdded(cR: CanvasRenderer){}
    onCanvasRemoved(cR: CanvasRenderer){}

    draw(cR: CanvasRenderer, step?: number | undefined): void {
        if(!this.active)
            return;

        const ctx = cR.context;
        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        //@ts-ignore
        ctx.fillText(this.displayedString, ...this.pos.toArray());
    }
}