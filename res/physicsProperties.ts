console.log("Loading physicsProperties");

import { PropertyEditorInputList, Vector2InputListRow, NumberInputListRow, ButtonInputListRow } from './document/propertyEditor.js';
import { PhysicsPropertyJSON } from './fileController.js';
import GenericCalculator, { NumberCalculator, Vector2Calculator, TrackingVectorCalculator } from './genericCalulator.js';
import { PhysicsObject } from './physicsObjects.js';
import { CanvasRenderer } from './rendering/canvasRenderer.js';
import { Simulatable, PhysicsPropertyName, TrackingVector, VectorStyle, ButtonColor, Renderable } from './types.js';
import Vector2 from './vector2.js';
import * as Buttons from './document/buttons.js';

export default abstract class PhysicsProperty<T> implements Simulatable {
    public active: boolean;
    public propertyEditorInput: PropertyEditorInputList | null = null;
    public doDrawGizmos: boolean;

    private iValue: T;
    private oValue: T;
    private iValueChangedListeners: Function[];

    protected static readonly DEFAULT_VECTOR_STYLE: VectorStyle = {
        style: "lightblue",
        strokeStyle: "black",
        strokeWidth: 1,

        lineWidth: 3,
        headAngle: Math.PI / 6,
        headLength: 10,

        rectDashOffset: [5, 5],
        rectStyle: "grey",
        rectThickness: 2,

        circleRadius: 3
    }

    protected static readonly SUB_VECTOR_STYLE: VectorStyle = {
        style: "orange",
        strokeStyle: "black",
        strokeWidth: 1,

        lineWidth: 2,
        headAngle: Math.PI / 6,
        headLength: 10,

        rectDashOffset: [5, 5],
        rectStyle: "lightgrey",
        rectThickness: 0,

        circleRadius: 3
    }

    constructor(
        public readonly kind: PhysicsPropertyName,
        public readonly changeable: boolean,
        public readonly object: PhysicsObject,
        private genericCalculator: GenericCalculator<T>,
        public readonly simulationPriority: number = 0
    ) {
        this.active = true;
        this.iValue = genericCalculator.zero;
        this.oValue = genericCalculator.zero;
        this.doDrawGizmos = false;
        this.iValueChangedListeners = [];
    }

    get initialValue() {
        return this.iValue;
    }

    set initialValue(value: T) {
        this.iValue = value;
        this.updateInputValue(this.value);
        this.fireIValueChanged();
    }

    get value() {
        return this.genericCalculator.sum(this.iValue, this.oValue);
    }

    set value(value: T) {
        this.oValue = this.genericCalculator.sub(value, this.iValue);
        this.updateInputValue(this.value);
    }

    onUserInput(formData: Map<string, any>) {
        this.initialValue = formData.values().next().value;
    }

    drawGizmos(canvasRenderer: CanvasRenderer) { }

    simulate(step: number): void { }

    reset(): void {
        this.value = this.initialValue;
    }

    destroy(): void{
        // delete this.iValue;
        // delete this.oValue;
        // delete this.iValueChangedListeners;

        if(this.propertyEditorInput){
            Buttons.removeAllButtonsFrom(this.propertyEditorInput.element);
            // delete this.propertyEditorInput
        }
    }

    toJSON(): PhysicsPropertyJSON<any> {
        return Object.assign({}, {
            kind: this.kind,
            iValue: this.iValue
        });
    }

    valueFromJSON(json: any): void {
        this.initialValue = this.genericCalculator.fromJSON(json);
    }

    onIValueChanged(f: Function): Function {
        this.iValueChangedListeners.push(f);
        return f;
    }

    protected updateInputValue(value: T): void {
        if (this.propertyEditorInput)
            this.propertyEditorInput.getInput()!.updateValue(value);
    }

    private fireIValueChanged(): void {
        this.iValueChangedListeners.forEach(f => f(this))
    }
}

export class ObjectPosition extends PhysicsProperty<Vector2>{
    constructor(
        object: PhysicsObject,
        initialPosition: Vector2
    ) {
        super("position", true, object, Vector2Calculator.instance);
        this.propertyEditorInput = new PropertyEditorInputList(this, "<b><i>r</b></i>", "Localização", 0, true, false, "Posição", 0);
        this.propertyEditorInput.addInput(new Vector2InputListRow("position", "m", initialPosition, true, false));

        this.initialValue = initialPosition;
    }


    set initialValue(value: Vector2) {
        super.initialValue = value;
        this.updateSpritePosition();
    }

    get initialValue() {
        return super.initialValue;
    }

    get value(): Vector2 {
        return super.value;
    }

    set value(value: Vector2) {
        super.value = value;
        this.updateSpritePosition();
    }

