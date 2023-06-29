import { LightningElement, api } from 'lwc';

export default class NksVisitorChannel extends LightningElement {
    @api channel;
    @api columnWidth;

    get channelContent() {
        console.log(`this.channel.telefon:`);
        console.log(this.channel.telefon);
        console.log(`this.channel.telefon.replace, ""):`);
        console.log(this.channel.telefon.replace(/\s/g, ''));
        return this.channel.telefon ? this.channel.telefon.replace(/\s/g, '') : this.channel.epost;
    }
}
