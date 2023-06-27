public with sharing class NKS_HistorikkViewController {
    public class Historikk {
        @AuraEnabled
        public List<Fullmakt> historiske;
        @AuraEnabled
        public List<Fullmakt> fremtidige;

        public Historikk() {
            historiske = new List<Fullmakt>();
            fremtidige = new List<Fullmakt>();
        }
    }

    public class Fullmakt {
        @AuraEnabled
        public String personIdent;
        @AuraEnabled
        public String motpartsRolle; //related person role
        @AuraEnabled
        public String motpartsPersonident; //related person Identity
        @AuraEnabled
        public String omraader;
        @AuraEnabled
        public String gyldigFraOgMed;
        @AuraEnabled
        public Date gyldigFraOgMedDate;
        @AuraEnabled
        public String gyldigTilOgMed; //date
        @AuraEnabled
        public Date gyldigTilOgMedDate; //date
        @AuraEnabled
        public String periode; //fullmat periode
        @AuraEnabled
        public String motpartsPersonNavn; //related person name
    }

    @AuraEnabled(cacheable=true)
    public static Historikk getHistorikk(Id recordId, String objectApiName) {
        Id personId;
        if (objectApiName == 'Case') {
            personId = [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            personId = [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        }
        PDL_API_Response historikkData;

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
                historikkData = queryHistorikkFromPDL(personIdent);
            } catch (Exception e) {
                return null;
            }
            if (historikkData?.data?.hentPerson != null) {
                return filterHistorikk(getFullmakt(historikkData));
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    @TestVisible
    private static PDL_API_Response queryHistorikkFromPDL(String ident) {
        PDL_API_QueryHelper query = new PDL_API_QueryHelper(ident);
        query.hentPerson.fullmakt.motpartsPersonident = true;
        query.hentPerson.fullmakt.motpartsRolle = true;
        query.hentPerson.fullmakt.omraader = true;
        query.hentPerson.fullmakt.gyldigFraOgMed = true;
        query.hentPerson.fullmakt.gyldigTilOgMed = true;
        query.hentPerson.fullmakt.historikk = true;
        return query.execute();
    }

    @TestVisible
    private static List<Fullmakt> getFullmakt(PDL_API_Response historikkData) {
        List<Fullmakt> fmList = new List<Fullmakt>();
        List<PDL_Fullmakt> fullmaktResp = new List<PDL_Fullmakt>();
        if (historikkData?.data?.hentPerson?.fullmakt != null && !historikkData.data.hentPerson.fullmakt.isEmpty()) {
            fullmaktResp = historikkData.data.hentPerson.fullmakt;
            for (PDL_Fullmakt fmResp : fullmaktResp) {
                Fullmakt person = new Fullmakt();
                person.motpartsPersonident = getMotpartsPersonident(fmResp);
                person.motpartsRolle = getMotpartsRolle(fmResp);
                person.omraader = getOmraader(fmResp);
                person.gyldigFraOgMed = getGyldigFraOgMed(fmResp);
                person.gyldigFraOgMedDate = fmResp.gyldigFraOgMed;
                person.gyldigTilOgMed = getGyldigTilOgMed(fmResp);
                person.gyldigTilOgMedDate = fmResp.gyldigTilOgMed;
                person.motpartsPersonNavn = getMotpartsPersonName(person.motpartsPersonident);
                if (person.gyldigFraOgMed != null && person.gyldigTilOgMed != null)
                    person.periode = person.gyldigFraOgMed + '-' + person.gyldigTilOgMed;
                fmList.add(person);
            }
        }
        return fmList;
    }

    private static Historikk filterHistorikk(List<Fullmakt> fullmaktList) {
        Historikk hist = new Historikk();
        for (Fullmakt full : fullmaktList) {
            if (full.gyldigTilOgMedDate < Date.today() && hist.historiske.size() < 3) {
                hist.historiske.add(full);
            } else if (full.gyldigFraOgMedDate > Date.today() && hist.fremtidige.size() < 3) {
                hist.fremtidige.add(full);
            }
        }
        return hist;
    }

    private static String getMotpartsPersonident(PDL_Fullmakt fmResp) {
        if (fmResp.motpartsPersonident == null) {
            return null;
        }
        return fmResp.motpartsPersonident;
    }

    private static String getMotpartsRolle(PDL_Fullmakt fmResp) {
        if (fmResp.motpartsRolle == null) {
            return null;
        }
        return String.valueOf(fmResp.motpartsRolle);
    }

    private static String getOmraader(PDL_Fullmakt fmResp) {
        if (fmResp.omraader == null) {
            return null;
        }
        List<String> omdList = new List<String>();
        omdList = fmResp.omraader;
        String omd = '';
        for (String s : fmResp.omraader) {
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

    private static String getGyldigFraOgMed(PDL_Fullmakt fmResp) {
        if (fmResp.gyldigFraOgMed == null) {
            return null;
        }
        return formatDate(fmResp.gyldigFraOgMed);
    }

    private static String getGyldigTilOgMed(PDL_Fullmakt fmResp) {
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
}
