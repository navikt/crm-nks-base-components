import { LightningElement, api, wire } from 'lwc';
import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';
import getHistorikk from '@salesforce/apex/NKS_HistorikkViewController.getHistorikk';

import FULL_NAME_FIELD from '@salesforce/schema/Person__c.CRM_FullName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import AGE_FIELD from '@salesforce/schema/Person__c.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/Person__c.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/Person__c.INT_MaritalStatus__c';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getNavLinks from '@salesforce/apex/NKS_NavUnitLinks.getNavLinks';
import { MessageContext, APPLICATION_SCOPE, subscribe, unsubscribe } from 'lightning/messageService';
import nksVeilederName from '@salesforce/messageChannel/nksVeilderName__c';

export default class NksPersonHighlightPanel extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;
    personInfo = {};
    shownBadge;

    wireFields;
    wiredBadge;
    historikkWiredData;
    isLoaded;

    badges;
    errorMessages;
    dateOfDeath;
    badgeContent;
    highlightPanelOpen = false;

    connectedCallback() {
        this.wireFields = [this.objectApiName + '.Id'];
        this.subscribeToMessageChannel();
    }

    @wire(MessageContext)
    messageContext;

    // Encapsulate logic for Lightning message service subscribe and unsubsubscribe
    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                nksVeilederName,
                (message) => this.handleVeilderName(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    // Handler for message received by component
    handleVeilderName(message) {
        if (message.recordId === this.recordId) {
            this.veilederName = message.displayName;
            this.veilederIdent = message.ident;
        }
    }

    @wire(getPersonBadgesAndInfo, {
        field: '$relationshipField',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId'
    })
    wiredBadgeInfo(value) {
        this.wiredBadge = value;
        this.setWiredBadge();
    }

    setWiredBadge() {
        if (this.wiredBadge == null || this.historikkWiredData == null) return;
        const { data, error } = this.wiredBadge;
        const { data: historikkData, error: historikkError } = this.historikkWiredData;

        if (data) {
            const badges = [];
            if (historikkData) {
                badges.push({
                    name: 'historicalGuardianship',
                    label: 'Historisk fullmakter',
                    styling: 'slds-m-left_x-small slds-m-vertical_xx-small pointer',
                    iconName: '',
                    iconAltText: 'geir',
                    clickable: true,
                    tabindex: '0',
                    badgeContent: historikkData,
                    badgeContentType: 'historicalPowerOfAttorney'
                });
            }
            badges.push(...data.badges);
            this.badges = badges;

            // this.entitlements = data.entitlements;
            this.errorMessages = data.errors;
            this.dateOfDeath = data.dateOfDeath;

            if (this.isLoaded) {
                this.setUuAlertText();
            }
        }

        if (error) {
            this.addError(error);

            if (this.isLoaded) {
                this.setUuAlertText();
            }
        }
    }
    @wire(getPersonAccessBadges, {
        field: '$relationshipField',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId'
    })
    wiredPersonBadgeInfo(value) {
        this.wiredPersonAccessBadge = value;
        try {
            this.setWiredPersonAccessBadge();
        } catch (error) {
            console.log('There was problem to fetch data from wire-function: ' + error);
        }
    }

    @wire(getHistorikk, {
        recordId: '$recordId',
        objectApiName: '$objectApiName'
    })
    wiredHistorikk(value) {
        this.historikkWiredData = value;
        const { data, error } = this.historikkWiredData;
        if (data) {
            this.setWiredBadge();
        }
        if (error) {
            console.log(error);
        }
    }

    updateBadgeContent() {}

    setWiredPersonAccessBadge() {
        const { data, error } = this.wiredPersonAccessBadge;

        if (data) {
            this.isNavEmployee = data.some((element) => element.name === 'isNavEmployee');
            this.isConfidential = data.some((element) => element.name === 'isConfidential');
            this.personAccessBadges = data;

            if (this.isLoaded) {
                this.setUuAlertText();
            }
        }

        if (error) {
            this.addError(error);

            if (this.isLoaded) {
                this.setUuAlertText();
            }
        }
    }

    setUuAlertText() {
        console.log('Geir Arne');
    }

    addError(a) {
        console.log('Error Arne', a);
    }

    toggleOpen() {
        this.highlightPanelOpen = !this.highlightPanelOpen;
    }

    onKeyPressHandler(event) {
        if (event.which === 13 || event.which === 32) {
            this.onClickHandler(event);
        }
    }

    onClickHandler(event) {
        let selectedBadge = event.target.dataset.id;
        const cmp = this.template.querySelector(
            `div[data-id="${selectedBadge}"] c-nks-person-highlight-panel-badge-content`
        );
        this.handleSelectedBadge(cmp.dataset.id, selectedBadge);
    }

    handleSelectedBadge(selectedBadge, badge) {
        if (this.shownBadge === selectedBadge) {
            this.shownBadge = '';
        } else {
            this.shownBadge = selectedBadge;
        }
        this.setExpanded(badge);
    }

    setExpanded(selectedBadge) {
        let badges = this.template.querySelectorAll('.slds-badge');
        badges.forEach((badge) => {
            if (badge instanceof HTMLElement && badge.dataset.id === selectedBadge && badge.ariaExpanded === 'false') {
                // eslint-disable-next-line @locker/locker/distorted-element-set-attribute
                badge.setAttribute('aria-expanded', 'true');
            } else if (badge.role === 'button') {
                // eslint-disable-next-line @locker/locker/distorted-element-set-attribute
                badge.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Header Info get data

    getRelatedRecordId(relationshipField, objectApiName) {
        getRelatedRecord({
            parentId: this.recordId,
            relationshipField: relationshipField,
            objectApiName: objectApiName
        })
            .then((record) => {
                this.personId = this.resolve(relationshipField, record);
                console.log(this.personId);
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
            this.updatePersonInfo('fullName', getFieldValue(data, FULL_NAME_FIELD));
            this.updatePersonInfo('personIdent', getFieldValue(data, PERSON_IDENT_FIELD));
            this.updatePersonInfo('gender', getFieldValue(data, GENDER_FIELD));
            this.updatePersonInfo('age', getFieldValue(data, AGE_FIELD));
            let __citizenship = getFieldValue(data, CITIZENSHIP_FIELD);
            if (__citizenship != null && typeof __citizenship === 'string') {
                this.personInfo.citizenship =
                    __citizenship.toLowerCase().charAt(0).toUpperCase() + __citizenship.slice(1);
            } else {
                this.updatePersonInfo('citizenship', '');
            }

            let __maritalStatus = getFieldValue(data, MARITAL_STATUS_FIELD);
            if (__maritalStatus != null && typeof __maritalStatus === 'string') {
                this.personInfo.maritalStatus = __maritalStatus
                    .toLowerCase()
                    .replace(/_/g, ' ')
                    .replace(' eller enkemann', '/-mann');
                this.updatePersonInfo(
                    'maritalStatus',
                    __maritalStatus.charAt(0).toUpperCase() + __maritalStatus.slice(1)
                );
            } else {
                this.updatePersonInfo('maritalStatus', '');
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
            this.updatePersonInfo('navUnit', data.unit);
            this.updatePersonInfo('navUnitName', data.unit ? `${data.unit.enhetNr} ${data.unit.navn}` : '');
            this.getFormattedLink();
        }
        if (error) {
            console.log(`error: ${error}`);
        }
    }

    async getFormattedLink() {
        if (this.personInfo.navUnit) {
            // TODO: See if works.
            const link = await getNavLinks().then((list) => {
                const onlineCheck = list.find((unit) => unit.enhetNr === this.personInfo.navUnit.unitNr);
                if (onlineCheck !== undefined) return 'https://www.nav.no' + onlineCheck.path;
                return (
                    'https://www.nav.no/kontor/' +
                    this.personInfo.navUnit.navn
                        .replace(/\.\s/g, '.')
                        .replace(/[\s/]/g, '-')
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                );
            });
            this.updatePersonInfo('formattedUnitLink', link);
        }
    }

    updatePersonInfo(field, value) {
        if (value == null && Object.keys(this.personInfo).includes(field)) return;
        this.personInfo = { ...this.personInfo, [field]: value };
    }

    resolve(path, obj) {
        if (typeof path !== 'string') {
            throw new Error('Path must be a string');
        }

        return path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : null;
        }, obj || {});
    }
}
