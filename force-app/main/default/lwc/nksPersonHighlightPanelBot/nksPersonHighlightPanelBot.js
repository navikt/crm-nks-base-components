// @ts-nocheck
import { LightningElement, api, wire } from 'lwc';
import getData from '@salesforce/apex/NKS_FagsystemController.getFagsystemData';
import getFagsoneIpAndOrgType from '@salesforce/apex/NKS_FagsystemController.getFagsoneIpAndOrgType';
import getEncryptedPensjonLink from '@salesforce/apex/NKS_FagsystemController.postPensjonPidEncrypt';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publishToAmplitude } from 'c/amplitude';
import getUserSkills from '@salesforce/apex/NKS_Utils.getUserSkills';

export default class NksPersonHighlightPanelBot extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relatedField;
    @api hasPersonId;
    @api filterList = [];
    @api fullName;
    @api personIdent;

    personInfo;
    fagsystemLinks = [];
    inFagsone;
    fagsoneText = '';
    isSandbox = false;
    wiredRecordData;
    actorId;
    navIdent;
    userSkills = [];

    @wire(getUserSkills)
    wiredGetUserSkills({ error, data }) {
        if (data) {
            this.userSkills = data;
            this.filterLinks();
        } else if (error) {
            console.error('Problem on getting user skills', JSON.stringify(error));
        }
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
        this.personIdent = this.wiredRecordData?.personIdent;
        this.actorId = this.wiredRecordData?.actorId;
        this.filterLinks();
    }

    filterLinks() {
        const skillSet = new Set(
            (Array.isArray(this.userSkills) ? this.userSkills : [])
                .map((s) => String(s).trim().toLowerCase())
                .filter(Boolean)
        );

        const linkToSkills = new Map([
            ['modia', []],
            ['gosys', []],
            ['speil', ['helse', 'internasjonal']],
            ['aa-reg', ['arbeid', 'internasjonal']],
            ['dinpensjon', ['pensjon', 'internasjonal']],
            ['dinufore', ['ufoeretrygd', 'internasjonal']],
            ['pesys', ['pensjon', 'ufoeretrygd', 'internasjonal']],
            ['foreldrepenger', ['familie', 'pleiepenger', 'internasjonal']],
            ['k9', ['familie', 'pleiepenger', 'internasjonal']],
            ['barnetrygd', ['familie', 'pleiepenger', 'internasjonal']],
            ['enslig', ['familie', 'pleiepenger', 'internasjonal']],
            ['kontantstøtte', ['familie', 'pleiepenger', 'internasjonal']]
        ]);

        const isAllowedBySkill = (linkName) => {
            const key = String(linkName).toLowerCase();
            const requiredSkills = linkToSkills.get(key);
            if (!requiredSkills) return true;
            if (requiredSkills.length === 0) return true;
            return requiredSkills.some((skill) => skillSet.has(skill));
        };

        const possibleLinks = [
            { name: 'Modia', field: this.generateUrl('Modia'), show: !!this.personIdent },
            { name: 'Gosys', field: this.generateUrl('Gosys'), show: !!this.personIdent },
            { name: 'SPEIL', field: this.generateUrl('Speil'), show: true },
            {
                name: 'AA-reg',
                field: null,
                eventFunc: this.handleAAClickOrKey,
                title: 'AA-register',
                show: !!this.personIdent
            },
            {
                name: 'DinPensjon',
                label: 'Din Pensjon',
                field: null,
                eventFunc: this.handleDinPensjonClickOrKey,
                title: 'Din Pensjon',
                show: !!this.personIdent
            },
            {
                name: 'DinUfore',
                label: 'Din Uføretrygd',
                eventFunc: this.handleDinUføretrygdClickOrKey,
                field: null,
                title: 'Din Uføretrygd',
                show: !!this.personIdent && !!this.navIdent
            },
            {
                name: 'Pesys',
                field: null,
                eventFunc: this.handlePesysClickOrKey,
                title: 'Pesys',
                show: !!this.personIdent
            },
            { name: 'Foreldrepenger', field: this.generateUrl('Foreldrepenger'), show: !!this.actorId },
            { name: 'K9', field: this.generateUrl('K9'), show: !!this.actorId },
            { name: 'Barnetrygd', field: this.generateUrl('Barnetrygd'), show: true },
            { name: 'Enslig', label: 'Enslig forsørger', field: this.generateUrl('Enslig'), show: true },
            { name: 'Kontantstøtte', field: this.generateUrl('Kontantstøtte'), show: true }
        ];

        const listOfFilter =
            typeof this.filterList === 'string'
                ? this.filterList.replaceAll(' ', '').split(',').filter(Boolean)
                : Array.isArray(this.filterList)
                ? this.filterList
                : [];

        this.fagsystemLinks = possibleLinks
            .filter((link) => {
                if (!link.show) return false;
                if (listOfFilter.length > 0 && !listOfFilter.includes(link.name)) return false;
                return isAllowedBySkill(link.name);
            })
            .map((link, index) => ({
                ...link,
                id: index,
                custom: link.field == null,
                name: link.label ?? link.name
            }));
    }

    generateUrl(fagsystem) {
        switch (fagsystem) {
            case 'Barnetrygd':
                return `https://barnetrygd.intern.nav.no/oppgaver`;
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
                return `https://modiapersonoversikt.intern${this.isSandbox ? '.dev' : ''}.nav.no/person/${
                    this.personIdent
                }`;
            case 'Speil':
                return 'https://speil.ansatt.nav.no/';
            default:
                return null;
        }
    }

    validKeyEvent(e) {
        return e.type === 'click' || e.key === 'Enter';
    }

    handleAAClickOrKey(e) {
        if (this.validKeyEvent(e)) {
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

            //this.handleClick(e);
        }
    }

    handleDinUføretrygdClickOrKey(e) {
        if (!this.validKeyEvent(e)) return;
        const urlMethod = (encryptedIdent) => {
            return `https://uforetrygd-selvbetjening-frontend-veileder.intern.${
                this.isSandbox ? 'dev.' : ''
            }nav.no/uforetrygd/selvbetjening?pid=${encryptedIdent}`;
        };
        const errorMethod = (error) => {
            if (error) {
                console.error('An error occured while encrypting Din Uføretrygd link: ', error);
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Klarte ikke å åpne Din Uføretrygd',
                    message: 'Vennligst prøv på nytt eller naviger direkte',
                    variant: 'error'
                })
            );
        };
        this.handleEncryptedPensjonLink(e, urlMethod, errorMethod);
    }

    handleDinPensjonClickOrKey(e) {
        if (!this.validKeyEvent(e)) return;
        const urlMethod = (encryptedIdent) => {
            return `https://pensjon-selvbetjening-dinpensjon-frontend-veileder${
                this.isSandbox ? '-q2.intern.dev' : '.intern'
            }.nav.no/pensjon/selvbetjening/dinpensjon?pid=${encryptedIdent}`;
        };
        const errorMethod = (error) => {
            if (error) {
                console.error('An error occured while encrypting Din Pensjon link: ', error);
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Klarte ikke å åpne Din Pensjon',
                    message: 'Vennligst prøv på nytt eller naviger direkte',
                    variant: 'error'
                })
            );
        };
        this.handleEncryptedPensjonLink(e, urlMethod, errorMethod);
    }

    handlePesysClickOrKey(e) {
        if (!this.validKeyEvent(e)) return;
        const urlMethod = (encryptedIdent) => {
            return `https://pensjon-psak.nais.adeo.no/psak/brukeroversikt/fnr=${encryptedIdent}`;
        };
        const errorMethod = (error) => {
            if (error) {
                console.error('An error occured while encrypting Pesys link: ', error);
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Klarte ikke å åpne Pesys',
                    message: 'Vennligst prøv på nytt eller naviger direkte',
                    variant: 'error'
                })
            );
        };
        this.handleEncryptedPensjonLink(e, urlMethod, errorMethod);
    }

    handleEncryptedPensjonLink(e, urlMethod, errorMethod) {
        getEncryptedPensjonLink({ personIdent: this.personIdent })
            .then((encryptedIdent) => {
                if (!encryptedIdent) {
                    errorMethod();
                    return;
                }
                const url = urlMethod(encryptedIdent);
                // eslint-disable-next-line @locker/locker/distorted-xml-http-request-window-open
                window.open(url);
            })
            .catch(errorMethod);
        //this.handleClick(e);
    }

    /*handleSosialModiaClickOrKey(e) {
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
    }*/

    handleClick(event) {
        //publishToAmplitude('Fagsystemer', { type: `${event.target.innerText}` });
    }
}
