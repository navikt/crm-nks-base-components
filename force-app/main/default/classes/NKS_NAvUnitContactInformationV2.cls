public with sharing class NKS_NAvUnitContactInformationV2 {
    public String enhetNr;
    public String navn;
    public String telefonnummer;
    public String telefonnummerKommentar;
    public Adresse postadresse;
    public Stedsadresse besoeksadresse;
    public String spesielleOpplysninger;
    public Brukerkontakt brukerkontakt;

    public class Adresse {
        public String postnummer;
        public String poststed;
        public String type;
        public String postboksnummer;
        public String postboksanlegg;
    }

    public class Brukerkontakt {
        public List<PublikumsmottakV2> publikumsmottak;
        public List<BrukerKontaktKanal> publikumskanaler;
        public BrukertjenesteTilbud brukertjenesteTilbud;
        public Sosialhjelp sosialhjelp;
        public String informasjonUtbetaling;
        public String skriftspraak;
    }

    public class PublikumsmottakV2 {
        public Stedsadresse besoeksadresse;
        public List<AapningstidV2> aapningstider;
        public String stedsbeskrivelse;
        public String adkomstbeskrivelse;
    }

    public class Stedsadresse {
        public String type;
        public String postnummer;
        public String poststed;
        public String gatenavn;
        public String husnummer;
        public String husbokstav;
        public String adresseTilleggsnavn;
    }

    public class AapningstidV2 {
        public String dag;
        public String dato;
        public String fra;
        public String til;
        public String kommentar;
        public Boolean stengt;
        public Boolean kunTimeavtale;
    }

    public class BrukerKontaktKanal {
        public String beskrivelse;
        public String telefon;
        public String epost;
        public Integer sortOrder;
    }

    public class BrukertjenesteTilbud {
        public List<Tjenestetilbud> tjenester;
        public String ytterligereInformasjon;
    }

    public class Tjenestetilbud {
        public String type;
    }

    public class Sosialhjelp {
        public List<SosialhjelpDigitalSoknad> digitaleSoeknader;
        public String papirsoeknadInformasjon;
    }

    public class SosialhjelpDigitalSoknad {
        public String lenke;
        public String lenketekst;
    }
}
