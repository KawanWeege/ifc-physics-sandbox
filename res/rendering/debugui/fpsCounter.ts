console.log("Loading fpsCounter");

import { CanvasRenderer } from "../canvasRenderer.js";
import Vector2 from "../../vector2.js";
import { DebugUIItem } from "./debugUIItem.js";

export class FPSCounter extends DebugUIItem {
    private lastFrameTimestamp: number;
    private fps: number;
    private nextUpdate: number;

    constructor(pos: Vector2, private readonly delay: number) {
        super(pos);

        this.lastFrameTimestamp = 0;
        this.nextUpdate = 0;
        this.fps = 0;
    }

    draw(cR: CanvasRenderer, step: number): void {
        if (step > this.nextUpdate) {
            this.fps = 1000 / (step - this.lastFrameTimestamp);
            this.nextUpdate = step + this.delay;
        }

        this.lastFrameTimestamp = step;
        this.displayedString = `${this.fps.toFixed(2)} FPS`;

        super.draw(cR);
    }
}