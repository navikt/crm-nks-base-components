import { LightningElement, api } from 'lwc';

export default class NksKnowledgeHelpText extends LightningElement {
    @api label;
    @api helpText;
    @api backgroundColor = '#ccf1d6';
    @api iconColor = '#06893a';

    sectionClass = 'slds-accordion__section';
    sectionIconName = 'utility:chevronright';
    isExpanded = true;
    isHidden = false;

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
