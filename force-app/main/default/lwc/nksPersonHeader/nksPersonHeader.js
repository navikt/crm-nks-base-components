import { LightningElement, api, wire, track } from 'lwc';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import FULL_NAME_FIELD from '@salesforce/schema/Person__c.CRM_FullName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import AGE_FIELD from '@salesforce/schema/Person__c.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/Person__c.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/Person__c.INT_MaritalStatus__c';
import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';
import getHistorikk from '@salesforce/apex/NKS_HistorikkViewController.getHistorikk';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NksPersonHeader extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;
    @api showPersonBadges = false;
    @api condition1; //deprecated
    @api condition2; //deprecated
    personId;
    fullName;
    personIdent;
    gender;
    age;
    citizenship;
    maritalStatus;
    wireFields;
    @api btnClick = false;
    @api btnShowFullmakt = false;
    @api fullmaktHistData;
    @track customclass = 'grey-icon';
    navUnit;

    connectedCallback() {
        this.wireFields = [this.objectApiName + '.Id'];
    }

    get showNotifications() {
        return this.notifications.length > 0;
    }

    get showErrors() {
        return this.errorMessages.length > 0;
    }

    get genderIcon() {
        switch (this.gender) {
            case 'Mann':
                return 'MaleFilled';
            case 'Kvinne':
                return 'FemaleFilled';
        }
        return 'NeutralFilled';
    }

    get genderIconSrc() {
        return NAV_ICONS + '/' + this.genderIcon + '.svg#' + this.genderIcon;
    }

    get genderIconClass() {
        return this.genderIcon;
    }

    get check1() {
        if (this.age && (this.citizenship || this.maritalStatus)) return true;
    }

    get check2() {
        if (this.citizenship && this.maritalStatus) return true;
    }

    handleCopy(event) {
        const hiddenInput = document.createElement('input');
        const eventValue = event.currentTarget.value;
        hiddenInput.value = eventValue;
        document.body.appendChild(hiddenInput);
        hiddenInput.focus();
        hiddenInput.select();
        try {
            const successful = document.execCommand('copy');
            this.showCopyToast(successful ? 'success' : 'error');
        } catch (error) {
            this.showCopyToast('error');
        }

        document.body.removeChild(hiddenInput);
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
                this.personId = this.resolve(relationshipField, record);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    @wire(getRecord, {
        recordId: '$personId',
        fields: [FULL_NAME_FIELD, PERSON_IDENT_FIELD, GENDER_FIELD, AGE_FIELD, CITIZENSHIP_FIELD, MARITAL_STATUS_FIELD]
    })
    wiredPersonInfo({ error, data }) {
        if (data) {
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.age = getFieldValue(data, AGE_FIELD);
            let __citizenship = getFieldValue(data, CITIZENSHIP_FIELD).toLowerCase();
            this.citizenship = __citizenship.charAt(0).toUpperCase() + __citizenship.slice(1);
            let __maritalStatus = getFieldValue(data, MARITAL_STATUS_FIELD)
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(' eller enkemann', '/-mann');
            this.maritalStatus = __maritalStatus.charAt(0).toUpperCase() + __maritalStatus.slice(1);
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
        }
        if (error) {
            console.log(`error: ${error}`);
        }
    }

    get testUnit() {
        return this.navUnit ? `${this.navUnit.enhetNr} ${this.navUnit.navn}` : '';
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

    /**
     * Retrieves the value from the given object's data path
     * @param {data path} path
     * @param {JS object} obj
     */
    resolve(path, obj) {
        return path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : null;
        }, obj || self);
    }
}
