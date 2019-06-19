import PhysicsObject from 'physicsObjects';
import Selectable from 'selectable';
import Vector2 from 'vector2';

export default class Ambient implements Selectable {
    public readonly objects: PhysicsObject[];

    constructor() {
        this.objects = [];
    }

    getObjectOnPosition(pos: Vector2): PhysicsObject | null {
        for (const obj of this.objects) {
            if (obj.sprite.positionIsInsideSprite(pos))
                return obj;
        }

        return null;
    }

    addObject(obj: PhysicsObject): void{
        this.objects.push(obj);
    }

    /* Selectable */

    get name(): string {
        return "Ambiente";
    }

    getProperty(): undefined {
        return undefined;
    }

    get isFollowable(){
        return false;
    }
}