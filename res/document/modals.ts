console.log("Loaded modal");

import documentElements from "./documentElements.js";

/*
    Class Definitions
*/

export class Modal {
    public onOpen: Function | null;

    constructor(public readonly element: HTMLElement) {
        this.onOpen = null;
    }

    setVisible(value: boolean) {
        this.element.style.display = value ? "flex" : "none";

        const application = <HTMLElement>documentElements.get("application-wrapper")!;

        application.style.filter = value ? "blur(3px)" : "none";

        if (value && this.onOpen)
            this.onOpen();
    }
}

/*
    Query modals
*/

const modals: Modal[] = [];
document.querySelectorAll(".modal").forEach(element => modals.push(new Modal(<HTMLElement>element)));

/*
    Export functions
*/

export const getModalById = (id: string) => {
    return modals.find(modal => { return modal.element.id == id });
}

export const getModalByHTMLElement = (element: HTMLElement) => {
    return modals.find(modal => { return modal.element == element });
}

export const pushModalElement = (element: HTMLElement) => {
    if (!getModalByHTMLElement(element))
        modals.push(new Modal(element));
}

export const removeModalElement = (element: HTMLElement) => {
    const btn = getModalByHTMLElement(element);
    if (btn)
        modals.splice(modals.indexOf(btn));
}