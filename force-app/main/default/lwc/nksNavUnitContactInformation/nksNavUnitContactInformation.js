import { LightningElement, api } from 'lwc';

export default class NksNavUnitContactInformation extends LightningElement {
    @api numCols = 2;

     _contactInformation;
     _visitorLocations = [];
    _visitorLocationsLength = 0;
    hasContactInformation = false;
    hasVisitorLocations = false;

    @api
    set contactInformation(value) {
        if (value) {
            this._contactInformation = value;
            this.hasContactInformation = true;

            const publikumsmottak = value.brukerkontakt?.publikumsmottak ?? [];
            if (publikumsmottak.length) {
                this.hasVisitorLocations = true;
                this._visitorLocations = publikumsmottak;
                this._visitorLocationsLength = publikumsmottak.length;
            }
        }
    }

    render() {
        return this.useNewDesign ? nksNavUnitContactInformationV2HTML : nksNavUnitContactInformationHTML;
    }

    get columnWidth() {
        return 12 / this.numCols;
    }

    //get hasContactInformation() { return this._contactInformation ? true : false; }
    get contactInformation() {
        return this._contactInformation;
    }

    //get hasVisitorLocations() { return 0 < this._visitorLocationsLength; }
    get visitorLocations() {
        return this._visitorLocations;
    }

    get postalAddress() {
        const address = this.contactInformation.postadresse;
        if (!address) return '';

        const { postboksnummer, postnummer, poststed } = address;

        return `Postboks ${postboksnummer}, ${postnummer} ${poststed}`;
    }

    get visitingAddress() {
        const address = this.contactInformation.besoeksadresse;
        if (!address) return '';

        const { gatenavn, husnummer, postnummer, poststed } = address;

        return `${gatenavn} ${husnummer}, ${postnummer} ${poststed}`;
    }
}
