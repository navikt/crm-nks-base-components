@isTest
public class NksRecordInfoController_Test {
    //Må skrive om testene til å passe for MessagingSessiong
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new LiveChatTranscript());
    }

    @isTest
    static void getRelatedRecordTest() {
        LiveChatTranscript trans = [SELECT Id FROM LiveChatTranscript LIMIT 1];

        Test.startTest();
        trans = (LiveChatTranscript) NksRecordInfoController.getRelatedRecord(
            String.valueOf(trans.Id),
            'LiveChatVisitorId',
            'LiveChatTranscript'
        );
        Test.stopTest();

        System.assertNotEquals(null, trans.LiveChatVisitorId);
    }

    @isTest
    static void getReverseRelatedRecordTest() {
        LiveChatVisitor vis = [SELECT Id FROM LiveChatVisitor LIMIT 1];
        List<LiveChatTranscript> trans;
        Test.startTest();
        trans = (List<LiveChatTranscript>) NksRecordInfoController.getReverseRelatedRecord(
            String.valueOf(vis.Id),
            'Id',
            'LiveChatTranscript',
            'LiveChatVisitorId'
        );
        Test.stopTest();

        System.assertNotEquals(0, trans.size());
        System.assertNotEquals(null, trans[0].Id);
    }
}
