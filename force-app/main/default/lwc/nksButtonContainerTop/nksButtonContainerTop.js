import { LightningElement, api } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';
import REDACT_LABEL from '@salesforce/label/c.NKS_Set_To_Redaction';

export default class NksChatButtonContainerTop extends LightningElement {
    @api recordId;
    @api flowButtonLabel;
    @api flowApiName;
    @api channelName;

    showFlow = false;
    redactLabel = REDACT_LABEL;

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

    get flowButtonClass() {
        return (
            'slds-button slds-button_brand slds-button_stretch' +
            (this.flowButtonLabel === this.redactLabel ? ' redactButton' : '')
        );
    }

    toggleFlow() {
        this.showFlow = !this.showFlow;
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === 'FINISHED' || flowStatus === 'FINISHED_SCREEN') {
            this.showFlow = false;
            publishToAmplitude(this.channelName, { type: this.flowButtonLabel + ' finished' });
        }
    }
}
