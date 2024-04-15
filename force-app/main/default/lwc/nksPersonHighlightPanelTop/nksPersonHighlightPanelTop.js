import { LightningElement, api } from 'lwc';

export default class NksPersonHighlightPanelTop extends LightningElement {
    @api personInfo;
    @api badges;
    openBaba;

    connectedCallback() {
        console.log(`this.personInfo: ${JSON.stringify(this.personInfo)}`);
    }
    renderedCallback() {
        console.log(`this.personInfo: ${JSON.stringify(this.personInfo)}`);
    }

    geirArne() {
        this.openBaba = !this.openBaba;
    }
}
