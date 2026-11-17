console.log("Loading main");

import Ambient from './ambient.js';
import * as Buttons from "./document/buttons.js";
import { ObjectSelectionController, Alert } from './document/documentUtilities.js';
import { CanvasRenderer } from './rendering/canvasRenderer.js';
import { CartesianPlane } from './rendering/cartesianPlane.js';
import Simulator from './simulator.js';
import Vector2 from './vector2.js';
import { DebugUI } from './rendering/debugui/debugUI.js';

let can = document.createElement('canvas');
let ctx = can.getContext('2d');
document.body.querySelector("#canvas-holder")!.appendChild(can);

export const canvasRenderer = new CanvasRenderer(ctx!, Vector2.zero, 100, 5, 500);
export let ambient = new Ambient();
export const simulator = new Simulator(Buttons.getButtonById("play-button")!, Buttons.getButtonById("reset-button")!, Buttons.getButtonById("destroy-button")!, Buttons.getButtonById("step-button")!);

import("./document/buttonClickFunctions.js");
import("./rendering/graph.js");

export const setAmbient = function (a: Ambient) {
    canvasRenderer.remove(ambient);
    simulator.remove(ambient);
    ambient.objects.forEach(o => o.destroy());
    ambient = a;
    canvasRenderer.add(ambient);
    simulator.add(ambient);
    ObjectSelectionController.selectObject(ambient);
}

ObjectSelectionController.selectObject(ambient);

simulator.add(ambient);

canvasRenderer.add(new CartesianPlane(1, CartesianPlane.ENVIRONMENT_STYLE));
canvasRenderer.add(ambient);
canvasRenderer.add(new DebugUI());
// canvasRenderer.add({ draw(cR: CanvasRenderer){
//     cR.context.beginPath();
//     cR.drawingTools.worldRectWithOffset(new Vector2(1, 1), new Vector2(1, 1), 20, false, 0.2*Math.PI); 
//     cR.context.fill();
//     cR.context.closePath();
// } });

canvasRenderer.start();

//If it's firefox, show a alert message warning about svg image scaling
//@ts-ignore
if (typeof InstallTrigger !== 'undefined')
    Alert.throwAlert("Atenção: o dimensionamento da imagens pode não funcionar corretamente", Alert.WARNING);