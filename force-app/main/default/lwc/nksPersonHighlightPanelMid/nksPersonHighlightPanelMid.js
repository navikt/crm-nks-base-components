import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { trackAmplitudeEvent } from 'c/amplitude';

export default class NksPersonHighlightPanelMid extends NavigationMixin(LightningElement) {
    @api gender;
    @api oppfolgingData;
    @api meldekortData;

    get midPanelStyling() { // TODO: Test this - Need .toLowerCase()?
        return this.gender === 'female' ? 'panel-dark-purple' : 'panel-dark-blue';
    }


    viewOppfolging(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        trackAmplitudeEvent('Opened Aktivitetsplanen');
        this.aktivitetsPageRef = {
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Aktivitetsplan'
            },
            state: {
                c__ActorId: this.oppfolgingData.actorId,
                c__firstName: this.oppfolgingData.firstName,
                c__pName: this.oppfolgingData.name,
                c__veilederName: this.oppfolgingData.veilederName,
                c__underOppfolging: this.oppfolgingData.underOppfolging,
                c__veilederIdent: this.oppfolgingData.veilederIdent
            }
        };
        this[NavigationMixin.GenerateUrl](this.aktivitetsPageRef).then((url) => (this.url = url));
        this[NavigationMixin.Navigate](this.aktivitetsPageRef);
    }

    viewMeldekort(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.aktivitetsPageRef = {
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'NKS_Arenaytelser'
            },
            state: {
                c__personId: this.meldekortData.personId
            }
        };
        this[NavigationMixin.GenerateUrl](this.aktivitetsPageRef).then((url) => (this.url = url));
        this[NavigationMixin.Navigate](this.aktivitetsPageRef);
    }
}
