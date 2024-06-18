import { LightningElement, api, track, wire } from 'lwc';
import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';
import getHistorikk from '@salesforce/apex/NKS_HistorikkViewController.getHistorikk';
import PERSON_ACTORID_FIELD from '@salesforce/schema/Person__c.INT_ActorId__c';
import PERSON_FIRST_NAME from '@salesforce/schema/Person__c.INT_FirstName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import IS_DECEASED_FIELD from '@salesforce/schema/Person__c.INT_IsDeceased__c';
import FULL_NAME_FIELD from '@salesforce/schema/Person__c.NKS_Full_Name__c';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import getVeilederName from '@salesforce/apex/NKS_AktivitetsplanController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';

const PERSON_FIELDS = [
    PERSON_FIRST_NAME,
    PERSON_IDENT_FIELD,
    PERSON_ACTORID_FIELD,
    GENDER_FIELD,
    IS_DECEASED_FIELD,
    FULL_NAME_FIELD
];

export default class NksPersonHighlightPanel extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;

    @track loadingStates = {
        getVeilederIdent: true,
        getVeilederName: true,
        getPersonBadgesAndInfo: true,
        getPersonAccessBadges: true,
        getHistorikk: true,
        getRecordPerson: true,
        getRecord: true
    };

    shownBadge;
    personId;
    wireFields;
    wiredBadge;
    historikkWiredData;
    isLoaded;
    actorId;
    veilederName;
    gender;
    isDeceased;
    fullName;

    badges;
    errorMessages;
    dateOfDeath;
    badgeContent;

    oppfolgingAndMeldekortData = {};

    connectedCallback() {
        this.wireFields = [this.objectApiName + '.Id'];
    }

    @wire(getVeilederIdent, { actorId: '$actorId' })
    wireVeilIdentInfo({ data, error }) {
        this.loadingStates.getVeilederIdent = !(error || data);
        if (data) {
            this.veilederIdent = data.primaerVeileder;
            this.underOppfolging = data.underOppfolging;
            this.oppfolgingAndMeldekortData.underOppfolging = this.underOppfolging;
            this.oppfolgingAndMeldekortData.veilederIdent = this.veilederIdent;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getVeilederName, { navIdent: '$veilederIdent' })
    wiredName({ data, error }) {
        this.loadingStates.getVeilederName = !(error || data || 'undefined');
        if (data) {
            this.veilederName = data;
            this.oppfolgingAndMeldekortData.veilederName = this.veilederName;
        } else if (error) {
            console.log('Error occurred: ', JSON.stringify(error, null, 2));
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
        const { data: historikkData, error: historikkError } = this.historikkWiredData;
        this.loadingStates.getPersonBadgesAndInfo = !(error || data);

        if (data) {
            const badges = [...data.badges];
            if (historikkData && historikkData != null && historikkData.length > 0) {
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
        } finally {
            this.loadingStates.getPersonAccessBadges = false;
        }
    }

    @wire(getHistorikk, {
        recordId: '$recordId',
        objectApiName: '$objectApiName'
    })
    wiredHistorikk(value) {
        this.historikkWiredData = value;
        const { data, error } = this.historikkWiredData;
        this.loadingStates.getHistorikk = !(error || data);
        if (data) {
            this.setWiredBadge();
        } else if (error) {
            console.log(error);
        }
    }

    setWiredPersonAccessBadge() {
        const { data, error } = this.wiredPersonAccessBadge;

        if (data) {
            this.isNavEmployee = data.some((element) => element.name === 'isNavEmployee');
            this.isConfidential = data.some((element) => element.name === 'isConfidential');
            this.personAccessBadges = data;

            if (this.isLoaded) {
                this.setUuAlertText();
            }
        } else if (error) {
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

    onKeyPressHandler(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            this.onClickHandler(event);
        }
    }

    onClickHandler(event) {
        let selectedBadge = event.target.dataset.id;
        const cmp = this.template.querySelector(
            `lightning-layout-item[data-id="${selectedBadge}"] c-nks-person-highlight-panel-badge-content`
        );
        console.log(cmp);
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

    getRelatedRecordId(relationshipField, objectApiName) {
        getRelatedRecord({
            parentId: this.recordId,
            relationshipField: relationshipField,
            objectApiName: objectApiName
        })
            .then((record) => {
                this.personId = this.resolve(relationshipField, record);
                this.oppfolgingAndMeldekortData.personId = this.personId;
            })
            .catch((error) => {
                console.log(error);
            });
    }

    @wire(getRecord, {
        recordId: '$personId',
        fields: PERSON_FIELDS
    })
    wiredPersonInfo({ error, data }) {
        this.loadingStates.getRecordPerson = !(error || data);
        if (data) {
            this.firstName = getFieldValue(data, PERSON_FIRST_NAME);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.isDeceased = getFieldValue(data, IS_DECEASED_FIELD);
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);

            this.oppfolgingAndMeldekortData.actorId = this.actorId;
            this.oppfolgingAndMeldekortData.firstName = this.firstName;
            this.oppfolgingAndMeldekortData.name = this.personIdent;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$wireFields'
    })
    wiredRecordInfo({ error, data }) {
        this.loadingStates.getRecord = !(error || data);
        if (data) {
            if (this.relationshipField && this.objectApiName) {
                console.log('toto recordInfo');
                this.getRelatedRecordId(this.relationshipField, this.objectApiName);
            }
        }
        if (error) {
            console.log(error);
        }
    }

    get panelStyling() {
        return (
            'highlightPanel ' +
            (!this.fullName
                ? 'panel-grey'
                : this.isDeceased
                ? 'panel-black'
                : this.gender === 'Kvinne'
                ? 'panel-purple'
                : this.gender === 'Mann'
                ? 'panel-blue'
                : 'panel-brown')
        );
    }

    get isLoading() {
        return Object.values(this.loadingStates).some((isLoading) => isLoading);
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
