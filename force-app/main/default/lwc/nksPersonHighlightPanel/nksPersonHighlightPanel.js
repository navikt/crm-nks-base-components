import { LightningElement, api, wire } from 'lwc';
import getPersonBadgesAndInfo from '@salesforce/apex/NKS_PersonBadgesController.getPersonBadgesAndInfo';
import getPersonAccessBadges from '@salesforce/apex/NKS_PersonAccessBadgesController.getPersonAccessBadges';

export default class NksPersonHighlightPanel extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relationshipField;

    wiredBadge;
    isLoaded;

    badges;
    errorMessages;
    dateOfDeath;
    badgeContent;

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
        const { data, error } = this.wiredBadge;

        if (data) {
            this.badges = data.badges;
            const badgeRemapping = [];
            for (const [key, value] of Object.entries(data)) {
                if (
                    [
                        'securityMeasures',
                        'spokenLanguagesIntepreter',
                        'guardianships',
                        'powerOfAttorneys',
                        'dateOfDeath'
                    ].includes(key) &&
                    value?.length > 0
                ) {
                    badgeRemapping.push({ type: key, data: value });
                }
            }
            this.badgeContent = badgeRemapping;

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
}
