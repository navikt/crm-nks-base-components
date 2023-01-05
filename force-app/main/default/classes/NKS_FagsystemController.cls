/**
 * @description       :
 * @author            : mamikals
 * @group             :
 * @last modified on  : 05-01-2023
 * @last modified by  : mamikals
 **/
public with sharing class NKS_FagsystemController {
    @AuraEnabled(cacheable=true)
    public static string getPersonId(String recordId, String relatedField, String objectApiName) {
        try {
            String query = 'SELECT ' + getField(relatedField) + ' FROM ' + objectApiName + ' WHERE Id = :recordId';
            System.debug(query);
            List<SOBject> objs = Database.query(query);
            return getIdFromRelationshipQuery(objs, relatedField);
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

    private class ModiaSosialResponse {
        public string modiaSosialhjelpUrl;
    }

    public class ModiaSosialException extends Exception {
    }
}
