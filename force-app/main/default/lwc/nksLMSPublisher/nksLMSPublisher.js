import { LightningElement, api, wire } from 'lwc';
import { FlowNavigationNextEvent } from 'lightning/flowSupport';
import { publish, MessageContext } from 'lightning/messageService';
import BOB_PREVENT_POPUP from '@salesforce/messageChannel/bobPreventPopUp__c';

export default class NksLMSPublisher extends LightningElement {
    @api messageChannelApiName;
    @api recordId;

    @wire(MessageContext) messageContext;

    connectedCallback() {
        if (this.messageChannelApiName) {
            this.publishMessage();
        }
    }

    publishMessage() {
        try {
            if (this.messageChannelApiName === 'bobPreventPopUp__c' && this.recordId) {
                const payload = { recordId: this.recordId };
                publish(this.messageContext, BOB_PREVENT_POPUP, payload);
                this.dispatchEvent(new FlowNavigationNextEvent());
            }
        } catch (error) {
            console.error('Error publishing message:', error);
        }
    }
}
