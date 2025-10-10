public with sharing class BobUsageUtilityController {
    @AuraEnabled
    public static String getCaseStatus(Id caseId) {
        if (caseId == null) {
            throw new AuraHandledException('Case Id is required');
        }
        List<Case> cases = [SELECT Status FROM Case WHERE Id = :caseId LIMIT 1];
        return !cases.isEmpty() ? cases[0].Status : null;
    }
}
