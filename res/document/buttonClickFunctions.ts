console.log("Loaded buttonClickFunctions");

import Ambient from "../ambient.js";
import { downloadJSON, loadJSON } from "../fileController.js";
import * as Main from "../main.js";
import { PhysicsObject } from "../physicsObjects.js";
import Vector2 from "../vector2.js";
import * as Buttons from "./buttons.js";
import { Alert, ObjectSelectionController, PropertyDescriptionUI } from "./documentUtilities.js";
import * as Modals from "./modals.js";

/*
    Button onClick setter
*/

Buttons.getButtonById("destroy-button")!.onClick = () => {
    const selectedObject = ObjectSelectionController.selectedObject;
    if (!selectedObject || !selectedObject.destroy || Main.simulator.time != 0)
        return;

    selectedObject.destroy();
    ObjectSelectionController.selectObject(Main.ambient);
};

Buttons.getButtonById("follow-button")!.onClick = () => {
    const selectedObject = <any>ObjectSelectionController.selectedObject;
    if (!selectedObject || !selectedObject.locate)
        return;

    const camera = Main.canvasRenderer.camera;

    if (camera.objectBeingFollowed != selectedObject)
        camera.followObject(selectedObject);
    else
        camera.unfollowObject();
}

Buttons.getButtonById("new-file-button")!.onClick = function () {
    const isOKClicked = confirm("Você tem certeza que quer criar um novo ambiente? As alterações não salvas serão perdidas!");
    if (isOKClicked) {
        Main.setAmbient(new Ambient());
        Main.simulator.reset();
        Main.canvasRenderer.camera.focusOrigin();
    }
};

Buttons.getButtonById("save-file-button")!.onClick = function () {
    downloadJSON(JSON.stringify(Main.ambient.toJSON()), "meuAmbiente.pha", "pha");
}

Buttons.getButtonById("load-file-button")!.onClick = function () {
    loadJSON((result) => {
        try {
            Main.setAmbient(Ambient.fromJSON(result));
        } catch(error){
            Alert.throwAlert("Não foi possível carregar este arquivo! Erro no console", Alert.ERROR);
            console.error(error);
        }
    
        Alert.throwAlert("Carregado arquivo com sucesso!", Alert.SUCCESS);
    });  
};

Buttons.getButtonById("center-camera-button")!.onClick = Main.canvasRenderer.camera.focusOrigin.bind(Main.canvasRenderer.camera);

/*
    Predined click functions
*/

Buttons.predefinedClickEvents.set("closeModal", (args: string) => Modals.getModalById(args)!.setVisible(false));
Buttons.predefinedClickEvents.set("hideElement", (args: string) => document.getElementById(args)!.style.display = "none");
Buttons.predefinedClickEvents.set("createObject", (args: string) => {
    if (Main.simulator.time > 0)
        return;

    PhysicsObject.createPhysicsObject(parseInt(args), Main.ambient, {
        position: Main.canvasRenderer.camera.getWorldPosFromCanvas(
            new Vector2(Main.canvasRenderer.context.canvas.width / 2, Main.canvasRenderer.context.canvas.height / 2)
        ),
        size: new Vector2(1, 1)
    })

    if (ObjectSelectionController.propertyEditor && ObjectSelectionController.selectedObject == Main.ambient)
        ObjectSelectionController.propertyEditor.build(Main.ambient);
});
Buttons.predefinedClickEvents.set("openPropertyDescription", (args: string) => PropertyDescriptionUI.show(parseInt(args)));
Buttons.predefinedClickEvents.set("openModal", (args: string) => {
    const modal = Modals.getModalById(args);
    if (modal)
        modal.setVisible(true);
});
Buttons.predefinedClickEvents.set("locateObject", (args: string) => {
    const obj = Main.ambient.objects.find(obj => obj.name == args);

    if (!obj)
        return;

    const cam = Main.canvasRenderer.camera;

    ObjectSelectionController.selectObject(obj);
    cam.pos = obj.locate();
})