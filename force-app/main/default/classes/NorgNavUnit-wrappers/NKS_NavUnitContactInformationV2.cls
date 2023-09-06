public with sharing class NKS_NavUnitContactInformationV2 {
    @AuraEnabled
    public String enhetNr;
    @AuraEnabled
    public String navn;
    @AuraEnabled
    public String telefonnummer;
    @AuraEnabled
    public String telefonnummerKommentar;
    @AuraEnabled
    public Adresse postadresse;
    @AuraEnabled
    public Stedsadresse besoeksadresse;
    @AuraEnabled
    public String spesielleOpplysninger;
    @AuraEnabled
    public Brukerkontakt brukerkontakt;

    public class Adresse {
        @AuraEnabled
        public String postnummer;
        @AuraEnabled
        public String poststed;
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String postboksnummer;
        @AuraEnabled
        public String postboksanlegg;
    }

    public class Brukerkontakt {
        @AuraEnabled
        public List<PublikumsmottakV2> publikumsmottak;
        @AuraEnabled
        public List<BrukerKontaktKanal> publikumskanaler;
        @AuraEnabled
        public BrukertjenesteTilbud brukertjenesteTilbud;
        @AuraEnabled
        public Sosialhjelp sosialhjelp;
        @AuraEnabled
        public String informasjonUtbetalinger;
        @AuraEnabled
        public String skriftspraak;
    }

    public class PublikumsmottakV2 {
        @AuraEnabled
        public Stedsadresse besoeksadresse;
        @AuraEnabled
        public List<AapningstidV2> aapningstider;
        @AuraEnabled
        public String stedsbeskrivelse;
        @AuraEnabled
        public String adkomstbeskrivelse;
    }

    public class Stedsadresse {
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String postnummer;
        @AuraEnabled
        public String poststed;
        @AuraEnabled
        public String gatenavn;
        @AuraEnabled
        public String husnummer;
        @AuraEnabled
        public String husbokstav;
        @AuraEnabled
        public String adresseTilleggsnavn;
    }

    public class AapningstidV2 {
        @AuraEnabled
        public String dag;
        @AuraEnabled
        public String dato;
        @AuraEnabled
        public String fra;
        @AuraEnabled
        public String til;
        @AuraEnabled
        public String kommentar;
        @AuraEnabled
        public Boolean stengt;
        @AuraEnabled
        public Boolean kunTimeavtale;
    }

    public class BrukerKontaktKanal {
        @AuraEnabled
        public String beskrivelse;
        @AuraEnabled
        public String telefon;
        @AuraEnabled
        public String epost;
        @AuraEnabled
        public Integer sortOrder;
    }

    public class BrukertjenesteTilbud {
        @AuraEnabled
        public List<Tjenestetilbud> tjenester;
        @AuraEnabled
        public String ytterligereInformasjon;
    }

    public class Tjenestetilbud {
        @AuraEnabled
        public String typeMapValue;
        @AuraEnabled
        public String type {
            get {
                return type;
            }
            set {
                typeMapValue = value;
                type = TjenestetilbudMap.get(value);
            }
        }
    }

    public class Sosialhjelp {
        @AuraEnabled
        public List<SosialhjelpDigitalSoknad> digitaleSoeknader;
        @AuraEnabled
        public String papirsoeknadInformasjon;
    }

    public class SosialhjelpDigitalSoknad {
        @AuraEnabled
        public String lenke;
        @AuraEnabled
        public String lenketekst;
    }

    public static Map<String, String> TjenestetilbudMap = new Map<String, String>{
        'BARNEVERNTJENESTE' => 'Barneverntjeneste',
        'FLYKTNINGTJENESTE' => 'Flyktningtjeneste',
        'FENGSEL_OPPFOLGING' => 'Oppfølging av personer i fengsel',
        'RUS_OPPFOLGING' => 'Oppfølging av personer med rusproblemer',
        'PSYKISK_HELSE_OPPFOLGING' => 'Oppfølging av personer med psykisk helseproblemer',
        'STARTLAN' => 'Startlån og tilskudd fra kommunen',
        'SJOFARTSOPPGAVER' => 'Utstedelse av sjøfartsbok og formidling av sjøfolk',
        'AKTIVITETSKORTET' => 'Aktivitetskortet for barn og unge',
        'BOSTOTTE_HUSBANKEN' => 'Bostøtte fra Husbanken',
        'BOSTOTTE_KOMMUNEN' => 'Bostøtte fra kommunen',
        'PRIVATOKONOMI_FORVALTNING' => 'Frivillig og tvungen forvaltning av privatøkonomi',
        'INTROPROGRAMMET' => 'Introduksjonsprogrammet',
        'KOMMUNAL_BOLIG' => 'Kommunal bolig',
        'KOMMUNAL_TILLEGGSPENSJON' => 'Kommunal tilleggspensjon',
        'KOMMUNALT_FRIKORT_HELSETJENESTER' => 'Kommunalt frikort for helsetjenester',
        'LEDSAGERBEVIS' => 'Ledsagerbevis',
        'PARKERING_FORFLYTNINGSHEMMEDE' => 'Parkeringstillatelse for forflytningshemmede',
        'REDUSERT_FORELDREBETALING' => 'Redusert foreldrebetaling i barnehage eller SFO',
        'SKJENKEBEVILLING' => 'Skjenkebevilling',
        'STOTTEKONTAKT' => 'Støttekontakt',
        'TILRETTELAGT_TRANSPORT' => 'Tilrettelagt transport (TT-kort)'
    };
}
