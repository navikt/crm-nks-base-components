/**
 * @description       :
 * @author            : mamikals
 * @group             :
 * @last modified on  : 05-01-2023
 * @last modified by  : mamikals
 **/
public with sharing class NKS_FagsystemController {
    @AuraEnabled(cacheable=true)
    public static FagsystemData getFagsystemData (String recordId, String relatedField, String objectApiName) {
        try {
            String query = 'SELECT ' + getField(relatedField) + ' FROM ' + objectApiName + ' WHERE Id = :recordId';
            List<SOBject> objs = Database.query(query);
            Id personId = getIdFromRelationshipQuery(objs, relatedField);

            Person__c person = [SELECT Name, INT_ActorId__c FROM Person__c WHERE Id = :personId];
            String navIdent = [SELECT CRM_NAV_Ident__c FROM User WHERE Id = :UserInfo.getUserId()].CRM_NAV_Ident__c;

            return new FagsystemData(navIdent, person.Name, person.INT_ActorId__c);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static string getField(String relatedField) {
        if (relatedField == 'Id') {
            return 'CRM_Person__c';
        }

        return relatedField.replace('__c', '__r') + '.CRM_Person__c';
    }

    public static string getIdFromRelationshipQuery(List<SObject> objs, String relatedField) {
        SOBject currentObj = objs[0];
        List<String> splitQuery = getField(relatedField).split('\\.');
        System.debug(splitQuery);
        for (Integer i = 0; i < splitQuery.size() - 1; i++) {
            currentObj = currentObj.getSObject(splitQuery[i]);
        }

        return (String) currentObj.get(splitQuery[splitQuery.size() - 1]);
    }

    @AuraEnabled(cacheable=true)
    public static FagsoneIp checkFagsoneIpRange() {
        Map<String, String> currentSession = Auth.SessionManagement.getCurrentSession();
        String ip = currentSession.get('SourceIp');
        Boolean isInFagsone = Auth.SessionManagement.inOrgNetworkRange(ip);
        return new FagsoneIp(ip, isInFagsone);
    }

    @AuraEnabled(cacheable=true)
    public static String getModiaSosialLink(String ident) {
        try {
            HttpResponse httpResponse = modiaSosialService(ident);
            if (httpResponse.getStatusCode() != 200) {
                throw new ModiaSosialException(
                    'Feil ved henting av Modia Sosial link \n Status: ' +
                        httpResponse.getStatus() +
                        '\n' +
                        'Body: ' +
                        httpResponse.getBody()
                );
            }

            ModiaSosialResponse resp = (ModiaSosialResponse) JSON.deserialize(
                httpResponse.getBody(),
                ModiaSosialResponse.class
            );

            return resp.modiaSosialhjelpUrl;
        } catch (Exception e) {
            LoggerUtility logger = new LoggerUtility();
            logger.error(e.getMessage(), null);
            logger.publish();
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static HttpResponse modiaSosialService(String ident) {
        String API_CONFIG_NAME = 'MODIA_SOSIAL';
        String SERVICE_AUTH_HEADER = 'Modiasosial';
        String SERVICE_NAME = 'POST_SOSIAL_LINK';
        String query = '{"fnr": "' + ident + '"}';
        ApiController apiCtrl = new ApiController();
        apiCtrl.initRequest(API_CONFIG_NAME, SERVICE_NAME);
        apiCtrl.addServiceAuthHeader(SERVICE_AUTH_HEADER);
        apiCtrl.addHeader('Content-Type', 'application/json');
        apiCtrl.setBody(query);
        apiCtrl.doCallout();
        return apiCtrl.getResponse();
    }

    @AuraEnabled(cacheable=true)
    public static FagsoneIpAndOrgType getFagsoneIpAndOrgType() {
        FagsoneIpAndOrgType result = new FagsoneIpAndOrgType();
        try {
            // Fagsone IP check
            Map<String, String> currentSession = Auth.SessionManagement.getCurrentSession();
            String ip = currentSession.get('SourceIp');
            Boolean isInFagsone = Auth.SessionManagement.inOrgNetworkRange(ip);
            result.ipResult = new FagsoneIp(ip, isInFagsone);
            
            // Org type check
            Organization orgInfo = [SELECT IsSandbox, TrialExpirationDate FROM Organization LIMIT 1];
            result.isSandboxOrScratch = orgInfo.IsSandbox || orgInfo.TrialExpirationDate != null;
        } catch (Exception e) {
            throw new AuraHandledException('getFagsoneIpAndOrgType failed: ' + e.getMessage());
        }
        
        return result;
    }

    public class FagsoneIp {
        @AuraEnabled
        public String ip;
        @AuraEnabled
        public Boolean isInFagsone;

        public FagsoneIp(String ip, Boolean isInFagsone) {
            this.ip = ip;
            this.isInFagsone = isInFagsone;
        }
    }

    private class ModiaSosialResponse {
        public string modiaSosialhjelpUrl;
    }

    public class ModiaSosialException extends Exception {
    }

    public class FagsystemData {
        @AuraEnabled 
        public String navIdent;

        @AuraEnabled 
        public String personIdent;

        @AuraEnabled 
        public String actorId;

        public FagsystemData (String navIdent, String personIdent, String actorId) {
            this.navIdent = navIdent;
            this.personIdent = personIdent;
            this.actorId = actorId;
        }
    }

    public class FagsoneIpAndOrgType {
        @AuraEnabled
        public FagsoneIp ipResult;
        @AuraEnabled
        public Boolean isSandboxOrScratch;
    }
}
