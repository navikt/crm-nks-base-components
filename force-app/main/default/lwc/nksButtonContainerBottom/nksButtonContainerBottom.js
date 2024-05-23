import { LightningElement, api, wire } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';
import getLabels from '@salesforce/apex/NKS_LabelGetter.getLabels';

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

    flowLoop;
    timer;
    _activeFlow;

    @wire(getLabels, { labels: '$flowLabelList' })
    labelWire({ data, error }) {
        if (data) {
            this.labelList = data;
            this.updateFlowLoop();
        }
        if (error) {
            console.log('Could not fetch labels for buttonContainerBottom');
            console.log(error);
        }
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
        return 'slds-var-p-vertical_medium' + (this.setBorders ? 'slds-border_top slds-border_bottom ' : '');
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

    updateFlowLoop() {
        this.flowLoop = this.flowNameList?.map((flowName, index) => ({
            developerName: flowName,
            label: this.labelList ? this.labelList[index] : flowName,
            expanded: (this.activeFlow === flowName).toString()
        }));
    }

    toggleFlow(event) {
        if (event.target?.dataset.id) {
            const dataId = event.target.dataset.id;
            if (this.activeFlow === dataId) {
                this.activeFlow = '';
                this.updateFlowLoop();
                return;
            }
            if (this.showFlow) {
                this.swapActiveFlow(dataId);
                return;
            }
            this.activeFlow = dataId;
        }
    }

    handleStatusChange(event) {
        let flowStatus = event.detail.status;
        if (flowStatus === CONSTANTS.FINISHED || flowStatus === CONSTANTS.FINISHED_SCREEN) {
            this.activeFlow = '';
            this.updateFlowLoop();
            publishToAmplitude(this.channelName, { type: `${event.target.label} completed` });
        }
    }

    swapActiveFlow(flowName) {
        clearTimeout(this.timer);
        this.activeFlow = '';
        // eslint-disable-next-line @lwc/lwc/no-async-operation, @locker/locker/distorted-window-set-timeout
        this.timer = setTimeout(() => {
            this.activeFlow = flowName;
        }, 10);
    }
}
