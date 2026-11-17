console.log("Loading cartesianPlane");

import { CartesianPlaneStyle, Renderable } from '../types.js';
import Vector2 from '../vector2.js';
import { CanvasRenderer } from './canvasRenderer.js';

export class CartesianPlane implements Renderable {
    public static readonly ENVIRONMENT_STYLE: CartesianPlaneStyle = {
        xAxisStyle: "red",
        yAxisStyle: "green",
        gridStyle: "grey",
        originStyle: "blue",
        axisLineThickness: 3,
        gridThickness: 1,

        axisMarkerFont: "italic bold 30px CMU Serif",
        axisNameFont: "italic bold 15px CMU Serif",
        showMeasurements: false
    };
    public static readonly BASIC_STYLE: CartesianPlaneStyle = {
        xAxisStyle: "black",
        yAxisStyle: "black",
        gridStyle: "lightgrey",
        originStyle: "black",
        measurementStyle: "grey",
        axisLineThickness: 1,
        gridThickness: 1,

        axisMarkerFont: "italic bold 30px CMU Serif",
        axisNameFont: "italic bold 15px CMU Serif",
        measurementFont: "italic bold 12px CMU Serif",

        showMeasurements: true
    };


    constructor(public gridSize: number, private readonly style: CartesianPlaneStyle = CartesianPlane.BASIC_STYLE, public xAxisName?: string, public yAxisName?: string) {
    }

    draw(canvasRenderer: CanvasRenderer) {
        const cam = canvasRenderer.camera
        const ctx = canvasRenderer.context;
        const canvas = ctx.canvas;

        const startPos = cam.getWorldPosFromCanvas(new Vector2(0, 0));
        const finishPos = cam.getWorldPosFromCanvas(new Vector2(canvas.width, canvas.height));

        const startX = Math.ceil(startPos.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(startPos.y / this.gridSize) * this.gridSize;

        const originPosOnCanvas = cam.getCanvasPosFromWorld(Vector2.zero);

        for (let i = startX; i < finishPos.x; i += this.gridSize) {
            const x = (i - cam.pos.x) * cam.zoom + canvas.width / 2;

            if (i != 0) {
                this.drawVerticalLine(ctx, x);

                if (this.style.showMeasurements)
                    this.drawText(ctx, i.toString(), this.style.measurementFont!, this.style.measurementStyle!, x + 5, originPosOnCanvas.y - 5, false);
            }
        }

        for (let i = startY; i > finishPos.y; i -= this.gridSize) {
            const y = -((i - cam.pos.y) * cam.zoom - canvas.height / 2);

            if (i != 0) {
                this.drawHorizontalLine(ctx, y);

                if (this.style.showMeasurements)
                    this.drawText(ctx, i.toString(), this.style.measurementFont!, this.style.measurementStyle!, originPosOnCanvas.x + 5, y - 5, false);
            }
        }

        if (originPosOnCanvas.y > 0) {
            const y = originPosOnCanvas.y;

            this.drawXAxis(ctx, y);
            this.drawXAxisMarker(ctx, ctx.canvas.width - 25, y < ctx.canvas.height / 2 ? y + 30 : y - 10);
            if (this.xAxisName)
                this.drawXAxisLabel(ctx, y, this.xAxisName);
        }

        if (originPosOnCanvas.x > 0) {
            const x = originPosOnCanvas.x;

            this.drawYAxis(ctx, x);
            this.drawYAxisMarker(ctx, x < ctx.canvas.width / 2 ? x + 10 : x - 30, 25);
            if (this.yAxisName)
                this.drawYAxisLabel(ctx, x, this.yAxisName);
        }

        if (originPosOnCanvas.x > 0 && originPosOnCanvas.y > 0)
            this.drawOrigin(ctx, originPosOnCanvas.x, originPosOnCanvas.y);
    }

    private drawText(ctx: CanvasRenderingContext2D, text: string, font: string, color: string, x: number, y: number, strokeText: boolean, strokeStyle?: string, strokeWidth?: number) {
        ctx.save();

        ctx.lineWidth = strokeWidth || ctx.lineWidth;
        ctx.strokeStyle = strokeStyle || ctx.strokeStyle;
        ctx.font = font;
        ctx.fillStyle = color;

        if (strokeText) ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);

        ctx.restore();
    }

    private drawLine(ctx: CanvasRenderingContext2D, startX: number, startY: number, finishX: number, finishY: number, style: string, lineWidth: number) {
        ctx.strokeStyle = style;
        ctx.fillStyle = style;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(finishX, finishY);
        ctx.stroke();
    }

    //Draw grid lines

    private drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number) {
        this.drawLine(ctx, 0, y, ctx.canvas.width, y, this.style.gridStyle, this.style.gridThickness);
    }

    private drawVerticalLine(ctx: CanvasRenderingContext2D, x: number) {
        this.drawLine(ctx, x, 0, x, ctx.canvas.height, this.style.gridStyle, this.style.gridThickness);
    }

    //Draw axises

    private drawXAxis(ctx: CanvasRenderingContext2D, y: number) {
        this.drawLine(ctx, 0, y, ctx.canvas.width, y, this.style.xAxisStyle, this.style.axisLineThickness);
    }

    private drawYAxis(ctx: CanvasRenderingContext2D, x: number) {
        this.drawLine(ctx, x, 0, x, ctx.canvas.height, this.style.yAxisStyle, this.style.axisLineThickness);
    }

    //Draw axis marker

    private drawXAxisMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
        this.drawText(ctx, "x", this.style.axisMarkerFont, this.style.xAxisStyle, x, y, true, "white", 4);
    }

    private drawYAxisMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
        this.drawText(ctx, "y", this.style.axisMarkerFont, this.style.yAxisStyle, x, y, true, "white", 4);
    }

    //Draw axis label

    private drawXAxisLabel(ctx: CanvasRenderingContext2D, y: number, text: string) {
        ctx.font = this.style.axisNameFont;
        const textX = ctx.canvas.width  - ctx.measureText(text).width - 35;
        const textY = y + 15;

        this.drawText(ctx, text, this.style.axisNameFont, this.style.xAxisStyle, textX, textY, true, "white", 3);
    }

    private drawYAxisLabel(ctx: CanvasRenderingContext2D, x: number, text: string) {
        ctx.save();

        ctx.font = this.style.axisNameFont;
        ctx.translate(x - 7, ctx.measureText(text).width + 35);
        ctx.rotate(-Math.PI / 2);
        this.drawText(ctx, text, this.style.axisNameFont, this.style.yAxisStyle, 0, 0, true, "white", 3);

        ctx.restore();
    }

    //Draw origin

    private drawOrigin(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = this.style.originStyle;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();

        const textX = x < ctx.canvas.width / 2 ? x + 5 : x - 35;
        const textY = y < ctx.canvas.height / 2 ? y + 30 : y - 10;
        this.drawText(ctx, "O", this.style.axisMarkerFont, this.style.originStyle, textX, textY, true, "white", 4);
    }
}