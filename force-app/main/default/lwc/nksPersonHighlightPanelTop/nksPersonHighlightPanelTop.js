import { LightningElement, api, wire } from 'lwc';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import PERSON_ACTORID_FIELD from '@salesforce/schema/Person__c.INT_ActorId__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import AGE_FIELD from '@salesforce/schema/Person__c.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/Person__c.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/Person__c.INT_MaritalStatus__c';
import WRITTEN_STANDARD_FIELD from '@salesforce/schema/Person__c.INT_KrrWrittenStandard__c';
import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';

import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getNavLinks from '@salesforce/apex/NKS_NavUnitLinks.getNavLinks';
import getVeilederName from '@salesforce/apex/NKS_AktivitetsplanController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';

const PERSON_FIELDS = [
    PERSON_IDENT_FIELD,
    PERSON_ACTORID_FIELD,
    AGE_FIELD,
    CITIZENSHIP_FIELD,
    MARITAL_STATUS_FIELD,
    WRITTEN_STANDARD_FIELD
];
export default class NksPersonHighlightPanelTop extends LightningElement {
    @api personId;
    @api objectApiName;
    @api recordId;
    @api relationshipField;
    @api gender;
    @api isDeceased;
    @api fullName;

    personIdent;
    citizenship;
    navUnit;
    age;
    maritalStatus;
    formattedUnitLink;
    veilederIdent;
    veilederName;
    actorId;
    writtenStandard;

    @wire(getVeilederIdent, { actorId: '$actorId' })
    wireVeilIdentInfo({ data, error }) {
        if (data) {
            this.veilederIdent = data.primaerVeileder;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getVeilederName, { navIdent: '$veilederIdent' })
    wiredName({ data, error }) {
        if (data) {
            this.veilederName = data;
        } else if (error) {
            console.error('Error occurred: ', JSON.stringify(error, null, 2));
        }
    }

    @wire(getRecord, {
        recordId: '$personId',
        fields: PERSON_FIELDS
    })
    wiredPersonInfo({ error, data }) {
        if (data) {
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.age = getFieldValue(data, AGE_FIELD);
            this.writtenStandard = getFieldValue(data, WRITTEN_STANDARD_FIELD);
            this.citizenship = this.capitalizeFirstLetter(getFieldValue(data, CITIZENSHIP_FIELD));
            this.maritalStatus = this.capitalizeFirstLetter(
                this.formatMaritalStatus(getFieldValue(data, MARITAL_STATUS_FIELD))
            );
        } else if (error) {
            console.error(error);
        }
    }

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
            console.error(`error: ${error}`);
        }
    }

    async getFormattedLink() {
        if (this.navUnit) {
            const link = await getNavLinks().then((list) => {
                const onlineCheck = list.find((unit) => unit.enhetNr === this.navUnit.unitNr);
                if (onlineCheck !== undefined) return 'https://www.nav.no' + onlineCheck.path;
                return (
                    'https://www.nav.no/kontor/' +
                    this.navUnit.navn
                        .replace(/\.\s/g, '.')
                        .replace(/[\s/]/g, '-')
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                );
            });
            this.formattedUnitLink = link;
        }
    }

    handleCopy(event) {
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

    capitalizeFirstLetter(str) {
        if (str == null || typeof str !== 'string') {
            return '';
        }
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    formatMaritalStatus(str) {
        if (typeof str !== 'string') {
            return str;
        }
        return str.replace(/_/g, ' ').replace(' eller enkemann', '/-mann');
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
        return [this.age, this.citizenship, this.maritalStatus].filter((x) => x != null).join(' / ');
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
        if (!this.fullName) {
            return 'Skjermet';
        }
        return this.isDeceased ? this.fullName + ' (død)' : this.fullName;
    }

    get formattedWrittenStandard() {
        if (!this.writtenStandard) {
            return null;
        }

        const standardMap = {
            nb: 'Bokmål',
            nn: 'Nynorsk'
        };

        const standard = standardMap.get(this.writtenStandard.toLowerCase());
        return standard ? 'Målform: ' + standard : null;
    }

    get genderIcon() {
        switch (this.gender) {
            case 'Mann':
                return 'MaleCircleFilled';
            case 'Kvinne':
                return 'FemaleCircleFilled';
            default:
                return 'UnknownCircleFilled';
        }
    }

    get genderIconSrc() {
        return NAV_ICONS + '/' + this.genderIcon + '.svg#' + this.genderIcon;
    }
}
