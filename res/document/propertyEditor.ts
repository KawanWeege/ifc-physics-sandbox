console.log("Loading propertyEditor");

import { PhysicsObject } from "../physicsObjects.js";
import { ButtonColor, PropertyEditorOption, Selectable, PropertyEditorFormTarget, PropertyEditorInputListRow } from "../types.js";
import Vector2 from "../vector2.js";
import { Button } from "./buttons.js";

export class PropertyEditor {
    private rows: PropertyEditorOption[];
    private enabled: boolean;

    constructor(private htmlElement: HTMLElement) {
        this.rows = [];
        this.enabled = true;

        this.htmlElement.addEventListener("change", this.onChanged.bind(this));
        this.htmlElement.addEventListener("click", this.onClicked.bind(this));
        this.htmlElement.addEventListener("mouseover", this.onMouseOver.bind(this));
        this.htmlElement.addEventListener("mouseout", this.onMouseOut.bind(this));
    }

    setEnabled(v: boolean) {
        this.rows.forEach(row => row.active = v);
        this.enabled = v;
    }

    build(object: Selectable): void {
        this.clear();

        if (!object.getPropertyEditorOptions)
            return;

        //Get categories from the propertyPalleteRows of object, and store them on an array of {name, layoutOrder}. Then remove all of categories with the same name, leaving the ones with the minimal layoutOrder
        const PropertyEditorOptions = object.getPropertyEditorOptions();
        let categories: { name: string, layoutOrder: number }[] = PropertyEditorOptions.map(el => { return { name: el.category, layoutOrder: el.layoutOrder } });
        categories = categories.sort((cat1, cat2) => cat1.layoutOrder - cat2.layoutOrder);
        categories = categories.filter((v) => categories.find(c => c.name == v.name) == v);

        //Append categories as h1 and PropertyEditorOptions
        categories.forEach(category => {
            let rowWithCategory = PropertyEditorOptions.filter(ppr => ppr.category == category.name);
            rowWithCategory = rowWithCategory.sort((row1, row2) => row1.layoutOrder - row2.layoutOrder);

            const categoryH1 = document.createElement("h1");
            categoryH1.innerHTML = category.name;

            this.htmlElement.append(categoryH1);
            rowWithCategory.forEach(row => {
                row.appendTo(this.htmlElement);
                row.active = this.enabled;
            });
        });

        this.htmlElement.style.display = this.htmlElement.childElementCount > 0 ? "block" : "none";

        this.rows = PropertyEditorOptions;
    }

    clear() {
        while (this.htmlElement.firstChild)
            this.htmlElement.removeChild(this.htmlElement.firstChild);

        this.rows = [];
    }

    private getRowFromEvent(ev: Event): PropertyEditorOption | undefined {
        const tgt = <HTMLElement>ev.target;
        if (!tgt) return;

        for (const row of this.rows) {
            if (row.element.contains(tgt))
                return row;
        }
    }

    private onChanged(ev: Event) {
        const row = this.getRowFromEvent(ev);

        if (row && row.onChanged)
            row.onChanged(ev);
    }

    private onClicked(ev: MouseEvent) {
        const row = this.getRowFromEvent(ev);

        if (row && row.onClicked)
            row.onClicked(ev);
    }

    private onMouseOver(ev: MouseEvent) {
        const row = this.getRowFromEvent(ev);

        if (row && row.onMouseOver)
            row.onMouseOver(ev);
    }

    private onMouseOut(ev: MouseEvent) {
        const row = this.getRowFromEvent(ev);

        if (row && row.onMouseOut)
            row.onMouseOut(ev);
    }
}

abstract class BasicPropertyEditorOption implements PropertyEditorOption {
    readonly element: HTMLElement;

    private _active: boolean;

    constructor(readonly category: string, readonly layoutOrder: number, protected changeable: boolean, descriptionId?: number) {
        this._active = changeable;
        this.element = document.createElement("li");

        this.element.setAttribute("class", changeable ? "active-row" : "inactive-row");

        if (descriptionId != undefined) {
            const descriptionButton = Button.createButtonElement({
                buttonName: `open-${descriptionId}-description-button`,
                buttonColor: ButtonColor.Dark,
                enabled: true,
                title: `Descrição`,
                imgSrc: "./assets/images/descriptionicon.svg",
                func: "openPropertyDescription",
                args: descriptionId.toString()
            });

            this.element.appendChild(descriptionButton);
        }
    }

