public with sharing class NKS_FullmaktController {
    private static LoggerUtility logger = new LoggerUtility('Fullmakt');

    @AuraEnabled(cacheable=true)
    public static List<FullmaktsgiverHistorikk> getHistorikk(Id recordId, String objectApiName) {
        String personIdent = fetchPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }

        try {
            HttpResponse resp = FullmaktService.getFullmaktsgiverHistorikk(personIdent);
            if (resp.getStatusCode() == 200) {
                List<HistorikkWrapper> historikkData = (List<HistorikkWrapper>) JSON.deserialize(
                    resp.getBody(),
                    List<HistorikkWrapper>.class
                );

                return processHistorikkData(historikkData);
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
    private static List<FullmaktsgiverHistorikk> processHistorikkData(
        List<HistorikkWrapper> historikkData
    ) {
        if (historikkData == null || historikkData.isEmpty()) {
            return null;
        }

        Set<String> omraader = extractOmraaderFromOmraadeList(historikkData).keySet();
        Map<String, String> omraadeNameByOmraadeTema = getOmraadeNamesFromCommonCodes(omraader);
        
        List<FullmaktsgiverHistorikk> historikkList = new List<FullmaktsgiverHistorikk>();
        for (HistorikkWrapper historikkResponse : historikkData) {
            HistorikkEndringer sisteEndring = historikkResponse.sisteEndring;
            if (sisteEndring != null && (sisteEndring.opphoert == true || (sisteEndring.gyldigFraOgMed != null && Date.valueOf(sisteEndring.gyldigTilOgMed) < Date.today()))) {
                historikkList.add(mapToHistorikk(sisteEndring, omraadeNameByOmraadeTema));
                if (historikkList.size() == 3) { // Only show last 3 changes to historical power of attorney
                    break;
                }
            }
        }
        return historikkList;
    }

    @AuraEnabled(cacheable=true)
    public static List<Fullmaktsgiver> getFullmaktsgiver(Id recordId, String objectApiName) {
        String personIdent = fetchPersonIdent(recordId, objectApiName);
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
                
                return processFullmaktsgiverData(fullmaktsgiverData);
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
    private static List<Fullmaktsgiver> processFullmaktsgiverData(List<FullmaktsgiverWrapper> fullmaktsgiverData) {
        if (fullmaktsgiverData == null || fullmaktsgiverData.isEmpty()) {
            return null;
        }

        Map<String, List<String>> handlingerByOmraadeTema = extractOmraaderFromOmraadeList(fullmaktsgiverData);
        Map<String, String> omraadeNameByOmraadeTema = getOmraadeNamesFromCommonCodes(handlingerByOmraadeTema.keySet());
        Map<String, List<String>> handlingerByOmraadeName = setHandlingerByOmraadeName(handlingerByOmraadeTema, omraadeNameByOmraadeTema);

        List<Fullmaktsgiver> fmList = new List<Fullmaktsgiver>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            fmList.add(mapToFullmaktsgiver(fmResponse, handlingerByOmraadeName));
        }
        return fmList;
    }

    private static FullmaktsgiverHistorikk mapToHistorikk(HistorikkEndringer sisteEndring, Map<String, String> omraadeNameByOmraadeTema) {
        FullmaktsgiverHistorikk historikk = new FullmaktsgiverHistorikk();
        historikk.fullmektig = sisteEndring.fullmektig;
        historikk.omraade = setOmraadeString(parseOmraadeIntoList(sisteEndring.omraade), omraadeNameByOmraadeTema);
        historikk.gyldigFraOgMed = getGyldigFraOgMed(sisteEndring);
        historikk.gyldigTilOgMed = getGyldigTilOgMed(sisteEndring);
        historikk.fullmektigsNavn = sisteEndring.fullmektigsNavn;
        historikk.opphoert = sisteEndring.opphoert;
        return historikk;
    }

    private static Fullmaktsgiver mapToFullmaktsgiver(FullmaktsgiverWrapper fmGiverWrapper, Map<String, List<String>> handlingerByOmraadeName) {
        Fullmaktsgiver fm = new Fullmaktsgiver();
        fm.motpartsPersonident = fmGiverWrapper.fullmektig;
        fm.omraade = handlingerByOmraadeName;
        fm.gyldigFraOgMed = fmGiverWrapper.gyldigFraOgMed;
        fm.gyldigTilOgMed = fmGiverWrapper.gyldigTilOgMed;
        fm.motpartsNavn = fmGiverWrapper.fullmektigsNavn;
        fm.motpartsRolle = 'Fullmektig';
        return fm;
    }

    private static String setOmraadeString(List<Omraade> omraadeList, Map<String, String> omraadeNameByOmraadeTema) {
        if (omraadeList == null || omraadeList.isEmpty()) {
            return '';
        }
        List<String> omdTemaList = new List<String>();
        for (Omraade omd : omraadeList) {
            String temaName = omraadeNameByOmraadeTema.get(omd.tema);
            omdTemaList.add(temaName != null ? temaName : omd.tema);
        }
        if (omdTemaList[0].equalsIgnoreCase('*')) {
            return 'Gjelder alle ytelser';
        }
        return String.join(omdTemaList, ', ');
    }

    private static Map<String, List<String>> extractOmraaderFromOmraadeList(List<Object> dataList) {
        Map<String, List<String>> omraader = new Map<String, List<String>>();
        
        for (Object data : dataList) {
            List<Omraade> omraadeList;
    
            if (data instanceof HistorikkWrapper) {
                HistorikkEndringer sisteEndring = ((HistorikkWrapper) data).sisteEndring;
                omraadeList = sisteEndring != null ? parseOmraadeIntoList(sisteEndring.omraade) : null;
            } else if (data instanceof FullmaktsgiverWrapper) {
                omraadeList = ((FullmaktsgiverWrapper) data).omraade;
            }
    
            if (omraadeList != null) {
                for (Omraade omd : omraadeList) {
                    omraader.put(omd.tema, omd.handling);
                }
            }
        }
        return omraader;
    }

    private static Map<String, List<String>> setHandlingerByOmraadeName(Map<String, List<String>> handlingerByOmraadeTema, Map<String, String> omraadeNameByOmraadeTema) {
        Map<String, List<String>> handlingerByOmraadeName = new Map<String, List<String>>();
        for (String omraade : handlingerByOmraadeTema.keySet()) {
            String omraadeName = omraadeNameByOmraadeTema.get(omraade);
            String actualOmraadeName = omraadeName != null ? omraadeName : omraade;           
            handlingerByOmraadeName.put(actualOmraadeName, handlingerByOmraadeTema.get(omraade));
        }
        return handlingerByOmraadeName;
    }

    private static Map<String, String> getOmraadeNamesFromCommonCodes(Set<String> omdList) {
        if (omdList.isEmpty()) {
            return new Map<String, String>();
        }

        List<Common_Code__c> omdNames = [
            SELECT Name, CRM_Code__c
            FROM Common_Code__c
            WHERE CRM_Code__c IN :omdList AND CRM_Code_Set__c = 'Tema'
        ];

        Map<String, String> omraadeNameByOmraadeTema = new Map<String, String>();
        for (Common_Code__c oCode : omdNames) {
            omraadeNameByOmraadeTema.put(oCode.CRM_Code__c, oCode.Name);
        }
        return omraadeNameByOmraadeTema;
    }

    // omraade response in history can be both array, string and semicolon separated string
    private static List<Omraade> parseOmraadeIntoList(String omraadeStr) {
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

    @TestVisible
    private static String fetchPersonIdent(Id recordId, String objectApiName) {
        Id personId = getPersonId(recordId, objectApiName);
        if (personId == null || !hasReadAccess(personId)) {
            return null;
        }
        return [SELECT Name FROM Person__c WHERE Id = :personId].Name;
    }

    private static Id getPersonId(Id recordId, String objectApiName) {
        if (objectApiName == 'Case') {
            return [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            return [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        } else if (objectApiName == 'Person__c') {
            return recordId;
        }
        return null;
    }

    private static Boolean hasReadAccess(Id personId) {
        Id userId = UserInfo.getUserId();
        return [SELECT RecordId, HasReadAccess FROM UserRecordAccess WHERE UserId = :userId AND RecordId = :personId]
        .HasReadAccess;
    }

    private static String getGyldigFraOgMed(HistorikkEndringer fmResp) {
        return fmResp.gyldigFraOgMed == null ? null : formatDate(fmResp.gyldigFraOgMed);
    }

    private static String getGyldigTilOgMed(HistorikkEndringer fmResp) {
        return fmResp.gyldigTilOgMed == null ? null : formatDate(fmResp.gyldigTilOgMed);
    }

    private static String formatDate(Date d) {
        return d == null ? null : DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('dd.MM.yyyy');
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

    public class HistorikkWrapper {
        public String fullmaktId;
        public List<HistorikkEndringer> fullmaktEndringsloggDetails;
        public HistorikkEndringer sisteEndring {
            get {
                if (!fullmaktEndringsloggDetails.isEmpty()) {
                    return fullmaktEndringsloggDetails[0];
                }
                return null;
            }
        }
    }

    public class HistorikkEndringer {
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
                if (opphoert) {
                    return 'Avsluttet';
                }
                return 'Utløpt';
            }
        }
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

    public virtual class Fullmaktsgiver {
        @AuraEnabled
        public String motpartsRolle;
        @AuraEnabled
        public String motpartsPersonident;
        @AuraEnabled
        public String motpartsNavn;
        @AuraEnabled
        public Map<String, List<String>> omraade;
        @AuraEnabled
        public List<Map<String, String>> formattedOmraadeList {
            get {
                List<Map<String, String>> formattedList = new List<Map<String, String>>();
                if (omraade != null) {
                    for (String key : omraade.keySet()) {
                        Map<String, String> omraadeMap = new Map<String, String>();
                        omraadeMap.put('name', key);
                        omraadeMap.put('permissions', String.join(omraade.get(key), ', '));
                        formattedList.add(omraadeMap);
                    }
                }
                return formattedList;
            }
        }
        @AuraEnabled
        public Date gyldigFraOgMed;
        @AuraEnabled
        public Date gyldigTilOgMed;
        @AuraEnabled
        public String id;
    }

    public class Omraade {
        public String tema;
        public List<String> handling;
    }

    public class FullmaktException extends Exception {

    }
}
