import { LightningElement, api, wire } from 'lwc';
import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';
import getHistorikk from '@salesforce/apex/NKS_HistorikkViewController.getHistorikk';
import PERSON_ACTORID_FIELD from '@salesforce/schema/Person__c.INT_ActorId__c';
import PERSON_FIRST_NAME from '@salesforce/schema/Person__c.INT_FirstName__c';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import GENDER_FIELD from '@salesforce/schema/Person__c.INT_Sex__c';
import IS_DECEASED_FIELD from '@salesforce/schema/Person__c.INT_IsDeceased__c';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import getRelatedRecord from '@salesforce/apex/NksRecordInfoController.getRelatedRecord';
import getVeilederName from '@salesforce/apex/NKS_AktivitetsplanController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';

const PERSON_FIELDS = [PERSON_FIRST_NAME, PERSON_IDENT_FIELD, PERSON_ACTORID_FIELD, GENDER_FIELD, IS_DECEASED_FIELD];

export default class NksPersonHighlightPanel extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;

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
        console.log('VEILEDER: ' + this.veilederIdent);
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

        if (data) {
            const badges = [...data.badges];
            if (historikkData) {
                badges.push({
                    name: 'historicalGuardianship',
                    label: 'Historisk fullmakter',
                    styling: 'slds-m-left_x-small slds-m-vertical_xx-small pointer greyBadge',
                    iconName: '',
                    iconAltText: 'geir',
                    clickable: true,
                    tabindex: '0',
                    badgeContent: historikkData,
                    badgeContentType: 'historicalPowerOfAttorney'
                });
            }
            this.badges = badges;
            console.log('Baggy');
            console.log(JSON.stringify(badges));

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
        }else if (error) {
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
        console.log('related Yo?');
        getRelatedRecord({
            parentId: this.recordId,
            relationshipField: relationshipField,
            objectApiName: objectApiName
        })
            .then((record) => {
                this.personId = this.resolve(relationshipField, record);
                this.oppfolgingAndMeldekortData.personId = this.personId;
                console.log('personId under');
                console.log(this.personId);
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
        if (data) {
            this.firstName = getFieldValue(data, PERSON_FIRST_NAME);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.isDeceased = getFieldValue(data, IS_DECEASED_FIELD);
            
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
        return 'highlightPanel ' + (this.isDeceased ? 'panel-black' : this.gender === 'Kvinne' ? 'panel-purple' : 'panel-blue');
    }

    get panelBorderStyling() {
        return 'border-height ' + (this.isDeceased ? 'border-light-grey' : this.gender === 'Kvinne' ? 'border-light-purple' : 'border-light-blue');
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
