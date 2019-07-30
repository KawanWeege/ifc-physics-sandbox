console.log("Loading simulator");

import { ObjectCreationController, ObjectSelectionController } from './document';
import { Simulatable } from './types';
import { Button } from './buttons';

export default class Simulator {
    private _time: number;
    private _isPlaying: boolean;
    private domInput: HTMLInputElement;
    private simulatables: Simulatable[];

    constructor(private readonly playButton: Button, private readonly resetButton: Button, private readonly destroyButton: Button){
        this._time = 0;
        this._isPlaying = false;
        
        const bottomBar = document.querySelector("#mid-menu>div:last-child");
        const queryInput = bottomBar!.querySelector("input");

        if(!queryInput)
            throw "time input, play button or reset button not found";
        
        this.domInput = <HTMLInputElement>queryInput;
        this.domInput.value = this._time.toFixed(2);
        this.simulatables = [];

        this.resetButton.enabled = false;

        this.domInput.addEventListener("change", () => {
            if(this.isPlaying)
                return;
            
            this.fastForwardTo(Number(this.domInput.value));
        });

        this.playButton.onClick = () => {
            if(!this.isPlaying)
                this.start();
            else
                this.stop();
        };

        this.resetButton.onClick = this.reset.bind(this);
    }

    get time(): number{
        return this._time;
    }

    set time(value: number){
        this._time = value;
        this.domInput.value = value.toFixed(2);

        ObjectSelectionController.propertiesEnabled = value == 0;
        ObjectCreationController.objectCreatable = value == 0;

        this.resetButton.enabled = value > 0 && !this._isPlaying;
        this.destroyButton.enabled = value == 0 && ObjectSelectionController.selectedObject != null && ObjectSelectionController.selectedObject.isFollowable;
    }

    get isPlaying(){
        return this._isPlaying;
    }

    set isPlaying(value: boolean){
        this._isPlaying = value;
        this.domInput.disabled = value;

        if(!value && this.time > 0)
            this.resetButton.enabled = false
    }

    add(simulatable: Simulatable): void{
        this.simulatables.push(simulatable);
    }

    remove(simulatable: Simulatable): void{
        const index = this.simulatables.indexOf(simulatable);
        if(index > -1) 
            this.simulatables.splice(index, 1);
        
    }
    
    start(): void{
        this.isPlaying = true;
        this.playButton.swapToAltImg();
        this.playButton.swapToAltTitle();
        this.simulate();
    }
    
    stop(): void{
        this.isPlaying = false;
        this.playButton.swapToDefaultImg();
        this.playButton.swapToDefaultTitle();
    }
    
    reset(): void{
        if(this.isPlaying || this.time == 0)
        return;
        
        this.time = 0;
        this.simulatables.forEach(simulatable => simulatable.reset());
    }
    
    fastForwardTo(time: number){
        this.reset();
        this.passTime(time);
    }

    private passTime(step: number){
        this.time += step;
        this.simulatables.forEach(simulatable => simulatable.simulate(step));
    }

    private simulate(): void{
        this.passTime(0.016);

        if(this.isPlaying)
            window.requestAnimationFrame(this.simulate.bind(this));
    }
}