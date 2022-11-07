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
    // the above tag-list is duplicated below, in .js-meta.xml, and in .html

    connectedCallback() {
        switch(this.tag) {
            case 'h1': this.h1tag = true; break;
            case 'h2': this.h2tag = true; break;
            case 'h3': this.h3tag = true; break;
            case 'h4': this.h4tag = true; break;
            case 'h5': this.h5tag = true; break;
            case 'h6': this.h6tag = true; break;
            default:
                throw new Error(`Tag not allowed here: <${this.tag}>`);
                break;
        }
    }
}
