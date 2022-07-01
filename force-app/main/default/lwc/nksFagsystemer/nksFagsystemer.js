import { LightningElement, api, track, wire } from 'lwc';
import getPersonId from '@salesforce/apex/NKS_FagsystemController.getPersonId';
import checkFagsoneIpRange from '@salesforce/apex/NKS_FagsystemController.checkFagsoneIpRange';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import PERSON_IDENT_FIELD from '@salesforce/schema/Person__c.Name';
import { refreshApex } from '@salesforce/apex';

export default class NksFagsystemer extends LightningElement {
    @api recordId;
    @api title;
    @api relatedField;
    @api objectApiName;
    @track personId;
    @track showLinks;
    @track inFagsone = false;

    connectedCallback() {
        checkFagsoneIpRange().then((res) => (this.inFagsone = res));
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

    handleAAClickOrKey(e) {
        if (e.type === 'click' || e.key === 'Enter') {
            const actorId = getFieldValue(this.person.data, PERSON_IDENT_FIELD);
            fetch('https://arbeid-og-inntekt-q1.dev.adeo.no/api/v2/redirect/sok/arbeidstaker', {
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
                });
        }
    }

    handleLoaded() {
        this.showLinks = true;
    }
}
