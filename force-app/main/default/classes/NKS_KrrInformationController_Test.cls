@isTest
public class NKS_KrrInformationController_Test {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new Person__c(Name = '01048800153'));
    }

    @isTest
    static void testKrrUpdate() {
        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(
                200,
                'OK',
                '{"personer":{"01048800153":{"personident":"01048800153","aktiv":true,"kanVarsles":false,"reservasjonOppdatert":"2024-09-02T07:40:52.158541Z","reservert":true,"spraak":"en","spraakOppdatert":"2024-09-02T07:40:52.159318Z"}},"feil":{}}',
                null
            )
        );

        Test.startTest();
        NKS_KrrInformationController.updateKrrInformation('01048800153');
        Test.stopTest();
    }
}
