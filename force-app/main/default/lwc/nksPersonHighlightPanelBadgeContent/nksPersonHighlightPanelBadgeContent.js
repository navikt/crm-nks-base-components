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
import NOE from './NOE.html';
import sharedStyling from './sharedStyling.css';

const templates = {
    SecurityMeasure: securityMeasures,
    SpokenLanguagesIntepreter: spokenLanguagesIntepreter,
    GuardianshipOrFuturePowerOfAttorney: guardianships,
    PowerOfAttorney: powerOfAttorneys,
    IsDeceased: dateOfDeath,
    historicalPowerOfAttorney: historicalPowerOfAttorney,
    OpenSTO: openSTO,
    NOE: NOE
};

export default class NksPersonHighlightPanelBadgeContent extends NavigationMixin(LightningElement) {
    @api type;
    @api badgeData;
    @api shownBadge;
    @api badgeStyling;

    // In LWC you can import stylesheets to apply to all templates
    // https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css.html#assign-css-stylesheets-to-a-component
    static stylesheets = [sharedStyling];

    render() {
        //code
        return templates[this.type] != null ? templates[this.type] : nksPersonHighlightPanelBadgeContent;
    }

    connectedCallback() {
        window.addEventListener('resize', this.calculateBadgeContent.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.calculateBadgeContent.bind(this));
    }

    renderedCallback() {
        this.calculateBadgeContent();
    }

    calculateBadgeContent() {
        const renderedBadgeContent = this.template.querySelector('.backgroundStyling');
        if (!renderedBadgeContent) return;
        renderedBadgeContent.style.removeProperty('right');
        renderedBadgeContent.style.removeProperty('left');
        if (renderedBadgeContent.offsetWidth + renderedBadgeContent.getBoundingClientRect().left >= window.innerWidth) {
            renderedBadgeContent.style.right = 0;
            renderedBadgeContent.style.left = 'auto';
        } else {
            renderedBadgeContent.style.right = 'auto';
            renderedBadgeContent.style.removeProperty('left');
        }
    }

    openRecordAndCloseList(event) {
        event.stopPropagation(); //Prevent this click from propagating into
        this.openRecord(event.target.dataset.id, 'Thread__c');
        const closeEvent = new CustomEvent('badgeclosed');
        this.dispatchEvent(closeEvent);
    }

    openRecord(recordId, objectApiName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: objectApiName,
                actionName: 'view'
            }
        });
    }

    get showBadge() {
        return this.type === this.shownBadge;
    }

    get headerLineStyling() {
        const headerStyle = this.badgeStyling.startsWith('slds-theme') ? this.badgeStyling?.split(' ')[0] : '';
        return 'headerLine ' + headerStyle;
    }
}
