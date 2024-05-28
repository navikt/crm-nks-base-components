import { LightningElement, api } from 'lwc';

export default class NksPersonHighlightPanelMid extends LightningElement {
    @api gender;

    get midPanelStyling() { // TODO: Test this - Need .toLowerCase()?
        return this.gender === 'female' ? 'panel-dark-purple' : 'panel-dark-blue';
    }
}
