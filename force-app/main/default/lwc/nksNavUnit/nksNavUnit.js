import { LightningElement, api, track } from 'lwc';
import nksNavUnitHTML from './nksNavUnit.html';
import nksNavUnitV2HTML from './nksNavUnitV2.html';
export default class NksNavUnit extends LightningElement {
    @api navUnit; // The nav unit
    @api contactInformation; // The contact information of the NAV Unit
    @api contactInformationV2; // Contact information from V2 of the api (more organized)
    @api allSectionsOpenOnLoad = false; // If all sections should be open when the component loads
    @api numCols = 2; // Number of columns for the displayed fields
    @api useNewDesign = false;

    @track activeSections = []; // The active sections on component load

    render() {
        return this.useNewDesign ? nksNavUnitV2HTML : nksNavUnitHTML;
    }

    connectedCallback() {
        if (this.allSectionsOpenOnLoad === 'true' || this.allSectionsOpenOnLoad === true) {
            this.activeSections = ['UNIT_SERVICES', 'CONTACT_DETAILS'];
        }
    }

    get columnWidth() {
        return 12 / this.numCols;
    }

    get tjenester() {
        const tjenester = this.contactInformationV2?.brukerkontakt?.brukertjenesteTilbud?.tjenester;
        if (tjenester == null || tjenester.length === 0) return null;
        return tjenester;
    }

    get ytterligereInformasjon() {
        return this.contactInformationV2?.brukerkontakt?.brukertjenesteTilbud?.ytterligereInformasjon;
    }

    get papirsoeknadInformasjon() {
        const papirsoeknadInformasjon = this.contactInformationV2?.brukerkontakt?.sosialhjelp?.papirsoeknadInformasjon;
        if (papirsoeknadInformasjon == null) return 'Ingen informasjon';
        return papirsoeknadInformasjon;
    }

    get informasjonUtbetalinger() {
        const informasjonUtbetalinger = this.contactInformationV2?.brukerkontakt?.informasjonUtbetalinger;
        if (informasjonUtbetalinger == null) return 'Ingen informasjon';
        return informasjonUtbetalinger;
    }

    get digitaleSoeknader() {
        const digitaleSoeknader = this.contactInformationV2?.brukerkontakt?.sosialhjelp?.digitaleSoeknader;
        if (digitaleSoeknader == null || digitaleSoeknader.length === 0) return null;
        return digitaleSoeknader;
    }

    get publikumskanaler() {
        const publikumskanaler = this.contactInformationV2?.brukerkontakt?.publikumskanaler?.filter(
            (kanal) => kanal.telefon != null && kanal.telefon !== ''
        );
        if (publikumskanaler == null || publikumskanaler.length === 0) return null;
        return publikumskanaler;
    }

    get getUnitNameAndNumber() {
        return this.navUnit.enhetNr + ' ' + this.navUnit.navn;
    }
}
