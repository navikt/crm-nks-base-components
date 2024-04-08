import { LightningElement } from 'lwc';

export default class NksPersonHighlightPanelMid extends LightningElement {
    geirs = Array.from(Array(10), (_x, i) => {
        return {
            anre: 'Geri' + i
        };
    });

    connectedCallback() {}
}