    private updateSpritePosition(): void {
        this.object.sprite.drawPosition = this.value;
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        canvasRenderer.drawingTools.drawVector(Vector2.zero, this.value, PhysicsProperty.DEFAULT_VECTOR_STYLE);
    }
}

export class ObjectSize extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;

    constructor(
        object: PhysicsObject,
        initialSize: Vector2
    ) {
        super("size", true, object, Vector2Calculator.instance);

        this.propertyEditorInput = new PropertyEditorInputList(this, "l, h", "Dimensões", 1, true, false, "Comprimento e altura (Tamanho)", 1);
        this.propertyEditorInput.addInput(new Vector2InputListRow("size", "m", initialSize, true, false));

        this.objectPosition = <ObjectPosition>this.object.getProperty("position");

        this.initialValue = initialSize;
    }

    private updateSpriteSize(): void {
        this.object.sprite.drawSize = this.value;
    }

    set initialValue(value: Vector2) {
        super.initialValue = value;
        this.updateSpriteSize();
    }

    get initialValue() {
        return super.initialValue;
    }

    get value(): Vector2 {
        return super.value;
    }

    set value(value: Vector2) {
        super.value = value;
        this.updateSpriteSize();
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.objectPosition) {
            const from = this.objectPosition.value.sub(this.value.div(2));    //from = objectPosition - objectSize / 2
            const to = this.objectPosition.value.add(this.value.div(2));      //to = objectPosition + objectSize / 2
            canvasRenderer.drawingTools.drawVector(from, to, PhysicsProperty.DEFAULT_VECTOR_STYLE);
        }
    }
}

export class ObjectArea extends PhysicsProperty<number>{
    constructor(object: PhysicsObject) {
        super("area", false, object, NumberCalculator.instance);

        const objectSize = <PhysicsProperty<Vector2>>object.getProperty("size");
        const updateIValue = () => { this.initialValue = objectSize.value.x * objectSize.value.y };

        updateIValue();
        objectSize.onIValueChanged(updateIValue.bind(this));

        this.propertyEditorInput = new PropertyEditorInputList(this, "A", "Dimensões", 2, false, false, "Área", 2);
        this.propertyEditorInput.addInput(new NumberInputListRow("area", "m", this.initialValue, false, false));
    }
}

export class ObjectVelocity extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;
    private objectAcceleration: ObjectAcceleration | null;

    constructor(object: PhysicsObject) {
        super("velocity", true, object, Vector2Calculator.instance, 1);

        this.propertyEditorInput = new PropertyEditorInputList(this, "<b><i>v</b></i>", "Cinemática", 2, true, false, "Vetor velocidade", 3);
        this.propertyEditorInput.addInput(new Vector2InputListRow("velocity", "<sup>m</sup>&frasl;<sub>s</sub>", this.initialValue, true, false, "m/s"));

        this.objectPosition = <ObjectPosition>this.object.getProperty("position");
        this.objectAcceleration = <ObjectAcceleration>this.object.getProperty("acceleration");
    }

    simulate(step: 0): void {
        const posn = this.objectPosition ? this.objectPosition.value : null;
        const vn = this.value
        const an = this.objectAcceleration ? this.objectAcceleration.value : null;

        if (this.objectPosition && this.objectAcceleration)
            //objectPosition = posn + vn * step + (an * step ^ 2 / 2)
            this.objectPosition.value = posn!.add(vn.mult(step).add(an!.mult(step * step).div(2)));


        if (this.objectAcceleration) {
            this.objectAcceleration.simulate();

            const anplus1 = this.objectAcceleration.value;
            const avgA = an!.add(anplus1).div(2);   //avgA = (an + anplus1) / 2

            //objectVelocity = vn + avgA * step
            this.value = vn.add(avgA.mult(step));
        }
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.doDrawGizmos && this.objectPosition) {
            const from = this.objectPosition.value;
            const to = from.add(this.value);
            canvasRenderer.drawingTools.drawVector(from, to, PhysicsProperty.DEFAULT_VECTOR_STYLE);
        }
    }
}

export class ObjectDisplacement extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;

    constructor(object: PhysicsObject) {
        super("displacement", false, object, Vector2Calculator.instance);

        this.propertyEditorInput = new PropertyEditorInputList(this, "<b><i>Δs</i></b>", "Cinemática", 5, false, false, "Vetor deslocamento", 4);
        this.propertyEditorInput.addInput(new Vector2InputListRow("displacement", "m", this.initialValue, false, false, "m"));

        this.objectPosition = <ObjectPosition>this.object.getProperty("position")!;
    }

    simulate(step: 0): void {
        if (this.objectPosition)
            this.value = this.objectPosition.value.sub(this.objectPosition.initialValue);
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.doDrawGizmos && this.objectPosition) {
            const from = this.objectPosition.initialValue;
            const to = from.add(this.value);
            canvasRenderer.drawingTools.drawVector(from, to, PhysicsProperty.DEFAULT_VECTOR_STYLE);
        }
    }
}

