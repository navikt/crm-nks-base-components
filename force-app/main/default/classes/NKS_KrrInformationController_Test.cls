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

    @isTest
    static void testKrrSistVerifisertDato() {
        Datetime newEmail = Datetime.newInstance(2024, 1, 1);
        Datetime oldEmail = Datetime.newInstance(2021,5,12);
        Datetime newPhone = Datetime.newInstance(2024,9,19);
        Datetime oldPhone = Datetime.newInstance(2018,7,3);

        KrrCalloutService.Person persEpostNewest = new KrrCalloutService.Person();
        persEpostNewest.epostadresseVerifisert = newEmail;
        persEpostNewest.mobiltelefonnummerVerifisert = oldPhone;

        KrrCalloutService.Person persMobileNewest = new KrrCalloutService.Person();
        persMobileNewest.epostadresseVerifisert = oldEmail;
        persMobileNewest.mobiltelefonnummerVerifisert = newPhone;

        KrrCalloutService.Person persNoMobile = new KrrCalloutService.Person();
        persNoMobile.epostadresseVerifisert = oldEmail;

        KrrCalloutService.Person persNoEmail = new KrrCalloutService.Person();
        persNoEmail.mobiltelefonnummerVerifisert = oldPhone;

        KrrCalloutService.Person persNoContact = new KrrCalloutService.Person();

        Test.startTest();
        Datetime datetimeEpostNewst = NKS_KrrInformationController.sistVerifisertDato(persEpostNewest);
        Datetime datetimeMobileNewest = NKS_KrrInformationController.sistVerifisertDato(persMobileNewest);
        Datetime datetimeNoMobile = NKS_KrrInformationController.sistVerifisertDato(persNoMobile);
        Datetime datetimeNoEmail = NKS_KrrInformationController.sistVerifisertDato(persNoEmail);
        Datetime datetimeNoContact = NKS_KrrInformationController.sistVerifisertDato(persNoContact);
        Test.stopTest();

        System.Assert.areEqual(newEmail, datetimeEpostNewst);
        System.Assert.areEqual(newPhone, datetimeMobileNewest);
        System.Assert.areEqual(oldEmail, datetimeNoMobile);
        System.Assert.areEqual(oldPhone, datetimeNoEmail);
        System.Assert.isNull(datetimeNoContact);
    }
}
