@IsTest
public class BobUsageUtilityControllerTest {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new Case(Origin = 'STO', STO_Category__c = 'Arbeid', Status = 'New'), true);
        UTIL_TestDataFactory.createRecord(new LiveChatTranscript(Status = 'Completed'));
    }

    @IsTest
    static void caseStatusTest() {
        Case c = [SELECT Id, Status FROM Case LIMIT 1];

        Test.startTest();
        String status = BobUsageUtilityController.getStatus(c.Id);
        Test.stopTest();

        Assert.areEqual('New', status);
    }

    @IsTest
    static void liveChatTranscriptStatusTest() {
        LiveChatTranscript chat = [SELECT Id, Status FROM LiveChatTranscript LIMIT 1];

        Test.startTest();
        String status = BobUsageUtilityController.getStatus(chat.Id);
        Test.stopTest();

        Assert.areEqual('Completed', status);
    }

    @IsTest
    static void nullRecordIdTest() {
        Exception ex;

        Test.startTest();
        try {
            BobUsageUtilityController.getStatus(null);
        } catch (Exception e) {
            ex = e;
        }
        Test.stopTest();

        Assert.isNotNull(ex);
    }

    @IsTest
    static void unsupportedObjectTypeTest() {
        Account acc = new Account(Name = 'Test');
        insert acc;

        Exception ex;

        Test.startTest();
        try {
            BobUsageUtilityController.getStatus(acc.Id);
        } catch (Exception e) {
            ex = e;
        }
        Test.stopTest();

        Assert.isNotNull(ex);
    }
}