export class ObjectAcceleration extends PhysicsProperty<Vector2>{
    private objectPosition: ObjectPosition | null;
    private objectCentripitalAcceleration: ObjectCentripetalAcceleration | null;
    private netForce: ObjectNetForce | null;
    private mass: ObjectMass | null;

    constructor(object: PhysicsObject) {
        super("acceleration", true, object, Vector2Calculator.instance, 2);
        this.propertyEditorInput = new PropertyEditorInputList(this, "<b><i>a</i></b>", "Cinemática", 3, true, false, "Vetor aceleração", 5);
        this.propertyEditorInput.addInput(new Vector2InputListRow("acceleration", "<sup>m</sup>&frasl;<sub>s<sup>2</sup></sub>", this.initialValue, true, false, "m/s²"));

        this.objectCentripitalAcceleration = <ObjectCentripetalAcceleration>this.object.getProperty("centripetalAcceleration");
        this.objectPosition = <ObjectPosition>this.object.getProperty("position");
        this.netForce = <ObjectNetForce>this.object.getProperty("netForce");
        this.mass = <ObjectMass>this.object.getProperty("mass");
    }

    simulate() {
        let value = this.initialValue;

        if (this.objectCentripitalAcceleration && this.objectPosition)
            this.value = this.initialValue.add(this.objectCentripitalAcceleration.calculate(this.objectPosition.value));

        if (this.netForce && this.mass && this.objectPosition && this.mass.value > 0)
            this.value = this.value.add(this.netForce.calculate().div(this.mass.value / 1000));

    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.doDrawGizmos && this.objectPosition) {
            const from = this.objectPosition.value;
            const to = from.add(this.value);
            canvasRenderer.drawingTools.drawVector(from, to, PhysicsProperty.DEFAULT_VECTOR_STYLE);
        }
    }
}

export class ObjectCentripetalAcceleration extends PhysicsProperty<TrackingVector> {
    private objectPosition: ObjectPosition | null;

    constructor(object: PhysicsObject) {
        super("centripetalAcceleration", true, object, TrackingVectorCalculator.instance);

        this.propertyEditorInput = new PropertyEditorInputList(this, "<b><i>a<sub>c</sub></i></b>", "Cinemática", 4, true, false, "Vetor aceleração centrípeta", 6);
        this.propertyEditorInput.addInput(new NumberInputListRow("módulo", "m", 0, true, true));
        this.propertyEditorInput.addInput(new Vector2InputListRow("ponto", "m", Vector2.zero, true, true));

        this.objectPosition = <ObjectPosition>this.object.getProperty("position");
    }

    calculate(p: Vector2) {
        const VP = this.value.target.sub(p);
        const dir = Vector2.equals(VP, Vector2.zero) ? Vector2.zero : VP.unit();

        return dir.mult(this.value.magnitude);
    }

    onUserInput(formData: Map<string, any>): void {
        this.initialValue = {
            magnitude: formData.get("módulo"),
            target: formData.get("ponto")
        }
    }

    onUserToggle(v: boolean): void {
        this.active = v;
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.doDrawGizmos && this.objectPosition) {
            const from = this.objectPosition.value;
            const to = from.add(this.calculate(from));
            canvasRenderer.drawingTools.drawVector(from, to, PhysicsProperty.DEFAULT_VECTOR_STYLE);
        }
    }

    protected updateInputValue(value: TrackingVector) {
        if (this.propertyEditorInput) {
            (<NumberInputListRow>this.propertyEditorInput.getInput("módulo")!).updateValue(value.magnitude);
            (<Vector2InputListRow>this.propertyEditorInput.getInput("ponto")!).updateValue(value.target);
        }
    }
}

export class ObjectMass extends PhysicsProperty<number>{
    constructor(object: PhysicsObject) {
        super("mass", true, object, NumberCalculator.instance);
        this.propertyEditorInput = new PropertyEditorInputList(this, "m", "Geral", 3, true, false, "Massa", 7);
        this.propertyEditorInput.addInput(new NumberInputListRow("mass", "g", 0, true, false));
    }
}

export class ObjectMomentum extends PhysicsProperty<Vector2>{
    private mass: PhysicsProperty<number>;
    private velocity: PhysicsProperty<Vector2>;
    private position: ObjectPosition | null;

    constructor(object: PhysicsObject) {
        super("momentum", false, object, Vector2Calculator.instance);
        this.mass = this.object.getProperty("mass")!;
        this.velocity = this.object.getProperty("velocity")!;
        this.position = <ObjectPosition>this.object.getProperty("position");

        const updateValue = () => this.initialValue = this.calculate();

        this.propertyEditorInput = new PropertyEditorInputList(this, "<b>p<b>", "Dinâmica", 5, false, false, "Vetor momentum", 8);
        this.propertyEditorInput.addInput(new Vector2InputListRow("momentum", "N·s", this.initialValue, false, false, "N*s"));

        this.initialValue = updateValue();
        this.mass.onIValueChanged(updateValue.bind(this));
        this.velocity.onIValueChanged(updateValue.bind(this));
    }

