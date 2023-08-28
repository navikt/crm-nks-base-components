import { LightningElement, api } from 'lwc';

export default class NksVisitorChannel extends LightningElement {
    @api channel;
    @api columnWidth;

    get channelContent() {
        return this.channel.telefon ? this.channel.telefon.replace(/\s/g, '') : this.channel.epost;
    }
}
