public with sharing class nksUtilityBackgroundController {
    @AuraEnabled
    public static string getTabName(String recordId) {
        try {
            String tabname;
            SObjectType objectName = Id.valueOf(recordId).getSobjectType();

            if (objectName == Schema.Case.getSObjectType()) {
                Case c = [
                    SELECT NKS_Puzzel_Queue_Name__c, Id, Origin, STO_Category__c
                    FROM Case
                    WHERE Id = :recordId
                    LIMIT 1
                ];
                if (c.Origin == 'Phone') {
                    tabname = c.NKS_Puzzel_Queue_Name__c;
                } else if (new List<String>{ 'STO', 'BTO' }.contains(c.Origin)) {
                    tabname = c.STO_Category__c;
                }
            }
            return tabname;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static string getOnlineId() {
        String statusId = String.valueOf(
            [SELECT Id FROM ServicePresenceStatus WHERE DeveloperName = 'Available_for_Chat']?.Id
        );
        return statusId?.substring(0, 15);
    }
}