    get active() {
        return this._active;
    }

    set active(v: boolean) {
        this._active = v && this.changeable;
        this.element.classList.replace(this.element.classList.contains("active-row") ? "active-row" : "inactive-row", this._active ? "active-row" : "inactive-row");
    }

    appendTo(target: HTMLElement) {
        target.appendChild(this.element);
    }
}

export class PropertyEditorInputList extends BasicPropertyEditorOption {
    private nameLabel: HTMLLabelElement;
    private inputWrapper: HTMLDivElement;
    private toggleElement?: HTMLInputElement;
    private _toggled?: boolean;

    private inputList: PropertyEditorInputListRow<any>[];

    constructor(protected readonly target: PropertyEditorFormTarget, name: string, category: string, layoutOrder: number, changeable: boolean, toggleable: boolean, title: string, descriptionId?: number) {
        super(category, layoutOrder, changeable, descriptionId);

        this.inputList = [];

        this.element.classList.add("input-row");
        this.inputWrapper = document.createElement("div");
        this.nameLabel = document.createElement("label");

        this.nameLabel.innerHTML = name;
        this.nameLabel.title = title;

        if(toggleable){
            this.toggleElement = document.createElement("input");
            this.toggleElement.type = "checkbox";
            this.toggleElement.classList.add("toggle-input");
            this._toggled = true;

            this.element.appendChild(this.toggleElement);
        }

        this.element.append(this.nameLabel, this.inputWrapper);
    }

    get active(): boolean {
        return super.active;
    }

    set active(v: boolean) {
        super.active = v;

        this.inputList.forEach(input => input.active = v && this.changeable);
        if(this.toggleElement)
            this.toggleElement.disabled = !v || !this.changeable;
    }

    get toggled(){
        return this._toggled;
    }

    set toggled(v: boolean | undefined){
        this._toggled = v;
        this.toggleElement!.checked = v || false;
    }

    addInput(input: PropertyEditorInputListRow<any>) {
        this.inputList.push(input);
        input.appendTo(this.inputWrapper);
    }

    removeInput(name: string){
        let inputToRemove = this.inputList.find(i => i.name === name);
        if(!inputToRemove)
            return;

        this.inputList.splice(this.inputList.indexOf(inputToRemove), 1);
        inputToRemove.element.remove();
    }

    getInput(name?: string): PropertyEditorInputListRow<any> | undefined {
        if(name)        
            return this.inputList.find(el => el.name == name);
        
        return this.inputList.length > 0 ? this.inputList[0] : undefined;
    }

    onChanged(ev: Event): void {
        const tgt = <HTMLInputElement>ev.target;
        if(tgt.classList.contains("toggle-input")){
            this.toggled = tgt.checked;
            if(this.target.onUserToggle)
                this.target.onUserToggle(this.toggled);
        }else{
            const map = new Map<string, any>();

            this.inputList.forEach(i => {
                const result = i.onChanged();
                if(result)
                    map.set(i.name, result);
            });

            this.target.onUserInput(map);
        }
    }

    onMouseOver(ev: MouseEvent): void {
        this.target.doDrawGizmos = true;
    }

    onMouseOut(ev: MouseEvent): void {
        this.target.doDrawGizmos = false;
    }
}

export class InputListRow<T> implements PropertyEditorInputListRow<T> {
    public readonly element: HTMLElement;
    private _active: boolean;
    protected input: HTMLInputElement;
    private lastValue: T;

    constructor(public readonly name: string, unit: string, initialValue: T, private regExp: RegExp, private changeable: boolean, createNameLabel: boolean){
        this._active = changeable;
        this.lastValue = initialValue;

        this.element = document.createElement("div");
        this.input = document.createElement("input");
        const unitLabel = document.createElement("label");

        unitLabel.innerHTML = unit;
        this.input.value = this.formatValue(initialValue);
        this.input.type = "text";
        this.active = changeable;

        if(createNameLabel){
            const nameLabel = document.createElement("label");
            nameLabel.innerHTML = name;

            this.element.appendChild(nameLabel);
        }

        this.element.append(this.input, unitLabel);
    }
    
