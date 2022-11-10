import { LightningElement, api, track, wire } from 'lwc';
import getPersonId from '@salesforce/apex/NKS_FagsystemController.getPersonId';
import checkFagsoneIpRange from '@salesforce/apex/NKS_FagsystemController.checkFagsoneIpRange';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import { refreshApex } from '@salesforce/apex';

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
        { name: 'Barnetrygd', field: 'NKS_BarnetrygdURL__c' },
        { name: 'Enslig', field: 'NKS_EnsligForsorgerURL__c' }
    ];

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
            .map((link, index) => ({ ...link, id: index, custom: link.field == null }))
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

    handleLoaded() {
        this.showLinks = true;
    }
}
