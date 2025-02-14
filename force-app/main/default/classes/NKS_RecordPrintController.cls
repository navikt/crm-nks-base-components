public with sharing class NKS_RecordPrintController {
    public Id recordId { get; set; }
    public String objectType { get; set; }
    public Case caseRecord { get; set; }
    public Thread__c threadRecord { get; set; }
    public LiveChatTranscript chatRecord { get; set; }
    public Conversation_Note__c convNoteRecord { get; set; }
    public List<Message__c> messages { get; set; }

    public NKS_RecordPrintController() {
        recordId = ApexPages.currentPage().getParameters().get('id');
        if (recordId == null) {
            return;
        }

        objectType = getObjectType(recordId);
        if (objectType == 'Case') {
            fetchCaseData();
        } else if (objectType == 'Thread__c') {
            fetchThreadData();
        } else if (objectType == 'LiveChatTranscript') {
            fetchLiveChatData();
        } else if (objectType == 'Conversation_Note__c') {
            fetchConversationNoteData();
        }
    }

    private String getObjectType(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }

    private void fetchCaseData() {        
        Thread__c thread = [
            SELECT Id, CRM_Theme_Group_Name__c 
            FROM Thread__c 
            WHERE CRM_Case__c = :recordId 
            LIMIT 1
        ];

        if (thread != null) {
            threadRecord = thread;
            messages = [
                SELECT Id, CRM_Message_Text__c 
                FROM Message__c 
                WHERE CRM_Thread__c = :thread.Id
            ];
        }
    }

    private void fetchThreadData() {
        threadRecord = [
            SELECT Id, CRM_Theme_Group_Name__c 
            FROM Thread__c 
            WHERE Id = :recordId
        ];
        messages = [
            SELECT Id, CRM_Message_Text__c 
            FROM Message__c 
            WHERE CRM_Thread__c = :recordId
        ];
    }

    private void fetchLiveChatData() {
        chatRecord = [
            SELECT Id, NKS_Chat_Queue__c, Body 
            FROM LiveChatTranscript 
            WHERE Id = :recordId
        ];
    }

    private void fetchConversationNoteData() {
        convNoteRecord = [
            SELECT Id, CRM_Conversation_Note__c 
            FROM Conversation_Note__c 
            WHERE Id = :recordId
        ];
    }
}
