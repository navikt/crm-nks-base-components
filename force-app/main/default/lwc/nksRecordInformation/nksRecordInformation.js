import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import nksRefreshRecord from '@salesforce/messageChannel/nksRefreshRecord__c';
import { resolve } from 'c/nksComponentsUtils';
export default class NksRecordInformation extends NavigationMixin(LightningElement) {
    @api recordId;
    @api viewedRecordId;
    @api viewedObjectApiName = null;
    @api relationshipField = null;
    @api objectApiName;
    @api displayedFields = null;
    @api cardLabel;
    @api iconName;
    @api numCols = 2;
    @api hideLabels = false;
    @api wireFields;
    @api parentWireFields;
    @api enableRefresh = false;
    @api copyFields;

    _showLink = false;
    showSpinner = false;
    subscription;

    connectedCallback() {
        this.subscribeToMessageChannel();
        this.viewedObjectApiName = this.viewedObjectApiName == null ? this.objectApiName : this.viewedObjectApiName;
        if (this.relationshipField != null && this.relationshipField !== '') {
            this.getRelatedRecordId(this.relationshipField, this.objectApiName);
        }
        this.viewedRecordId = this.viewedRecordId ? this.viewedRecordId : this.recordId;
        this.wireFields = [this.viewedObjectApiName + '.Id'];
        this.fieldList.forEach((e) => {
            this.wireFields.push(this.viewedObjectApiName + '.' + e.fieldName);
        }, this);
        this.parentWireFields = [this.objectApiName + '.Id'];
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    @wire(MessageContext)
    messageContext;

    @wire(getObjectInfo, {
        objectApiName: '$viewedObjectApiName'
    })
    wireObjectInfo;

    @wire(getRecord, {
        recordId: '$viewedRecordId',
        fields: '$wireFields'
    })
    wireRecord;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$parentWireFields'
    })
    dewireParent() {
        if (this.relationshipField) {
            this.getRelatedRecordId(this.relationshipField, this.objectApiName);
        }
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(this.messageContext, nksRefreshRecord, (message) => {
                let recordId = message.recordId;
                if (this.recordId === recordId) {
                    this.getRelatedRecordId(this.relationshipField, this.objectApiName);
                } else if (this.viewedRecordId === recordId) {
                    this.refreshRecord();
                }
            });
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    getRelatedRecordId(relationshipField, objectApiName) {
        getRelatedRecord({
            parentId: this.recordId,
            relationshipField: relationshipField,
            objectApiName: objectApiName
        })
            .then((record) => {
                this.viewedRecordId = resolve(relationshipField, record);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    handleCopy(event) {
        const fieldName = event.currentTarget.dataset.field;
        const fieldValue = this.wireRecord.data?.fields[fieldName]?.value;
        if (!fieldValue) {
            this.showCopyToast(fieldName, 'warning');
            return;
        }
        const hiddenInput = document.createElement('input');
        hiddenInput.value = fieldValue;
        document.body.appendChild(hiddenInput);
        hiddenInput.select();
        try {
            document.execCommand('copy');
            this.showCopyToast(fieldName, 'success');
        } catch {
            this.showCopyToast(fieldName, 'error');
        }
        document.body.removeChild(hiddenInput);
    }

    showCopyToast(field, status) {
        const label = this.wireObjectInfo.data?.fields[field]?.label || field;
        let message = '';
        if (status === 'success') message = `${label} ble kopiert til utklippstavlen.`;
        else if (status === 'warning') message = `${label} er tomt.`;
        else message = `Kunne ikke kopiere ${label}`;
        this.dispatchEvent(
            new ShowToastEvent({
                message,
                variant: status,
                mode: 'dismissable'
            })
        );
    }

    navigateToRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.viewedRecordId,
                objectApiName: this.viewedObjectApiName,
                actionName: 'view'
            }
        });
    }

    refreshRecord() {
        this.showSpinner = true;
        refreshApex(this.wireRecord)
            .then(() => {
                //Successful refresh
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }

    @api
    set showLink(value) {
        if (value === 'TRUE' || value === 'true' || value === true) {
            this._showLink = true;
        } else {
            this._showLink = false;
        }
    }

    get showLink() {
        return this._showLink;
    }

    get columnWidth() {
        return 12 / this.numCols;
    }

    get recordIdSet() {
        return this.viewedRecordId != null;
    }

    get fieldList() {
        let fieldList = (this.displayedFields != null ? this.displayedFields.replace(/\s/g, '').split(',') : []).map(
            (e, i) => {
                return {
                    fieldName: e,
                    copyButton: this.copyFieldsNr.includes(i),
                    buttonName: this.viewedObjectApiName + '_' + e + '_copyButton',
                    buttonTip:
                        this.wireObjectInfo.data && this.wireObjectInfo.data.fields[e]
                            ? 'Kopier ' + this.wireObjectInfo.data.fields[e].label
                            : ''
                };
            }
        );
        return fieldList;
    }

    get copyFieldsNr() {
        let copyFieldsNr =
            this.copyFields != null
                ? this.copyFields
                      .replace(/\s/g, '')
                      .split(',')
                      .map((e) => parseInt(e, 10) - 1)
                : [];
        return copyFieldsNr;
    }
}
