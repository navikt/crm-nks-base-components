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

    private static final Map<String, String> TJENESTETILBUD_MAP = new Map<String, String>{
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

    private static String joinParts(List<String> parts) {
        String result = '';

        for (String part : parts) {
            if (String.isBlank(part)) {
                continue;
            }

            result += String.isBlank(result) ? part : ' ' + part;
        }

        return result;
    }

    private static String combineStreetAndPostal(List<String> streetParts, List<String> postalParts) {
        String street = joinParts(streetParts);
        String postal = joinParts(postalParts);

        if (String.isBlank(street)) {
            return postal;
        }

        if (String.isBlank(postal)) {
            return street;
        }

        return street + ', ' + postal;
    }

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
        @AuraEnabled
        public String adresseTilleggsnavn;
        @AuraEnabled
        public String gatenavn;
        @AuraEnabled
        public String husbokstav;
        @AuraEnabled
        public String husnummer;

        @AuraEnabled
        public String concatenatedAddress {
            get {
                return concatAddress();
            }
            private set;
        }

        private String concatAddress() {
            return NKS_NavUnitContactInformationV2.combineStreetAndPostal(
                new List<String>{
                    adresseTilleggsnavn,
                    isPostboksadresse() ? 'Postboks' : null,
                    postboksnummer,
                    postboksanlegg,
                    gatenavn,
                    husnummer,
                    husbokstav
                },
                new List<String>{ postnummer, poststed }
            );
        }

        private Boolean isPostboksadresse() {
            return String.isNotBlank(type) && type.equalsIgnoreCase('postboksadresse');
        }
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

        @AuraEnabled
        public String concatenatedAddress {
            get {
                return NKS_NavUnitContactInformationV2.combineStreetAndPostal(
                    new List<String>{ adresseTilleggsnavn, gatenavn, husnummer, husbokstav },
                    new List<String>{ postnummer, poststed }
                );
            }
            private set;
        }
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

        private String tempType;

        @AuraEnabled
        public String type {
            get {
                return tempType;
            }
            set {
                typeMapValue = value;
                tempType = TJENESTETILBUD_MAP.containsKey(value) ? TJENESTETILBUD_MAP.get(value) : value;
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
}
