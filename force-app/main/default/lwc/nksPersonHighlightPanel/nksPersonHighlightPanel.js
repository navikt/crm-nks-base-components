import { LightningElement, api, track, wire } from 'lwc';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import { resolve } from 'c/nksComponentsUtils';

import PERSON_ACTORID_FIELD from '@salesforce/schema/Person__c.INT_ActorId__c';
import PERSON_FIRST_NAME from '@salesforce/schema/Person__c.INT_FirstName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import IS_DECEASED_FIELD from '@salesforce/schema/Person__c.INT_IsDeceased__c';
import FULL_NAME_FIELD from '@salesforce/schema/Person__c.NKS_Full_Name__c';
import AGE_FIELD from '@salesforce/schema/Person__c.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/Person__c.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/Person__c.INT_MaritalStatus__c';
import WRITTEN_STANDARD_FIELD from '@salesforce/schema/Person__c.INT_KrrWrittenStandard__c';

import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';
import getFullmaktsgiverHistorikk from '@salesforce/apex/NKS_FullmaktController.getFullmaktsgiverHistorikk';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import getVeilederName from '@salesforce/apex/NKS_AktivitetsplanController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';

const PERSON_FIELDS = [
    PERSON_FIRST_NAME,
    PERSON_IDENT_FIELD,
    PERSON_ACTORID_FIELD,
    GENDER_FIELD,
    IS_DECEASED_FIELD,
    FULL_NAME_FIELD,
    AGE_FIELD,
    CITIZENSHIP_FIELD,
    MARITAL_STATUS_FIELD,
    WRITTEN_STANDARD_FIELD
];

