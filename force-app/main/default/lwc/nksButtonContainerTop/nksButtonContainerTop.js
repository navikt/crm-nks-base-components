import { LightningElement, api } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';

export default class NksChatButtonContainerTop extends LightningElement {
    @api recordId;
    @api flowButtonLabel;
    @api flowApiName;
    @api channelName;

    showFlow = false;

    get inputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId
            }
        ];
    }

    get buttonExpanded() {
        return this.showFlow.toString();
    }

    toggleFlow(event) {
        this.showFlow = !this.showFlow;
        if (event.target?.label) {
            publishToAmplitude(this.channelName, { type: event.target.label + ' pressed' });
        }
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === 'FINISHED' || flowStatus === 'FINISHED_SCREEN') {
            this.showFlow = false;
        }
    }
}
