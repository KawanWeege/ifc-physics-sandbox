console.log("Loading physicsobjects");

import Ambient from './ambient.js';
import { PropertyEditorInputList } from './document/propertyEditor.js';
import { PhysicsObjectJSON, PhysicsPropertyJSON } from './fileController.js';
import PhysicsProperty, * as PhysicsProperties from './physicsProperties.js';
import { CanvasRenderer } from './rendering/canvasRenderer.js';
import { Sprite } from './rendering/sprite.js';
import { Followable, PhysicsObjectConfig, PhysicsObjectType, PropertyEditorOption, Renderable, Selectable, Simulatable, PhysicsPropertyName } from './types.js';
import Vector2 from './vector2.js';
import { ObjectSelectionController } from './document/documentUtilities.js';

export class PhysicsObject implements Selectable, Simulatable, Renderable, Followable {
    static DEFAULT_NAME: string = "";

    public name: string;
    
    private readonly properties: Map<PhysicsPropertyName, PhysicsProperty<any>>;

    constructor(public readonly kind: PhysicsObjectType, public readonly sprite: Sprite, protected ambient: Ambient, name?: string) {
        this.properties = new Map<PhysicsPropertyName, PhysicsProperty<any>>();

        this.name = name || this.generateName();
        this.ambient.addObject(this);
    }

    get isDeletable() {
        return true;
    }

    static createPhysicsObject(type: PhysicsObjectType, ambient: Ambient, properties?: PhysicsObjectConfig): PhysicsObject {
        switch (type) {
            case PhysicsObjectType.Solid:
                return new Solid(ambient, properties);
        }
    }

    static fromJSON(json: PhysicsObjectJSON | string, ambient: Ambient): PhysicsObject {
        if (typeof json === "string") {
            return JSON.parse(
                json,
                function (key: string, value: any) {
                    return key === "" ? PhysicsObject.fromJSON(value, ambient) : value
                }
            );
        } else {
            const physicsObj = this.createPhysicsObject(json.kind, ambient);
            json.properties.forEach(prop => {
                (<PhysicsProperty<any>>physicsObj.getProperty(prop.kind)!).valueFromJSON(prop.iValue);
            });

            return physicsObj;
        }
    }

    draw(cR: CanvasRenderer): void {
        const ctx = cR.context;

        ctx.save();
        this.sprite.draw(cR);
        ctx.restore();

        ctx.save();
        this.properties.forEach(property => {
            if(property.doDrawGizmos)
                property.drawGizmos(cR);
        });
        ctx.restore();

        if(ObjectSelectionController.selectedObject == this){
            const pos = (<PhysicsProperties.ObjectPosition>this.getProperty("position"))!.value;
            const size = (<PhysicsProperties.ObjectSize>this.getProperty("size"))!.value;

            const drawPos = pos.sub(size.div(new Vector2(2, -2)));                //drawPos = pos - size/(2, -2)


            //ctx.setLineDash([8, 3]);
            ctx.lineWidth = 4;
            ctx.fillStyle = "rgba(241, 196, 15, 0.2)"
            ctx.strokeStyle = "#f1c40f";
            ctx.beginPath();
            cR.drawingTools.worldRectWithOffset(drawPos, size, 5);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            // Gizmos.drawSelection(canvasRenderer, drawPos, size.value, {style: "MediumSeaGreen", lineThickness: 4, offset: 6, lineDash: [8, 3]});
        }
    }

    addProperty(name: PhysicsPropertyName, property: PhysicsProperty<any>): void {
        this.properties.set(name, property);
    }

    simulate(step: number): void {
        const sorted = Array.from(this.properties.values()).sort((a, b) => { return b.simulationPriority - a.simulationPriority; });
        sorted.forEach(property => property.simulate(step))
    }

    reset(): void {
        this.properties.forEach(property => property.reset())
    }

    locate(): Vector2 {
        return (<PhysicsProperties.ObjectPosition>this.getProperty("position")).value;
    }

    generateName(): string{
        const objs = this.ambient.objects.filter(obj => obj.kind == this.kind);
        const defaultName = Object.getPrototypeOf(this).constructor.DEFAULT_NAME;
        
        let i = 0;
        while(true){
            const object = objs.find(obj => obj.name.includes(i.toString()));
            if(!object)
                return `${defaultName} ${i}`;
            
            i++;
        }
    }

    /**
     * Returns rather the position(world position) parameter is located inside the object
     * @param position 
     */
    isPositionInsideObject(position: Vector2): boolean {
        const objPos = (<PhysicsProperties.ObjectPosition>this.getProperty("position")).value;
        let objSize = (<PhysicsProperties.ObjectSize>this.getProperty("size")).value;
        objSize = objSize.div(2);

        return position.x >= objPos.x - objSize.x &&
            position.x <= objPos.x + objSize.x &&
            position.y >= objPos.y - objSize.y &&
            position.y <= objPos.y + objSize.y
    }

    getProperty(property: PhysicsPropertyName): PhysicsProperty<any> | undefined {
        if(typeof property == "number")
            return Array.from(this.properties.values()).find(el => el.kind == property);
        else
            return this.properties.get(property);
    }

    getAllProperties(): PhysicsProperty<any>[]{
        return Array.from( this.properties.values() );
    }

    getPropertyEditorOptions(): PropertyEditorOption[] {
        const rows: PropertyEditorInputList[] = [];

        this.properties.forEach(el => {
            if (el.propertyEditorInput)
                rows.push(el.propertyEditorInput);
        });

        return rows;
    }

    destroy(): void {
        const index = this.ambient.objects.indexOf(this);
        this.ambient.objects.splice(index, 1);
        this.properties.forEach(p => p.destroy());
    }

    toJSON(): PhysicsObjectJSON {
        const properties: PhysicsPropertyJSON<any>[] = [];
        this.properties.forEach(prop => properties.push(prop.toJSON()));
        return Object.assign({}, {
            kind: this.kind,
            properties: properties
        });
    }
}

class Solid extends PhysicsObject {
    static DEFAULT_NAME = "Sólido";

    constructor(ambient: Ambient, properties?: PhysicsObjectConfig) {
        super(
            PhysicsObjectType.Solid,
            new Sprite(
                "./assets/images/solid.svg",
                new Vector2(0, 0),
                new Vector2(512, 512),
                Vector2.zero,
                Vector2.zero
            ),
            ambient,
            properties ? properties.name : undefined);
        
        this.addProperty("mass", new PhysicsProperties.ObjectMass(this));
        this.addProperty("position", new PhysicsProperties.ObjectPosition(this, properties ? properties.position : Vector2.zero));
        this.addProperty("centripetalAcceleration", new PhysicsProperties.ObjectCentripetalAcceleration(this));
        this.addProperty("netForce", new PhysicsProperties.ObjectNetForce(this));
        this.addProperty("acceleration", new PhysicsProperties.ObjectAcceleration(this));
        this.addProperty("size", new PhysicsProperties.ObjectSize(this, properties ? properties.size : Vector2.zero));
        this.addProperty("area", new PhysicsProperties.ObjectArea(this));
        this.addProperty("displacement", new PhysicsProperties.ObjectDisplacement(this));
        this.addProperty("velocity", new PhysicsProperties.ObjectVelocity(this));
        this.addProperty("momentum", new PhysicsProperties.ObjectMomentum(this));
    }
}