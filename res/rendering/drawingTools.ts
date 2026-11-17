import { ArrowStyle, LineStyle, VectorStyle } from "../types.js";
import Vector2 from "../vector2.js";
import { Camera } from "./canvasRenderer.js";

export class DrawingTools {
    public static readonly DEFAULT_LINE_STYLE: LineStyle = {
        lineWidth: 3,
        style: "black"
    }
    public static readonly DEFAULT_ARROW_STYLE: ArrowStyle = {
        lineWidth: 3,
        style: "black",
        headLength: 10,
        headAngle: Math.PI / 6,
    }

    public static readonly DEFAULT_VECTOR_STYLE: VectorStyle = {
        lineWidth: 3,
        style: "black",
        headLength: 10,
        headAngle: Math.PI / 6,
        rectDashOffset: [10, 10],
        rectStyle: "grey",
        rectThickness: 2,
        circleRadius: 5
    }

    private worldToCanvas: Function;

    constructor(private ctx: CanvasRenderingContext2D, private cam: Camera) {
        this.worldToCanvas = cam.getCanvasPosFromWorld.bind(cam);
    }

    worldMoveTo(pos: Vector2) {
        //@ts-ignore
        this.ctx.moveTo(...this.worldToCanvas(pos).toArray());
    }

    worldLineTo(pos: Vector2) {
        //@ts-ignore
        this.ctx.lineTo(...this.worldToCanvas(pos).toArray());
    }

    worldRect(pos: Vector2, size: Vector2, angleRad: number = 0, resizeOnZoom?: boolean) {
        size = size.mult(resizeOnZoom ? this.cam.zoom : 1);
        this.rotateAroundCenterpoint(this.worldToCanvas(pos), size, angleRad);

        //@ts-ignore
        this.ctx.rect(...size.div(2).inverse().toArray(), ...size.toArray());
        this.ctx.resetTransform();
    }

    worldRectWithOffset(pos: Vector2, size: Vector2, offset: number, isWorldOffset?: boolean, angleRad: number = 0) {
        const wOffset = new Vector2(offset, -offset);
        const cOffset = new Vector2(offset, offset);
        const drawPos = isWorldOffset ?
            this.worldToCanvas(pos.sub(wOffset)) :                  //worldToCanvas( pos - wOffset )
            this.worldToCanvas(pos).sub(cOffset);                   //worldToCanvas(pos) - cOffset
        const drawSize = isWorldOffset ?
            size.add(cOffset.mult(2)).mult(this.cam.zoom) :         //(size + cOffset * 2) * zoom
            size.mult(this.cam.zoom).add(cOffset.mult(2));          //size * zoom + cOffset * 2
        
        this.rotateAroundCenterpoint(drawPos, drawSize, angleRad)
        //@ts-ignore
        this.ctx.rect(...drawSize.div(2).inverse().toArray(), ...drawSize.toArray());
        this.ctx.resetTransform();
    }

    worldArc(pos: Vector2, radius: number, startAngle: number, endAngle: number, resizeOnZoom?: boolean, anticlockwise?: boolean) {
        //@ts-ignore
        this.ctx.arc(...this.worldToCanvas(pos).toArray(), resizeOnZoom ? (radius * this.cam.zoom) : radius, startAngle, endAngle, anticlockwise);
    }

    worldText(text: string, pos: Vector2, stroke?:boolean, angleRad: number = 0) {
        if (angleRad > 0) {
            const textMeasurement = this.ctx.measureText(text);
            this.rotateAroundCenterpoint(this.worldToCanvas(pos), new Vector2(textMeasurement.width, parseInt(this.ctx.font)), angleRad);
        }

        if(stroke)
            //@ts-ignore
            this.ctx.strokeText(text, ...this.worldToCanvas(pos).toArray());

        //@ts-ignore
        this.ctx.fillText(text, ...this.worldToCanvas(pos).toArray());
        this.ctx.resetTransform();
    }

    worldImage(imgElement: HTMLImageElement, pos: Vector2, size: Vector2, angleRad: number = 0, resizeOnZoom?: boolean, clipPos?: Vector2, clipSize?: Vector2) {
        const drawSize = resizeOnZoom ? size.mult(this.cam.zoom) : size;
        const drawPos = drawSize.div(-2);

        this.rotateAroundCenterpoint(this.worldToCanvas(pos), drawSize, angleRad);

        if (clipSize)
            //@ts-ignore
            this.ctx.drawImage(imgElement, ...clipPos.toArray(), ...clipSize.toArray(), ...drawPos.toArray(), ...drawSize.toArray());
        else
            //@ts-ignore
            this.ctx.drawImage(imgElement, drawPos.x, drawPos.y, drawSize.x, drawSize.y);

        this.ctx.resetTransform();
    }

