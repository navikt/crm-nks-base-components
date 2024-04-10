import { LightningElement, api } from 'lwc';
import securityMeasures from './securityMeasures.html';
import spokenLanguagesIntepreter from './spokenLanguagesIntepreter.html';
import guardianships from './guardianships.html';
import powerOfAttorneys from './powerOfAttorneys.html';
import nksPersonHighlightPanelBadgeContent from './nksPersonHighlightPanelBadgeContent.html';
import dateOfDeath from './dateOfDeath.html';

const templates = {
    securityMeasures: securityMeasures,
    spokenLanguagesIntepreter: spokenLanguagesIntepreter,
    guardianships: guardianships,
    powerOfAttorneys: powerOfAttorneys,
    dateOfDeath: dateOfDeath
};

export default class NksPersonHighlightPanelBadgeContent extends LightningElement {
    @api type;
    @api badgeData;

    render() {
        //code
        if (templates[this.type] == null) console.log(this.type);
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
