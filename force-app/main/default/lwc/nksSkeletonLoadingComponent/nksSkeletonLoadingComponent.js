import { LightningElement, api } from 'lwc';
import personHighlightPanel from './personHighlightPanel.html';

export default class SkeletonLoadingComponent extends LightningElement {
    @api personId = '123'; // Default to true, will be overwritten once parent is done with wires

    render() {
        return personHighlightPanel;
    }

    get isPersonIdSet() {
        console.log(this.personId);
        return this.personId !== null;
    }
}

// INFO: This component is shown until parent has set personid from wires
// TODO: Set color and correct height according to highlightpanel (height is off atm)
