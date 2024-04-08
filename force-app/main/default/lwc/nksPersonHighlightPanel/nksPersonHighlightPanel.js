import { LightningElement, api } from 'lwc';

export default class NksPersonHighlightPanel extends LightningElement {
    @api recordId;
    @api objectApiName;
    connectedCallback() {
        console.log('Geir Arne');
    }
}
