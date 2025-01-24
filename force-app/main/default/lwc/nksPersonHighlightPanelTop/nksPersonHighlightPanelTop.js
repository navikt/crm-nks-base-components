import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getNavLinks from '@salesforce/apex/NKS_NavUnitLinks.getNavLinks';
export default class NksPersonHighlightPanelTop extends LightningElement {
    @api personDetails;
    @api objectApiName;
    @api recordId;
    @api veilederName;
    @api veilederIdent;
    @api relationshipField;

    navUnit;
    formattedUnitLink;

    @wire(getNavUnit, {
        field: '$relationshipField',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId',
        type: 'PERSON_LOCATION'
    })
    wiredData(result) {
        const { data, error } = result;
        if (data) {
            this.navUnit = data.unit;
            this.getFormattedLink();
        } else if (error) {
            console.error(`Error retrieving nav unit: ${error}`);
        }
    }

    getFormattedLink() {
        if (!this.navUnit) {
            return;
        }
        getNavLinks().then((list) => {
            const onlineCheck = list.find((unit) => unit.enhetNr === this.navUnit.unitNr);
            if (onlineCheck) {
                this.formattedUnitLink = 'https://www.nav.no' + onlineCheck.path;
                return;
            }
            this.formattedUnitLink = `https://www.nav.no/kontor/${this.navUnit.navn
                .replace(/\.\s/g, '.')
                .replace(/[\s/]/g, '-')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')}`;
        });
    }

    handleCopy(event) {
        // fjernes?
        const hiddenInput = document.createElement('input');
        const eventValue = event.currentTarget.value;
        hiddenInput.value = eventValue;
        document.body.appendChild(hiddenInput);
        hiddenInput.focus();
        hiddenInput.select();
        try {
            // eslint-disable-next-line @locker/locker/distorted-document-exec-command
            const successful = document.execCommand('copy');
            if (!successful) this.showCopyToast('error');
        } catch (error) {
            this.showCopyToast('error');
        }
        document.body.removeChild(hiddenInput);
        event.currentTarget.focus();
    }

    showCopyToast(status) {
        const evt = new ShowToastEvent({
            message: status === 'success' ? 'kopiert til utklippstavlen.' : 'Kunne ikke kopiere',
            variant: status,
            mode: 'pester'
        });
        this.dispatchEvent(evt);
    }

    get formattedPersonInfo() {
        const validLegalStatuses = ['Bosatt', 'Ikke Bosatt', 'Utflyttet'];
        return [
            this.personDetails?.age,
            this.personDetails?.citizenship,
            this.personDetails?.maritalStatus,
            validLegalStatuses.includes(this.personDetails?.legalStatus) ? this.personDetails.legalStatus : null
        ]
            .filter((x) => x != null)
            .join(' / ');
    }

    get formattedVeileder() {
        if (!this.veilederName) {
            return undefined;
        }
        let veilederInfo = 'Veileder: ' + this.veilederName;
        if (this.veilederIdent) {
            veilederInfo += ' (' + this.veilederIdent + ')';
        }
        return veilederInfo;
    }

    get formattedUnit() {
        return this.navUnit ? this.navUnit.enhetNr + ' ' + this.navUnit.navn : '';
    }

    get formattedFullName() {
        if (!this.personDetails?.fullName) {
            return 'Skjermet person';
        }
        return this.personDetails?.isDeceased ? this.personDetails?.fullName + ' (død)' : this.personDetails?.fullName;
    }

    get formattedWrittenStandard() {
        if (!this.personDetails?.writtenStandard) {
            return null;
        }

        const standardMap = {
            nb: 'Bokmål',
            nn: 'Nynorsk'
        };

        const standard = standardMap[this.personDetails?.writtenStandard.toLowerCase()];
        return standard ? 'Målform: ' + standard : null;
    }

    get genderIcon() {
        if (!this.personDetails?.fullName) return 'confidentialCircleFilled';
        switch (this.personDetails?.gender) {
            case 'Mann':
                return 'MaleCircleFilled';
            case 'Kvinne':
                return 'FemaleCircleFilled';
            default:
                return 'UnknownCircleFilled';
        }
    }

    get genderText() {
        if (this.personDetails?.gender === 'Ukjent') return 'Ukjent kjønn';
        return this.personDetails?.gender;
    }

    get genderIconSrc() {
        return NAV_ICONS + '/' + this.genderIcon + '.svg#' + this.genderIcon;
    }

    get personIdent() {
        return this.personDetails?.personIdent;
    }
}
