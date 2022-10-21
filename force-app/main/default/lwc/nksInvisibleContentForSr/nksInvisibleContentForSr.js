import { LightningElement, api } from 'lwc';

export default class NksInvisibleContentForSr extends LightningElement {
    @api tag;
    @api text;
    h1tag = false;
    h2tag = false;
    h3tag = false;
    h4tag = false;
    h5tag = false;
    h6tag = false;

    connectedCallback() {
        if(this.tag == 'h1') this.h1tag = true;
        else if(this.tag == 'h2') this.h2tag = true;
        else if(this.tag == 'h3') this.h3tag = true;
        else if(this.tag == 'h4') this.h4tag = true;
        else if(this.tag == 'h5') this.h5tag = true;
        else if(this.tag == 'h6') this.h6tag = true;
        else {
            throw new Error(`Tag not allowed here: <${this.tag}>`);
        }
    }
}
