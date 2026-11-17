console.log("Loading sprite");

import { Renderable } from "../types.js";
import Vector2 from "../vector2.js";
import { CanvasRenderer } from "./canvasRenderer.js";

export class Sprite implements Renderable {
    public drawSize: Vector2;
    private image: HTMLImageElement;

    constructor(imageSrc: string, public copyPosition: Vector2, public copySize: Vector2, public drawPosition: Vector2, drawSize: Vector2) {
        const imgElement = document.createElement('img');
        imgElement.src = imageSrc;
        this.image = imgElement;

        this.drawSize = drawSize;
    }

    draw(canvasRenderer: CanvasRenderer): void {
        const offsettedPos = this.drawPosition.sub(this.drawSize.div(new Vector2(2, -2)));    //offsettedPos = drawPosition - drawSize/V(2, -2)

        canvasRenderer.drawingTools.worldImage(this.image, offsettedPos, this.drawSize, 0, true);
    }
}