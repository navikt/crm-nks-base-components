public with sharing class NKS_FullmaktController {
    public class Historikk {
        @AuraEnabled
        public String fullmaktsgiver; // personIdent
        @AuraEnabled
        public String fullmektig; //related person Identity //motpartsPersonident
        @AuraEnabled
        public String omraade;
        @AuraEnabled
        public String gyldigFraOgMed;
        @AuraEnabled
        public String gyldigTilOgMed; //date
        @AuraEnabled
        public String periode; //fullmat periode
        @AuraEnabled
        public String fullmektigsNavn; //related person name //motpartsPersonNavn
    }

    @AuraEnabled(cacheable=true)
    public static List<Historikk> getHistorikk(Id recordId, String objectApiName) {
        Id personId;
        if (objectApiName == 'Case') {
            personId = [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            personId = [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        }
        List<Historikk> historikks = new List<Historikk>();

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

        String personIdent = [SELECT Id, Name FROM Person__c WHERE Id = :personId]?.Name;
        if (personIdent != null) {
            try {
                HttpResponse resp = FullmaktService.getFullmaktsgiverHistorikk();
                if (resp.getStatusCode() == 200) {
                    List<FullmaktsgiverHistorikk> historikkData = (List<FullmaktsgiverHistorikk>) JSON.deserialize(
                        resp.getBody(),
                        FullmaktsgiverHistorikk.class
                    );
                    historikks.addAll(getFullmaktHistorikk(historikkData));
                }
            } catch (Exception e) {
                return null;
            }
            // if (historikkData?.data?.hentPerson != null) {
            //     historikks.addAll(getFullmakt(historikkData));
            //     return historikks;
            // } else {
            //     return null;
            // }
        } else {
            return null;
        }
    }

    @TestVisible
    private static List<Historikk> getFullmaktHistorikk(List<FullmaktsgiverHistorikk> historikkData) {
        List<Historikk> fmList = new List<Historikk>();
        if (historikkData != null && !historikkData.isEmpty()) {
            for (FullmaktsgiverHistorikk histResp : historikkData) {
                FullmaktsgiverHistorikkEndringer fullmaktsHistorikk = histResp.firstEndring;
                if (fullmaktsHistorikk == null)
                    continue;
                Historikk person = new Historikk();

                person.fullmektig = fullmaktsHistorikk.fullmektig;
                person.omraade = getOmraader(fullmaktsHistorikk);
                person.gyldigFraOgMed = getGyldigFraOgMed(fullmaktsHistorikk);
                person.gyldigTilOgMed = getGyldigTilOgMed(fullmaktsHistorikk);
                person.motpartsPersonNavn = getMotpartsPersonName(person.motpartsPersonident);
                if (person.gyldigFraOgMed != null && person.gyldigTilOgMed != null)
                    person.periode = person.gyldigFraOgMed + '-' + person.gyldigTilOgMed;
                fmList.add(person);
                if (fmList.size() == 3)
                    break;
            }
        }
        return fmList;
    }

    @AuraEnabled(cacheable=true)
    public static List<PowerOfAttorney> getFullmaktsgiver(Id recordId, String objectApiName) {
        Id personId;
        if (objectApiName == 'Case') {
            personId = [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            personId = [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        }

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
        List<PowerOfAttorney> fullmaktsgiverDataToReturn = new List<PowerOfAttorney>();
        String personIdent = [SELECT Id, Name FROM Person__c WHERE Id = :personId]?.Name;
        if (personIdent != null) {
            try {
                HttpResponse resp = FullmaktService.getFullmaktsgiver();
                if (resp.getStatusCode() == 200) {
                    List<Fullmaktsgiver> fullmaktsgiverData = (List<Fullmaktsgiver>) JSON.deserialize(
                        resp.getBody(),
                        Fullmaktsgiver.class
                    );
                    fullmaktsgiverDataToReturn.addAll(getFullmaktsgiverData(fullmaktsgiverData));
                }
            } catch (Exception e) {
                return null;
            }
        } else {
            return null;
        }
        return fullmaktsgiverDataToReturn;
    }

    @TestVisible
    private static List<PowerOfAttorney> getFullmaktsgiverData(List<Fullmaktsgiver> fullmaktsgiverData) {
        if (fullmaktsgiverData == null || fullmaktsgiverData.isEmpty()) {
            return null;
        }
        List<PowerOfAttorney> fmList = new List<PowerOfAttorney>();
        for (Fullmaktsgiver fmResponse : fullmaktsgiverData) {
            Fullmaktsgiver person = new Fullmaktsgiver();

            //TODO: Set fullmaktsgiver data from wrapper class
            /*person.fullmektig = fmResponse.firstEndring?.fullmektig;
            person.omraade = getOmraader(fmResp);
            person.gyldigFraOgMed = getGyldigFraOgMed(fmResp);
            person.gyldigTilOgMed = getGyldigTilOgMed(fmResp);
            person.motpartsPersonNavn = getMotpartsPersonName(person.motpartsPersonident);
            if (person.gyldigFraOgMed != null && person.gyldigTilOgMed != null)
                person.periode = person.gyldigFraOgMed + '-' + person.gyldigTilOgMed;
            fmList.add(person);
            if (fmList.size() == 3)
                break;*/
        }
        return fmList;
    }

    private static String getOmraader(FullmaktsgiverHistorikkEndringer fmResp) {
        if (fmResp.omraade == null) {
            return null;
        }
        List<String> omdList = new List<String>();
        omdList = fmResp.omraade;
        String omd = '';
        for (String s : fmResp.omraade) {
            String oName = [
                SELECT Name, CRM_Code__c
                FROM Common_Code__c
                WHERE CRM_Code__c = :s AND CRM_Code_Set__c = 'Tema'
            ]
            ?.Name;
            if (oName != null)
                omd = omd + oName + ', ';
            else
                omd = omd + s + ', ';
        }
        omd = omd.removeEnd(', ');
        return omd;
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

    private static String getMotpartsPersonName(String motpartsPersonident) {
        if (motpartsPersonident == null) {
            return null;
        }
        return [SELECT id, NKS_Full_Name__c FROM Person__c WHERE Name = :motpartsPersonident]?.NKS_Full_Name__c;
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

    public class Fullmaktsgiver {
        public String fullmaktId;
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

    public class PowerOfAttorney {
        @AuraEnabled
        public String motpartsRolle {
            get {
                return motpartsRolle.toLowerCase().capitalize();
            }
            set;
        }
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
            if (1 == omraader.size() && '*'.equalsIgnoreCase(omraader[0])) {
                return 'Gjelder alle ytelser';
            } else if (0 < omraader.size()) {
                return String.join(omraader, ',');
            }

            return '';
        }
    }
}
