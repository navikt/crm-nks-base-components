import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';

import { MessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import krrUpdateChannel from '@salesforce/messageChannel/krrUpdate__c';

export default class NksPersonBadges extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api personRelationField;
    @api addBoxLayout = false;
    @api assistiveHeader;
    @api leftAlignBadges = false;

    krrSubscription = null;

    @track wiredBadge;
    @track wiredPersonAccessBadge;
    @track badges = [];
    @track personAccessBadges = [];
    @track securityMeasures = [];
    @track interpreterSpokenLanguages = [];
    @track guardianships = [];
    @track powerOfAttorneys = [];
    //@track entitlements = [];
    @track errorMessages = [];

    infoPanelToShow = '';

    isNavEmployee = false;
    isConfidential = false;
    uuAlertText = '';
    wireFields;
    dateOfDeath;

    get isLoaded() {
        return this.wiredBadge &&
            (this.wiredBadge.data || this.wiredBadge.error) &&
            this.wiredPersonAccessBadge &&
            (this.wiredPersonAccessBadge.data || this.wiredPersonAccessBadge.error)
            ? true
            : false;
    }

    get hasErrors() {
        return this.errorMessages && 0 < this.errorMessages.length ? true : false;
    }

    get hasBadges() {
        return (this.badges && 0 < this.badges.length) ||
            (this.personAccessBadges && 0 < this.personAccessBadges.length)
            ? true
            : false;
    }

    get selectedBadge() {
        if (this.infoPanelToShow) {
            for (let index = 0; index < this.badges.length; index++) {
                const badge = this.badges[index];
                if (badge.name === this.infoPanelToShow) {
                    return badge;
                }
            }
        }
    }

    get badgeInfo() {
        const selectedBadgeInfo = JSON.parse(this.selectedBadge.badgeInfo);
        const badgeInfo = [];
        const btoList = [];
        const stoList = [];
        selectedBadgeInfo.forEach(infoItem => {
            if (infoItem.Origin === 'STO') {
                stoList.push(infoItem);
            } else if (infoItem.Origin === 'BTO') {
                btoList.push(infoItem);
            }
        });
        badgeInfo.push(stoList.length > 0 ? {name: "Åpne Skriv til oss", list: stoList} : {});
        badgeInfo.push(btoList.length > 0 ? {name: "Åpne Beskjed til oss", list: btoList} : {});
        return badgeInfo;
    }

    get showSTOInformation() {
        return 'openSTO' === this.infoPanelToShow;
    }

    get showIntepreterSpokenLanguage() {
        return 'spokenLanguageIntepreter' === this.infoPanelToShow && 0 < this.interpreterSpokenLanguages.length;
    }

    get showSecurityMeasures() {
        return 'securityMeasures' === this.infoPanelToShow && 0 < this.securityMeasures.length;
    }

    get showGuardianship() {
        return 'guardianshipOrFuturePowerOfAttorney' === this.infoPanelToShow && 0 < this.guardianships.length;
    }

    get showPowerOfAttorney() {
        return 'powerOfAttorney' === this.infoPanelToShow && 0 < this.powerOfAttorneys.length;
    }
    /*
    get showEntitlements() {
        return 'entitlements' === this.infoPanelToShow && 0 < this.entitlements.length;
    } 
    */

    get showDateOfDeath() {
        return 'isDeceased' === this.infoPanelToShow && this.dateOfDeath !== null;
    }

    get backgroundTheme() {
        return this.addBoxLayout === true ? 'slds-box slds-box_x-small slds-theme_default' : '';
    }

    get floatClass() {
        return this.leftAlignBadges ? '' : 'slds-float_right';
    }

    connectedCallback() {
        this.wireFields = [this.objectApiName + '.Id'];
        this.subscribeToKrrUpdates();
    }

    disconnectedCallback() {
        this.unsubscribeToKrrUpdates();
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$wireFields'
    })
    wiredRecordInfo({ error, data }) {
        if (data) {
            if (this.isLoaded) {
                this.errorMessages = [];
                refreshApex(this.wiredBadge).then(() => {
                    this.setWiredBadge();
                });
                refreshApex(this.wiredPersonAccessBadge).then(() => {
                    this.setWiredPersonAccessBadge();
                });
            }
        }

        if (error) {
            this.addError(error);
        }
    }

    @wire(getPersonBadgesAndInfo, {
        field: '$personRelationField',
        parentObject: '$objectApiName',
        parentRecordId: '$recordId'
    })
    wiredBadgeInfo(value) {
        this.wiredBadge = value;
        this.setWiredBadge();
    }

    setWiredBadge() {
        const { data, error } = this.wiredBadge;

        if (data) {
            /*
             * Det er foreløpig ikke avgjort hvordan åpne STO skal vises
             * så vi legger den ikke til i layouten. Lar imidlertid koden
             * ligge sånn at vi kan se på performancen.
             */
            this.badges = data.badges;
            this.securityMeasures = data.securityMeasures;
            this.interpreterSpokenLanguages = data.spokenLanguagesIntepreter;
            this.guardianships = data.guardianships;
            this.powerOfAttorneys = data.powerOfAttorneys;
            //this.entitlements = data.entitlements;
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
        field: '$personRelationField',
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

    onKeyPressHandler(event) {
        if (event.which === 13 || event.which === 32) {
            let selectedBadge = event.target.dataset.id;
            this.handleSelectedBadge(selectedBadge);
        }
    }

    onClickHandler(event) {
        let selectedBadge = event.target.dataset.id;
        this.handleSelectedBadge(selectedBadge);
    }

    handleSelectedBadge(selectedBadge) {
        if (this.infoPanelToShow === selectedBadge) {
            this.infoPanelToShow = '';
        } else {
            this.infoPanelToShow = selectedBadge;
        }
        this.setExpanded(selectedBadge);
    }

    setExpanded(selectedBadge) {
        let badges = this.template.querySelectorAll('.slds-badge');
        badges.forEach((badge) => {
            if (badge instanceof HTMLElement && badge.dataset.id === selectedBadge && badge.ariaExpanded === 'false') {
                badge.setAttribute('aria-expanded', 'true');
            } else if (badge.role === 'button') {
                badge.setAttribute('aria-expanded', 'false');
            }
        });
    }

    addError(error) {
        if (Array.isArray(error.body)) {
            this.errorMessages = this.errorMessages.concat(error.body.map((e) => e.message));
        } else if (error.body && typeof error.body.message === 'string') {
            this.errorMessages.push(error.body.message);
        } else {
            this.errorMessages.push(error.body);
        }
    }

    setUuAlertText() {
        let alertText = '';

        let hasSecurityMeasures = this.securityMeasures.length > 0;
        let navEmployeeText = ' er egen ansatt';
        let isConfidentialText = ' skjermet';
        let securityMeasureText = ' har ' + this.securityMeasures.length + ' sikkerhetstiltak';

        alertText += 'Bruker';
        alertText += this.isNavEmployee ? navEmployeeText : '';
        alertText +=
            this.isNavEmployee && this.isConfidential && hasSecurityMeasures
                ? ', '
                : this.isNavEmployee && this.isConfidential
                ? ' og'
                : this.isConfidential
                ? ' er'
                : '';
        alertText += this.isConfidential ? isConfidentialText : '';
        alertText += (this.isNavEmployee || this.isConfidential) && hasSecurityMeasures ? ' og' : '';
        alertText += hasSecurityMeasures ? securityMeasureText : '';
        alertText += '.';

        this.uuAlertText = alertText;
    }

    @wire(MessageContext)
    messageContext;

    subscribeToKrrUpdates() {
        if (!this.krrSubscription) {
            this.krrSubscription = subscribe(
                this.messageContext,
                krrUpdateChannel,
                (message) => {
                    this.handleKrrUpdate(message);
                },
                null
            );
        }
    }
    unsubscribeToKrrUpdates() {
        unsubscribe(this.krrSubscription);
        this.krrSubscription = null;
    }
    handleKrrUpdate(message) {
        if (message.updated === true) {
            refreshApex(this.wiredBadge).then(() => {
                this.setWiredBadge();
            });
        }
    }
}
