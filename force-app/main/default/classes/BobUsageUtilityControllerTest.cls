@IsTest
public class BobUsageUtilityControllerTest {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new Case(Origin = 'STO', STO_Category__c = 'Arbeid', Status = 'New'), true);

        User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        System.runAs(thisUser) {
            MessagingChannel msgChannel = new MessagingChannel();
            msgChannel.MasterLabel = 'TestHandlerChannel';
            msgChannel.DeveloperName = 'TestHandlerChannel';
            msgChannel.IsActive = true;
            msgChannel.MessageType = 'Text';
            msgChannel.MessagingPlatformKey = 'TestHandlerChannel';
            insert msgChannel;

            MessagingEndUser msgEndUser = new MessagingEndUser();
            msgEndUser.Name = 'Handler Test User';
            msgEndUser.MessagingChannelId = msgChannel.Id;
            msgEndUser.MessageType = 'EmbeddedMessaging';
            msgEndUser.MessagingPlatformKey = 'TestHandlerChannel';
            insert msgEndUser;

            // Status and EndTime are set on insert — Status is not writable via update
            MessagingSession msgSession = new MessagingSession();
            msgSession.MessagingEndUserId = msgEndUser.Id;
            msgSession.MessagingChannelId = msgChannel.Id;
            msgSession.Status = 'Ended';
            msgSession.EndTime = Datetime.now().addMinutes(-5);
            insert msgSession;
        }
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
    static void messagingSessionStatusTest() {
        MessagingSession msgSession = [SELECT Id, Status FROM MessagingSession LIMIT 1];

        Test.startTest();
        String status = BobUsageUtilityController.getStatus(msgSession.Id);
        Test.stopTest();

        Assert.areEqual('Ended', status);
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
