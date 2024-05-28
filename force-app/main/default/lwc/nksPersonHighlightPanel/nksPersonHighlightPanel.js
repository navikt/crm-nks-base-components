import { LightningElement, api, wire, track } from 'lwc';
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
import getVeilederName from '@salesforce/apex/NKS_AktivitetsplanController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';

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

    fullName;
    citizenship;
    navUnit;
    veilederName;
    gender;

    badges;
    errorMessages;
    dateOfDeath;
    badgeContent;

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
                console.log('personId under');
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
        console.log('Fimsk Yoyo');
        console.log(this.personId);
        console.log(data);
        if (data) {
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.age = getFieldValue(data, AGE_FIELD);

            let __citizenship = getFieldValue(data, CITIZENSHIP_FIELD);
            if (__citizenship != null && typeof __citizenship === 'string') {
                this.citizenship = __citizenship.toLowerCase().charAt(0).toUpperCase() + __citizenship.slice(1);
            } else {
                this.citizenship = '';
            }

            let __maritalStatus = getFieldValue(data, MARITAL_STATUS_FIELD);
            if (__maritalStatus != null && typeof __maritalStatus === 'string') {
                this.maritalStatus = __maritalStatus
                    .toLowerCase()
                    .replace(/_/g, ' ')
                    .replace(' eller enkemann', '/-mann');
                this.maritalStatus = __maritalStatus.charAt(0).toUpperCase() + __maritalStatus.slice(1);
            } else {
                this.maritalStatus = '';
            }
        } else {
            console.log('there is no data noob');
        }
        if (error) {
            console.log('yoyono data');
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

    get formattedveileder() {
        console.log(this.veilederName);
        return 'Veileder: ' + this.veilederName + (this.veilederIdent ? '(' + this.veilederIdent + ')' : '');
    }

    get panelStyling() { // TODO: Test this - Need .toLowerCase()?
        return 'highlightPanel ' + this.gender === 'female' ? 'panel-purple' : 'panel-blue';
    }

    updatePersonInfo(field, value) {
        console.log('update personInfo Triggered');
        if (value == null && Object.keys(this.personInfo).includes(field)) return;
        this.personInfo = { ...this.personInfo, [field]: value };
        console.log('person from higlightpanel: ');
        console.log(this.personInfo);
    }

    resolve(path, obj) {
        if (typeof path !== 'string') {
            throw new Error('Path must be a string');
        }

        return path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : null;
        }, obj || {});
    }

    renderedCallback() {
        console.log('rendered person info below');
        console.log(`this.personInfo: ${JSON.stringify(this.personInfo)}`);
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
}
