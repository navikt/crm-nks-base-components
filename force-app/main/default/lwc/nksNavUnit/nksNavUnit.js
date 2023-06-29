import { LightningElement, api, track, wire } from 'lwc';
import getContactInformation from '@salesforce/apex/NKS_NavUnitSingleController.getContactInformation';
export default class NksNavUnit extends LightningElement {
    @api navUnit; // The nav unit
    @api contactInformation; // The contact information of the NAV Unit
    @api contactInformationV2; // Contact information from V2 of the api (more organized)
    @api allSectionsOpenOnLoad = false; // If all sections should be open when the component loads
    @api numCols = 2; // Number of columns for the displayed fields
    @track activeSections = []; // The active sections on component load

    connectedCallback() {
        if ('true' === this.allSectionsOpenOnLoad || true === this.allSectionsOpenOnLoad) {
            this.activeSections = ['UNIT_SERVICES', 'CONTACT_DETAILS'];
        }
    }

    get columnWidth() {
        return 12 / this.numCols;
    }

    get nice() {
        return this.contactInformationV2?.brukerkontakt?.brukertjenesteTilbud?.tjenester;
    }

    get nice2() {
        return this.contactInformationV2?.brukerkontakt?.brukertjenesteTilbud?.ytterligereInformasjon;
    }

    get nice3() {
        return this.contactInformationV2?.brukerkontakt?.sosialhjelp?.papirsoeknadInformasjon;
    }

    get nice4() {
        return this.contactInformationV2?.brukerkontakt?.informasjonUtbetalinger;
    }

    get nice5() {
        if (
            this.contactInformationV2?.brukerkontakt?.sosialhjelp?.digitaleSoeknader == null ||
            this.contactInformationV2?.brukerkontakt?.sosialhjelp?.digitaleSoeknader.length === 0
        )
            return null;
        return this.contactInformationV2?.brukerkontakt?.sosialhjelp?.digitaleSoeknader;
    }
}
