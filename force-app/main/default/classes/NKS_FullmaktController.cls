public with sharing class NKS_FullmaktController {
    private static LoggerUtility logger = new LoggerUtility('Fullmakt');
    public static String checkAccessAndGetPersonIdent(Id recordId, String objectApiName) {
        Id personId;
        if (objectApiName == 'Case') {
            personId = [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            personId = [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        } else if (objectApiName == 'Person__c') {
            personId = recordId;
        }
        if (personId == null)
            return null;

        Id userId = UserInfo.getUserId();
        Boolean access = [
            SELECT RecordId, HasReadAccess
            FROM UserRecordAccess
            WHERE UserId = :userId AND RecordId = :personId
        ]
        .HasReadAccess;
        if (!access) {
            return null;
        }
        return [SELECT Name FROM Person__c WHERE Id = :personId]?.Name;
    }

    @AuraEnabled(cacheable=true)
    public static List<FullmaktsgiverHistorikk> getHistorikk(Id recordId, String objectApiName) {
        System.debug('hallo');
        String personIdent = checkAccessAndGetPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }
        System.debug('personIdent: ' + personIdent);
        try {
            System.debug('yo');
            HttpResponse resp = FullmaktService.getFullmaktsgiverHistorikk(personIdent);
            System.debug('dafuq');
            if (resp.getStatusCode() == 200) {
                List<FullmaktsgiverHistorikkWrapper> historikkData = (List<FullmaktsgiverHistorikkWrapper>) JSON.deserialize(
                    resp.getBody(),
                    List<FullmaktsgiverHistorikkWrapper>.class
                );
                System.debug('Response Body: ' + historikkData);
                return getFullmaktHistorikk(historikkData);
            } else {
                logError(resp, 'Error retrieving FullmaktsgiverHistorikk');
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving FullmaktsgiverHistorikk: ' + e.getMessage());
        }
        return null;
    }

    @TestVisible
    private static List<FullmaktsgiverHistorikk> getFullmaktHistorikk(
        List<FullmaktsgiverHistorikkWrapper> historikkData
    ) {
        if (historikkData == null && historikkData.isEmpty()) {
            return null;
        }
        System.debug('hallo');
        // Add tema to list
        List<String> omdCodes = new List<String>();
        for (FullmaktsgiverHistorikkWrapper histResp : historikkData) {
            FullmaktsgiverHistorikkEndringer fullmaktsHistorikk = histResp.firstEndring;
            if (fullmaktsHistorikk != null) {
                System.debug('fullmaktsHistorikk.omraade: ' + fullmaktsHistorikk.omraade);
                List<Omraade> omraade = (List<Omraade>) JSON.deserialize(
                    fullmaktsHistorikk.omraade,
                    List<Omraade>.class
                );
                // TODO: Sometimes omraade is not an array. Find fix.
                System.debug('omraade: ' + omraade);
                if (omraade != null && !omraade.isEmpty()) {
                    for (Omraade omd : omraade) {
                        omdCodes.add(omd.tema);
                    }
                }
            }
        }
        System.debug('omdCodes: ' + omdCodes);
        Map<String, String> omdNameByOmdCode = getOmraadeNames(omdCodes);
        System.debug('omdNameByOmdCode: ' + omdNameByOmdCode);
        List<FullmaktsgiverHistorikk> historikkList = new List<FullmaktsgiverHistorikk>();
        for (FullmaktsgiverHistorikkWrapper histResp : historikkData) {
            FullmaktsgiverHistorikkEndringer fullmaktsHistorikk = histResp.firstEndring;
            if (fullmaktsHistorikk != null) {
                FullmaktsgiverHistorikk historikk = new FullmaktsgiverHistorikk();
                historikk.fullmektig = fullmaktsHistorikk.fullmektig;
                List<Omraade> omraade = (List<Omraade>) JSON.deserialize(
                    fullmaktsHistorikk.omraade,
                    List<Omraade>.class
                );
                historikk.omraade = getOmraader(omraade, omdNameByOmdCode);
                System.debug('historikk.omraade: ' + historikk.omraade);
                historikk.gyldigFraOgMed = getGyldigFraOgMed(fullmaktsHistorikk);
                historikk.gyldigTilOgMed = getGyldigTilOgMed(fullmaktsHistorikk);
                historikk.fullmektigsNavn = fullmaktsHistorikk.fullmektigsNavn;
                historikkList.add(historikk);
                if (historikkList.size() == 3) {
                    break;
                }
            }
        }
        return historikkList;
    }

    @AuraEnabled(cacheable=true)
    public static List<Fullmaktsgiver> getFullmaktsgiver(Id recordId, String objectApiName) {
        String personIdent = checkAccessAndGetPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }

        try {
            HttpResponse resp = FullmaktService.getFullmaktsgiver(personIdent);
            if (resp.getStatusCode() == 200) {
                List<FullmaktsgiverWrapper> fullmaktsgiverData = (List<FullmaktsgiverWrapper>) JSON.deserialize(
                    resp.getBody(),
                    List<FullmaktsgiverWrapper>.class
                );
                return getFullmaktsgiverData(fullmaktsgiverData);
            } else {
                logError(resp, 'Error retrieving Fullmaktsgiver');
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving Fullmaktsgiver: ' + e.getMessage());
        }
        return null;
    }

    @TestVisible
    private static List<Fullmaktsgiver> getFullmaktsgiverData(List<FullmaktsgiverWrapper> fullmaktsgiverData) {
        if (fullmaktsgiverData == null || fullmaktsgiverData.isEmpty()) {
            return null;
        }

        List<String> omdCodes = new List<String>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            if (fmResponse.omraade != null) {
                for (Omraade omd : fmResponse.omraade) {
                    omdCodes.add(omd.tema);
                }
            }
        }
        Map<String, String> omdNameByOmdCode = getOmraadeNames(omdCodes);

        List<Fullmaktsgiver> fmList = new List<Fullmaktsgiver>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            Fullmaktsgiver fm = new Fullmaktsgiver();
            fm.motpartsPersonident = fmResponse.fullmektig;
            fm.omraader = getOmraader(fmResponse.omraade, omdNameByOmdCode).split(', ');
            fm.gyldigFraOgMed = fmResponse.gyldigFraOgMed;
            fm.gyldigTilOgMed = fmResponse.gyldigTilOgMed;
            fm.motpartsNavn = fmResponse.fullmektigsNavn;
            fm.motpartsRolle = 'Fullmektig';
            fmList.add(fm);
        }
        return fmList;
    }

    private static String getOmraader(List<Omraade> omraade, Map<String, String> omdNameByOmdCode) {
        if (omraade == null || omraade.isEmpty()) {
            return '';
        }
        List<String> omdTemaList = new List<String>();
        for (Omraade omd : omraade) {
            omdTemaList.add(omdNameByOmdCode.get(omd.tema) != null ? omdNameByOmdCode.get(omd.tema) : omd.tema);
        }
        return String.join(omdTemaList, ', ');
    }

    private static Map<String, String> getOmraadeNames(List<String> omdList) {
        if (omdList == null || omdList.isEmpty()) {
            return new Map<String, String>();
        }

        List<Common_Code__c> omdNames = [
            SELECT Name, CRM_Code__c
            FROM Common_Code__c
            WHERE CRM_Code__c IN :omdList AND CRM_Code_Set__c = 'Tema'
        ];

        Map<String, String> omdNameByOmdCode = new Map<String, String>();
        for (Common_Code__c oCode : omdNames) {
            omdNameByOmdCode.put(oCode.CRM_Code__c, oCode.Name);
        }
        return omdNameByOmdCode;
    }

    private static String getGyldigFraOgMed(FullmaktsgiverHistorikkEndringer fmResp) {
        return fmResp.gyldigFraOgMed == null ? null : formatDate(fmResp.gyldigFraOgMed);
    }

    private static String getGyldigTilOgMed(FullmaktsgiverHistorikkEndringer fmResp) {
        return fmResp.gyldigTilOgMed == null ? null : formatDate(fmResp.gyldigTilOgMed);
    }

    private static String formatDate(Date d) {
        return d == null ? null : DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('dd.MM.yyyy');
    }

    private static void logError(HttpResponse resp, String message) {
        logger.error(
            message + '\n ' + 'Status: ' + resp.getStatus() + '\n' + 'Body: ' + resp.getBody(),
            null,
            CRM_ApplicationDomain.Domain.NKS
        );
        logger.publish();
    }

    private static void logError(String message) {
        logger.error(message + '\n ', null, CRM_ApplicationDomain.Domain.NKS);
        logger.publish();
    }

    // WRAPPERS //

    public class FullmaktsgiverHistorikkWrapper {
        public String fullmaktId;
        public List<FullmaktsgiverHistorikkEndringer> fullmaktEndringsloggDetails;
        public FullmaktsgiverHistorikkEndringer firstEndring {
            get {
                if (fullmaktEndringsloggDetails.size() > 0) {
                    return fullmaktEndringsloggDetails[0];
                }
                return null;
            }
        }
    }

    public class FullmaktsgiverHistorikk {
        @AuraEnabled
        public String fullmektig;
        @AuraEnabled
        public String omraade;
        @AuraEnabled
        public String gyldigFraOgMed;
        @AuraEnabled
        public String gyldigTilOgMed;
        @AuraEnabled
        public String periode {
            get {
                if (gyldigFraOgMed != null && gyldigTilOgMed != null)
                    return gyldigFraOgMed + '-' + gyldigTilOgMed;
                if (gyldigFraOgMed != null)
                    return gyldigFraOgMed + '- Tidsubegrenset';
                return '';
            }
        }
        @AuraEnabled
        public String fullmektigsNavn;
    }

    public class FullmaktsgiverHistorikkEndringer {
        public String fullmaktsgiver;
        public String fullmektig;
        public String omraade;
        public Date gyldigFraOgMed;
        public Date gyldigTilOgMed;
        public String fullmaktsgiverNavn;
        public String fullmektigsNavn;
        public String opphoert;
        public String kilde;
        public String kommentar;
    }

    public class FullmaktsgiverWrapper {
        public String fullmaktsgiver;
        public String fullmektig;
        public List<Omraade> omraade;
        public Date gyldigFraOgMed;
        public Date gyldigTilOgMed;
        public String fullmaktsgiverNavn;
        public String fullmektigsNavn;
        public String opphoert;
        public String status;
        public String kilde;
    }

    public class Omraade {
        public String tema;
        public List<String> handling;
    }

    public class Fullmaktsgiver {
        @AuraEnabled
        public String motpartsRolle;
        @AuraEnabled
        public String motpartsPersonident;
        @AuraEnabled
        public String motpartsNavn;
        @AuraEnabled
        public List<String> omraader;
        @AuraEnabled
        public String omraade {
            get {
                return omraadeString();
            }
            set;
        }
        @AuraEnabled
        public Date gyldigFraOgMed;
        @AuraEnabled
        public Date gyldigTilOgMed;
        @AuraEnabled
        public String id;

        private String omraadeString() {
            if (omraader == null || omraader.isEmpty()) {
                return '';
            }
            if (omraader.size() == 1 && '*'.equalsIgnoreCase(omraader[0])) {
                return 'Gjelder alle ytelser';
            } else {
                return String.join(omraader, ',');
            }
        }
    }
}
