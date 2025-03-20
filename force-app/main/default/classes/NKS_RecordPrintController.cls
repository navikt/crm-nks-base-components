public with sharing class NKS_RecordPrintController {
    public Id recordId { get; set; }
    public String objectType { get; set; }
    public SObject mainRecord { get; set; }
    public List<SObject> messages { get; set; }

    public NKS_RecordPrintController() {
        recordId = ApexPages.currentPage().getParameters().get('id');
        if (recordId == null) {
            return;
        }

        objectType = getObjectType(recordId);
        // TODO: Add utbetaling
        if (objectType == 'Case') {
            fetchCaseData();
        } else if (objectType == 'Thread__c') {
            fetchThreadData();
        } else if (objectType == 'Conversation_Note__c') {
            fetchConversationNoteData();
        }
    }

    private static String getObjectType(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }

    private void fetchCaseData() {
        //se om vi må bruke et annet felt enn crm case. Feltet er ikke alltid populert Det er en antagelse -morten. henvendelse_behandlings_id/api_reference er alltid utfylt
        Thread__c thread = [
            SELECT Id, CRM_Theme_Group_Name__c
            FROM Thread__c
            WHERE CRM_Case__c = :recordId
            LIMIT 1
        ];

        mainRecord = thread;
        messages = (thread != null)
            ? [
                  SELECT CRM_Message_Text__c
                  FROM Message__c
                  WHERE CRM_Thread__c = :thread.Id
              ]
            : null;
    }

    private void fetchThreadData() {
        Thread__c thread = [
            SELECT
                Id,
                CRM_Theme_Group_Name__c,
                CRM_Conversation_Summary__c,
                STO_Category__c,
                Name,
                CRM_Journal_Status__c,
                CRM_Account__c
            FROM Thread__c
            WHERE Id = :recordId
        ];

        mainRecord = thread;
        messages = [
            SELECT CRM_Message_Text__c, CRM_Sent_date__c, CRM_Read__c, CRM_From_User__c
            FROM Message__c
            WHERE CRM_Thread__c = :recordId
        ];
        System.debug('messages');
        System.debug(messages);
        System.debug('messages');
    }

    private void fetchConversationNoteData() {
        Conversation_Note__c note = [
            SELECT
                CRM_Conversation_Note__c,
                CRM_Theme_Group_Name__c,
                CRM_Date_Time_Registered__c,
                CRM_Created_By_NAV_Unit__c,
                CRM_Journal_Status__c
            FROM Conversation_Note__c
            WHERE Id = :recordId
        ];

        mainRecord = note;
        messages = null;
    }
}
