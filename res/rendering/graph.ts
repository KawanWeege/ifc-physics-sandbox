console.log("Loading graph...");

import * as Buttons from "../document/buttons.js";
import * as Document from "../document/documentUtilities.js";
import * as Modal from "../document/modals.js";
import * as Main from "../main.js";
import { PhysicsObject } from "../physicsObjects.js";
import PhysicsProperty from "../physicsProperties.js";
import Simulator from "../simulator.js";
import { PhysicsPropertyName, Renderable, Simulatable, ValueGetter, Followable } from "../types.js";
import Vector2 from "../vector2.js";
import { CanvasRenderer } from "./canvasRenderer.js";
import documentElements from "../document/documentElements.js";
import { DrawingTools } from "./drawingTools.js";

/*
    Class definitions
*/

class PhysicsObjectValueGetter implements ValueGetter {
    public static readonly NUMBER_CALLBACK: number = 0;
    public static readonly VECTOR2X_CALLBACK: number = 1;
    public static readonly VECTOR2Y_CALLBACK: number = 2;
    public static readonly VECTOR2_MODULUS_CALLBACK: number = 3;

    private static getValueCallbacks: Function[];

    constructor(public name: string, public readonly propertyType: PhysicsPropertyName, private getValueCallbackIndex: number) {
    }

    static initialize() {
        this.getValueCallbacks = [];
        this.getValueCallbacks[this.NUMBER_CALLBACK] = function (target: PhysicsObject, propertyType: PhysicsPropertyName) {
            const property = <PhysicsProperty<Number>>target.getProperty(propertyType);
            return property.value;
        }

        this.getValueCallbacks[this.VECTOR2X_CALLBACK] = function (target: PhysicsObject, propertyType: PhysicsPropertyName) {
            const property = <PhysicsProperty<Vector2>>target.getProperty(propertyType);
            return property.value.x;
        };

        this.getValueCallbacks[this.VECTOR2Y_CALLBACK] = function (target: PhysicsObject, propertyType: PhysicsPropertyName) {
            const property = <PhysicsProperty<Vector2>>target.getProperty(propertyType);
            return property.value.y;
        };

        this.getValueCallbacks[this.VECTOR2_MODULUS_CALLBACK] = function (target: PhysicsObject, propertyType: PhysicsPropertyName) {
            const property = <PhysicsProperty<Vector2>>target.getProperty(propertyType);
            return property.value.magnitude();
        };
    }

    getTargetNames(): string[] {
        const objectNames: string[] = [];

        Main.ambient.objects.forEach(object => {
            if (object.getProperty(this.propertyType))
                objectNames.push(object.name);
        });

        return objectNames;
    }

    getValue(target: string): number {
        const targetObj = Main.ambient.objects.find(obj => { return obj.name == target });
        return PhysicsObjectValueGetter.getValueCallbacks[this.getValueCallbackIndex]!(targetObj, this.propertyType);
    }
}

class SimulatorValueGetter implements ValueGetter {
    public static readonly TIME_CALLBACK = 0;

    private static getValueCallbacks: Function[];
    private simulator: Simulator | null;

    constructor(public name: string, private readonly getValueCallback: number) {
        this.simulator = null;
        import("../main.js").then(
            (element) => { this.simulator = element.simulator; }
        ).catch(
            () => { throw "Could not import simulator"; }
        );
    }

    static initialize() {
        this.getValueCallbacks = [];
        this.getValueCallbacks[this.TIME_CALLBACK] = function (simulator: Simulator) {
            return simulator.time;
        };
    }

    getTargetNames(): string[] {
        return ["Simulador"];
    }

    getValue(target: string): number {
        return SimulatorValueGetter.getValueCallbacks[this.getValueCallback](this.simulator);
    }
}

export class Graph implements Renderable, Simulatable {
    private points: Vector2[];
    private highlightedPoint: Vector2 | null;
    private onMouseMoved: ((ev: MouseEvent) => void) | null;

    constructor(private readonly targetX: string, private readonly targetY: string, public readonly valueGetterX: ValueGetter, public readonly valueGetterY: ValueGetter, private pointSize: number) {
        this.points = [];
        this.onMouseMoved = null;
        this.highlightedPoint = null;

        this.simulate(0);
    }

    simulate(step: number): void {
        const x = this.valueGetterX.getValue(this.targetX);
        const y = this.valueGetterY.getValue(this.targetY);
        const newPoint = new Vector2(x, y);

        //Remove last inserted point if the resulting line continues straight
        if (this.points.length > 1) {
            const lastIndex = this.points.length - 1;
            const vectorDeterminant = Vector2.getVectorDeterminant(this.points[lastIndex - 1], this.points[lastIndex], newPoint);
            if (vectorDeterminant < 0.00001 && vectorDeterminant > -0.00001)
                this.points.splice(lastIndex);
        }

        this.points.push(newPoint);
    }

    reset(): void {
        //this.simulate(0);
        this.points = [];
    }

