@isTest
public with sharing class nksUtilityBackgroundControllerTest {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new LiveChatTranscript());
        UTIL_TestDataFactory.createRecord(new Case(Origin = 'Phone', NKS_Puzzel_Queue_Name__c = 'TEST'));
        //UTIL_TestDataFactory.createRecord(new Case(Origin = 'STO', STO_Category__c = 'Arbeid'));
    }

    @isTest
    static void nksUtilityBackgroundControllerTest() {
        LiveChatTranscript lct = [SELECT Id FROM LiveChatTranscript LIMIT 1];
        Case cPhone = [SELECT Id FROM Case WHERE Origin = 'Phone' LIMIT 1];
        Case cSTO = [SELECT Id FROM Case WHERE Origin = 'STO' LIMIT 1];

        Test.startTest();
        String tablabelchat = (String) nksUtilityBackgroundController.getTabName(lct.Id);
        String tabLabelCaseSTO = (String) nksUtilityBackgroundController.getTabName(cSTO.Id);
        String tabLabelCasePhone = (String) nksUtilityBackgroundController.getTabName(cPhone.Id);
        Test.stopTest();

        System.assertEquals(
            null,
            tablabelchat,
            'Should be null because there is no chat button connected to the transcript'
        );
        System.assertEquals('TEST', tabLabelCasePhone, 'Should be null because there is no chat connected to the case');
        System.assertEquals('Arbeid', tabLabelCaseSTO, 'Should be null because there is no chat connected to the case');
    }

    @isTest
    static void getOnlineId() {
        Test.startTest();
        SYstem.assertEquals(null, nksUtilityBackgroundController.getOnlineId());
        Test.stopTest();
    }
}
