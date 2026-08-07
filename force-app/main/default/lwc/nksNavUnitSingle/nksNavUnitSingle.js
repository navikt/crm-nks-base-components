import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
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
    contactInformationV2;
    unitNumber;
    wiredNavUnit;
    wiredContactInformationV2;
    wireFields;
    errorMessage;
    isError = false;
    isLoaded = false;

    render() {
        if (this.cardLayout) {
            return cardLayoutHTML;
        }

        return this.boxLayout ? boxLayoutHTML : noLayoutHTML;
    }

    connectedCallback() {
        this.wireFields = [`${this.objectApiName}.Id`];
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$wireFields'
    })
    wiredRecordInfo({ error, data }) {
        if (data && this.wiredNavUnit?.data) {
            this.isLoaded = false;
            refreshApex(this.wiredNavUnit);
            return;
        }

        if (error) {
            this.handleError(error);
        }
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
        const { data, error } = this.wiredNavUnit || {};

        if (data) {
            const newUnitNumber = data.unit?.enhetNr || null;
            this.unitNumber = newUnitNumber;
            this.navUnit = data.unit;
            this.isError = !data.success;
            this.appendErrorMessage(data.errorMessage);
            this.isLoaded = !newUnitNumber;
        } else if (error) {
            this.handleError(error);
        }
    }

    @wire(getContactInformationV2, { unitNumber: '$unitNumber' })
    wiredGetContactInformationV2(value) {
        this.wiredContactInformationV2 = value;
        const { data, error } = value || {};

        if (data) {
            this.contactInformationV2 = data.contactInformation;
            this.isError = this.isError || !data.success;
            this.appendErrorMessage(data.errorMessage);
            this.isLoaded = true;
        } else if (error) {
            this.handleError(error);
        }
    }

    appendErrorMessage(errorMessage) {
        if (errorMessage) {
            this.errorMessage = this.errorMessage ? `${this.errorMessage} ${errorMessage}` : errorMessage;
        }
    }

    handleError(error) {
        this.errorMessage = 'Unknown error';

        if (Array.isArray(error?.body)) {
            this.errorMessage = error.body.map((e) => e.message).join(', ');
        } else if (typeof error?.body?.message === 'string') {
            this.errorMessage = error.body.message;
        } else if (typeof error?.message === 'string') {
            this.errorMessage = error.message;
        }

        this.isError = true;
        this.isLoaded = true;
    }
}
