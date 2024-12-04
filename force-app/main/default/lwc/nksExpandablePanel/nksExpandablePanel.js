import { LightningElement, api, track } from 'lwc';

export default class NksExpandablePanel extends LightningElement {
    @api title = 'Expandable Section';
    @api sldsSize = '';
    @api isFirst = false;
    @api chevronLeft = false; // Changes between the "detail" and "communication" styles
    @track isExpanded = false;

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    get containerStyle() {
        return `${this.sldsSize} panel-background` + (this.chevronLeft ? ' panel-background-bottom-border' : '');
    }

    get panelHeaderStyle() {
        return (
            'panel-header' +
            (this.chevronLeft
                ? ' panel-header-padding-medium'
                : ' panel-header-space-between panel-divider panel-header-padding-medium panel-header-min-height') +
            (this.isFirst ? ' panel-header-first' : '')
        );
    }

    get chevronClass() {
        return (
            'slds-icon slds-icon-text-default slds-icon_small custom-chevron' +
            (this.isExpanded ? ' rotate-chevron' : '')
        );
    }

    get panelBodyClass() {
        return 'panel-body' + (this.chevronLeft ? ' panel-body-left panel-body-small' : ' panel-body-medium');
    }

    get cardBorderClass() {
        return this.chevronLeft ? '' : 'card-border';
    }

    get showSubtitle() {
        return !this.chevronLeft && !this.isExpanded;
    }
}
