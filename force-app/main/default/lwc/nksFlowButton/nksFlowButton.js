import { LightningElement, api } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';

export default class NksFlowButton extends LightningElement {
    @api flowName;
    @api buttonLabel;
    @api buttonColor;
    @api inputVariables;
    @api isDisabled = false;

    showFlow = false;
    _buttonVariant = 'brand';

    get ariaExpanded() {
        return this.showFlow.toString();
    }

    get buttonClassName() {
        return this.buttonColor?.toLowerCase() === 'green' ? 'button green' : 'button';
    }

    @api
    get buttonVariant() {
        return this._buttonVariant;
    }

    set buttonVariant(value) {
        this._buttonVariant = value;
    }

    toggleFlow() {
        publishToAmplitude('Action', { type: this.buttonLabel + ' pressed' });
        this.showFlow = !this.showFlow;
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === 'FINISHED' || flowStatus === 'FINISHED_SCREEN') {
            this.showFlow = false;
        }
        this.dispatchEvent(new CustomEvent('flowfinished'));
    }
}
