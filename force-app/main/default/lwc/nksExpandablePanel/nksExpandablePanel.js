import { LightningElement, api, track } from 'lwc';

export default class NksExpandablePanel extends LightningElement {
    @api title = 'Expandable Section';
    @api sldsSize;
    @api isFirst = false;
    @track isExpanded = false;

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    get containerStyle() {
        return this.sldsSize + ' panel-background';
    }

    get arrowDirection() {
        return this.isExpanded
            ? 'M5.52307 14.8387L12.6192 7.67335C12.8269 7.46565 13.1731 7.46565 13.3808 7.67335L20.4769 14.8387C20.6846 15.0464 20.6846 15.3926 20.4769 15.6003L19.7154 16.3618C19.5077 16.5695 19.1615 16.5695 18.9538 16.3618L13.3808 10.7195C13.1731 10.5118 12.8269 10.5118 12.6192 10.7195L7.04615 16.3272C6.83846 16.5349 6.4923 16.5349 6.28461 16.3272L5.52307 15.5657C5.35 15.358 5.35 15.0464 5.52307 14.8387Z'
            : 'M20.4769 11.1613L13.3808 18.3267C13.1731 18.5343 12.8269 18.5343 12.6192 18.3267L5.52308 11.1613C5.31539 10.9536 5.31539 10.6074 5.52308 10.3997L6.28462 9.63819C6.49231 9.4305 6.83846 9.4305 7.04616 9.63819L12.6192 15.2805C12.8269 15.4882 13.1731 15.4882 13.3808 15.2805L18.9538 9.67281C19.1615 9.46511 19.5077 9.46511 19.7154 9.67281L20.4769 10.4343C20.65 10.642 20.65 10.9536 20.4769 11.1613Z';
    }

    get panelHeaderStyle() {
        return 'panel-header slds-p-horizontal_small' + (this.isFirst ? ' panel-header-first' : '');
    }
}