    get active() {
        return this._active;
    }

    set active(v: boolean){
        this._active = v && this.changeable;
        this.input.disabled = !v || !this.changeable;
    }

    appendTo(element: HTMLElement){
        element.appendChild(this.element);
    }

    resetToLastValue(){
        this.input.value = this.formatValue(this.lastValue);
    }

    onChanged(): T{
        const reset = () => {
            const lastValue = this.lastValue;
            this.resetToLastValue();
            return lastValue;
        }
        const match = this.input.value.match(this.regExp)?.filter(el => el != "" );

        if (!match)
            return reset();

        const matchResult = this.processMatch(match);

        if (matchResult == undefined)
            return reset();

        return matchResult;
    }

    updateValue(v: T) {
        this.lastValue = v;
        this.input.value = this.formatValue(v)
    }

    protected formatValue(value: T): string{
        return "NaN";
    }

    protected processMatch(match: string[]): T | undefined {
        return undefined;
    }
}

export class Vector2InputListRow extends InputListRow<Vector2>{
    constructor(name: string, unit: string, initialValue: Vector2, changeable: boolean, createNameLabel: boolean, private modulusUnit?: string){
        super(name, unit, initialValue, /\-?\d*\.?\d*/g, changeable, createNameLabel);
        this.updateInputTitle(initialValue);
    }

    updateValue(v: Vector2){
        super.updateValue(v);
        this.updateInputTitle(v);
    }

    protected formatValue(value: Vector2): string {
        return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)})`;
    }

    protected processMatch(match: string[]): Vector2 | undefined {
        if (!match[0] || !match[1]) {
            this.resetToLastValue();
            return undefined;
        }

        return new Vector2(Number(match[0]), Number(match[1]));
    }

    private updateInputTitle(v: Vector2){
        if (this.modulusUnit)
            this.input.title = `Módulo: ${v.magnitude()} ${this.modulusUnit}`;
    }
}

export class NumberInputListRow extends InputListRow<number>{
    constructor(name: string, unit: string, initialValue: number, changeable: boolean, createNameLabel: boolean){
        super(name, unit, initialValue, /\-?\d*\.?\d*/i, changeable, createNameLabel);
    }

    protected formatValue(value: number): string {
        return value.toFixed(2);
    }

    protected processMatch(match: string[]): number | undefined {
        if (!match[0]) {
            this.resetToLastValue();
            return;
        }

        return Number(match[0]);
    }
}

export class ButtonInputListRow implements PropertyEditorInputListRow<null>{
    private _active: boolean;
    public readonly element: HTMLElement;

    constructor(public name: string, private button: Button, createNameLabel: boolean = true){
        this._active = true;
        this.element = document.createElement("div");

        if(createNameLabel){
            const nameLabel = document.createElement("label");
            nameLabel.innerHTML = name;
            this.element.appendChild(nameLabel);
        }

        this.element.appendChild(button.element);
    }
    get active() {
        return this._active;
    }

    set active(v: boolean){
        this._active = v;
        this.button.enabled = v;
    }
    appendTo(target: HTMLElement): void {
        target.appendChild(this.element)
    }
    onChanged(): null {return null}
    resetToLastValue(): void {}
    updateValue(v: null): void {}
}

export class ObjectLocatorPropertyEditorOption extends BasicPropertyEditorOption {
    private locateButton: HTMLElement;

    constructor(target: PhysicsObject, category: string, layoutOrder: number, descriptionId?: number) {
        super(category, layoutOrder, true, descriptionId);

        this.element.classList.add("object-locator-row");

        const nameLabel = document.createElement("label");
        this.locateButton = Button.createButtonElement({
            buttonColor: ButtonColor.Dark,
            buttonName: `locate-${target.name.replace(/\s+/g, '')}`,
            enabled: true,
            title: `Localizar objeto`,
            imgSrc: "./assets/images/centertooriginicon.svg",
            func: "locateObject",
            args: target.name
        });

        nameLabel.innerHTML = target.name;

        this.element.append(nameLabel, this.locateButton);
    }
}