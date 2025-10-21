public with sharing class BobUsageUtilityController {
    @AuraEnabled
    public static String getStatus(Id recordId) {
        if (recordId == null) {
            throw new AuraHandledException('RecordId is required');
        }
        String objectType = getObjectType(recordId);
        if (objectType == 'Case') {
            List<Case> cases = [SELECT Status FROM Case WHERE Id = :recordId LIMIT 1];
            return !cases.isEmpty() ? cases[0].Status : null;
        } else if (objectType == 'LiveChatTranscript') {
            List<LiveChatTranscript> chatTranscripts = [
                SELECT Status
                FROM LiveChatTranscript
                WHERE Id = :recordId
                LIMIT 1
            ];
            return !chatTranscripts.isEmpty() ? chatTranscripts[0].Status : null;
        } else {
            throw new AuraHandledException('Unsupported object type: ' + objectType);
        }
    }

    private static String getObjectType(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }
}
