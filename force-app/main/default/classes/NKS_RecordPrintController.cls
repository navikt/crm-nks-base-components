public with sharing class NKS_RecordPrintController {
    public Id recordId { get; set; }
    public String objectType { get; set; }
    public SObject mainRecord { get; set; }
    public List<MessageWrapper> wrapperMessages { get; set; }
    public ConversationNoteWrapper convoWrapper { get; set; }

    public NKS_RecordPrintController() {
        wrapperMessages = new List<MessageWrapper>();
        recordId = ApexPages.currentPage().getParameters().get('id');
        if (recordId == null) {
            return;
        }

        objectType = getObjectType(recordId);
        // TODO: Add utbetaling
        if (objectType == 'Thread__c') {
            fetchThreadData();
        } else if (objectType == 'Conversation_Note__c') {
            fetchConversationNoteData();
        }
    }

    private static String getObjectType(Id recordId) {
        return recordId.getSObjectType().getDescribe().getName();
    }

    private void fetchThreadData() {
        Thread__c thread = [
            SELECT
                Id,
                CRM_Theme_Group_Name__c,
                CRM_Conversation_Summary__c,
                STO_Category__c,
                CRM_Thread_Type__c,
                Name,
                CRM_Journal_Status__c,
                CRM_Account__r.INT_PersonIdent__c,
                CRM_Account__r.Name
            FROM Thread__c
            WHERE Id = :recordId
        ];

        mainRecord = thread;
        List<Message__c> threadMessages = [
            SELECT
                CRM_Message_Text__c,
                CRM_External_Message__c,
                CRM_Sent_date__c,
                CRM_Read__c,
                CRM_Read_Datetime__c,
                CRM_From_First_Name__c,
                CRM_From_Ident__c
            FROM Message__c
            WHERE CRM_Thread__c = :recordId
        ];

        for (Message__c message : threadMessages) {
            wrapperMessages.add(new MessageWrapper(message, mainRecord));
        }
    }

    private void fetchConversationNoteData() {
        Conversation_Note__c note = [
            SELECT
                CRM_Conversation_Note__c,
                CRM_Theme_Group_Name__c,
                CRM_Theme_Name__c,
                CRM_Account__c,
                CRM_Account__r.INT_PersonIdent__c,
                CRM_Journal_Status__c,
                CRM_Communication_Channel__c,
                CRM_Date_Time_Registered__c,
                CRM_Created_By_Ident__c,
                CRM_Created_By_NAV_Unit__c
            FROM Conversation_Note__c
            WHERE Id = :recordId
        ];

        mainRecord = note;
        convoWrapper = new ConversationNoteWrapper(mainRecord); 
    }



    public class ConversationNoteWrapper {
        public SObject mainRecord { get; set; }
        public String createdDate { get; set; }
        public String comChannelNorwegian { get; set; }
        public String journalStatusNorwegian { get; set; }

        public ConversationNoteWrapper(SObject mainRecord) {
            this.mainRecord = mainRecord;
            this.createdDate = dateTimeFormatter((Datetime)mainRecord.get('CRM_Date_Time_Registered__c'));
            this.comChannelNorwegian = translationService((String)mainRecord.get('CRM_Communication_Channel__c'), '');
            this.journalStatusNorwegian = translationService('', (String)mainRecord.get('CRM_Journal_Status__c'));
        }

        private String dateTimeFormatter(Datetime dt) {
            return dt.format();
        }

        private String translationService(String communicationChannel, String journalStatus){
            Map<String, String> communicationChannelMap = new Map<String, String>{'Phone' => 'Telefon', 'Meeting' => 'Møte'};
            Map<String, String> journalStatusMap = new Map<String, String>{'Not Journaled' => 'Ikke journalført', 'Journal Error' => 'Journalføring feilet', 'Journal Completed' => 'Journalført', 'Journal Started' => 'Journalført'};
            
            if (!String.isBlank(communicationChannel)){
                return communicationChannelMap.get(communicationChannel) ?? communicationChannel;
            } else if (!String.isBlank(journalStatus)) {
                return journalStatusMap.get(journalStatus) ?? journalStatus;
            } 

            return '';
        }
    }

    public class MessageWrapper {
        public Message__c message { get; set; }
        public String messageFrom { get; set; }
        public String messageRead { get; set; }
        public SObject mainRecord { get; set; }
        public String createdDate { get; set; }

        public MessageWrapper(Message__c message, SObject mainRecord) {
            this.message = message;
            this.mainRecord = mainRecord;
            this.messageFrom = setMessageFrom(message);
            this.messageRead = setMessageRead(message);
            this.createdDate = dateTimeFormatter((Datetime)message.get('CRM_Sent_date__c'));
        }

        public String dateTimeFormatter(Datetime dt) {
            return dt.format();
        }

        private String setMessageFrom(Message__c msg) {
            return (msg.CRM_External_Message__c
                    ? ((Thread__c) mainRecord).CRM_Account__r.INT_PersonIdent__c + ' (Bruker)' ?? ''
                    : message.CRM_From_Ident__c + ' (Veileder)' ?? '');
        }

        private String setMessageRead(Message__c msg) {
            return msg.CRM_Read__c ? 'Lest: ' + msg.CRM_Read_Datetime__c : 'Ulest';
        }
    }
}
