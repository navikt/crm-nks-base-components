import { LightningElement, api, track, wire } from 'lwc';
import getPersonId from '@salesforce/apex/NKS_FagsystemController.getPersonId';
import checkFagsoneIpRange from '@salesforce/apex/NKS_FagsystemController.checkFagsoneIpRange';
import getModiaSosialLink from '@salesforce/apex/NKS_FagsystemController.getModiaSosialLink';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import NKS_SosialTilgang from '@salesforce/customPermission/NKS_SosialTilgang';
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
    @track showLinks;
    @track inFagsone = false;
    @api filterList;

    hiddenLinks = ['Aktivitetsplan', 'Speil'];

    possibleLinks = [
        { name: 'Modia', field: 'NKS_ModiaURL__c' },
        { name: 'Gosys', field: 'NKS_GoSysURL__c' },
        { name: 'Aktivitetsplan', field: 'NKS_AktivitetsplanURL__c' },
        { name: 'AA-reg', field: null, eventFunc: this.handleAAClickOrKey, title: 'AA-register' },
        { name: 'DinPensjon', field: 'NKS_PSELVPensjonURL__c' },
        { name: 'DinUfore', field: 'NKS_PSELVUfoeretrygdURL__c' },
        { name: 'Pesys', field: 'NKS_PESYSURL__c' },
        { name: 'Speil', field: 'NKS_SpeilURL__c' },
        { name: 'Foreldrepenger', field: 'NKS_ForeldrepengerURL__c' },
        { name: 'K9', field: 'NKS_K9URL__c' },
        {
            name: 'Sosial',
            field: null,
            eventFunc: this.handleSosialModiaClickOrKey,
            title: 'Modia Sosialhjelp',
            show: NKS_SosialTilgang
        },
        { name: 'Barnetrygd', field: 'NKS_BarnetrygdURL__c' },
        { name: 'Enslig', field: 'NKS_EnsligForsorgerURL__c' }
    ];
    // { name: 'SYFO', field: null, eventFunc: this.handleSYFOClickOrKey, title: 'SYFO' },

    connectedCallback() {
        checkFagsoneIpRange().then((res) => {
            this.inFagsone = res.isInFagsone;
            if (this.inFagsone === false) {
                console.log('Ip is: ' + res.ip);
            }
        });
    }

    renderedCallback() {
        const listOfFilter =
            typeof this.filterList === 'string' ? this.filterList.replaceAll(' ', '').split(',') : this.filterList;
        this.fields = this.possibleLinks
            .map((link, index) => ({ ...link, id: index, custom: link.field == null, show: link.show ?? true }))
            .filter(filterFunc(this.hiddenLinks, listOfFilter));
    }

    get size() {
        return 6;
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

    @wire(getRecord, { recordId: '$personId', fields: PERSON_IDENT_FIELD })
    person;

    refreshRecord() {
        this.showLinks = false;
        this.personId = null;
        refreshApex(this._refresh).then(() => {
            this.personId = this._refresh.data;
        });
    }

    get showContent() {
        return this.personId != null;
    }

    get showRefreshButton() {
        return !(!this.objectApiName || !this.recordId || !this.relatedField);
    }

    handleAAClickOrKey(e) {
        if (e.type === 'click' || e.key === 'Enter') {
            const actorId = getFieldValue(this.person.data, PERSON_IDENT_FIELD);
            fetch('https://arbeid-og-inntekt.nais.adeo.no/api/v2/redirect/sok/arbeidstaker', {
                method: 'GET',
                headers: {
                    'Nav-Personident': actorId
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
            const actorId = getFieldValue(this.person.data, PERSON_IDENT_FIELD);
            getModiaSosialLink({ ident: actorId })
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
        }
    }

    handleLoaded() {
        this.showLinks = true;
    }
}