    draw(canvasRenderer: CanvasRenderer): void {
        const cam = canvasRenderer.camera;
        const ctx = canvasRenderer.context;
        const dT = canvasRenderer.drawingTools;

        if (this.points.length > 0) {
            ctx.beginPath();

            dT.worldMoveTo(this.points[0]);
            for (let index = 1; index < this.points.length; index++)
                dT.worldLineTo(this.points[index]);

            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "orange";
            ctx.stroke();
            ctx.closePath();

            this.drawCircle(dT, ctx, this.points[0], 4, "orange");
            this.drawCircle(dT, ctx, this.points[this.points.length - 1], 4, "orange");
        }

        if (this.highlightedPoint) {
            this.drawCircle(dT, ctx, this.highlightedPoint, 4, "red");

            const text = `P(${this.highlightedPoint.x.toFixed(2)}, ${this.highlightedPoint.y.toFixed(2)})`;
            const textPos = cam.getCanvasPosFromWorld(this.highlightedPoint).add(new Vector2(10, -10));    //textPos = canvasHighlightedPos + V2(10, -10)
            ctx.font = "italic 15px CMU Serif";
            ctx.fillStyle = "red";
            ctx.strokeStyle = "white"
            ctx.lineWidth = 3;

            //@ts-ignore
            ctx.strokeText(text, ...textPos.toArray());
            //@ts-ignore
            ctx.fillText(text, ...textPos.toArray());
        }
    }

    onCanvasAdded(cR: CanvasRenderer) {
        this.onMouseMoved = (ev: MouseEvent) => this.highlightPoint(cR, ev);

        cR.context.canvas.addEventListener("mousemove", this.onMouseMoved);
    }


    onCanvasRemoved(cR: CanvasRenderer) {
        if (this.onMouseMoved) {
            cR.context.canvas.removeEventListener("mousemove", this.onMouseMoved);
            this.onMouseMoved = null;
        }
    }

