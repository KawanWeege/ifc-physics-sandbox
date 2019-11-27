import { PhysicsObjectType, PhysicsPropertyName } from "./types";

export interface AmbientJSON {
    objects: PhysicsObjectJSON[];
}

export interface PhysicsObjectJSON {
    kind: PhysicsObjectType;
    properties: PhysicsPropertyJSON<any>[];
}

export interface PhysicsPropertyJSON<T> {
    kind: PhysicsPropertyName;
    iValue: T;
}

export const downloadJSON = function (data: string, filename: string, type: string) {
    const file = new Blob([data], { type: type });

    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else {
        const a = document.createElement("a")
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

export const loadJSON = function (onload: (json: string) => void){
    const input = document.createElement("input");
    input.type = "file";

    input.addEventListener("change", () => {
        if (input.files) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.readAsText(file, "utf-8");

            reader.onload = ev => {
                const result = <string>(<FileReader>ev.target!).result;

                onload(result);

                input.remove();
            };
        }
    })

    input.click();
}
