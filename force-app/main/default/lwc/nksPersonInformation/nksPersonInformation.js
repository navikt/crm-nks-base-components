import { LightningElement, api, wire, } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';

import FULL_NAME_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.CRM_FullName__c';
import PERSON_FIRST_NAME_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.INT_FirstName__c';
import PERSON_ID_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.Id';
import PERSON_IDENT_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.Name';
import PERSON_ACTORID_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.INT_ActorId__c';
import GENDER_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.INT_Sex__c';
import AGE_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.CRM_Age__c';
import CITIZENSHIP_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.INT_Citizenships__c';
import MARITAL_STATUS_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.INT_MaritalStatus__c';
import WRITTEN_STANDARD_FIELD from '@salesforce/schema/LiveChatTranscript.Account.CRM_Person__r.INT_KrrWrittenStandard__c';

import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';

import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';
import getVeilederName from '@salesforce/apex/NKS_NOMController.getEmployeeName';
import getVeilederIdent from '@salesforce/apex/NKS_AktivitetsplanController.getOppfolgingsInfo';
import getArbeidssoeker from '@salesforce/apex/NKS_ArbeidssoekerController.getArbeidssoeker';
import getHistorikk from '@salesforce/apex/NKS_FullmaktController.getHistorikk';
import getNavUnit from '@salesforce/apex/NKS_NavUnitSingleController.findUnit';
import getNavLinks from '@salesforce/apex/NKS_NavUnitLinks.getNavLinks';

const GENDER_ICONS = {
    'Mann': 'MaleCircleFilled',
    'Kvinne': 'FemaleCircleFilled',
    'Ukjent': 'UnknownCircleFilled',
    default: 'confidentialCircleFilled'
};

const LANGUAGE_MAPPING = {
    'nb': 'Bokmål',
    'nn': 'Nynorsk'
};

