import { LightningElement, api } from 'lwc';
export default class NksNavUnitVisitorLocation extends LightningElement {
    @api location;

    get visitingAddress() {
        return this.location?.besoeksadresse?.concatenatedAddress || '';
    }

    get locationName() {
        return this.location.stedsbeskrivelse;
    }

    get hasOpeningHours() {
        return this.location.aapningstider && 0 < this.location.aapningstider.length;
    }

    get openingHours() {
        return this.location.aapningstider;
    }
}
