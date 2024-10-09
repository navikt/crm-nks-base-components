import { LightningElement, api, wire } from 'lwc';
import getData from '@salesforce/apex/NKS_FagsystemController.getFagsystemData';
import getFagsoneIpAndOrgType from '@salesforce/apex/NKS_FagsystemController.getFagsoneIpAndOrgType';
import getModiaSosialLink from '@salesforce/apex/NKS_FagsystemController.getModiaSosialLink';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publishToAmplitude } from 'c/amplitude';

export default class NksPersonHighlightPanelBot extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relatedField;
    @api hasPersonId;
    @api filterList = [];
    @api fullName;

    personInfo;
    fagsystemLinks = [];
    inFagsone;
    fagsoneText = '';
    isSandbox = false;
    wiredRecordData;
    actorId;
    navIdent;
    _personIdent;

    @api
    get personIdent() {
        return this._personIdent;
    }

    set personIdent(value) {
        this._personIdent = value;
    }

    @wire(getFagsoneIpAndOrgType)
    wiredGetFagsoneIpAndOrgType({ error, data }) {
        if (data) {
            this.isSandbox = data.isSandboxOrScratch;
            this.inFagsone = data.ipResult.isInFagsone;
            if (!this.inFagsone) {
                this.fagsoneText = 'Du er ikke i en sikker sone';
                console.log('Ip is: ' + data.ipResult.ip);
            }
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getData, {
        recordId: '$recordId',
        relatedField: '$relatedField',
        objectApiName: '$objectApiName',
        hasPersonId: '$hasPersonId'
    })
    wiredGetData({ error, data }) {
        if (data) {
            this.wiredRecordData = data;
            this.loadData();
        } else if (error) {
            console.error(error);
        }
    }

    loadData() {
        this.navIdent = this.wiredRecordData?.navIdent;
        this._personIdent = this.wiredRecordData?.personIdent;
        this.actorId = this.wiredRecordData?.actorId;
        this.filterLinks();
    }

    filterLinks() {
        let possibleLinks = [
            { name: 'Modia', field: this.generateUrl('Modia'), show: this.personIdent },
            { name: 'Gosys', field: this.generateUrl('Gosys'), show: this.personIdent },
            {
                name: 'AA-reg',
                field: null,
                eventFunc: this.handleAAClickOrKey,
                title: 'AA-register',
                show: this.personIdent
            },
            {
                name: 'DinPensjon',
                label: 'Din Pensjon',
                field: this.generateUrl('DinPensjon'),
                show: this.personIdent
            },
            {
                name: 'DinUfore',
                label: 'Din Uføretrygd',
                field: this.generateUrl('DinUfore'),
                show: this.personIdent && this.navIdent
            },
            { name: 'Pesys', field: this.generateUrl('Pesys'), show: this.personIdent },
            { name: 'Foreldrepenger', field: this.generateUrl('Foreldrepenger'), show: this.actorId },
            { name: 'K9', field: this.generateUrl('K9'), show: this.actorId },
            { name: 'Barnetrygd', field: this.generateUrl('Barnetrygd'), show: true },
            { name: 'Enslig', label: 'Enslig forsørger', field: this.generateUrl('Enslig'), show: true },
            { name: 'Kontantstøtte', field: this.generateUrl('Kontantstøtte'), show: true },
            { name: 'Aktivitetsplan', field: this.generateUrl('Aktivitetsplan'), show: false },
            { name: 'Speil', field: this.generateUrl('Speil'), show: false }
        ];

        const listOfFilter =
            typeof this.filterList === 'string' ? this.filterList.replaceAll(' ', '').split(',') : this.filterList;
        this.fagsystemLinks = possibleLinks
            .filter((link) => listOfFilter.length === 0 || listOfFilter.includes(link.name))
            .map((link, index) => ({
                ...link,
                id: index,
                custom: link.field == null,
                show: link.show,
                name: link.label ?? link.name
            }));
    }

    generateUrl(fagsystem) {
        switch (fagsystem) {
            case 'Aktivitetsplan':
                return `https://veilarbpersonflate${this.isSandbox ? '.dev' : ''}.intern.nav.no/${this.personIdent}`;
            case 'Barnetrygd':
                return `https://barnetrygd.intern.nav.no/oppgaver`;
            case 'DinPensjon':
                return `https://pensjon-selvbetjening-dinpensjon-frontend-veileder${
                    this.isSandbox ? '-q2.intern.dev' : '.intern'
                }.nav.no/pensjon/selvbetjening/dinpensjon?pid=${this.personIdent}`;
            case 'DinUfore':
                return `https://pensjon-pselv${
                    this.isSandbox ? '-q1.nais.preprod.local' : '.nais.adeo.no'
                }/pselv/publisering/uforetrygd.jsf?_brukerId=${this.personIdent}&context=ut&_loggedOnName=${
                    this.navIdent
                }`;
            case 'Enslig':
                return `https://ensligmorellerfar.intern.nav.no/oppgavebenk`;
            case 'Foreldrepenger':
                return `https://fpsak${this.isSandbox ? '.dev' : ''}.intern.nav.no/aktoer/${this.actorId}`;
            case 'Gosys':
                return `https://gosys${this.isSandbox ? '-q1.dev' : ''}.intern.nav.no/gosys/personoversikt/fnr=${
                    this.personIdent
                }`;
            case 'Kontantstøtte':
                return 'https://kontantstotte.intern.nav.no/';
            case 'K9':
                return `https://k9.intern.nav.no/k9/web/aktoer/${this.actorId}`;
            case 'Modia':
                return `http://app${this.isSandbox ? '-qx' : ''}.adeo.no/modiapersonoversikt/${
                    this.isSandbox ? '' : 'person/'
                }${this.personIdent}`;
            case 'Pesys':
                return `https://pensjon-psak.nais.adeo.no/psak/brukeroversikt/fnr=${this.personIdent}`;
            case 'Speil':
                return `https://syfomodiaperson${this.isSandbox ? '.dev' : ''}.intern.nav.no/sykefravaer/personsok`;
            default:
                return null;
        }
    }

    handleAAClickOrKey(e) {
        if (e.type === 'click' || e.key === 'Enter') {
            // eslint-disable-next-line @locker/locker/distorted-window-fetch
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
                // eslint-disable-next-line @locker/locker/distorted-xml-http-request-window-open
                .then((a) => window.open(a))
                .catch((error) => {
                    console.error('An error occured while retrieving AA-reg link: ', error);
                    // eslint-disable-next-line @locker/locker/distorted-xml-http-request-window-open
                    window.open('https://arbeid-og-inntekt.nais.adeo.no/');
                });

            this.handleClick(e);
        }
    }

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
                    // eslint-disable-next-line @locker/locker/distorted-xml-http-request-window-open
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

    handleClick(event) {
        publishToAmplitude('Fagsystemer', { type: `${event.target.innerText}` });
    }
}
