@isTest
public class NKS_KrrInformationController_Test {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new Person__c(Name = '01048800153'));
    }

    @isTest
    static void testKrrUpdate() {
        ApiMock.setTestMock('POST_KRR_QUERY', 200, 'OK');

        Test.startTest();
        NKS_KrrInformationController.updateKrrInformation('01048800153');
        Test.stopTest();

        System.assertEquals(
            true,
            [SELECT Id, INT_KRR_Reservation__c FROM Person__c WHERE Name = '01048800153' LIMIT 1].INT_KRR_Reservation__c
        );
    }
}
