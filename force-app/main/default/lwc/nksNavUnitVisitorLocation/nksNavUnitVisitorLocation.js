import { LightningElement, api } from 'lwc';
import nksNavUnitVisitorLocationV2HTML from './nksNavUnitVisitorLocationV2.html';
import nksNavUnitVisitorLocationHTML from './nksNavUnitVisitorLocation.html';
export default class NksNavUnitVisitorLocation extends LightningElement {
    @api location;
    @api useNewDesign = false;

    render() {
        return this.useNewDesign ? nksNavUnitVisitorLocationV2HTML : nksNavUnitVisitorLocationHTML;
    }

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
