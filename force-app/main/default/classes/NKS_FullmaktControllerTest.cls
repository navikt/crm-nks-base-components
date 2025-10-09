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
        Common_Code__c cCode = (Common_Code__c) UTIL_TestDataFactory.createRecord(
            new Common_Code__c(Name = 'Test ccode', CRM_Code_Set__c = 'Tema', CRM_Code__c = 'ARP'),
            true
        );
    }

    @IsTest
    static void testCheckAccessAndGetPersonIdentWithCase() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '01234567890'];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );

        Test.startTest();
        String personIdent = NKS_FullmaktController.fetchPersonIdent(c.Id, 'Case');
        Test.stopTest();

        Assert.isNotNull(personIdent);
    }

    @IsTest
    static void testCheckAccessAndGetPersonIdentWithAccount() {
        Account a = [SELECT Id FROM Account WHERE Name = 'Fake Person'];

        Test.startTest();
        String personIdent = NKS_FullmaktController.fetchPersonIdent(a.Id, 'Account');
        Test.stopTest();

        Assert.isNull(personIdent);
    }

    @IsTest
    static void testCheckAccessAndGetPersonIdentWithPerson() {
        Person__c p = [SELECT Id, Name FROM Person__c WHERE Name = '01234567890'];

        Test.startTest();
        String personIdent = NKS_FullmaktController.fetchPersonIdent(p.Id, 'Person__c');
        Test.stopTest();

        Assert.areEqual('01234567890', personIdent);
    }

    @IsTest
    static void testLogErrorForCoverage() {
        Test.startTest();
        NKS_FullmaktController.logError('test err message');
        Test.stopTest();
    }

    @IsTest
    static void testGetAllFullmaktsgiver() {
        ApiMock.setTestMock(FullmaktService.services.GET_ALL_FULLMAKTSGIVER.name(), 200, 'OK');

        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '01234567890'];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );
        Test.startTest();
        NKS_FullmaktController.FullmaktsgiverAlle fullmakter = NKS_FullmaktController.getAllFullmaktsgiver(
            c.Id,
            'case'
        );
        Test.stopTest();

        Assert.isNotNull(fullmakter);
        Assert.isNotNull(fullmakter.active);
        Assert.isNotNull(fullmakter.historical);
        Assert.areNotEqual(0, fullmakter.active.size());
        Assert.areEqual(2, fullmakter.active.size());
        Assert.areNotEqual(0, fullmakter.historical.size());
        Assert.areEqual(1, fullmakter.historical.size());
    }

    @IsTest
    static void testGetAllFullmaktsgiverNoIdent() {
        Account a = [SELECT Id FROM Account WHERE Name = 'Fake Person'];
        Test.startTest();
        NKS_FullmaktController.FullmaktsgiverAlle fullmakter = NKS_FullmaktController.getAllFullmaktsgiver(
            a.Id,
            'account'
        );
        Test.stopTest();

        Assert.isNull(fullmakter);
    }

    @IsTest
    static void testGetAllFullmaktsgiverErrorHandling() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '01234567890'];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );
        ApiMock.setTestMock(FullmaktService.services.GET_ALL_FULLMAKTSGIVER.name(), 500, 'Error');

        Boolean exceptionOccured = false;
        Test.startTest();
        try {
            NKS_FullmaktController.getAllFullmaktsgiver(c.Id, 'Case');
            exceptionOccured = false;
        } catch (Exception e) {
            exceptionOccured = true;
        }
        Test.stopTest();

        Assert.isTrue(exceptionOccured);
    }

    @IsTest
    static void testGetAllFullmaktsgiverThemeHandling() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '01234567890'];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );

        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(
                200,
                'OK',
                '[{ "fullmaktId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "fullmaktsgiver": "12345678910", "fullmektig": "12345678910", "gyldigFraOgMed": "2025-06-17", "gyldigTilOgMed": null, "leserettigheter": [ "DAG", "FOS", "PEN" ], "skriverettigheter": [ "BIL", "HEL", "HJE", "SAK", "SER" ], "endringslogg": [ { "endringId": 9007199254740991, "registrert": "2025-06-17T08:59:19.868Z", "registrertAv": "string", "kilde": "BRUKER", "hendelse": "OPPRETTELSE_AV_BRUKER", "gyldigFraOgMed": "2025-06-17", "gyldigTilOgMed": null, "leserettigheter": [ "DAG", "FOS", "PEN" ], "skriverettigheter": [ "BIL", "HEL", "HJE", "SAK", "SER" ] } ] }]',
                null
            )
        );

        Test.startTest();
        NKS_FullmaktController.FullmaktsgiverAlle fullmakter = NKS_FullmaktController.getAllFullmaktsgiver(
            c.Id,
            'Case'
        );
        Test.stopTest();

        Assert.areEqual('Hjelpemidler', fullmakter.active[0].themeGroup[0].name);
        Assert.areEqual('Gjelder alle ytelser', fullmakter.active[0].themeGroup[0].displayValue);
        Assert.areEqual('Øvrig', fullmakter.active[0].themeGroup[1].name);
        Assert.areEqual('SAK, SER', fullmakter.active[0].themeGroup[1].displayValue);
    }
}