    simulate() {
        this.value = this.calculate();
    }

    calculate(): Vector2 {
        return this.velocity.value.mult(this.mass.value / 1000);
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.doDrawGizmos && this.position) {
            const from = this.position.value;
            const to = from.add(this.value);
            canvasRenderer.drawingTools.drawVector(from, to, PhysicsProperty.DEFAULT_VECTOR_STYLE);
        }
    }
}

export class ObjectNetForce extends PhysicsProperty<Vector2>{
    private forceList: Map<string, Vector2>;
    private position: PhysicsProperty<Vector2> | null;

    constructor(object: PhysicsObject) {
        super("netForce", true, object, Vector2Calculator.instance);

        this.forceList = new Map<string, Vector2>();
        this.position = <PhysicsProperty<Vector2>>object.getProperty("position");

        const button = new Buttons.Button(Buttons.Button.createButtonElement({
            buttonName: `add-force-${object.name}`,
            buttonColor: ButtonColor.InvisibleBackground,
            enabled: true,
            imgSrc: "./assets/images/addicon.svg"
        }));
        button.onClick = () => this.addForce(this.generateForceName(), Vector2.zero);

        this.propertyEditorInput = new PropertyEditorInputList(this, "F", "Dinâmica", 6, true, false, "Vetor força total", 9);
        this.propertyEditorInput!.addInput(new ButtonInputListRow("Criar Força", button))
        this.propertyEditorInput!.addInput(new Vector2InputListRow("F<sub>t</sub>", "N", this.calculate(), false, true, "N"));
    }

    addForce(name: string, value: Vector2) {
        this.forceList.set(name, value);

        const newInput = new Vector2InputListRow(name, "N", value, true, true, "N");
        const deleteButton = new Buttons.Button(Buttons.Button.createButtonElement({
            buttonName: `delete-force-${name}`,
            buttonColor: ButtonColor.InvisibleBackground,
            enabled: true,
            imgSrc: "./assets/images/destroyicon.svg"
        }));
        deleteButton.onClick = () => this.removeForce(name);
        newInput.element.insertBefore(deleteButton.element, newInput.element.firstChild);

        this.propertyEditorInput!.addInput(newInput);
    }

    calculate(): Vector2 {
        let total = Vector2.zero;
        this.forceList.forEach(v => total = total.add(v));
        return total;
    }

    drawGizmos(canvasRenderer: CanvasRenderer) {
        if (this.position && this.doDrawGizmos) {
            const from = this.position.value;
            const totalTo = from.add(this.calculate());

            canvasRenderer.drawingTools.drawVector(from, totalTo, PhysicsProperty.DEFAULT_VECTOR_STYLE);

            if (this.forceList.size > 1)

                this.forceList.forEach(v =>
                    canvasRenderer.drawingTools.drawVector(from, from.add(v), PhysicsProperty.SUB_VECTOR_STYLE)
                );
        }
    }

    getForce(name: string) {
        return this.forceList.get(name);
    }

    onUserInput(formData: Map<string, any>): void {
        Array.from(this.forceList.keys()).forEach(k => this.forceList.set(k, formData.get(k)));
        this.initialValue = this.calculate();
    }

    removeForce(name: string) {
        this.forceList.delete(name);
        this.propertyEditorInput!.removeInput(name);
        this.updateTotalForceDisplay();
    }


    toJSON(): PhysicsPropertyJSON<any> {
        let values: any = [];

        this.forceList.forEach((v, k) => values.push({ key: k, force: v }));

        return Object.assign({}, {
            kind: this.kind,
            iValue: values
        });
    }

    valueFromJSON(json: any[]): void {
        json.forEach(value => this.addForce(value.key, Vector2.fromJSON(value.force)));
    }

    protected updateInputValue(value: Vector2) {
        this.updateTotalForceDisplay();
        this.updateSubForceDisplay();
    }

    private generateForceName(): string {
        const keys = Array.from(this.forceList.keys());
        for (let i = 0; i < keys.length; i++) {
            const name = `F${i}`;
            const key = keys.find(k => k === name);
            if (!key)
                return name;
        }

        return `F${keys.length}`;
    }

    private updateSubForceDisplay() {
        this.forceList.forEach((f, k) => this.propertyEditorInput!.getInput(k)!.updateValue(f));
    }

    private updateTotalForceDisplay() {
        this.propertyEditorInput!.getInput("F<sub>t</sub>")!.updateValue(this.calculate());
    }
}