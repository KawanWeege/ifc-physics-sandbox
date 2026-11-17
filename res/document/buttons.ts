console.log("Loaded buttons");

import { ButtonConfig } from "../types.js";

const buttons: Button[] = [];

/*
    Class Definitions
*/

export class Button {
    public readonly buttonName: string;
    public onClick: Function | null;

    private _enabled: boolean;
    private defaultImgSrc: string | null;
    private defaultTitle: string | null
    private altImgSrc: string | null;
    private altTitle: string | null;
    private imgElement: HTMLImageElement | null;

    constructor(public readonly element: HTMLButtonElement) {
        this._enabled = element.classList.contains("active-button");

        this.onClick = null;
        this.defaultTitle = element.getAttribute("title");
        this.altTitle = element.getAttribute("alt-title");

        const imgElement = element.querySelector("img");
        if (imgElement) {
            this.imgElement = imgElement;
            this.defaultImgSrc = imgElement.getAttribute("src");
        } else {
            this.imgElement = null;
            this.defaultImgSrc = null;
        }
        this.altImgSrc = element.getAttribute("alt-img");

        this.buttonName = element.id;
        element.setAttribute("button-name", this.buttonName);
        element.querySelectorAll("*").forEach((element) => element.setAttribute("button-name", this.buttonName));

        buttons.push(this);
    }

    get enabled() {
        return this._enabled
    }

    set enabled(value: boolean) {
        this.element.classList.replace(
            this._enabled ? "active-button" : "inactive-button",    //old token
            value ? "active-button" : "inactive-button"             //new token
        );

        this._enabled = value;
    }

    static createButtonElement(buttonConfig: ButtonConfig): HTMLButtonElement {
        const button = document.createElement("button");

        buttonConfig.buttonName = buttonConfig.buttonName.replace(" ", "-").toLowerCase();

        button.setAttribute("id", buttonConfig.buttonName);
        button.setAttribute("class", `${buttonConfig.buttonColor} ${buttonConfig.enabled ? "active-button" : "inactive-button"}`);
        button.setAttribute("button-name", buttonConfig.buttonName);

        if (buttonConfig.func)
            button.setAttribute("func", buttonConfig.func);

        if (buttonConfig.args)
            button.setAttribute("args", buttonConfig.args);

        if (buttonConfig.title)
            button.setAttribute("title", buttonConfig.title);

        if (buttonConfig.altTitle)
            button.setAttribute("alt-title", buttonConfig.altTitle);

        if (buttonConfig.imgSrc) {
            const imgElement = document.createElement("img");
            imgElement.src = buttonConfig.imgSrc;

            button.appendChild(imgElement);
        }

        if (buttonConfig.altImgSrc)
            button.setAttribute("alt-img", buttonConfig.altImgSrc);

        button.querySelectorAll("*").forEach(element => element.setAttribute("button-name", buttonConfig.buttonName));
        return button;
    }

    swapToAltImg() {
        this.swapImg(this.altImgSrc);
    }

    swapToDefaultImg() {
        this.swapImg(this.defaultImgSrc);
    }

    swapToDefaultTitle() {
        this.setTitle(this.defaultTitle);
    }

    swapToAltTitle() {
        this.setTitle(this.altTitle);
    }

    click() {
        if (this.onClick && this.enabled)
            this.onClick();
    }

    private swapImg(src: string | null) {
        if (this.imgElement && src)
            this.imgElement.setAttribute("src", src);
    }

    private setTitle(title: string | null) {
        if (title)
            this.element.setAttribute("title", title);
    }
}

/*
    Query Buttons
*/

document.querySelectorAll("button").forEach(element => new Button(element));

/*
    Export functions
*/

export const getButtonById = (id: string) => {
    return buttons.find(button => { return button.element.id == id });
}

export const getButtonByHTMLElement = (element: HTMLButtonElement) => {
    return buttons.find(button => { return button.element == element });
}

export const pushButtonElement = (element: HTMLButtonElement) => {
    if (!getButtonByHTMLElement(element))
        buttons.push(new Button(element));
}

export const removeButtonElement = (element: HTMLButtonElement) => {
    const btn = getButtonByHTMLElement(element);
    if (btn)
        buttons.splice(buttons.indexOf(btn));
}

export const removeAllButtonsFrom = (element: HTMLElement) => {
    element.querySelectorAll("button").forEach(b => {
        let btn = getButtonByHTMLElement(b);
        if (btn)
            buttons.splice(buttons.indexOf(btn));
    })
}

/*
    Predefined onClick functions
*/

export const predefinedClickEvents: Map<String, Function> = new Map<String, Function>();

/*
    Click event
*/

document.addEventListener("click", ev => {
    const target = <HTMLElement>ev.target;
    if (!target || !target.getAttribute("button-name"))
        return;

    const buttonObject = getButtonById(target.getAttribute("button-name")!);
    const buttonElement = document.querySelector(`button#${target.getAttribute("button-name")}`);
    
    if (buttonObject && buttonObject.onClick)
        buttonObject.click();

    if (buttonElement && buttonElement.getAttribute("func")) {
        const func = predefinedClickEvents.get(buttonElement.getAttribute("func")!);
        if (func)
            func(buttonElement.getAttribute("args"));
    }
});