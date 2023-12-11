import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class NksKnowledgeHelpText extends LightningElement {
    @api helpTextId;
    @api backgroundColor = '#ccf1d6';
    @api iconColor = '#06893a';

    @track objMetadataValues = {};

    sectionClass = 'slds-accordion__section';
    sectionIconName = 'utility:chevronright';
    isExpanded = true;
    isHidden = false;

    @wire(getRecord, {
        recordId: '$helpTextId',
        fields: ['NKS_Help_Text__mdt.Help_Text_Label__c', 'NKS_Help_Text__mdt.Help_Text_Content__c']
    })
    wiredData({ error, data }) {
        if (data) {
            let currentData = data.fields;
            this.objMetadataValues = {
                label: currentData.Help_Text_Label__c.value,
                content: currentData.Help_Text_Content__c.value
            };
        } else if (error) {
            window.console.log('error ====> ' + JSON.stringify(error));
        }
    }

    handleOpen() {
        if (this.sectionClass === 'slds-accordion__section slds-is-open') {
            this.sectionClass = 'slds-accordion__section';
            this.sectionIconName = 'utility:chevronright';
            this.isExpanded = false;
            this.isHidden = true;
        } else {
            this.sectionClass = 'slds-accordion__section slds-is-open';
            this.sectionIconName = 'utility:chevrondown';
            this.isExpanded = true;
            this.isHidden = false;
        }
    }

    get backgroundStyle() {
        return `background-color: ${this.backgroundColor}`;
    }

    get iconStyle() {
        return `--sds-c-icon-color-foreground-default: ${this.iconColor}`;
    }
}
