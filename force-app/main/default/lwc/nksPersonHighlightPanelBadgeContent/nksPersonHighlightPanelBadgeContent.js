// @ts-nocheck
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import securityMeasures from './securityMeasures.html';
import spokenLanguagesIntepreter from './spokenLanguagesIntepreter.html';
import guardianships from './guardianships.html';
import powerOfAttorneys from './powerOfAttorneys.html';
import nksPersonHighlightPanelBadgeContent from './nksPersonHighlightPanelBadgeContent.html';
import dateOfDeath from './dateOfDeath.html';
import historicalPowerOfAttorney from './historicalPowerOfAttorney.html';
import openSTO from './openSTO.html';
import sharedStyling from './sharedStyling.css';

const templates = {
    SecurityMeasure: securityMeasures,
    SpokenLanguagesIntepreter: spokenLanguagesIntepreter,
    GuardianshipOrFuturePowerOfAttorney: guardianships,
    PowerOfAttorney: powerOfAttorneys,
    IsDeceased: dateOfDeath,
    historicalPowerOfAttorney: historicalPowerOfAttorney,
    OpenSTO: openSTO
};

export default class NksPersonHighlightPanelBadgeContent extends NavigationMixin(LightningElement) {
    @api type;
    @api badgeData;
    @api shownBadge;
    // In LWC you can import stylesheets to apply to all templates
    // https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css.html#assign-css-stylesheets-to-a-component
    static stylesheets = [sharedStyling];

    render() {
        //code
        return templates[this.type] != null ? templates[this.type] : nksPersonHighlightPanelBadgeContent;
    }

    get showBadge() {
        if (this.type === this.shownBadge) console.log(JSON.stringify(this.badgeData));
        return this.type === this.shownBadge;
    }

    renderedCallback() {
        const renderedBadgeContent = this.template.querySelector('.backgroundStyling');
        if (!renderedBadgeContent) return;
        if (renderedBadgeContent.offsetWidth + renderedBadgeContent.getBoundingClientRect().left >= window.innerWidth) {
            renderedBadgeContent.style.right = 0;
        } else {
            renderedBadgeContent.style.right = 'auto';
        }
    }

    openRecord(event) {
        event.stopPropagation(); //Prevent this click from propagating into
        const recordId = event.target.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Thread__c',
                actionName: 'view'
            }
        });
    }
}
