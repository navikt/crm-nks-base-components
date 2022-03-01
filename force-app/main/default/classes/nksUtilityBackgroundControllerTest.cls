@isTest
public with sharing class nksUtilityBackgroundControllerTest {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new LiveChatTranscript());
        UTIL_TestDataFactory.createRecord(new Case());
    }

    @isTest
    static void nksUtilityBackgroundControllerTest() {
        LiveChatTranscript lct = [SELECT Id FROM LiveChatTranscript LIMIT 1];
        Case c = [SELECT Id FROM Case LIMIT 1];

        Test.startTest();
        String tablabelchat = (String) nksUtilityBackgroundController.getTabName(lct.Id);
        String tablabelcase = (String) nksUtilityBackgroundController.getTabName(c.Id);
        Test.stopTest();

        System.assertEquals(
            null,
            tablabelchat,
            'Should be null because there is no chat button connected to the transcript'
        );
        System.assertEquals(null, tablabelcase, 'Should be null because there is no chat connected to the case');
    }
}
