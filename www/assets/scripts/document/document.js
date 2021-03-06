var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "../main", "../propertyDescriptions", "../rendering/canvasRenderer", "../rendering/cartesianPlane", "./modals", "../vector2", "./buttons", "./propertyEditor"], function (require, exports, main_1, propertyDescriptions_1, canvasRenderer_1, cartesianPlane_1, Modals, vector2_1, Buttons, propertyEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Modals = __importStar(Modals);
    vector2_1 = __importDefault(vector2_1);
    Buttons = __importStar(Buttons);
    console.log("Loading document");
    class PropertyDescriptionUI {
        static setElementVisible(isVisible) {
            this.modal.setVisible(isVisible);
        }
        static show(propertyKind) {
            this.setElementVisible(true);
            const description = propertyDescriptions_1.propertyDescriptions.get(propertyKind);
            if (description)
                this.modal.element.querySelector("article").innerHTML = description;
            else
                this.hide();
        }
        static hide() {
            this.setElementVisible(false);
        }
    }
    exports.PropertyDescriptionUI = PropertyDescriptionUI;
    PropertyDescriptionUI.modal = Modals.getModalById("property-description-modal");
    class GraphPanel {
        static initialize(element) {
            this.panel = element;
            this.title = this.panel.querySelector("h1");
            const canvas = document.createElement("canvas");
            canvas.width = 10;
            canvas.height = 10;
            this.panel.querySelector(".panel-content").appendChild(canvas);
            this.canvasRenderer = new canvasRenderer_1.CanvasRenderer(canvas.getContext("2d"));
            this.canvasRenderer.camera.pos = new vector2_1.default(150, 150);
            this.cartesianPlane = new cartesianPlane_1.CartesianPlane(1);
            this.canvasRenderer.add(this.cartesianPlane);
        }
        static setElementVisible(v, title = "Gráfico") {
            this.panel.style.display = v ? "flex" : "none";
            this.title.innerHTML = title;
            if (!v) {
                this.stopRenderingGraph();
                if (this.onClose) {
                    this.onClose();
                    this.onClose = null;
                }
            }
        }
        static renderGraph(graph) {
            this.stopRenderingGraph();
            this.canvasRenderer.add(graph);
            this.graph = graph;
            this.cartesianPlane.xAxisName = graph.valueGetterX.name;
            this.cartesianPlane.yAxisName = graph.valueGetterY.name;
            this.canvasRenderer.start();
        }
        static stopRenderingGraph() {
            if (this.graph) {
                this.canvasRenderer.remove(this.graph);
                this.graph = null;
            }
            this.canvasRenderer.stop();
        }
    }
    exports.GraphPanel = GraphPanel;
    /**
     * Class that controls if the CreateObjectButtons are enabled or not
     */
    class ObjectCreationController {
        static set objectCreatable(value) {
            this._objectCreatable = value;
            if (!this.objectListElement)
                this.objectListElement = exports.documentElements.get("object-list");
            this.objectListElement.querySelectorAll("button").forEach(element => Buttons.getButtonByHTMLElement(element).enabled = value);
        }
        static get objectCreatable() {
            return this._objectCreatable;
        }
    }
    exports.ObjectCreationController = ObjectCreationController;
    ObjectCreationController._objectCreatable = true;
    ObjectCreationController.objectListElement = null;
    /**
     * Controlls the selection of Selectable objects
     */
    class ObjectSelectionController {
        static initialize(propertyEditor) {
            this.propertyEditor = propertyEditor;
        }
        /**
         * @returns the currently selected object
         */
        static get selectedObject() {
            return this._selectedObject;
        }
        /**
         * Selects an object, displaying it's properties in the properties list
         * @param object the object to be selected
         */
        static selectObject(object) {
            if (object == this.selectedObject)
                return;
            console.log("Selected:", object);
            const domPropertyH1 = exports.documentElements.get("property-list-title");
            this._selectedObject = object;
            this.propertyEditor.build(object);
            domPropertyH1.innerHTML = `Propriedades do ${object.name}`;
            const followButton = Buttons.getButtonById("follow-button");
            const destroyButton = Buttons.getButtonById("destroy-button");
            followButton.enabled = object.locate;
            if (main_1.canvasRenderer.camera.objectBeingFollowed == this._selectedObject)
                followButton.swapToAltImg();
            else
                followButton.swapToDefaultImg();
            destroyButton.enabled = object.destroy != undefined && main_1.simulator.time == 0;
        }
    }
    exports.ObjectSelectionController = ObjectSelectionController;
    ObjectSelectionController._selectedObject = null;
    class Alert {
        static initialize(element) {
            this.element = element;
        }
        static throwAlert(text, style) {
            this.element.classList.replace(this.element.classList[1], style);
            this.element.querySelector("p").innerHTML = text;
            this.element.style.display = "flex";
        }
    }
    exports.Alert = Alert;
    Alert.WARNING = "alert-warning";
    Alert.ERROR = "alert-error";
    /**
     * A map that contains various Elements in the application HTML document.
     */
    exports.documentElements = new Map();
    exports.documentElements.set("application-wrapper", document.querySelector("#application-wrapper"));
    exports.documentElements.set("header", document.querySelector("#buttons-header"));
    exports.documentElements.set("main-interface", document.querySelector("main"));
    exports.documentElements.set("file-buttons", exports.documentElements.get("header").querySelector("#header-file-buttons"));
    exports.documentElements.set("camera-buttons", exports.documentElements.get("header").querySelector("#header-camera-buttons"));
    exports.documentElements.set("graph-buttons", exports.documentElements.get("header").querySelector("#header-graph-buttons"));
    exports.documentElements.set("property-panel", document.querySelector("#property-side-panel"));
    exports.documentElements.set("object-interactor", document.querySelector("#object-interactor"));
    exports.documentElements.set("property-list-title", exports.documentElements.get("property-panel").querySelector("h1"));
    exports.documentElements.set("property-list", document.querySelector("#property-list"));
    exports.documentElements.set("simulation-controller-buttons", document.querySelector("#simulation-controller-buttons"));
    exports.documentElements.set("object-list", document.querySelector("#object-list"));
    exports.documentElements.set("graph-config-form", document.querySelector("#graph-config-form"));
    exports.documentElements.set("graph-panel", document.querySelector("#graph-panel"));
    exports.documentElements.set("alert", document.querySelector("#alert"));
    //Initialize static classes
    GraphPanel.initialize(exports.documentElements.get("graph-panel"));
    Alert.initialize(exports.documentElements.get("alert"));
    ObjectSelectionController.initialize(new propertyEditor_1.PropertyEditor(exports.documentElements.get("property-list")));
});
