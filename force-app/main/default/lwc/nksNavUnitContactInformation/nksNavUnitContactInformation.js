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
        this._contactInformation = value || null;
        this.hasContactInformation = !!value;

        const publikumsmottak = value?.brukerkontakt?.publikumsmottak ?? [];
        this._visitorLocations = publikumsmottak;
        this._visitorLocationsLength = publikumsmottak.length;
        this.hasVisitorLocations = publikumsmottak.length > 0;
    }

    get contactInformation() {
        return this._contactInformation;
    }

    get columnWidth() {
        return 12 / this.numCols;
    }

    get visitorLocations() {
        return this._visitorLocations;
    }

    get postalAddress() {
        return this.contactInformation?.postadresse?.concatenatedAddress || '';
    }

    get visitingAddress() {
        return this.contactInformation?.besoeksadresse?.concatenatedAddress || '';
    }
}
