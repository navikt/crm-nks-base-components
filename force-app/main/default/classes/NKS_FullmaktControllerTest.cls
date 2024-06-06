@IsTest
public with sharing class NKS_FullmaktControllerTest {
    @TestSetup
    static void makeData() {
        Person__c p1 = (Person__c) UTIL_TestDataFactory.createRecord(
            new Person__c(
                Name = '01234567890',
                INT_FirstName__c = 'Fullmaktsgiver',
                INT_LastName__c = 'McFullmaktsen',
                INT_Confidential__c = 'UGRADERT'
            ),
            true
        );
        Account a1 = (Account) UTIL_TestDataFactory.createRecord(new Account(Name = 'Fake person'), true);
    }

    @IsTest
    static void getFullmaktsgiverHistorikkTest() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '01234567890'];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );
        ApiMock.setTestMock(FullmaktService.services.GET_FULLMAKTSGIVER_HISTORIKK.name(), 200, 'OK');

        Test.startTest();
        List<NKS_FullmaktController.Historikk> histy = NKS_FullmaktController.getHistorikk(c.Id, 'Case');
        Test.stopTest();

        Assert.isNotNull(histy);
        Assert.areNotEqual(0, histy.size());
    }

    @IsTest
    static void getFullmaktsgiverHistorikkNoPersonIdentTest() {
        Account a = [SELECT Id FROM Account WHERE Name = 'Fake Person'];
        Test.startTest();
        List<NKS_FullmaktController.Historikk> histy = NKS_FullmaktController.getHistorikk(a.Id, 'Account');
        Test.stopTest();

        Assert.isNull(histy);
    }

    @IsTest
    static void getFullmaktsgiverTest() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '01234567890'];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );
        ApiMock.setTestMock(FullmaktService.services.GET_FULLMAKTSGIVER.name(), 200, 'OK');

        Test.startTest();
        List<NKS_FullmaktController.Fullmaktsgiver> fullmaktsGiver = NKS_FullmaktController.getFullmaktsgiver(
            c.Id,
            'Case'
        );
        Test.stopTest();

        Assert.isNotNull(fullmaktsGiver);
        Assert.areNotEqual(0, fullmaktsGiver.size());
    }

    @IsTest
    static void getFullmaktsgiverNoPersonIdentTest() {
        Account a = [SELECT Id FROM Account WHERE Name = 'Fake Person'];

        Test.startTest();
        List<NKS_FullmaktController.Fullmaktsgiver> fullmaktsGiver = NKS_FullmaktController.getFullmaktsgiver(
            a.Id,
            'Account'
        );
        Test.stopTest();

        Assert.isNull(fullmaktsGiver);
    }
}
