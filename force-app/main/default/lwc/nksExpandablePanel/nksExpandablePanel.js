import { LightningElement, api, track } from 'lwc';

export default class NksExpandablePanel extends LightningElement {
    @api title = 'Expandable Section';
    @api sldsSize;
    @api isFirst = false;
    @api chevronLeft = false;
    @track isExpanded = false;

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    get containerStyle() {
        return this.sldsSize + ' panel-background';
    }

    get panelHeaderStyle() {
        return (
            'panel-header' +
            (this.chevronLeft ? '' : ' panel-header-space-between') +
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
        return 'panel-body' + (this.chevronLeft ? ' panel-body-left' : '');
    }
}
