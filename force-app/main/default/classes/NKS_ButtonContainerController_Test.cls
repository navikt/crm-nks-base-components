@IsTest
public with sharing class NKS_ButtonContainerController_Test {
    @TestSetup
    static void makeData() {
        Common_Code__c commonCode = new Common_Code__c(Name = 'Arbeid', CRM_Code_Set__c = 'Tema', CRM_Code__c = 'ARB');
        insert commonCode;
    }

    @IsTest
    static void getLabelTest() {
        Test.startTest();
        String testLabel = NKS_ButtonContainerController.getLabel('NKS_Create_NAV_Task');
        Test.stopTest();
        Assert.areEqual('Create NAV Task', testLabel);
    }

    @IsTest
    static void getLabelsTest() {
        List<String> labelList = new List<String>{ 'NKS_Create_NAV_Task', 'NKS_Journal' };
        Test.startTest();
        List<String> testLabels = NKS_ButtonContainerController.getLabels(labelList);
        Test.stopTest();
        Assert.areEqual(2, testLabels.size());
    }

    @IsTest
    static void testGetCommonCodeName() {
        Common_Code__c commonCode = [SELECT Id FROM Common_Code__c LIMIT 1];

        Test.startTest();
        String result = NKS_ButtonContainerController.getCommonCodeName(commonCode.Id);
        Test.stopTest();

        System.assertEquals('Arbeid', result, 'The name should match the inserted Common_Code__c record');
    }
}
