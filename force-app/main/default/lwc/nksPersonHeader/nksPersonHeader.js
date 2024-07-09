import { LightningElement, api, wire } from 'lwc';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import FULL_NAME_FIELD from '@salesforce/schema/Person__c.CRM_FullName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import PERSON_ACTORID_FIELD from '@salesforce/schema/Person__c.INT_ActorId__c';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import AGE_FIELD from '@salesforce/schema/Person__c.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/Person__c.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/Person__c.INT_MaritalStatus__c';
import WRITTEN_STANDARD_FIELD from '@salesforce/schema/Person__c.INT_KrrWrittenStandard__c';
import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';
import getHistorikk from '@salesforce/apex/NKS_HistorikkViewController.getHistorikk';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getNavLinks from '@salesforce/apex/NKS_NavUnitLinks.getNavLinks';
import getVeilederName from '@salesforce/apex/NKS_AktivitetsplanController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { resolve } from 'c/nksComponentsUtils';

export default class NksPersonHeader extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;
    @api showPersonBadges = false;
    @api leftAlignBadges = false;
    @api showExtraInfo = false;
    personId;
    fullName;
    personIdent;
    veilederIdent;
    actorId;
    gender;
    age;
    citizenship;
    maritalStatus;
    wireFields;
    navUnit;
    formattedUnitLink;
    writtenStandard;

    @api btnClick = false;
    @api btnShowFullmakt = false;
    @api fullmaktHistData;
    @api condition1; //deprecated
    @api condition2; //deprecated

    customclass = 'grey-icon';
    veilederName;

    connectedCallback() {
        this.wireFields = [this.objectApiName + '.Id'];
    }

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
            console.log('Error occurred: ', JSON.stringify(error, null, 2));
        }
    }

    get genderIcon() {
        switch (this.gender) {
            case 'Mann':
                return 'MaleFilled';
            case 'Kvinne':
                return 'FemaleFilled';
            default:
        }
        return 'NeutralFilled';
    }

    get genderIconSrc() {
        return NAV_ICONS + '/' + this.genderIcon + '.svg#' + this.genderIcon;
    }

    get genderIconClass() {
        return this.genderIcon;
    }

    get formattedUnit() {
        return this.navUnit ? `${this.navUnit.enhetNr} ${this.navUnit.navn}` : '';
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

    get formattedVeilder() {
        return 'Veileder: ' + this.veilederName + (this.veilederIdent ? '(' + this.veilederIdent + ')' : '');
    }

    get showNavUnit() {
        return this.showExtraInfo && this.formattedUnit;
    }

    get formattedPersonInfo() {
        return [this.age, this.citizenship, this.maritalStatus].filter((x) => x != null).join(' / ');
    }

    get formattedWrittenStandard() {
        if (this.writtenStandard) {
            const standard =
                this.writtenStandard.toLowerCase() === 'nb'
                    ? 'Bokmål'
                    : this.writtenStandard.toLowerCase() === 'nn'
                    ? 'Nynorsk'
                    : null;
            return standard ? 'Målform: ' + standard : null;
        }
        return null;
    }

    get showVeilederName() {
        return this.showExtraInfo && this.veilederName;
    }

    get badgeClass() {
        return (this.leftAlignBadges ? '' : 'slds-grow ') + 'slds-var-p-right_small';
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

    showCopyToast(status) {
        const evt = new ShowToastEvent({
            message: status === 'success' ? 'kopiert til utklippstavlen.' : 'Kunne ikke kopiere',
            variant: status,
            mode: 'pester'
        });
        this.dispatchEvent(evt);
    }

    getRelatedRecordId(relationshipField, objectApiName) {
        getRelatedRecord({
            parentId: this.recordId,
            relationshipField: relationshipField,
            objectApiName: objectApiName
        })
            .then((record) => {
                this.personId = resolve(relationshipField, record);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    @wire(getRecord, {
        recordId: '$personId',
        fields: [
            FULL_NAME_FIELD,
            PERSON_IDENT_FIELD,
            PERSON_ACTORID_FIELD,
            GENDER_FIELD,
            AGE_FIELD,
            CITIZENSHIP_FIELD,
            MARITAL_STATUS_FIELD,
            WRITTEN_STANDARD_FIELD
        ]
    })
    wiredPersonInfo({ error, data }) {
        if (data) {
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.age = getFieldValue(data, AGE_FIELD);
            this.writtenStandard = getFieldValue(data, WRITTEN_STANDARD_FIELD);
            let __citizenship = getFieldValue(data, CITIZENSHIP_FIELD);
            if (__citizenship != null && typeof __citizenship === 'string') {
                this.citizenship = this.capitalizeFirstLetter(__citizenship.toLowerCase());
            } else {
                this.citizenship = '';
            }

            let __maritalStatus = getFieldValue(data, MARITAL_STATUS_FIELD);
            if (__maritalStatus != null && typeof __maritalStatus === 'string') {
                this.maritalStatus = __maritalStatus
                    .toLowerCase()
                    .replace(/_/g, ' ')
                    .replace(' eller enkemann', '/-mann');
                this.maritalStatus = this.capitalizeFirstLetter(__maritalStatus.toLowerCase());
            } else {
                this.maritalStatus = '';
            }
        }
        if (error) {
            console.log(error);
        }
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$wireFields'
    })
    wiredRecordInfo({ error, data }) {
        if (data) {
            if (this.relationshipField && this.objectApiName) {
                this.getRelatedRecordId(this.relationshipField, this.objectApiName);
            }
        }
        if (error) {
            console.log(error);
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
        }
        if (error) {
            console.log(`error: ${error}`);
        }
    }

    /*
     * To change the button color on click
     */
    handleFullmaktData() {
        if (!this.btnClick) {
            this.btnClick = true;
            this.customclass = 'blue-icon';
        } else if (this.btnClick) {
            this.btnClick = false;
            this.customclass = 'grey-icon';
        }
    }

    @wire(getHistorikk, {
        recordId: '$recordId',
        objectApiName: '$objectApiName'
    })
    wiredHistorikk({ error, data }) {
        if (data) {
            this.fullmaktHistData = data;
            this.btnShowFullmakt = this.fullmaktHistData.length > 0;
        }
        if (error) {
            console.log(error);
        }
    }

    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
