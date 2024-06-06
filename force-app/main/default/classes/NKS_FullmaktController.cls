public with sharing class NKS_FullmaktController {
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
        return [SELECT Id, Name FROM Person__c WHERE Id = :personId]?.Name;
    }

    @AuraEnabled(cacheable=true)
    public static List<Historikk> getHistorikk(Id recordId, String objectApiName) {
        String personIdent = checkAccessAndGetPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }

        try {
            HttpResponse resp = FullmaktService.getFullmaktsgiverHistorikk(personIdent);
            if (resp.getStatusCode() == 200) {
                List<FullmaktsgiverHistorikk> historikkData = (List<FullmaktsgiverHistorikk>) JSON.deserialize(
                    resp.getBody(),
                    List<FullmaktsgiverHistorikk>.class
                );
                return getFullmaktHistorikk(historikkData);
            }
            // ApplicationLogger logger = new ApplicationLogger();
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    @TestVisible
    private static List<Historikk> getFullmaktHistorikk(List<FullmaktsgiverHistorikk> historikkData) {
        if (historikkData == null && historikkData.isEmpty()) {
            return null;
        }

        List<Historikk> fmList = new List<Historikk>();
        for (FullmaktsgiverHistorikk histResp : historikkData) {
            FullmaktsgiverHistorikkEndringer fullmaktsHistorikk = histResp.firstEndring;
            if (fullmaktsHistorikk == null)
                continue;
            Historikk person = new Historikk();

            person.fullmektig = fullmaktsHistorikk.fullmektig;
            List<Omraade> omraade = (List<Omraade>) JSON.deserialize(fullmaktsHistorikk.omraade, List<Omraade>.class);
            person.omraade = getOmraader(omraade);
            person.gyldigFraOgMed = getGyldigFraOgMed(fullmaktsHistorikk);
            person.gyldigTilOgMed = getGyldigTilOgMed(fullmaktsHistorikk);
            person.fullmektigsNavn = fullmaktsHistorikk.fullmektigsNavn;
            fmList.add(person);
            if (fmList.size() == 3)
                break;
        }
        return fmList;
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
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    @TestVisible
    private static List<Fullmaktsgiver> getFullmaktsgiverData(List<FullmaktsgiverWrapper> fullmaktsgiverData) {
        if (fullmaktsgiverData == null || fullmaktsgiverData.isEmpty()) {
            return null;
        }

        List<Fullmaktsgiver> fmList = new List<Fullmaktsgiver>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            Fullmaktsgiver fm = new Fullmaktsgiver();
            fm.motpartsPersonident = fmResponse.fullmektig;
            fm.omraader = getOmraader(fmResponse.omraade).split(', ');
            fm.gyldigFraOgMed = fmResponse.gyldigFraOgMed;
            fm.gyldigTilOgMed = fmResponse.gyldigTilOgMed;
            fm.motpartsNavn = fmResponse.fullmektigsNavn;
            fm.motpartsRolle = 'Fullmektig';
            fmList.add(fm);
        }
        return fmList;
    }

    private static String getOmraader(List<Omraade> omraade) {
        if (omraade == null || omraade.size() == 0) {
            return null;
        }
        List<String> omdTemaList = new List<String>();
        for (Omraade omd : omraade) {
            omdTemaList.add(omd.tema);
        }
        return getNamesOfOmraade(omdTemaList);
    }

    private static String getNamesOfOmraade(List<String> omdList) {
        if (omdList == null || omdList.isEmpty()) {
            return '';
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

        List<String> omdNameList = new List<String>();
        for (String code : omdList) {
            String oName = omdNameByOmdCode.get(code);
            if (oName != null) {
                omdNameList.add(oName);
            } else {
                omdNameList.add(code);
            }
        }
        return String.join(omdNameList, ', ');
    }

    private static String getGyldigFraOgMed(FullmaktsgiverHistorikkEndringer fmResp) {
        if (fmResp.gyldigFraOgMed == null) {
            return null;
        }
        return formatDate(fmResp.gyldigFraOgMed);
    }

    private static String getGyldigTilOgMed(FullmaktsgiverHistorikkEndringer fmResp) {
        if (fmResp.gyldigTilOgMed == null) {
            return null;
        }
        return formatDate(fmResp.gyldigTilOgMed);
    }

    private static String formatDate(Date d) {
        if (d == null) {
            return null;
        }
        return DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('dd.MM.yyyy');
    }

    public class FullmaktsgiverHistorikk {
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

    public class Historikk {
        @AuraEnabled
        public String fullmektig; //related person Identity //motpartsPersonident
        @AuraEnabled
        public String omraade;
        @AuraEnabled
        public String gyldigFraOgMed;
        @AuraEnabled
        public String gyldigTilOgMed; //date
        @AuraEnabled
        public String periode {
            get {
                if (gyldigFraOgMed != null && gyldigTilOgMed != null)
                    return gyldigFraOgMed + '-' + gyldigTilOgMed;
                if (gyldigFraOgMed != null)
                    return gyldigFraOgMed + '- Tidsubegrenset';
                return '';
            }
        } //fullmakt periode
        @AuraEnabled
        public String fullmektigsNavn; //related person name //motpartsPersonNavn
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
            System.debug('omraader: ' + omraader);
            if (omraader == null) {
                return '';
            }
            if (omraader.size() == 1 && '*'.equalsIgnoreCase(omraader[0])) {
                return 'Gjelder alle ytelser';
            } else if (omraader.size() > 0) {
                return String.join(omraader, ',');
            }
            return '';
        }
    }
}
