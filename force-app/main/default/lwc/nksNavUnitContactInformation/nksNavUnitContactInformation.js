import { LightningElement, api, track } from 'lwc';

export default class NksNavUnitContactInformation extends LightningElement {
    @api numCols = 2;
    @track _contactInformation;
    @track _contactInformationV2;
    @track _visitorLocations = [];
    @track _visitorChannels;
    _visitorLocationsLength = 0;
    hasContactInformation = false;
    hasVisitorLocations = false;
    hasVisitorChannels = false;

    @api
    set contactInformation(value) {
        if (value) {
            this._contactInformation = value;
            this.hasContactInformation = true;

            if (value.publikumsmottak && value.publikumsmottak.length) {
                this.hasVisitorLocations = true;
                this._visitorLocations = value.publikumsmottak;
                this._visitorLocationsLength = value.publikumsmottak.length;
            }
        }
    }

    @api
    set contactInformationV2(value) {
        if (value) {
            this._contactInformation = value;
            if (value.brukerkontakt.publikumskanaler && value.brukerkontakt.publikumskanaler.length) {
                this.hasVisitorChannels = true;
                this._visitorChannels = value.brukerkontakt.publikumskanaler;
            }
        }
    }

    get columnWidth() {
        return 12 / this.numCols;
    }

    //get hasContactInformation() { return this._contactInformation ? true : false; }
    get contactInformation() {
        return this._contactInformation;
    }

    get contactInformationV2() {
        return this._contactInformationV2;
    }

    //get hasVisitorLocations() { return 0 < this._visitorLocationsLength; }
    get visitorLocations() {
        return this._visitorLocations;
    }

    get visitorChannels() {
        return this._visitorChannels;
    }

    get postalAddress() {
        return this.contactInformation.postadresse ? this.contactInformation.postadresse.concatenatedAddress : '';
    }

    get visitingAddress() {
        return this.contactInformation.besoeksadresse ? this.contactInformation.besoeksadresse.concatenatedAddress : '';
    }
}
