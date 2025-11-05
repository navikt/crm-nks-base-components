import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getContactInformation from '@salesforce/apex/NKS_NavUnitSingleController.getContactInformation';
import getContactInformationV2 from '@salesforce/apex/NKS_NavUnitSingleController.getContactInformationV2';
import boxLayoutHTML from './boxLayout.html';
import cardLayoutHTML from './cardLayout.html';
import noLayoutHTML from './noLayout.html';

export default class NksNavUnitSingle extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationField;
    @api type; // If based on person location or unit
    @api numCols = 2; // Number of columns for the displayed fields
    @api cardLayout = false; // If true, use the card layout, if not use box layout
    @api boxLayout = false;

    navUnit;
    contactInformation;
    contactInformationV2;
    unitNumber;
    wiredNavUnit;
    wiredContactInformation;
    wireFields;
    errorMessage;
    isError = false;
    isLoaded = false;
    noLayout = false;

    render() {
        if (this.cardLayout) {
            return cardLayoutHTML;
        }
        return this.boxLayout ? boxLayoutHTML : noLayoutHTML;
    }

    connectedCallback() {
        this.wireFields = [`${this.objectApiName}.Id`];

        if (!this.cardLayout && !this.boxLayout) {
            this.noLayout = true;
        }
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$wireFields'
    })
    wiredRecordInfo({ error, data }) {
        if (data) {
            if (this.wiredNavUnit?.data) {
                this.isLoaded = false;
                refreshApex(this.wiredNavUnit).then(() => {
                    this.setWiredNavUnit();
                });
            }
        }
        if (error) {
            this.handleError(error);
        }
    }

    get fancyError() {
        return JSON.stringify(this.errorMessage);
    }

    @wire(getNavUnit, {
        field: '$relationField',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId',
        type: '$type'
    })
    wiredGetNavUnit(value) {
        this.wiredNavUnit = value;
        this.setWiredNavUnit();
    }

    setWiredNavUnit() {
        const { data, error } = this.wiredNavUnit;
        if (data) {
            let newUnitNumber = data.unit?.enhetNr ? data.unit.enhetNr : null;
            this.unitNumber = newUnitNumber;
            this.isLoaded = this.unitNumber === newUnitNumber;
            this.isError = !data.success;
            this.navUnit = data.unit;
            this.appendErrorMessage(data.errorMessage);
        }
        if (error) {
            this.handleError(error);
        }
    }

    @wire(getContactInformation, { unitNumber: '$unitNumber' }) wiredGetContactInformation(res) {
        this.wiredContactInformation = res;
        this.setWiredContactInformation();
    }

    setWiredContactInformation() {
        const { data, error } = this.wiredContactInformation;
        if (data) {
            this.isError = !data.success;
            this.contactInformation = data.contactInformation;
            this.appendErrorMessage(data.errorMessage);
        } else if (error) {
            this.handleError(error);
        }

        getContactInformationV2({ unitNumber: this.unitNumber })
            .then((res) => {
                if (res) {
                    this.contactInformationV2 = res.contactInformation;
                    this.appendErrorMessage(res.errorMessage);
                    this.isError = this.isError || !res.success;
                }
                this.isLoaded = true;
            })
            .catch((err) => {
                this.handleError(err);
            });
    }

    appendErrorMessage(errorMessage) {
        if (errorMessage) {
            this.errorMessage = this.errorMessage ? `${this.errorMessage} ${errorMessage}` : errorMessage;
        }
    }

    handleError(error) {
        this.errorMessage = 'Unknown error';
        if (Array.isArray(error.body)) {
            this.errorMessage = error.body.map((e) => e.message).join(', ');
        } else if (typeof error.body.message === 'string') {
            this.errorMessage = error.body.message;
        }
        this.isError = true;
        this.isLoaded = true;
    }
}
