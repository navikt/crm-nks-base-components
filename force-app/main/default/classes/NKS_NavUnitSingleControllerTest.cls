@IsTest
private with sharing class NKS_NavUnitSingleControllerTest {
    @IsTest
    static void findUnit_PersonLocationSuccess() {
        String unitJSON =
            '{' +
            '    "enhetId": 100000048,' +
            '    "navn": "NAV TEST",' +
            '    "enhetNr": "1234",' +
            '    "antallRessurser": 1,' +
            '    "status": "Aktiv",' +
            '    "orgNivaa": "EN",' +
            '    "type": "LOKAL",' +
            '    "organisasjonsnummer": "999999999",' +
            '    "underEtableringDato": "1970-01-01",' +
            '    "aktiveringsdato": "1970-01-01",' +
            '    "underAvviklingDato": null,' +
            '    "nedleggelsesdato": null,' +
            '    "oppgavebehandler": true,' +
            '    "versjon": 37,' +
            '    "sosialeTjenester": "sosialeTjenester",' +
            '    "kanalstrategi": "kanalstrategi",' +
            '    "orgNrTilKommunaltNavKontor": "999999999"' +
            '}';

        Test.setMock(HttpCalloutMock.class, new SingleRequestMock(200, 'OK', unitJSON, null));

        Person__c p = (Person__c) UTIL_TestDataFactory.createRecord(
            new Person__c(
                Name = '1234567890',
                INT_LastName__c = 'Potter',
                INT_IsNavEmployee__c = false,
                INT_Confidential__c = 'UGRADERT',
                INT_MunicipalityNumber__c = '1234'
            ),
            true
        );
        Account pAccount = [SELECT Id FROM Account WHERE CRM_Person__c = :p.Id];
        Case c = (Case) UTIL_TestDataFactory.createRecord(new Case(AccountId = pAccount.Id), true);

        NKS_NorgNavUnitService.NavUnitResponse result;

        Test.startTest();
        result = NKS_NavUnitSingleController.findUnit('Account.CRM_Person__c', 'Case', c.Id, 'PERSON_LOCATION');
        Test.stopTest();

        System.assertEquals(true, result.success, 'Expected success');
        System.assertEquals(true, String.isBlank(result.errorMessage), 'Expected blank errorMessage');
        System.assertEquals('1234', result.unit.enhetNr, 'Expected the same unit number as in the mock');
    }

    @IsTest
    static void findUnit_UnitNumberSuccess() {
        String unitJSON =
            '[{' +
            '    "enhetId": 100000048,' +
            '    "navn": "NAV TEST",' +
            '    "enhetNr": "1234",' +
            '    "antallRessurser": 1,' +
            '    "status": "Aktiv",' +
            '    "orgNivaa": "EN",' +
            '    "type": "LOKAL",' +
            '    "organisasjonsnummer": "999999999",' +
            '    "underEtableringDato": "1970-01-01",' +
            '    "aktiveringsdato": "1970-01-01",' +
            '    "underAvviklingDato": null,' +
            '    "nedleggelsesdato": null,' +
            '    "oppgavebehandler": true,' +
            '    "versjon": 37,' +
            '    "sosialeTjenester": "sosialeTjenester",' +
            '    "kanalstrategi": "kanalstrategi",' +
            '    "orgNrTilKommunaltNavKontor": "999999999"' +
            '}]';

        Test.setMock(HttpCalloutMock.class, new SingleRequestMock(200, 'OK', unitJSON, null));

        NavUnit__c unit = (NavUnit__c) UTIL_TestDataFactory.createRecord(
            new NavUnit__c(Name = 'NAV TEST', INT_UnitNumber__c = '1234'),
            true
        );

        NKS_NorgNavUnitService.NavUnitResponse result;

        Test.startTest();
        result = NKS_NavUnitSingleController.findUnit('INT_UnitNumber__c', 'NavUnit__c', unit.Id, 'UNIT_NUMBER');
        Test.stopTest();

        System.assertEquals(true, result.success, 'Expected success');
        System.assertEquals(true, String.isBlank(result.errorMessage), 'Expected blank errorMessage');
        System.assertEquals('1234', result.unit.enhetNr, 'Expected the same unit number as in the mock');
    }

    @IsTest
    static void findUnit_IncorrectType() {
        NKS_NorgNavUnitService.NavUnitResponse result;

        Test.startTest();
        result = NKS_NavUnitSingleController.findUnit('INT_UnitNumber__c', 'NavUnit__c', '', 'TEST');
        Test.stopTest();

        System.assertEquals(null, result, 'Expected NULL in response');
    }

    @IsTest
    static void findUnits_Sucess() {
        String unitJSON =
            '[{' +
            '    "enhetId": 100000048,' +
            '    "navn": "NAV TEST",' +
            '    "enhetNr": "1234",' +
            '    "antallRessurser": 1,' +
            '    "status": "Aktiv",' +
            '    "orgNivaa": "EN",' +
            '    "type": "LOKAL",' +
            '    "organisasjonsnummer": "999999999",' +
            '    "underEtableringDato": "1970-01-01",' +
            '    "aktiveringsdato": "1970-01-01",' +
            '    "underAvviklingDato": null,' +
            '    "nedleggelsesdato": null,' +
            '    "oppgavebehandler": true,' +
            '    "versjon": 37,' +
            '    "sosialeTjenester": "sosialeTjenester",' +
            '    "kanalstrategi": "kanalstrategi",' +
            '    "orgNrTilKommunaltNavKontor": "999999999"' +
            '},' +
            '{' +
            '    "enhetId": 100000043,' +
            '    "navn": "NAV IT TEST",' +
            '    "enhetNr": "2990",' +
            '    "antallRessurser": 1,' +
            '    "status": "Aktiv",' +
            '    "orgNivaa": "EN",' +
            '    "type": "LOKAL",' +
            '    "organisasjonsnummer": "999999999",' +
            '    "underEtableringDato": "1970-01-01",' +
            '    "aktiveringsdato": "1970-01-01",' +
            '    "underAvviklingDato": null,' +
            '    "nedleggelsesdato": null,' +
            '    "oppgavebehandler": true,' +
            '    "versjon": 37,' +
            '    "sosialeTjenester": "sosialeTjenester",' +
            '    "kanalstrategi": "kanalstrategi",' +
            '    "orgNrTilKommunaltNavKontor": "999999999"' +
            '},' +
            '{' +
            '    "enhetId": 100000046,' +
            '    "navn": "NAV MAX",' +
            '    "enhetNr": "9999",' +
            '    "antallRessurser": 1,' +
            '    "status": "Aktiv",' +
            '    "orgNivaa": "EN",' +
            '    "type": "LOKAL",' +
            '    "organisasjonsnummer": "999999999",' +
            '    "underEtableringDato": "1970-01-01",' +
            '    "aktiveringsdato": "1970-01-01",' +
            '    "underAvviklingDato": null,' +
            '    "nedleggelsesdato": null,' +
            '    "oppgavebehandler": true,' +
            '    "versjon": 37,' +
            '    "sosialeTjenester": "sosialeTjenester",' +
            '    "kanalstrategi": "kanalstrategi",' +
            '    "orgNrTilKommunaltNavKontor": "999999999"' +
            '}]';

        Test.setMock(HttpCalloutMock.class, new SingleRequestMock(200, 'OK', unitJSON, null));

        List<NKS_NorgNavUnitService.NavUnitResponse> result;

        Test.startTest();
        result = NKS_NavUnitSingleController.findUnits(new List<String>{'1234', '9999', '2990', '4321'});
        Test.stopTest();

        System.assertEquals(true, result[0].success, 'Expected success');
        System.assertEquals(true, String.isBlank(result[0].errorMessage), 'Expected blank errorMessage');
        System.assertEquals('1234', result[0].unit.enhetNr, 'Expected the same unit number as in the mock');

        System.assertEquals(true, result[1].success, 'Expected success');
        System.assertEquals(true, String.isBlank(result[1].errorMessage), 'Expected blank errorMessage');
        System.assertEquals('9999', result[1].unit.enhetNr, 'Expected the same unit number as in the mock');

        System.assertEquals(true, result[2].success, 'Expected success');
        System.assertEquals(true, String.isBlank(result[2].errorMessage), 'Expected blank errorMessage');
        System.assertEquals('2990', result[2].unit.enhetNr, 'Expected the same unit number as in the mock');

        Assert.isNull(result[3].unit, 'Expected null');
    }

    @IsTest
    static void getContactInformation_Success() {
        String unitJSON =
            '{' +
            '  "id": 100000048,' +
            '  "enhetNr": "1234",' +
            '  "telefonnummer": "12345678",' +
            '  "telefonnummerKommentar": "kl. 08.00–15.30",' +
            '  "faksnummer": null,' +
            '  "epost": null,' +
            '  "postadresse": {' +
            '    "type": "postboksadresse",' +
            '    "postnummer": "0001",' +
            '    "poststed": "OSLO",' +
            '    "postboksnummer": "1",' +
            '    "postboksanlegg": null' +
            '  },' +
            '  "besoeksadresse": {' +
            '    "type": "stedsadresse",' +
            '    "postnummer": "0001",' +
            '    "poststed": "OSLO",' +
            '    "gatenavn": "Storgata",' +
            '    "husnummer": "8",' +
            '    "husbokstav": null,' +
            '    "adresseTilleggsnavn": null' +
            '  }' +
            '}';

        Test.setMock(HttpCalloutMock.class, new SingleRequestMock(200, 'OK', unitJSON, null));

        NKS_NorgNavUnitService.NavUnitContactInformationResponse result;

        Test.startTest();
        result = NKS_NavUnitSingleController.getContactInformation('1234');
        Test.stopTest();

        System.assertEquals(true, result.success, 'Expected success');
        System.assertEquals(true, String.isBlank(result.errorMessage), 'Expected blank errorMessage');
        System.assertEquals('1234', result.contactInformation.enhetNr, 'Expected the same unit number as in the mock');
    }

    @IsTest
    static void getContactInformationV2_Success() {
        ApiMock.setTestMock('GET_KONTAKTINFORMASJON_V2', 200, 'OK');

        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 result;

        Test.startTest();
        result = NKS_NavUnitSingleController.getContactInformationV2('0314');
        Test.stopTest();

        System.assertEquals(true, result.success, 'Expected success');
        System.assertEquals(true, String.isBlank(result.errorMessage), 'Expected blank errorMessage');
        System.assertEquals('0314', result.contactInformation.enhetNr, 'Expected the same unit number as in the mock');
    }

    @IsTest
    static void getContactInformationV2_null() {
        ApiMock.setTestMock('GET_KONTAKTINFORMASJON_V2', 200, 'OK');

        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 result;

        Test.startTest();
        result = NKS_NavUnitSingleController.getContactInformationV2(null);
        Test.stopTest();

        System.assertEquals(null, result, 'Expected null');
    }
}
