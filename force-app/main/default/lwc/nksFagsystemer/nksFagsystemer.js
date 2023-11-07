import { LightningElement, api, track, wire } from 'lwc';
import getData from '@salesforce/apex/NKS_FagsystemController.getFagsystemData';
import checkFagsoneIpRange from '@salesforce/apex/NKS_FagsystemController.checkFagsoneIpRange';
import getModiaSosialLink from '@salesforce/apex/NKS_FagsystemController.getModiaSosialLink';
import checkIfSandboxOrScratch from '@salesforce/apex/NKS_FagsystemController.checkIfSandboxOrScratch';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import NKS_SosialTilgang from '@salesforce/customPermission/NKS_SosialTilgang';
import { MessageContext, publish } from 'lightning/messageService';
import AMPLITUDE_CHANNEL from '@salesforce/messageChannel/amplitude__c';

/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */

const filterFunc = (listToFilterOut, listToFilterIn) => (element) => {
    return (
        (!listToFilterOut || !listToFilterOut.includes(element.name)) &&
        (!listToFilterIn || listToFilterIn.includes(element.name))
    );
};

export default class NksFagsystemer extends LightningElement {
    @api recordId;
    @api title;
    @api relatedField;
    @api objectApiName;
    @api filterList;

    // @track showLinks;
    @track inFagsone = true;

    isSandbox = false;
    showSpinner = false;
    wiredObject;
    personIdent;
    actorId;
    navIdent;

    hiddenLinks = ['Aktivitetsplan', 'Speil'];

    connectedCallback() {
        /*
        checkFagsoneIpRange().then((res) => {
            this.inFagsone = res.isInFagsone;
            if (this.inFagsone === false) {
                console.log('Ip is: ' + res.ip);
            }
        });*/

        checkIfSandboxOrScratch().then((res) => {
            this.isSandbox = res;
        });
    }

    @wire(MessageContext)
    messageContext;

    @wire(getData, {
        recordId: '$recordId',
        relatedField: '$relatedField',
        objectApiName: '$objectApiName'
    })
    wiredData(result) {
        this.wiredObject = result;
        this.loadData();
    }

    loadData() {
        const { error, data } = this.wiredObject;
        if (data) {
            this.navIdent = data.navIdent;
            this.personIdent = data.personIdent;
            this.actorId = data.actorId;

            if (this.navIdent && this.personIdent && this.actorId) {
                this.filterLinks();
            }
        } else if (error) {
            console.log(error);
        }
    }

    filterLinks() {
        let possibleLinks = [
            { name: 'AA-reg', field: null, eventFunc: this.handleAAClickOrKey, title: 'AA-register' },
            {
                name: 'Aktivitetsplan',
                field: this.isSandbox
                    ? `https://veilarbpersonflate.intern.nav.no/${this.personIdent}`
                    : `https://veilarbpersonflate.dev.intern.nav.no/${this.personIdent}`
            },
            { name: 'Barnetrygd', field: `https://barnetrygd.intern.nav.no/oppgaver` },
            {
                name: 'DinPensjon',
                field: this.isSandbox
                    ? `https://pensjon-pselv-q1.nais.preprod.local/pselv/publisering/dinpensjon.jsf?_brukerId=${this.personIdent}&context=pensjon&_loggedOnName=${this.navIdent}`
                    : `https://pensjon-pselv.nais.adeo.no/pselv/publisering/dinpensjon.jsf?_brukerId=${this.personIdent}&context=pensjon&_loggedOnName=${this.navIdent}`
            },
            {
                name: 'DinUfore',
                field: this.isSandbox
                    ? `https://pensjon-pselv-q1.nais.preprod.local/pselv/publisering/uforetrygd.jsf?_brukerId=${this.personIdent}&context=ut&_loggedOnName=${this.navIdent}`
                    : `https://pensjon-pselv.nais.adeo.no/pselv/publisering/uforetrygd.jsf?_brukerId=${this.personIdent}&context=ut&_loggedOnName=${this.navIdent}`
            },
            { name: 'Enslig', field: `https://ensligmorellerfar.intern.nav.no/oppgavebenk` },
            {
                name: 'Foreldrepenger',
                field: this.isSandbox
                    ? `https://fpsak.dev.intern.nav.no/aktoer/${this.actorId}`
                    : `https://fpsak.intern.nav.no/aktoer/${this.actorId}`
            },
            {
                name: 'Gosys',
                field: this.isSandbox
                    ? `https://gosys-q1.dev.intern.nav.no/gosys/personoversikt/fnr=${this.personIdent}`
                    : `https://gosys.intern.nav.no/gosys/personoversikt/fnr=${this.personIdent}`
            },
            { name: 'Kontantstøtte', literalLink: 'https://kontantstotte.intern.nav.no/' },
            { name: 'K9', field: `https://k9.intern.nav.no/k9/web/aktoer/${this.actorId}` },
            {
                name: 'Modia',
                field: this.isSandbox
                    ? `http://app-qx.adeo.no/modiapersonoversikt/${this.personIdent}`
                    : `https://app.adeo.no/modiapersonoversikt/person/${this.personIdent}`
            },
            {
                name: 'Pesys',
                field: `https://pensjon-psak.nais.adeo.no/psak/brukeroversikt/fnr=${this.personIdent}`
            },
            {
                name: 'Speil',
                field: this.isSandbox
                    ? `https://syfomodiaperson.dev.intern.nav.no/sykefravaer/personsok`
                    : `https://syfomodiaperson.intern.nav.no/sykefravaer/personsok`
            }
        ];
        // {
        //     name: 'Sosial',
        //     field: null,
        //     eventFunc: this.handleSosialModiaClickOrKey,
        //     title: 'Modia Sosialhjelp',
        //     show: NKS_SosialTilgang
        // },
        // { name: 'SYFO', field: null, eventFunc: this.handleSYFOClickOrKey, title: 'SYFO' },

        const listOfFilter =
            typeof this.filterList === 'string' ? this.filterList.replaceAll(' ', '').split(',') : this.filterList;
        this.fields = possibleLinks
            .map((link, index) => ({
                ...link,
                id: index,
                custom: link.field == null,
                show: !('show' in link) || (link.show ?? false)
            }))
            .filter(filterFunc(this.hiddenLinks, listOfFilter));
    }

