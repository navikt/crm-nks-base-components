import { LightningElement, api, wire } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';
import { getOutputVariableValue } from 'c/nksButtonContainerUtils';
import REDACT_LABEL from '@salesforce/label/c.NKS_Set_To_Redaction';
import BUTTON_CONTAINER_NOTIFICATIONS_CHANNEL from '@salesforce/messageChannel/buttonContainerNotifications__c';
import { publish, MessageContext } from 'lightning/messageService';

export default class NksChatButtonContainerTop extends LightningElement {
    @api recordId;
    @api flowButtonLabel;
    @api flowApiName;
    @api channelName;

    showFlow = false;
    redactLabel = REDACT_LABEL;

    @wire(MessageContext)
    messageContext;

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
        return 'full-width-grid-btn' + (this.flowButtonLabel === this.redactLabel ? ' redactButton' : '');
    }

    toggleFlow() {
        this.showFlow = !this.showFlow;
    }

    handleStatusChange(event) {
        const status = event.detail.status;
        const outputVariables = event.detail?.outputVariables;
        if (status === 'FINISHED' || status === 'FINISHED_SCREEN') {
            this.showFlow = false;
            publishToAmplitude(this.channelName, { type: this.flowButtonLabel + ' finished' });
            try {
                let publishNotification = getOutputVariableValue(outputVariables, 'Publish_Notification');
                if (publishNotification) {
                    const payload = {
                        flowApiName: this.flowApiName,
                        outputVariables: outputVariables
                    };
                    publish(this.messageContext, BUTTON_CONTAINER_NOTIFICATIONS_CHANNEL, payload);
                }
            } catch (error) {
                console.error('Error publishing message on button container message channel: ', error);
            }
        }
    }
}
