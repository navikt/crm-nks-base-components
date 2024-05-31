import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { trackAmplitudeEvent } from 'c/amplitude';

export default class NksPersonHighlightPanelMid extends NavigationMixin(LightningElement) {
    @api gender;
    @api personData;
    links = [];

    connectedCallback() {
        this.links = [
            { id: 'aktivitetsplan', name: 'Aktivitetsplan', onclick: this.viewOppfolging.bind(this) },
            { id: 'meldekort', name: 'Meldekort', onclick: this.viewMeldekort.bind(this) }
        ];
        console.log('this.personData: ', this.personData);
    }

    // TODO: Add color for deceased?
    get midPanelStyling() {
        return 'mid-panel ' + (this.gender === 'Kvinne' ? 'panel-dark-purple' : 'panel-dark-blue');
    }

    viewOppfolging() {
        trackAmplitudeEvent('Opened Aktivitetsplanen');
        const { actorId, firstName, name, veilederName, underOppfolging, veilederIdent } = this.personData || {};

        this.aktivitetsPageRef = {
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Aktivitetsplan'
            },
            state: {
                c__ActorId: actorId,
                c__firstName: firstName,
                c__pName: name,
                c__veilederName: veilederName,
                c__underOppfolging: underOppfolging,
                c__veilederIdent: veilederIdent
            }
        };
        this[NavigationMixin.GenerateUrl](this.aktivitetsPageRef);
        this[NavigationMixin.Navigate](this.aktivitetsPageRef);
    }

    viewMeldekort() {
        trackAmplitudeEvent('Opened Meldekort');
        const { personId } = this.personData || {};

        this.aktivitetsPageRef = {
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'NKS_Arenaytelser'
            },
            state: {
                c__personId: personId
            }
        };
        this[NavigationMixin.GenerateUrl](this.aktivitetsPageRef);
        this[NavigationMixin.Navigate](this.aktivitetsPageRef);
    }
}
