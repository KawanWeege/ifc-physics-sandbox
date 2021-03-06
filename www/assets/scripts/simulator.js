define(["require", "exports", "./document/documentUtilities"], function (require, exports, documentUtilities_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    console.log("Loading simulator");
    class Simulator {
        constructor(playButton, resetButton, destroyButton, stepButton) {
            this.playButton = playButton;
            this.resetButton = resetButton;
            this.destroyButton = destroyButton;
            this.stepButton = stepButton;
            this._time = 0;
            this._isPlaying = false;
            const input = document.querySelector("#simulation-time");
            if (!input)
                throw "time input, play button or reset button not found";
            this.domInput = input;
            this.domInput.value = this._time.toFixed(2);
            this.domInput.title = `Valor exato: ${this._time}`;
            this.simulatables = [];
            this.domInput.addEventListener("change", () => {
                if (this.isPlaying)
                    return;
                this.fastForwardTo(Number(this.domInput.value));
            });
            this.playButton.onClick = () => {
                if (!this.isPlaying)
                    this.start();
                else
                    this.stop();
            };
            this.resetButton.onClick = () => {
                this.stop();
                this.reset();
            };
            if (this.stepButton)
                this.stepButton.onClick = () => this.passTime(0.01);
        }
        get time() {
            return this._time;
        }
        set time(value) {
            this._time = value;
            this.domInput.value = value.toFixed(2);
            this.domInput.title = `Valor exato: ${value}`;
            documentUtilities_1.ObjectSelectionController.propertyEditor.setEnabled(value == 0);
            documentUtilities_1.ObjectCreationController.objectCreatable = value == 0;
            this.destroyButton.enabled = value == 0 && documentUtilities_1.ObjectSelectionController.selectedObject != null;
        }
        get isPlaying() {
            return this._isPlaying;
        }
        set isPlaying(value) {
            this._isPlaying = value;
            this.domInput.disabled = value;
        }
        add(simulatable) {
            this.simulatables.push(simulatable);
            if (simulatable.onSimulatorAdded)
                simulatable.onSimulatorAdded(this);
        }
        remove(simulatable) {
            const index = this.simulatables.indexOf(simulatable);
            if (index > -1)
                this.simulatables.splice(index, 1);
        }
        start() {
            this.isPlaying = true;
            this.playButton.swapToAltImg();
            this.playButton.swapToAltTitle();
            this.simulate();
        }
        stop() {
            this.isPlaying = false;
            this.playButton.swapToDefaultImg();
            this.playButton.swapToDefaultTitle();
        }
        reset() {
            if (this.time == 0)
                return;
            this.time = 0;
            this.simulatables.forEach(simulatable => simulatable.reset());
        }
        fastForwardTo(time) {
            if (time < this.time)
                this.reset();
            const step = 0.01;
            let timePassed = this.time;
            while (timePassed + step < time) {
                this.passTime(step);
                timePassed += step;
            }
            if (this.time < time)
                this.passTime(time - this.time);
        }
        passTime(step) {
            this.time += step;
            this.simulatables.forEach(simulatable => simulatable.simulate(step));
        }
        simulate() {
            if (!this.isPlaying)
                return;
            this.passTime(0.016);
            window.requestAnimationFrame(this.simulate.bind(this));
        }
    }
    exports.default = Simulator;
});
