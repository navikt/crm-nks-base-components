public with sharing class NKS_NavUnit {
    @AuraEnabled @invocableVariable
    public String enhetId;
    @AuraEnabled @invocableVariable
    public String navn;
    @AuraEnabled @invocableVariable
    public String enhetNr;
    @AuraEnabled @invocableVariable
    public Integer antallRessurser;
    @AuraEnabled @invocableVariable
    public String status;
    @AuraEnabled @invocableVariable
    public String orgNivaa;
    @AuraEnabled @invocableVariable
    public String type;
    @AuraEnabled @invocableVariable
    public String organisasjonsnummer;
    @AuraEnabled @invocableVariable
    public Date underEtableringDato;
    @AuraEnabled @invocableVariable
    public Date aktiveringsdato;
    @AuraEnabled @invocableVariable
    public Date underAvviklingDato;
    @AuraEnabled @invocableVariable
    public Date nedleggelsesdato;
    @AuraEnabled @invocableVariable
    public Boolean oppgavebehandler;
    @AuraEnabled @invocableVariable
    public Integer versjon;
    @AuraEnabled @invocableVariable
    public String sosialeTjenester;
    @AuraEnabled @invocableVariable
    public String kanalstrategi;
    @AuraEnabled @invocableVariable
    public String orgNrTilKommunaltNavKontor;

    public NKS_NavUnit() {
        this.enhetId = null;
        this.navn = null;
        this.enhetNr = null;
        this.antallRessurser = null;
        this.status = null;
        this.orgNivaa = null;
        this.type = null;
        this.organisasjonsnummer = null;
        this.underEtableringDato = null;
        this.aktiveringsdato = null;
        this.underAvviklingDato = null;
        this.nedleggelsesdato = null;
        this.oppgavebehandler = false;
        this.versjon = null;
        this.sosialeTjenester = null;
        this.kanalstrategi = null;
        this.orgNrTilKommunaltNavKontor = null;
    }
}
