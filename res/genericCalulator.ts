import Vector2 from "./vector2.js";
import { TrackingVector } from "./types.js";

export default interface GenericCalculator<T> {
    zero: T;
    sum(a: T, b: T): T;
    sub(a: T, b: T): T;
    mult(a: T, b: T): T;
    div(a: T, b: T): T;
    fromJSON(json: any): T;
}

export class Vector2Calculator implements GenericCalculator<Vector2>{
    public static readonly instance: GenericCalculator<any> = new Vector2Calculator();

    private constructor() { }

    get zero(): Vector2{
        return Vector2.zero;
    }

    sum(a: Vector2, b: Vector2): Vector2 {
        return a.add(b);
    }
    sub(a: Vector2, b: Vector2): Vector2 {
        return a.sub(b);
    }
    mult(a: Vector2, b: Vector2): Vector2 {
        return a.mult(b);
    }
    div(a: Vector2, b: Vector2): Vector2 {
        return a.div(b);
    }
    fromJSON(json: any): Vector2{
        return new Vector2(json.x, json.y);
    }
}

export class NumberCalculator implements GenericCalculator<number>{
    public static readonly instance: GenericCalculator<any> = new NumberCalculator();

    private constructor() { }

    get zero(): number{
        return 0;
    }

    sum(a: number, b: number): number {
        return a + b;
    }
    sub(a: number, b: number): number {
        return a - b;
    }
    mult(a: number, b: number): number {
        return a * b;
    }
    div(a: number, b: number): number {
        return a / b;
    }
    fromJSON(json: any): number{
        return json;
    }
}

export class TrackingVectorCalculator implements GenericCalculator<TrackingVector> {
    public static readonly instance: GenericCalculator<any> = new TrackingVectorCalculator();

    private constructor() { }

    get zero(): TrackingVector{
        return {
            magnitude: 0, 
            target: Vector2.zero
        };
    }

    sum(a: TrackingVector, b: TrackingVector): TrackingVector {
        return {
            magnitude: a.magnitude + b.magnitude,
            target: a.target.add(b.target)
        };
    }
    sub(a: TrackingVector, b: TrackingVector): TrackingVector {
        return {
            magnitude: a.magnitude - b.magnitude,
            target: a.target.sub(b.target)
        };
    }
    mult(a: TrackingVector, b: TrackingVector): TrackingVector {
        return {
            magnitude: a.magnitude * b.magnitude,
            target: a.target.mult(b.target)
        };
    }
    div(a: TrackingVector, b: TrackingVector): TrackingVector {
        return {
            magnitude: a.magnitude / b.magnitude,
            target: a.target.div(b.target)
        };
    }
    fromJSON(json: any): TrackingVector{
        return {magnitude: json.magnitude, target: Vector2Calculator.instance.fromJSON(json.target)};
    }
}