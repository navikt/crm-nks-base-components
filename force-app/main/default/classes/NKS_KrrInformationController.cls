public without sharing class NKS_KrrInformationController {
    static LoggerUtility logger = new LoggerUtility();

    @AuraEnabled
    public static KrrData getKrrInformation(String personIdent) {
        try {
            List<KrrCalloutService.Person> personer = KrrCalloutService.doPersonOppslag2(
                new List<String>{ personIdent },
                null
            );
            if (personer != null && !personer.isEmpty()) {
                KrrData data = new KrrData();
                data.email = personer[0]?.epostadresse;
                data.mobilePhone = personer[0]?.mobiltelefonnummer;
                data.verified = sistVerifisertDato(personer[0]);
                data.reservation = personer[0]?.reservert == null ? false : personer[0]?.reservert;
                data.language = personer[0]?.spraak;
                data.krrLastUpdated = Datetime.now();
                return data;
            }
            return null;
        } catch (Exception e) {
            logger.exception(e, null, CRM_ApplicationDomain.Domain.NKS);
            logger.publish();
            throw new AuraHandledException('Failed to refresh KRR information.');
        }
    }

    public class KrrData {
        @AuraEnabled
        public String email;
        @AuraEnabled
        public String mobilePhone;
        @AuraEnabled
        public Datetime verified;
        @AuraEnabled
        public Boolean reservation;
        @AuraEnabled
        public String language;
        @AuraEnabled
        public Datetime krrLastUpdated;
    }

    private static Datetime sistVerifisertDato(KrrCalloutService.Person pers) {
        Datetime emailVerifisertDato = pers?.epostadresseVerifisert;
        Datetime mobileVerifisertDato = pers?.mobiltelefonnummerVerifisert;
        if (emailVerifisertDato != null && mobileVerifisertDato != null) {
            if (emailVerifisertDato < mobileVerifisertDato) {
                return mobileVerifisertDato;
            }
            return emailVerifisertDato;
        } else if (emailVerifisertDato != null)
            return emailVerifisertDato;
        else if (mobileVerifisertDato != null)
            return mobileVerifisertDato;
        else
            return null;
    }
}
