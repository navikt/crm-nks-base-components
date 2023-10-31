import { LightningElement, api, track, wire } from 'lwc';
import getPersonId from '@salesforce/apex/NKS_FagsystemController.getPersonId';
import checkFagsoneIpRange from '@salesforce/apex/NKS_FagsystemController.checkFagsoneIpRange';
import getModiaSosialLink from '@salesforce/apex/NKS_FagsystemController.getModiaSosialLink';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import NKS_SosialTilgang from '@salesforce/customPermission/NKS_SosialTilgang';
import { trackAmplitudeEvent } from 'c/amplitude';

import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import MODIA_FIELD from '@salesforce/schema/Person__c.NKS_ModiaURL__c';
import GOSYS_FIELD from '@salesforce/schema/Person__c.NKS_GoSysURL__c';
import AKTIVITETSPLAN_FIELD from '@salesforce/schema/Person__c.NKS_AktivitetsplanURL__c';
import DINPENSJON_FIELD from '@salesforce/schema/Person__c.NKS_PSELVPensjonURL__c';
import DINUFORE_FIELD from '@salesforce/schema/Person__c.NKS_PSELVUfoeretrygdURL__c';
import PESYS_FIELD from '@salesforce/schema/Person__c.NKS_PESYSURL__c';
import SPEIL_FIELD from '@salesforce/schema/Person__c.NKS_SpeilURL__c';
import FORELDREPENGER_FIELD from '@salesforce/schema/Person__c.NKS_ForeldrepengerURL__c';
import K9_FIELD from '@salesforce/schema/Person__c.NKS_K9URL__c';
import BARNETRYGD_FIELD from '@salesforce/schema/Person__c.NKS_BarnetrygdURL__c';
import ENSLIG_FIELD from '@salesforce/schema/Person__c.NKS_EnsligForsorgerURL__c';

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
    @api personId;
    @api filterList;

    @track showLinks;
    @track inFagsone = true;
    @track person;

    wireFields = [
        PERSON_IDENT_FIELD,
        MODIA_FIELD,
        GOSYS_FIELD,
        AKTIVITETSPLAN_FIELD,
        DINPENSJON_FIELD,
        DINUFORE_FIELD,
        PESYS_FIELD,
        SPEIL_FIELD,
        FORELDREPENGER_FIELD,
        K9_FIELD,
        BARNETRYGD_FIELD,
        ENSLIG_FIELD
    ];

    hiddenLinks = ['Aktivitetsplan', 'Speil'];
    personIdent;
    modia;
    gosys;
    aktivitetsplan;
    dinpensjon;
    dinufore;
    pesys;
    speil;
    foreldrepenger;
    k9;
    barnetrygd;
    enslig;

    connectedCallback() {
        checkFagsoneIpRange().then((res) => {
            this.inFagsone = res.isInFagsone;
            if (this.inFagsone === false) {
                console.log('Ip is: ' + res.ip);
            }
        });
    }

    get size() {
        return 6;
    }

    get showContent() {
        return this.personId != null;
    }

    get showRefreshButton() {
        return !(!this.objectApiName || !this.recordId || !this.relatedField);
    }

    @wire(getPersonId, {
        recordId: '$recordId',
        relatedField: '$relatedField',
        objectApiName: '$objectApiName'
    })
    wirePersonId(res) {
        this._refresh = res;
        if (res.error) {
            console.log(res.error);
        }
        if (res.data) {
            this.personId = res.data;
        }
    }

    @wire(getRecord, { recordId: '$personId', fields: '$wireFields' })
    wiredRecord({ error, data }) {
        if (error) {
            console.log(error);
        } else if (data) {
            this.person = data;
            if (this.person) {
                this.personIdent = getFieldValue(this.person, PERSON_IDENT_FIELD);
                this.modia = getFieldValue(this.person, MODIA_FIELD);
                this.gosys = getFieldValue(this.person, GOSYS_FIELD);
                this.aktivitetsplan = getFieldValue(this.person, AKTIVITETSPLAN_FIELD);
                this.dinpensjon = getFieldValue(this.person, DINPENSJON_FIELD);
                this.dinufore = getFieldValue(this.person, DINUFORE_FIELD);
                this.pesys = getFieldValue(this.person, PESYS_FIELD);
                this.speil = getFieldValue(this.person, SPEIL_FIELD);
                this.foreldrepenger = getFieldValue(this.person, FORELDREPENGER_FIELD);
                this.k9 = getFieldValue(this.person, K9_FIELD);
                this.barnetrygd = getFieldValue(this.person, BARNETRYGD_FIELD);
                this.enslig = getFieldValue(this.person, ENSLIG_FIELD);
            }
        }
        this.filterLinks();
    }

    filterLinks() {
        const possibleLinks = [
            { name: 'Modia', field: this.getLink(this.modia) },
            { name: 'Gosys', field: this.getLink(this.gosys) },
            { name: 'Aktivitetsplan', field: this.getLink(this.aktivitetsplan) },
            { name: 'DinPensjon', field: this.getLink(this.dinpensjon) },
            { name: 'DinUfore', field: this.getLink(this.dinufore) },
            { name: 'Pesys', field: this.getLink(this.pesys) },
            { name: 'Speil', field: this.getLink(this.speil) },
            { name: 'Foreldrepenger', field: this.getLink(this.foreldrepenger) },
            { name: 'K9', field: this.getLink(this.k9) },
            { name: 'Barnetrygd', field: this.getLink(this.barnetrygd) },
            { name: 'Enslig', field: this.getLink(this.enslig) },
            { name: 'AA-reg', field: null, eventFunc: this.handleAAClickOrKey, title: 'AA-register' },
            { name: 'Kontantstøtte', literalLink: 'https://kontantstotte.intern.nav.no/' }
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

    getLink(input) {
        input = String(input);
        let startIndex = input.indexOf('href') + 6;
        let lastIndex = input.indexOf('target') - 2;
        return input.substring(startIndex, lastIndex);
    }

    handleClick(event) {
        console.log('clicked: ', event.target.innerText);
        trackAmplitudeEvent('Fagsystem Event', { type: `Click on ${event.target.innerText}` });
    }

    refreshRecord() {
        this.showLinks = false;
        this.personId = null;
        refreshApex(this._refresh).then(() => {
            this.personId = this._refresh.data;
        });
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
    //                 'nav-personident':  this.personIdent
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

    handleLoaded() {
        this.showLinks = true;
    }
}