    refreshRecord() {
        this.showSpinner = true;
        refreshApex(this.wiredObject)
            .then(() => {
                this.loadData();
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }

    get size() {
        return 6;
    }

    get showContent() {
        return this.wiredObject != null;
    }

    get showRefreshButton() {
        return !(!this.objectApiName || !this.recordId || !this.relatedField);
    }

    handleAAClickOrKey(e) {
        if (e.type === 'click' || e.key === 'Enter') {
            fetch('https://arbeid-og-inntekt.nais.adeo.no/api/v2/redirect/sok/arbeidstaker', {
                method: 'GET',
                headers: {
                    'Nav-Personident': this.personIdent
                },
                credentials: 'include'
            })
                .then((res) => {
                    return res.text();
                })
                .then((a) => window.open(a))
                .catch((error) => {
                    console.log('An error occured while retrieving AA-reg link');
                    console.log(error);
                    window.open('https://arbeid-og-inntekt.nais.adeo.no/');
                });

            this.handleClick(e);
        }
    }

    // handleSYFOClickOrKey(e) {
    //     if (e.type === 'click' || e.key === 'Enter') {
    //         const actorId = getFieldValue(this.person.data, PERSON_IDENT_FIELD);
    //         fetch('https://modiacontextholder.intern.nav.no/modiacontextholder/api/context', {
    //             method: 'POST',
    //             // Æ må se på denna shiten. Ser at crm-sf-saf\force-app\main\default\classes\Saf_CalloutHandler.cls har noe om det muligens
    //             // apiCtrl.setLogger(logParameters.log)
    //             //    .setLogCalloutRequest()
    //             //    .setLogCategory('SAF')
    //             //    .setLogDomain(logParameters.domain)
    //             //    .setLogUuid(new Uuid().getValue())
    //             //    .addHeader('Nav-Consumer-Id', logParameters.domain == null ? 'salesforce' : 'sf-' + logParameters.domain.name())
    //             //    .addHeader('Nav-Callid', apiCtrl.getLogUuid());
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Nav-Consumer-Id': 'Idk (Salesforce mby???)',
    //                 'Nav-Call-Id': `${NAV_CONSUMER_ID}-${generateUUID()}`,
    //                 'nav-personident': actorId
    //             },
    //             credentials: 'include'
    //         })
    //             .then((res) => {
    //                 return res.text();
    //             })
    //             .then((a) => window.open(a))
    //             .catch((error) => {
    //                 console.log('An error occured while retrieving AA-reg link');
    //                 console.log(error);
    //                 window.open('https://arbeid-og-inntekt.nais.adeo.no/');
    //             });
    //     }
    // }

    handleSosialModiaClickOrKey(e) {
        if (e.type === 'click' || e.key === 'Enter') {
            getModiaSosialLink({ ident: this.personIdent })
                .then((urlLink) => {
                    if (!urlLink) {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Klarte ikke å åpne Modia Sosialhjelp',
                                message: 'Vennligst prøv på nytt eller naviger direkte',
                                variant: 'error'
                            })
                        );
                        return;
                    }
                    window.open(urlLink);
                })
                .catch(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Klarte ikke å åpne Modia Sosialhjelp',
                            message: 'Vennligst prøv på nytt eller naviger direkte',
                            variant: 'error'
                        })
                    );
                });

            this.handleClick(e);
        }
    }

    /*
    handleLoaded() {
        this.showLinks = true;
    }*/

    handleClick(event) {
        let message = {
            eventType: 'Fagsystem',
            properties: { type: `Click on ${event.target.innerText}` }
        };
        publish(this.messageContext, AMPLITUDE_CHANNEL, message);
    }
}
