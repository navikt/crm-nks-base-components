public with sharing class NKS_FullmaktController {
    private static LoggerUtility logger = new LoggerUtility('Fullmakt');

    @AuraEnabled(cacheable=true)
    public static List<FullmaktsgiverHistorikk> getFullmaktsgiverHistorikk(Id recordId, String objectApiName) {
        String personIdent = checkAccessAndGetPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }

        try {
            HttpResponse resp = FullmaktService.getFullmaktsgiverHistorikk(personIdent);
            if (resp.getStatusCode() == 200) {
                List<FullmaktsgiverHistorikkWrapper> historikkData = (List<FullmaktsgiverHistorikkWrapper>) JSON.deserialize(
                    resp.getBody(),
                    List<FullmaktsgiverHistorikkWrapper>.class
                );
                return getFullmaktsgiverHistorikkData(historikkData);
            } else {
                logError(resp, 'Error retrieving FullmaktsgiverHistorikk');
                throw new FullmaktException();
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving FullmaktsgiverHistorikk: ' + e.getMessage());
            throw new FullmaktException(e.getMessage());
        }
    }

    @TestVisible
    private static List<FullmaktsgiverHistorikk> getFullmaktsgiverHistorikkData(
        List<FullmaktsgiverHistorikkWrapper> historikkData
    ) {
        if (historikkData == null || historikkData.isEmpty()) {
            return null;
        }

        List<String> omdCodes = new List<String>();
        for (FullmaktsgiverHistorikkWrapper histResp : historikkData) {
            FullmaktsgiverHistorikkEndringer fullmaktsHistorikk = histResp.firstEndring;
            if (fullmaktsHistorikk != null) {
                List<Omraade> omraade = parseOmraade(fullmaktsHistorikk.omraade);
                for (Omraade omd : omraade) {
                    omdCodes.add(omd.tema);
                }
            }
        }
        Map<String, String> omdNameByOmdCode = getOmraadeNames(omdCodes);

        List<FullmaktsgiverHistorikk> historikkList = new List<FullmaktsgiverHistorikk>();
        for (FullmaktsgiverHistorikkWrapper histResp : historikkData) {
            FullmaktsgiverHistorikkEndringer fullmaktsHistorikk = histResp.firstEndring;
            if (fullmaktsHistorikk != null) {
                if(fullmaktsHistorikk.opphoert == true || (fullmaktsHistorikk.gyldigFraOgMed != null && Date.valueOf(fullmaktsHistorikk.gyldigTilOgMed) < Date.today())) {
                    FullmaktsgiverHistorikk historikk = new FullmaktsgiverHistorikk();
                    historikk.fullmektig = fullmaktsHistorikk.fullmektig;
                    historikk.omraade = getOmraader(parseOmraade(fullmaktsHistorikk.omraade), omdNameByOmdCode);
                    historikk.gyldigFraOgMed = getGyldigFraOgMed(fullmaktsHistorikk);
                    historikk.gyldigTilOgMed = getGyldigTilOgMed(fullmaktsHistorikk);
                    historikk.fullmektigsNavn = fullmaktsHistorikk.fullmektigsNavn;
                    historikk.opphoert = fullmaktsHistorikk.opphoert;
                    historikkList.add(historikk);
                    // Only show last 3 changes to historical power of attorney
                    if (historikkList.size() == 3) {
                        break;
                    }
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
                throw new FullmaktException();
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving Fullmaktsgiver: ' + e.getMessage());
            throw new FullmaktException(e.getMessage());
        }
    }

    @TestVisible
    private static List<Fullmaktsgiver> getFullmaktsgiverData(List<FullmaktsgiverWrapper> fullmaktsgiverData) {
        if (fullmaktsgiverData == null || fullmaktsgiverData.isEmpty()) {
            return null;
        }

        List<String> omdCodes = new List<String>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            fmResponse.omraadeList = parseOmraade(fmResponse.omraade);
            if (fmResponse.omraade != null) {
                for (Omraade omd : fmResponse.omraadeList) {
                    omdCodes.add(omd.tema);
                }
            }
        }
        Map<String, String> omdNameByOmdCode = getOmraadeNames(omdCodes);

        List<Fullmaktsgiver> fmList = new List<Fullmaktsgiver>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            Fullmaktsgiver fm = new Fullmaktsgiver();
            fm.motpartsPersonident = fmResponse.fullmektig;
            fm.omraade = getOmraader(fmResponse.omraadeList, omdNameByOmdCode);
            fm.gyldigFraOgMed = fmResponse.gyldigFraOgMed;
            fm.gyldigTilOgMed = fmResponse.gyldigTilOgMed;
            fm.motpartsNavn = fmResponse.fullmektigsNavn;
            fmList.add(fm);
        }
        return fmList;
    }

    public static String checkAccessAndGetPersonIdent(Id recordId, String objectApiName) {
        Id personId;
        if (objectApiName == 'Case') {
            personId = [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            personId = [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        } else if (objectApiName == 'Person__c') {
            personId = recordId;
        }
        if (personId == null) {
            return null;
        }
        if (!hasReadAccess(personId)) {
            return null;
        }
        return [SELECT Name FROM Person__c WHERE Id = :personId]?.Name;
    }

    private static Boolean hasReadAccess(Id personId) {
        Id userId = UserInfo.getUserId();
        return [SELECT RecordId, HasReadAccess FROM UserRecordAccess WHERE UserId = :userId AND RecordId = :personId]
        .HasReadAccess;
    }

    private static String getOmraader(List<Omraade> omraade, Map<String, String> omdNameByOmdCode) {
        if (omraade == null || omraade.isEmpty()) {
            return '';
        }
        List<String> omdTemaList = new List<String>();
        for (Omraade omd : omraade) {
            omdTemaList.add(omdNameByOmdCode.get(omd.tema) != null ? omdNameByOmdCode.get(omd.tema) : omd.tema);
        }
        if ('*'.equalsIgnoreCase(omdTemaList[0])) {
            return 'Gjelder alle ytelser';
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

    // omraade response in history can be both array, string and semicolon separated string
    private static List<Omraade> parseOmraade(String omraadeStr) {
        List<Omraade> omraadeList = new List<Omraade>();
        if (String.isBlank(omraadeStr)) {
            return omraadeList;
        }
        if (isJsonArray(omraadeStr)) {
            omraadeList = (List<Omraade>) JSON.deserialize(omraadeStr, List<Omraade>.class);
        } else if (omraadeStr.contains(';')) {
            for (String tema : omraadeStr.split(';')) {
                Omraade omraade = new Omraade();
                omraade.tema = tema;
                omraadeList.add(omraade);
            }
        } else {
            Omraade omraade = new Omraade();
            omraade.tema = omraadeStr;
            omraadeList.add(omraade);
        }
        return omraadeList;
    }

    private static Boolean isJsonArray(String jsonString) {
        try {
            JSONParser parser = JSON.createParser(jsonString);
            while (parser.nextToken() != null) {
                if (parser.getCurrentToken() == JSONToken.START_ARRAY) {
                    return true;
                }
            }
        } catch (JSONException e) {
            return false;
        }
        return false;
    }

    private static void logError(HttpResponse resp, String message) {
        logger.error(
            message +
                '\n ' +
                'Status code: ' +
                resp.getStatusCode() +
                '\n' +
                'Status: ' +
                resp.getStatus() +
                '\n' +
                'Body: ' +
                resp.getBody(),
            null,
            CRM_ApplicationDomain.Domain.NKS
        );
        logger.publish();
    }

    @TestVisible
    private static void logError(String message) {
        logger.error(message + '\n ', null, CRM_ApplicationDomain.Domain.NKS);
        logger.publish();
    }

    //
    // WRAPPERS
    //

    public class FullmaktsgiverHistorikkWrapper {
        public String fullmaktId;
        public List<FullmaktsgiverHistorikkEndringer> fullmaktEndringsloggDetails;
        public FullmaktsgiverHistorikkEndringer firstEndring {
            get {
                if (!fullmaktEndringsloggDetails.isEmpty()) {
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
        @AuraEnabled
        public Boolean opphoert;
        @AuraEnabled
        public String status {
            get {
                if(opphoert == true) {
                    return 'Avsluttet';
                }
                return 'Utløpt';
            }
        }
    }

    public class FullmaktsgiverHistorikkEndringer {
        public String fullmaktsgiver;
        public String fullmektig;
        public String omraade;
        public Date gyldigFraOgMed;
        public Date gyldigTilOgMed;
        public String fullmaktsgiverNavn;
        public String fullmektigsNavn;
        public Boolean opphoert;
        public String kilde;
        public String kommentar;
    }

    public class FullmaktsgiverWrapper {
        public String fullmaktsgiver;
        public String fullmektig;
        public String omraade;
        public List<Omraade> omraadeList;
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

    public virtual class Fullmaktsgiver {
        @AuraEnabled
        public String motpartsRolle;
        @AuraEnabled
        public String motpartsPersonident;
        @AuraEnabled
        public String motpartsNavn;
        @AuraEnabled
        public String omraade;
        @AuraEnabled
        public List<String> omraader {
            get {
                return omraade?.split(', ');
            }
            set;
        }
        @AuraEnabled
        public Date gyldigFraOgMed;
        @AuraEnabled
        public Date gyldigTilOgMed;
        @AuraEnabled
        public String id;
    }

    public class FullmaktException extends Exception {

    }
}
