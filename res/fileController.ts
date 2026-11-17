import { PhysicsObjectType, PhysicsPropertyName } from "./types.js";
import { Alert } from "./document/documentUtilities.js";

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

    //@ts-ignore
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        //@ts-ignore
        window.navigator.msSaveOrOpenBlob(file, filename);
    //@ts-ignore
    else if(typeof cordova !== 'undefined' && cordova.platformId === "android"){
        //@ts-ignore
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
            //@ts-ignore
            fs.root.getDirectory('PIFisica', { create: true }, function (dirEntry) {
                //@ts-ignore
                dirEntry.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                    //@ts-ignore
                    fileEntry.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function() {
                            Alert.throwAlert("Ambiente salvo com sucesso! Você pode encontrá la em "+fileEntry.fullPath, Alert.SUCCESS);
                        };

                        //@ts-ignore
                        fileWriter.onerror = function (e) {
                            Alert.throwAlert("Erro ao salvar ambiente: "+ e.toString(), Alert.ERROR);
                        };

                        fileWriter.write(file);
                    });

                }, () => Alert.throwAlert("Não foi possível criar arquivo", Alert.ERROR));
            }, () => Alert.throwAlert("Não foi possível criar diretório", Alert.ERROR))
        }, () => Alert.throwAlert("Não foi possível carregar sistema de arquvos", Alert.ERROR));
    }
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
    console.log('a')

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
