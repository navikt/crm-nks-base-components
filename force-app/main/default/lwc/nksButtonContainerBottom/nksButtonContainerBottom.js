import { LightningElement, api, wire } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';
import getLabels from '@salesforce/apex/NKS_ButtonContainerController.getLabels';
import { handleShowNotifications } from 'c/nksButtonContainerUtils';
import { subscribe, unsubscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import BUTTON_CONTAINER_NOTIFICATIONS_CHANNEL from '@salesforce/messageChannel/buttonContainerNotifications__c';

const CONSTANTS = {
    FINISHED: 'FINISHED',
    FINISHED_SCREEN: 'FINISHED_SCREEN',
    CONVERSATION_NOTE: 'Conversation note'
};

export default class NksButtonContainerBottom extends LightningElement {
    @api recordId;
    @api channelName;
    @api flowNames;
    @api flowLabels;
    @api setBorders = false;
    @api showNotifications = false;

    flowLoop;
    timer;
    _activeFlow;
    subscription = null;

    @wire(MessageContext)
    messageContext;

    @wire(getLabels, { labels: '$flowLabelList' })
    labelWire({ data, error }) {
        if (data) {
            this.labelList = data;
            this.updateFlowLoop();
        } else if (error) {
            console.error('Could not fetch labels for buttonContainerBottom', error);
        }
    }

    renderedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    get inputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId
            }
        ];
    }

    get flowLabelList() {
        return this.flowLabels?.replace(/ /g, '').split(',');
    }

    get flowNameList() {
        return this.flowNames?.replace(/ /g, '').split(',');
    }

    get showFlow() {
        return this.activeFlow !== '' && this.activeFlow != null;
    }

    get layoutClassName() {
        return `slds-p-vertical_medium${
            this.setBorders ? ' slds-var-p-right_xx-small slds-border_top slds-border_bottom' : ''
        }`;
    }

    get activeFlow() {
        return this._activeFlow;
    }

    set activeFlow(flowName) {
        this._activeFlow = flowName;
        this.updateFlowLoop();
        if (this.channelName === CONSTANTS.CONVERSATION_NOTE) {
            this.dispatchEvent(new CustomEvent('flowclicked', { detail: this.activeFlow }));
        }
    }

    get notificationBoxTemplate() {
        return this.template.querySelector('c-nks-notification-box');
    }

    updateFlowLoop() {
        this.flowLoop = this.flowNameList?.map((flowName, index) => ({
            developerName: flowName,
            label: this.labelList ? this.labelList[index] : flowName,
            expanded: (this.activeFlow === flowName).toString()
        }));
    }

    toggleFlow(event) {
        const dataId = event.target?.dataset.id;
        if (dataId) {
            if (this.activeFlow === dataId) {
                this._activeFlow = '';
                this.updateFlowLoop();
                return;
            }
            if (this.showFlow) {
                this.swapActiveFlow(dataId);
                return;
            }
            this._activeFlow = dataId;
        }
    }

    handleStatusChange(event) {
        const { status, outputVariables } = event.detail;

        if (status === CONSTANTS.FINISHED || status === CONSTANTS.FINISHED_SCREEN) {
            publishToAmplitude(this.channelName, { type: `${event.target.label} completed` });

            if (this.showNotifications) {
                handleShowNotifications(this.activeFlow, outputVariables, this.notificationBoxTemplate);
            } else {
                this.dispatchEvent(
                    new CustomEvent('flowsucceeded', {
                        detail: { flowName: this.activeFlow, flowOutput: outputVariables }
                    })
                );
            }

            this._activeFlow = '';
            this.updateFlowLoop();
        }
    }

    swapActiveFlow(flowName) {
        clearTimeout(this.timer);
        this._activeFlow = '';
        // eslint-disable-next-line @lwc/lwc/no-async-operation, @locker/locker/distorted-window-set-timeout
        this.timer = setTimeout(() => {
            this._activeFlow = flowName;
        }, 10);
    }

    subscribeToMessageChannel() {
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(
            this.messageContext,
            BUTTON_CONTAINER_NOTIFICATIONS_CHANNEL,
            (message) =>
                handleShowNotifications(message.flowApiName, message.outputVariables, this.notificationBoxTemplate),
            { scope: APPLICATION_SCOPE }
        );
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
}
