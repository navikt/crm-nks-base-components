import { LightningElement, api, wire } from 'lwc';
import { publishToAmplitude } from 'c/amplitude';
import getLabels from '@salesforce/apex/NKS_ButtonContainerController.getLabels';
import { callGetCommonCode, getOutputVariableValue } from 'c/nksButtonContainerUtils';

const CONSTANTS = {
    FINISHED: 'FINISHED',
    FINISHED_SCREEN: 'FINISHED_SCREEN',
    CONVERSATION_NOTE: 'Conversation note',
    ERROR: 'ERROR'
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
        return 'slds-var-p-vertical_medium' + (this.setBorders ? ' slds-border_top slds-border_bottom' : '');
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
        const outputVariables = event.detail?.outputVariables;
        const flowStatus = event.detail.status;
        if (flowStatus === CONSTANTS.FINISHED || flowStatus === CONSTANTS.FINISHED_SCREEN) {
            publishToAmplitude(this.channelName, { type: `${event.target.label} completed` });
            if (this.showNotifications) {
                this.handleShowNotifications(outputVariables);
            } else {
                this.dispatchEvent(
                    new CustomEvent('flowsucceeded', {
                        detail: { flowName: this.activeFlow, flowOutput: event.detail.outputVariables }
                    })
                );
            }
            this.activeFlow = '';
            this.updateFlowLoop();
        }
        if (flowStatus === CONSTANTS.ERROR) {
            this.dispatchEvent(new CustomEvent('flowfailed', { detail: this.activeFlow }));
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

    async handleShowNotifications(flowName, outputVariables) {
        if (!outputVariables) {
            console.error('No output variables found in the event detail');
            return;
        }
        try {
            if (flowName.toLowerCase().includes('journal')) {
                const selectedThemeId = getOutputVariableValue(outputVariables, 'Selected_Theme_SF_Id');
                let journalTheme = '';
                if (selectedThemeId) {
                    journalTheme = await callGetCommonCode(selectedThemeId);
                }
                this.notificationBoxTemplate.addNotification('Henvendelsen er journalført', journalTheme);
            } else if (flowName.toLowerCase().includes('task')) {
                const selectedThemeId = getOutputVariableValue(outputVariables, 'Selected_Theme_SF_Id');
                const unitName = getOutputVariableValue(outputVariables, 'Selected_Unit_Name');
                const unitNumber = getOutputVariableValue(outputVariables, 'Selected_Unit_Number');
                let navTaskTheme = '';

                if (selectedThemeId) {
                    navTaskTheme = await callGetCommonCode(selectedThemeId);
                }

                this.notificationBoxTemplate.addNotification(
                    'Oppgave opprettet',
                    `${navTaskTheme} Sendt til: ${unitNumber} ${unitName}`
                );
            }
        } catch (error) {
            console.error('Error handling flow succeeded event: ', error);
        }
    }
}
