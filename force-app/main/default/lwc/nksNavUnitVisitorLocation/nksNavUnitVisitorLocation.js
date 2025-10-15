import { LightningElement, api } from 'lwc';
export default class NksNavUnitVisitorLocation extends LightningElement {
    @api location;

    get visitingAddress() {
        const address = this.location.besoeksadresse;
        if (!address) return '';

        const { gatenavn, husnummer, postnummer, poststed } = address;

        return `${gatenavn} ${husnummer}, ${postnummer} ${poststed}`;
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
