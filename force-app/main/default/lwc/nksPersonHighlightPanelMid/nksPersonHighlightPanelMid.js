import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { trackAmplitudeEvent } from 'c/amplitude';

export default class NksPersonHighlightPanelMid extends NavigationMixin(LightningElement) {
    @api personData;
    @api fullName;

    get links() {
        return [
            {
                id: 'aktivitetsplan',
                name: 'Aktivitetsplan',
                show: this.personData?.underOppfolging,
                onclick: this.viewOppfolging
            },
            { id: 'meldekort', name: 'Meldekort', show: true, onclick: this.viewMeldekort }
        ];
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