    private drawCircle(dT: DrawingTools, ctx: CanvasRenderingContext2D, centerPos: Vector2, radius: number, fillStyle: string) {
        ctx.fillStyle = fillStyle;

        ctx.beginPath();
        dT.worldArc(centerPos, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }

    private highlightPoint(cR: CanvasRenderer, ev: MouseEvent) {
        //console.time("Highlight point calculation");

        if (this.points.length <= 1)
            return;

        const cam = cR.camera;

        const wMousePos = cam.getWorldPosFromCanvas(new Vector2(ev.offsetX, ev.offsetY));
        const cMousePos = new Vector2(ev.offsetX, ev.offsetY);
        let closestDistance = Infinity;
        let closestPoint = Vector2.zero;

        for (let i = 0; i < this.points.length - 1; i++) {
            const A = this.points[i];
            const B = this.points[i + 1];

            const AB = B.sub(A);
            const AP = wMousePos.sub(A);

            const magAB = AB.magnitude() * AB.magnitude();
            const ABAPProduct = Vector2.dotProduct(AP, AB);
            const dist = ABAPProduct / magAB;

            let closestPointOnLineSegment;
            if (dist < 0)
                closestPointOnLineSegment = A;
            else if (dist > 1)
                closestPointOnLineSegment = B;
            else
                closestPointOnLineSegment = A.add(AB.mult(dist)); //closestPointOnLineSegment = A + AB * dist
            
            const d = Vector2.distanceSquared(closestPointOnLineSegment, wMousePos);
            if(d < closestDistance){
                closestDistance = d;
                closestPoint = closestPointOnLineSegment;
            }
        }

        this.highlightedPoint = Vector2.distanceSquared(cam.getCanvasPosFromWorld(closestPoint), cMousePos) < 1000 ? closestPoint : null;
        //console.timeEnd("Highlight point calculation");
    }
}

/*
    Constants
*/

const valueGetters: ValueGetter[] = [
    new SimulatorValueGetter("Tempo", SimulatorValueGetter.TIME_CALLBACK),
    new PhysicsObjectValueGetter("Posição (eixo X)", "position", PhysicsObjectValueGetter.VECTOR2X_CALLBACK),
    new PhysicsObjectValueGetter("Posição (eixo Y)", "position", PhysicsObjectValueGetter.VECTOR2Y_CALLBACK),
    new PhysicsObjectValueGetter("Tamanho (eixo X)", "size", PhysicsObjectValueGetter.VECTOR2X_CALLBACK),
    new PhysicsObjectValueGetter("Tamanho (eixo Y)", "size", PhysicsObjectValueGetter.VECTOR2Y_CALLBACK),
    new PhysicsObjectValueGetter("Área", "area", PhysicsObjectValueGetter.NUMBER_CALLBACK),
    new PhysicsObjectValueGetter("Aceleração (eixo X)", "acceleration", PhysicsObjectValueGetter.VECTOR2X_CALLBACK),
    new PhysicsObjectValueGetter("Aceleração (eixo Y)", "acceleration", PhysicsObjectValueGetter.VECTOR2Y_CALLBACK),
    new PhysicsObjectValueGetter("Aceleração (módulo)", "acceleration", PhysicsObjectValueGetter.VECTOR2_MODULUS_CALLBACK),
    new PhysicsObjectValueGetter("Velocidade (eixo X)", "velocity", PhysicsObjectValueGetter.VECTOR2X_CALLBACK),
    new PhysicsObjectValueGetter("Velocidade (eixo Y)", "velocity", PhysicsObjectValueGetter.VECTOR2Y_CALLBACK),
    new PhysicsObjectValueGetter("Velocidade (módulo)", "velocity", PhysicsObjectValueGetter.VECTOR2_MODULUS_CALLBACK),
    new PhysicsObjectValueGetter("Deslocamento (eixo X)", "displacement", PhysicsObjectValueGetter.VECTOR2X_CALLBACK),
    new PhysicsObjectValueGetter("Deslocamento (eixo Y)", "displacement", PhysicsObjectValueGetter.VECTOR2Y_CALLBACK),
    new PhysicsObjectValueGetter("Deslocamento (módulo)", "displacement", PhysicsObjectValueGetter.VECTOR2_MODULUS_CALLBACK)
];

const graphConfigModal = Modal.getModalById("graph-config-modal")!;
const graphConfigForm = <HTMLFormElement>documentElements.get("graph-config-form")!;
const xAxisPropertySelect = <HTMLSelectElement>graphConfigForm.querySelector("#x-axis-property")!;
const yAxisPropertySelect = <HTMLSelectElement>graphConfigForm.querySelector("#y-axis-property")!;
const xAxisPropertyHolderSelect = <HTMLSelectElement>graphConfigForm.querySelector("#x-axis-property-holder")!;
const yAxisPropertyHolderSelect = <HTMLSelectElement>graphConfigForm.querySelector("#y-axis-property-holder")!;

/*
    Functions
*/

const addOptionToSelect = (select: HTMLSelectElement, optionText: string) => {
    const option = document.createElement("option");
    option.text = optionText;
    option.id = optionText;

    select.add(option);
}

const clearChildElements = (element: Element) => {
    while (element.firstChild)
        element.removeChild(element.firstChild);
}

const fillPropertySelect = (select: HTMLSelectElement) => {
    clearChildElements(select);

    valueGetters.forEach(valueGetter => addOptionToSelect(select, valueGetter.name));
}

const fillPropertyHolderSelect = (select: HTMLSelectElement, valueGetter: ValueGetter) => {
    clearChildElements(select);

    valueGetter.getTargetNames().forEach(targetName => addOptionToSelect(select, targetName));

    select.disabled = select.length < 1;
}

/*
    Event listeners
*/

graphConfigForm.addEventListener("change", ev => {
    const target = <HTMLSelectElement>ev.target;
    if (!target)
        return;

    const selectedOption = target.options[target.selectedIndex].text;

    if (target.id == "x-axis-property" || target.id == "y-axis-property")
        fillPropertyHolderSelect(
            target.id == "x-axis-property" ? xAxisPropertyHolderSelect : yAxisPropertyHolderSelect,
            valueGetters.find(vG => { return selectedOption == vG.name })!
        );
});

Buttons.getButtonById("create-graph-button")!.onClick = () => {
    const formData = new FormData(graphConfigForm);
    const vGX = valueGetters.find(vG => { return vG.name == formData.get("x-axis-property") })!;
    const vGY = valueGetters.find(vG => { return vG.name == formData.get("y-axis-property") })!;
    const targetX = <string>formData.get("x-axis-property-holder");
    const targetY = <string>formData.get("y-axis-property-holder");

    if (!targetX || !targetY) {
        Document.Alert.throwAlert("Há campos não preenchidos!", Document.Alert.WARNING);
        return;
    }

    const graph = new Graph(targetX, targetY, vGX, vGY, 4);

    graphConfigModal.setVisible(false);

    Document.GraphPanel.setElementVisible(true, `Gráfico ${vGY.name} x ${vGX.name}`);

    import("../main.js").then(
        main => {
            main.simulator.add(graph);
            main.simulator.start();
        }
    )

    Document.GraphPanel.onClose = () => import("../main.js").then(main => main.simulator.remove(graph));

    Document.GraphPanel.renderGraph(graph);
};

/*
    Other code
*/

PhysicsObjectValueGetter.initialize();
SimulatorValueGetter.initialize();
fillPropertySelect(xAxisPropertySelect);
fillPropertySelect(yAxisPropertySelect);
graphConfigModal.onOpen = () => {
    xAxisPropertySelect.value = "Tempo";
    yAxisPropertySelect.value = "Velocidade (módulo)";
    xAxisPropertySelect.dispatchEvent(new Event("change", { bubbles: true }));
    yAxisPropertySelect.dispatchEvent(new Event("change", { bubbles: true }));
};
