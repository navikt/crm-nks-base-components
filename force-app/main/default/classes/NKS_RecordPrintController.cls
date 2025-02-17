public with sharing class NKS_RecordPrintController {
    public Id recordId { get; set; }
    public String objectType { get; set; }
    public WrapperRecord wrapperRecord { get; set; }

    public class WrapperRecord {
        public SObject mainRecord { get; set; }
        public List<SObject> messages { get; set; }

        public WrapperRecord(SObject mainRecord, List<SObject> messages) {
            this.mainRecord = mainRecord;
            this.messages = messages;
        }
    }

    public NKS_RecordPrintController() {
        recordId = ApexPages.currentPage().getParameters().get('id');
        if (recordId == null) {
            return;
        }

        objectType = getObjectType(recordId);
        // TODO: Add utbetaling
        if (objectType == 'Case') {
            wrapperRecord = fetchCaseData();
        } else if (objectType == 'Thread__c') {
            wrapperRecord = fetchThreadData();
        } else if (objectType == 'LiveChatTranscript') {
            wrapperRecord = fetchLiveChatData();
        } else if (objectType == 'Conversation_Note__c') {
            wrapperRecord = fetchConversationNoteData();
        }
    }

    private static String getObjectType(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }

    private WrapperRecord fetchCaseData() {
        Thread__c thread = [
            SELECT Id, CRM_Theme_Group_Name__c 
            FROM Thread__c 
            WHERE CRM_Case__c = :recordId 
            LIMIT 1
        ];

        List<Message__c> messages = (thread != null) ? [
            SELECT CRM_Message_Text__c 
            FROM Message__c 
            WHERE CRM_Thread__c = :thread.Id
        ] : null;

        return new WrapperRecord(thread, messages);
    }

    private WrapperRecord fetchThreadData() {
        Thread__c thread = [
            SELECT Id, CRM_Theme_Group_Name__c 
            FROM Thread__c 
            WHERE Id = :recordId
        ];

        List<Message__c> messages = [
            SELECT CRM_Message_Text__c 
            FROM Message__c 
            WHERE CRM_Thread__c = :recordId
        ];

        return new WrapperRecord(thread, messages);
    }

    private WrapperRecord fetchLiveChatData() {
        LiveChatTranscript chat = [
            SELECT NKS_Chat_Queue__c, Body 
            FROM LiveChatTranscript 
            WHERE Id = :recordId
        ];

        return new WrapperRecord(chat, null);
    }

    private WrapperRecord fetchConversationNoteData() {
        Conversation_Note__c note = [
            SELECT CRM_Conversation_Note__c 
            FROM Conversation_Note__c 
            WHERE Id = :recordId
        ];

        return new WrapperRecord(note, null);
    }
}
