// @ts-nocheck
import { LightningElement, api } from 'lwc';
import securityMeasures from './securityMeasures.html';
import spokenLanguagesIntepreter from './spokenLanguagesIntepreter.html';
import guardianships from './guardianships.html';
import powerOfAttorneys from './powerOfAttorneys.html';
import nksPersonHighlightPanelBadgeContent from './nksPersonHighlightPanelBadgeContent.html';
import dateOfDeath from './dateOfDeath.html';
import historicalPowerOfAttorney from './historicalPowerOfAttorney.html';
import InfoCircle from '@salesforce/resourceUrl/InfoCircle';
import sharedStyling from './sharedStyling.css';

const templates = {
    securityMeasures: securityMeasures,
    spokenLanguagesIntepreter: spokenLanguagesIntepreter,
    guardianships: guardianships,
    powerOfAttorneys: powerOfAttorneys,
    dateOfDeath: dateOfDeath,
    historicalPowerOfAttorney: historicalPowerOfAttorney
};

export default class NksPersonHighlightPanelBadgeContent extends LightningElement {
    @api type;
    @api badgeData;
    // In LWC you can import stylesheets to apply to all templates
    // https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css.html#assign-css-stylesheets-to-a-component
    static stylesheets = [sharedStyling];

    infoIcon = `${InfoCircle}#logo`;

    render() {
        //code
        return templates[this.type] != null ? templates[this.type] : nksPersonHighlightPanelBadgeContent;
    }

    // Open STO List

    selectedBadge;
    get badgeInfo() {
        const selectedBadgeInfo = JSON.parse(this.selectedBadge.badgeInfo);
        const badgeInfo = [];
        const btoList = [];
        const stoList = [];
        selectedBadgeInfo.forEach((infoItem) => {
            if (infoItem.Origin === 'STO') {
                stoList.push(infoItem);
            } else if (infoItem.Origin === 'BTO') {
                btoList.push(infoItem);
            }
        });
        badgeInfo.push(stoList.length > 0 ? { name: 'Åpne Skriv til oss', list: stoList } : {});
        badgeInfo.push(btoList.length > 0 ? { name: 'Åpne Beskjed til oss', list: btoList } : {});
        return badgeInfo;
    }
}