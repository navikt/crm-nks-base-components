import { LightningElement, api } from 'lwc';
import JOURNAL_LABEL from '@salesforce/label/c.NKS_Journal';
import CREATE_NAV_TASK_LABEL from '@salesforce/label/c.NKS_Create_NAV_Task';
import { publishToAmplitude } from 'c/amplitude';

const CONSTANTS = {
    CREATE_NAV_TASK: 'createNavTask',
    JOURNAL: 'journal',
    FINISHED: 'FINISHED',
    FINISHED_SCREEN: 'FINISHED_SCREEN',
    CONVERSATION_NOTE: 'Conversation note'
};

export default class NksButtonContainerBottom extends LightningElement {
    @api recordId;
    @api channelName;
    @api createNavTaskFlowName;
    @api journalFlowName;
    @api setBorders = false;

    showFlow = false;
    labels = {
        createNavTask: CREATE_NAV_TASK_LABEL,
        journal: JOURNAL_LABEL
    };
    dataId = '';

    get inputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId
            }
        ];
    }

    @api
    get showCreateNavTaskFlow() {
        return this.showFlow && this.dataId === CONSTANTS.CREATE_NAV_TASK;
    }

    get showJournalFlow() {
        return this.showFlow && this.dataId === CONSTANTS.JOURNAL;
    }

    get createNavTaskExpanded() {
        return this.showCreateNavTaskFlow.toString();
    }

    get journalExpanded() {
        return this.showJournalFlow.toString();
    }

    get layoutClassName() {
        return this.setBorders
            ? 'slds-border_top slds-border_bottom slds-var-p-vertical_medium'
            : 'slds-var-p-vertical_medium';
    }

    toggleFlow(event) {
        this.showFlow = !this.showFlow;
        if (event.target?.dataset.id) {
            this.dataId = event.target.dataset.id;
            this.changeColor(this.dataId);
            if (this.dataId === CONSTANTS.JOURNAL && this.channelName === CONSTANTS.CONVERSATION_NOTE) {
                this.dispatchEvent(new CustomEvent('journalbuttonclicked'));
            }
        }
        publishToAmplitude(this.channelName, { type: `${event.target.label} pressed` });
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === CONSTANTS.FINISHED || flowStatus === CONSTANTS.FINISHED_SCREEN) {
            this.showFlow = false;
        }
    }

    changeColor(dataId) {
        const buttons = this.template.querySelectorAll('lightning-button');
        buttons.forEach((button) => {
            button.classList.remove('active');
        });
        let currentButton = this.template.querySelector(`lightning-button[data-id="${dataId}"]`);
        if (currentButton && this.showFlow) {
            currentButton.classList.add('active');
        }
    }
}
