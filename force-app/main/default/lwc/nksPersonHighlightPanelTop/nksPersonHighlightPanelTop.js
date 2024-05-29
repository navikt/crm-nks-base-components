import { LightningElement, api, wire } from 'lwc';
import PERSON_ACTORID_FIELD from '@salesforce/schema/Person__c.INT_ActorId__c';
import FULL_NAME_FIELD from '@salesforce/schema/Person__c.CRM_FullName__c';
import PERSON_FIRST_NAME from '@salesforce/schema/Person__c.INT_FirstName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import AGE_FIELD from '@salesforce/schema/Person__c.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/Person__c.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/Person__c.INT_MaritalStatus__c';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getNavLinks from '@salesforce/apex/NKS_NavUnitLinks.getNavLinks';

export const PERSON_FIELDS = [FULL_NAME_FIELD, PERSON_IDENT_FIELD, PERSON_ACTORID_FIELD, GENDER_FIELD, AGE_FIELD, CITIZENSHIP_FIELD, MARITAL_STATUS_FIELD];


export default class NksPersonHighlightPanelTop extends LightningElement {
    @api veilederName;
    @api veilederIdent;
    @api personId;
    @api objectApiName;

    personIdent;
    fullName;
    citizenship;
    navUnit;
    gender;
    age;
    maritalStatus;
    wireFields;


    connectedCallback() {
        this.wireFields = [this.objectApiName + '.Id'];
    }


    @wire(getRecord, {
        recordId: '$personId',
        fields: PERSON_FIELDS
    })
    wiredPersonInfo({ error, data }) {
        if (data) {
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.age = getFieldValue(data, AGE_FIELD);

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
        } else {
            console.log('there is no data noob');
        }
        if (error) {
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
        console.log('Yoyo navUnit');
        if (data) {
            console.log('Yoyo navUnit hadde data');
            this.navUnit = data.unit ? `${data.unit.enhetNr} ${data.unit.navn}` : '';
            //this.updatePersonInfo('navUnitName', data.unit ? `${data.unit.enhetNr} ${data.unit.navn}` : '');
            this.getFormattedLink();
        } else {
            console.log('no navUnit data noob');
        }

        if (error) {
            console.log(`error: ${error}`);
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

    updatePersonInfo(field, value) {
        console.log('update personInfo Triggered');
        if (value == null && Object.keys(this.personInfo).includes(field)) return;
        this.personInfo = { ...this.personInfo, [field]: value };
        console.log('person from higlightpanel: ');
        console.log(this.personInfo);
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
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    get formattedVeileder() {
        console.log('Veileder navn: ' + this.veilederName)
        return 'Veileder: ' + this.veilederName + (this.veilederIdent ? '(' + this.veilederIdent + ')' : '');
    }
    get formattedUnit() {
        return this.navUnit ? `${this.navUnit.enhetNr} ${this.navUnit.navn}` : '';
    }

    get genderIcon() {
        switch (this.gender) {
            case 'Mann':
                return 'MaleCircleFilled';
            case 'Kvinne':
                return 'FemaleCircleFilled';
            default:
        }
        return 'NeutralFilled';
    }

    get genderIconSrc() {
        let returnvalue = NAV_ICONS + '/' + this.genderIcon + '.svg#' + this.genderIcon;
        return returnvalue;

    }

    get genderIconClass() {
        return this.genderIcon;
    }
}