export default class NksPersonHighlightPanel extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;

    @track loadingStates = {
        getPersonBadgesAndInfo: true,
        getPersonAccessBadges: true,
        getHistorikk: true,
        getRecordPerson: true
    };

    shownBadge;
    personId;
    wireFields;
    wiredBadge;
    historikkWiredData;
    isLoaded;
    actorId;
    veilederName;
    veilederIdent;
    fullName;
    firstName;
    personIdent;

    badges;
    errorMessages;
    dateOfDeath;
    badgeContent;

    oppfolgingAndMeldekortData = {};
    personDetails = {};

    connectedCallback() {
        this.wireFields = [`${this.objectApiName}.Id`];
    }

    @wire(getVeilederIdent, { actorId: '$actorId' })
    wireVeilIdentInfo({ data, error }) {
        if (data) {
            this.veilederIdent = data.primaerVeileder;
            this.underOppfolging = data.underOppfolging;
            console.log('wireVeilIdentInfo: ', this.underOppfolging);
            this.oppfolgingAndMeldekortData.underOppfolging = this.underOppfolging;
            this.oppfolgingAndMeldekortData.veilederIdent = this.veilederIdent;

            // When wiredPersonInfo runs, it instantly sends oppfolgingAndMeldekortData to the mid component
            // and does not resend it when this dependant wire has finished running, therefore the code below
            // is needed to send oppfolging and veilederident afterwards.
            const midPanel = this.template.querySelector('c-nks-person-highlight-panel-mid');
            if (midPanel) {
                midPanel.updateOppfolging(this.oppfolgingAndMeldekortData);
            }
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getVeilederName, { navIdent: '$veilederIdent' })
    wiredName({ data, error }) {
        if (data) {
            this.veilederName = data;
            this.oppfolgingAndMeldekortData.veilederName = this.veilederName;
        } else if (error) {
            console.error('Error occurred: ', JSON.stringify(error, null, 2));
        }
    }

    @wire(getPersonBadgesAndInfo, {
        field: '$relationshipField',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId',
        filterOpenSTO: true
    })
    wiredBadgeInfo(value) {
        this.wiredBadge = value;
        this.setWiredBadge();
    }

    setWiredBadge() {
        if (this.wiredBadge == null || this.historikkWiredData == null) return;
        const { data, error } = this.wiredBadge;
        const { data: historikkData } = this.historikkWiredData;
        this.loadingStates.getPersonBadgesAndInfo = !(error || data);

        if (data) {
            const badges = [...data.badges];
            if (historikkData && historikkData.length > 0) {
                badges.push({
                    name: 'historicalGuardianship',
                    label: 'Historisk Fullmakter',
                    styling: 'slds-m-left_x-small slds-m-vertical_xx-small pointer greyBadge',
                    clickable: true,
                    tabindex: '0',
                    badgeContent: historikkData,
                    badgeContentType: 'historicalPowerOfAttorney'
                });
            }
            this.badges = badges;

            // this.entitlements = data.entitlements;
            this.errorMessages = data.errors;
            this.dateOfDeath = data.dateOfDeath;
        }
        if (error) {
            console.error(error);
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
            console.error('There was problem to fetch data from wire-function: ' + error);
        } finally {
            this.loadingStates.getPersonAccessBadges = false;
        }
    }

    @wire(getFullmaktsgiverHistorikk, {
        recordId: '$recordId',
        objectApiName: '$objectApiName'
    })
    wiredHistorikk(value) {
        this.historikkWiredData = value;
        const { data, error } = this.historikkWiredData;
        // data is null if there is no historic data
        this.loadingStates.getHistorikk = !(error || data || data === null);
        if (data) {
            this.setWiredBadge();
        } else if (error) {
            console.error(error);
        }
    }

    setWiredPersonAccessBadge() {
        const { data, error } = this.wiredPersonAccessBadge;

        if (data) {
            this.isNavEmployee = data.some((element) => element.name === 'isNavEmployee');
            this.isConfidential = data.some((element) => element.name === 'isConfidential');
            this.personAccessBadges = data;
        } else if (error) {
            console.error(error);
        }
    }

    onKeyPressHandler(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            this.onClickHandler(event);
        }
    }

    onClickHandler(event) {
        const selectedBadge = event.target.dataset.id;
        const cmp = this.template.querySelector(
            `lightning-layout-item[data-id="${selectedBadge}"] c-nks-person-highlight-panel-badge-content`
        );
        if (cmp == null) return;
        this.handleSelectedBadge(cmp.dataset.id, selectedBadge);
    }

    handleSelectedBadge(selectedBadge, badge) {
        if (this.shownBadge === selectedBadge) {
            this.closeBadge();
            return;
        }
        this.shownBadge = selectedBadge;
        this.setExpanded(badge);
    }

    closeBadge() {
        this.shownBadge = '';
        this.setExpanded(null);
    }

    setExpanded(selectedBadge) {
        const badges = this.template.querySelectorAll('.slds-badge');
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

    getRelatedRecordId(relationshipField, objectApiName) {
        getRelatedRecord({
            parentId: this.recordId,
            relationshipField: relationshipField,
            objectApiName: objectApiName
        })
            .then((record) => {
                this.personId = resolve(relationshipField, record);
                this.oppfolgingAndMeldekortData.personId = this.personId;
            })
            .catch((error) => {
                console.error(error);
            });
    }

    @wire(getRecord, {
        recordId: '$personId',
        fields: PERSON_FIELDS
    })
    wiredPersonInfo({ error, data }) {
        this.loadingStates.getRecordPerson = !(error || data);
        if (data) {
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);
            this.firstName = getFieldValue(data, PERSON_FIRST_NAME);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.personDetails = {
                personId: this.personId,
                firstName: this.firstName,
                personIdent: this.personIdent,
                actorId: this.actorId,
                fullName: this.fullName,
                gender: getFieldValue(data, GENDER_FIELD),
                isDeceased: getFieldValue(data, IS_DECEASED_FIELD),
                age: getFieldValue(data, AGE_FIELD),
                writtenStandard: getFieldValue(data, WRITTEN_STANDARD_FIELD),
                citizenship: this.capitalizeFirstLetter(getFieldValue(data, CITIZENSHIP_FIELD)),
                maritalStatus: this.capitalizeFirstLetter(
                    this.formatMaritalStatus(getFieldValue(data, MARITAL_STATUS_FIELD))
                )
            };

            this.oppfolgingAndMeldekortData.actorId = this.actorId;
            this.oppfolgingAndMeldekortData.firstName = this.firstName;
            this.oppfolgingAndMeldekortData.name = this.personIdent;

            this.handleBackgroundColor();
        } else if (error) {
            console.error(error);
            this.handleBackgroundColor();
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
            console.error(error);
        }
    }

    handleBackgroundColor() {
        const genderWrapper = this.template.querySelector('.gender-wrapper');
        if (!genderWrapper) return;
        const className = !this.personDetails?.fullName
            ? 'confidentialBackground'
            : this.personDetails?.isDeceased
            ? 'deadBackground'
            : this.personDetails?.gender === 'Kvinne'
            ? 'femaleBackground'
            : this.personDetails?.gender === 'Mann'
            ? 'maleBackground'
            : 'unknownBackground';
        genderWrapper.className = 'gender-wrapper ' + className;
    }

    capitalizeFirstLetter(str) {
        if (!str || typeof str !== 'string') {
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

    get isLoading() {
        return Object.values(this.loadingStates).some((isLoading) => isLoading);
    }

    get panelClass() {
        return this.fullName ? 'highlightPanel' : 'highlightPanelConfidential';
    }
}