    drawLine(sPos: Vector2, fPos: Vector2, lineStyle: LineStyle = DrawingTools.DEFAULT_LINE_STYLE, isWorldPos: boolean = true): void {
        this.ctx.beginPath();

        if (isWorldPos) {
            this.worldMoveTo(sPos);
            this.worldLineTo(fPos);
        } else {
            //@ts-ignore
            this.ctx.moveTo(...sPos.toArray());
            //@ts-ignore
            this.ctx.lineTo(...fPos.toArray());
        }

        //Draw stroke
        if (this.configureLineStrokeStyle(lineStyle))
            this.ctx.stroke();

        this.configureLineStyle(lineStyle);
        this.ctx.stroke();

        this.ctx.closePath();
    }

    drawArrow(from: Vector2, to: Vector2, arrowStyle = DrawingTools.DEFAULT_ARROW_STYLE, isWorldPos: boolean = true) {
        from = isWorldPos ? this.worldToCanvas(from) : from;
        to = isWorldPos ? this.worldToCanvas(to) : to;

        if(Vector2.equals(from, to))
            return;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        const headLength = arrowStyle.resizeHeadlengthOnZoom ? arrowStyle.headLength * this.cam.zoom : arrowStyle.headLength;
        const head1 = new Vector2(to.x - headLength * Math.cos(angle - arrowStyle.headAngle), to.y - headLength * Math.sin(angle - arrowStyle.headAngle));
        const head2 = new Vector2(to.x - headLength * Math.cos(angle + arrowStyle.headAngle), to.y - headLength * Math.sin(angle + arrowStyle.headAngle));

        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        this.ctx.beginPath();

        //@ts-ignore
        this.ctx.moveTo(...head1.toArray());
        //@ts-ignore
        this.ctx.lineTo(...to.toArray());
        //@ts-ignore
        this.ctx.lineTo(...head2.toArray());
        //@ts-ignore
        this.ctx.moveTo(...to.toArray());
        //@ts-ignore
        this.ctx.lineTo(...from.toArray());

        if (this.configureLineStrokeStyle(arrowStyle))
            this.ctx.stroke();

        this.configureLineStyle(arrowStyle);
        this.ctx.stroke();

        this.ctx.closePath();
    }

    drawVector(from: Vector2, to: Vector2, vectorStyle: VectorStyle = DrawingTools.DEFAULT_VECTOR_STYLE, isWorldPos: boolean = true) {

        // Draw Vector Arrow //
        this.drawArrow(from, to, vectorStyle, isWorldPos);

        // Draw From Dot //
        this.ctx.beginPath();

        if(isWorldPos)
            this.worldArc(from, vectorStyle.circleRadius, 0, 2*Math.PI, vectorStyle.resizeCircleOnZoom);
        else
            //@ts-ignore 
            this.ctx.arc(...from.toArray(), vectorStyle.circleRadius, 0, 2*Math.PI);      

        this.ctx.fillStyle = vectorStyle.style;
        if(vectorStyle.strokeStyle) this.ctx.strokeStyle = vectorStyle.strokeStyle;
        if(vectorStyle.strokeWidth) this.ctx.lineWidth = vectorStyle.strokeWidth;

        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();

        // Draw Vector Rect //
        this.ctx.save();

        const rectPos = new Vector2(Math.min(from.x, to.x), isWorldPos ? Math.max(from.y, to.y) : Math.min(from.y, to.y));
        const rectSize = new Vector2(Math.abs(to.x - from.x), Math.abs(to.y - from.y));;

        if (rectSize.x > 0 && rectSize.y > 0) {
            this.ctx.setLineDash(vectorStyle.rectDashOffset);
            this.ctx.strokeStyle = vectorStyle.rectStyle;
            this.ctx.lineWidth = vectorStyle.rectThicknessResizeOnZoom ? vectorStyle.rectThickness * this.cam.zoom : vectorStyle.rectThickness;

            this.ctx.beginPath();
            if (isWorldPos) {
                this.worldRect(rectPos, rectSize, 0, true);
            } else
                //@ts-ignore  
                this.ctx.rect(...rectPos.toArray(), ...rectSize.toArray());

            this.ctx.stroke();
            this.ctx.closePath();
        }

        this.ctx.restore();
    }

    private configureLineStrokeStyle(style: LineStyle) {
        if (style.strokeWidth) {
            this.ctx.lineWidth = style.strokeWidth * 2 + style.lineWidth;
            this.ctx.lineWidth = style.strokeWidthResizeOnZoom ? this.ctx.lineWidth * this.cam.zoom : this.ctx.lineWidth;
            this.ctx.strokeStyle = style.strokeStyle || "black";

            return true;
        }

        return false;
    }

    private configureLineStyle(style: LineStyle) {
        this.ctx.lineWidth = style.lineWidthResizeOnZoom ? style.lineWidth * this.cam.zoom : style.lineWidth;
        this.ctx.strokeStyle = style.style;
    }

    private rotateAroundCenterpoint(pos: Vector2, size: Vector2, angleRad: number): void {
        const pivotPos = pos.add(size.div(2));    //pivotPos = pos + size / 2

        //@ts-ignore
        this.ctx.translate(...pivotPos.toArray());
        this.ctx.rotate(angleRad);
    }

}