export default class NksPersonInformation extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api showPersonBadges = false;
    @api leftAlignBadges = false;

    actorId;
    personIdent;
    personId;
    veilederIdent;
    fullName;
    firstName;
    gender;
    age;
    citizenship;
    maritalStatus;
    navUnit;
    formattedUnitLink;
    writtenStandard;
    veilederName;
    dateOfDeath;

    shownBadge;
    wiredBadge;
    badges;

    historikkWiredData;
    arbeidssoekerPerioder;
    erNasjonalOppfolging = false;
    uuAlertText = '';

    get genderIcon() {
        if (!this.fullName) return GENDER_ICONS.default;
        return GENDER_ICONS[this.gender] || GENDER_ICONS.default;
    }

    get genderText() {
        if (this.gender === 'Ukjent') return 'Ukjent kjønn';
        return this.gender;
    }

    get genderIconSrc() {
        return NAV_ICONS + '/' + this.genderIcon + '.svg#' + this.genderIcon;
    }

    get formattedUnit() {
        return this.navUnit ? `${this.navUnit.enhetNr} ${this.navUnit.navn}` : '';
    }

    get formattedVeileder() {
        if (!this.veilederName || this.erNasjonalOppfolging) {
            return undefined;
        }
        let veilederInfo = 'Veileder: ' + this.veilederName;
        if (this.veilederIdent) {
            veilederInfo += ' (' + this.veilederIdent + ')';
        }
        return veilederInfo;
    }

    get formattedPersonInfo() {
        return [this.age, this.citizenship, this.maritalStatus].filter((x) => x != null).join(' / ');
    }

    get formattedWrittenStandard() {
        if (!this.writtenStandard) return null;
        
        const standard = LANGUAGE_MAPPING[this.writtenStandard.toLowerCase()];
        return standard ? `Målform: ${standard}` : null;
    }

    get badgeClass() {
        return (this.leftAlignBadges ? '' : 'slds-grow ') + 'slds-var-p-right_small';
    }

    get isArbeidssoeker() {
        return this.arbeidssoekerPerioder?.some((period) => period.avsluttet == null);
    }

    get links() {
        return [
            {
                id: 'aktivitetsplan',
                name: 'Aktivitetsplan',
                onclick: this.viewOppfolging
            },
            { id: 'meldekort', name: 'Meldekort', onclick: this.viewMeldekort }
        ];
    }

    get personIdentNotNull() {
        return this.personIdent != null && this.personIdent !== '';
    }

    async getVeilederIdent() {       
        try {
            const result = await getVeilederIdent({ actorId: this.actorId });
            if (result) {
                this.veilederIdent = result.primaerVeileder;
                this.underOppfolging = result.underOppfolging;

                if (result.underOppfolging && result.OppfolgingsEnhet.enhetId === '4154') {
                    this.erNasjonalOppfolging = true;
                    this.setWiredBadge();
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async getVeilederName() {       
        try {
            const result = await getVeilederName({ navIdent: this.veilederIdent });
            if (result) {
                this.veilederName = result;
            }
        } catch (error) {
            console.error(error);
        }
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [
            FULL_NAME_FIELD,
            PERSON_FIRST_NAME_FIELD,
            PERSON_ID_FIELD,
            PERSON_IDENT_FIELD,
            PERSON_ACTORID_FIELD,
            GENDER_FIELD,
            AGE_FIELD,
            CITIZENSHIP_FIELD,
            MARITAL_STATUS_FIELD,
            WRITTEN_STANDARD_FIELD,
        ]
    })
    wiredRecordInfo({ error, data }) {
        if (data) {
            const oldPersonIdent = this.personIdent;
            this.fullName = getFieldValue(data, FULL_NAME_FIELD);
            this.personIdent = getFieldValue(data, PERSON_IDENT_FIELD);
            this.actorId = getFieldValue(data, PERSON_ACTORID_FIELD);
            this.gender = getFieldValue(data, GENDER_FIELD);
            this.age = getFieldValue(data, AGE_FIELD);
            this.firstName = getFieldValue(data, PERSON_FIRST_NAME_FIELD);
            this.personId = getFieldValue(data, PERSON_ID_FIELD);
            this.writtenStandard = getFieldValue(data, WRITTEN_STANDARD_FIELD);
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

            if (!oldPersonIdent && this.personIdentNotNull) {
                this.refreshAllWiredData();
                this.loadArbeidssoekerData();
                this.loadNavUnitData();
                this.getVeilederIdent();
                this.getVeilederName();
            }
        }
        if (error) {
            console.error(error);
        }
    }

    async loadArbeidssoekerData() {       
        try {
            const result = await getArbeidssoeker({ identnr: this.personIdent });
            if (result) {
                this.arbeidssoekerPerioder = JSON.parse(result);
            }
        } catch (error) {
            console.error('Error loading arbeidssoeker data:', error);
        }
    }

    async loadNavUnitData() {        
        try {
            const result = await getNavUnit({
                field: 'Account.CRM_Person__c',
                parentObject: this.objectApiName,
                parentRecordId: this.recordId,
                type: 'PERSON_LOCATION'
            });
            
            if (result && result.unit) {
                this.navUnit = result.unit;
                this.getFormattedLink();
            } else if (result && result.errorMessage) {
                console.error('Nav unit error:', result.errorMessage);
            }
        } catch (error) {
            console.error('Error loading nav unit data:', error);
        }
    }

    @wire(getPersonBadgesAndInfo, {
        field: 'Account.CRM_Person__c',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId',
        filterOpenSTO: true
    })
    wiredBadgeInfo(result) {
        this._wiredBadgeResult = result;
        this.wiredBadge = result;
        this.setWiredBadge();
    }

    setWiredBadge() {
        if (this.wiredBadge == null) return;
        
        const { data, error } = this.wiredBadge;
        const { data: historikkData } = this.historikkWiredData || {};

        if (data) {
            let badges = [];
            if (this.erNasjonalOppfolging) {
                badges.push({
                    name: 'NOE',
                    label: 'NOE',
                    styling: 'slds-theme_warning slds-m-left_x-small slds-m-vertical_xx-small pointer slds-badge',
                    clickable: true,
                    tabindex: '0',
                    badgeContent: 'NOE',
                    badgeContentType: 'NOE'
                });
            }
            badges = [...badges, ...data.badges];

            if (historikkData && historikkData.length > 0) {
                badges.push({
                    name: 'historicalGuardianship',
                    label: 'Historiske fullmakter',
                    styling: 'slds-theme_shade slds-m-left_x-small slds-m-vertical_xx-small pointer slds-badge',
                    clickable: true,
                    tabindex: '0',
                    badgeContent: historikkData,
                    badgeContentType: 'historicalPowerOfAttorney'
                });
            }
            this.badges = badges;
            this.dateOfDeath = data.dateOfDeath;
            this.setUuAlertText();
        }
        if (error) {
            console.error(error);
        }
    }

    @wire(getPersonAccessBadges, {
        field: 'Account.CRM_Person__c',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId'
    })
    wiredPersonBadgeInfo(result) {
        this._wiredPersonAccessBadgeResult = result;
        this.wiredPersonAccessBadge = result;
        try {
            this.setWiredPersonAccessBadge();
        } catch (error) {
            console.error('There was problem to fetch data from wire-function: ' + error);
        }
    }

    setWiredPersonAccessBadge() {
        const { data, error } = this.wiredPersonAccessBadge;

        if (data) {
            this.isNavEmployee = data.some((element) => element.name === 'isNavEmployee');
            this.isConfidential = data.some((element) => element.name === 'isConfidential');
            this.personAccessBadges = data;
            this.setUuAlertText();
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getHistorikk, {
            recordId: '$recordId',
            objectApiName: '$objectApiName'
        })
    wiredHistorikk(result) {
        this._wiredHistorikkResult = result;
        this.historikkWiredData = result;
        const { data, error } = this.historikkWiredData;
  
        this.setWiredBadge();
        
        if (error) {
            console.error(error);
        }
    }
    
    async getFormattedLink() {
        if (!this.navUnit) {
            return;
        }

        try {
            const list = await getNavLinks();
            if (!Array.isArray(list)) throw new Error('Nav links returned invalid data');

            const onlineCheck = list.find((unit) => unit.enhetNr === this.navUnit.unitNr);
            if (onlineCheck) {
                this.formattedUnitLink = 'https://www.nav.no' + onlineCheck.path;
                return;
            }

            this.formattedUnitLink = `https://www.nav.no/kontor/${this.navUnit.navn
                .replace(/\.\s/g, '.')
                .replace(/[\s/]/g, '-')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')}`;
        } catch (error) {
            console.error('Failed to format Nav link:', error);
            this.formattedUnitLink = 'https://www.nav.no'; // fallback safe link
        }
    }

    // When the personIdent changes from null to a value, some wire adapters don't automatically re-execute with the new parameters.
    async refreshAllWiredData() {       
        try {
            const refreshPromises = [
                this._wiredBadgeResult && refreshApex(this._wiredBadgeResult),
                this._wiredPersonAccessBadgeResult && refreshApex(this._wiredPersonAccessBadgeResult),
                this._wiredHistorikkResult && refreshApex(this._wiredHistorikkResult)
            ];
            await Promise.all(refreshPromises);
        } catch (error) {
            console.error('Error refreshing wire adapters:', error);
        }
    }

    viewOppfolging() {
        this.aktivitetsPageRef = {
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Aktivitetsplan'
            },
            state: {
                c__ActorId: this.actorId,
                c__firstName: this.firstName,
                c__pName: this.personIdent,
                c__veilederName: this.veilederName,
                c__underOppfolging: this.underOppfolging,
                c__veilederIdent: this.veilederIdent
            }
        };
        this[NavigationMixin.GenerateUrl](this.aktivitetsPageRef);
        this[NavigationMixin.Navigate](this.aktivitetsPageRef);
    }

    viewMeldekort() {
        this.aktivitetsPageRef = {
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'NKS_Arenaytelser'
            },
            state: {
                c__personId: this.personId
            }
        };
        this[NavigationMixin.GenerateUrl](this.aktivitetsPageRef);
        this[NavigationMixin.Navigate](this.aktivitetsPageRef);
    }

    onKeyPressHandler(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            this.onClickHandler(event);
        }
    }

    onClickHandler(event) {
        const selectedBadge = event.target.dataset.id;
        const cmp = this.template.querySelector(
            `.badge-wrapper[data-id="${selectedBadge}"] c-nks-person-highlight-panel-badge-content`
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

    setUuAlertText() {
        const securityMeasures = this.badges?.find((badge) => badge.badgeContentType === 'SecurityMeasure');
        const hasSecurityMeasures = securityMeasures?.badgeContent.length > 0;
        if (!(hasSecurityMeasures || this.isConfidential || this.isNavEmployee)) {
            this.uuAlertText = '';
            return;
        }

        const navEmployeeText = ' er egen ansatt';
        const isConfidentialText = ' skjermet';
        let alertText = `Bruker${this.isNavEmployee ? navEmployeeText : ''}`;
        const securityMeasureText = hasSecurityMeasures
            ? ` har ${securityMeasures?.label}: ${securityMeasures?.badgeContent
                  .map((secMeasure) => secMeasure.SecurityMeasure)
                  .join(', ')}`
            : '';
        const confidentialityText =
            this.isNavEmployee && this.isConfidential ? ', og' : this.isConfidential ? ' er' : '';
        alertText += confidentialityText;
        alertText += this.isConfidential ? isConfidentialText : '';
        alertText += (this.isNavEmployee || this.isConfidential) && hasSecurityMeasures ? ' og' : '';
        alertText += securityMeasureText || '';
        alertText += '.';
        this.uuAlertText = alertText;
    }
}
