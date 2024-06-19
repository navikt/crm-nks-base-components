@IsTest
private with sharing class NKS_PersonBadgesController_Test {
    static String toIso(Date d) {
        return Datetime.newInstanceGmt(d, Time.newInstance(12, 0, 0, 0)).format('yyyy-MM-dd');
    }

    @TestSetup
    static void makeData() {
        Person__c p = (Person__c) UTIL_TestDataFactory.createRecord(
            new Person__c(
                Name = '12345678901',
                INT_FirstName__c = 'Harry',
                INT_LastName__c = 'Potter',
                INT_Confidential__c = 'UGRADERT'
            ),
            true
        );

        Person__c p2 = (Person__c) UTIL_TestDataFactory.createRecord(
            new Person__c(
                Name = '01234567890',
                INT_FirstName__c = 'Motpart',
                INT_LastName__c = 'Motpartsen',
                INT_Confidential__c = 'UGRADERT'
            ),
            true
        );

        insert new List<Common_Code__c>{
            new Common_Code__c(
                CRM_Active__c = true,
                CRM_Archive_Theme__c = true,
                CRM_Code__c = 'AAP',
                CRM_Code_Set__c = 'Tema',
                CRM_Display_Name__c = '',
                CRM_UniqueKey__c = 'TemaAAP',
                Name = 'Arbeidsavklaringspenger'
            ),
            new Common_Code__c(
                CRM_Active__c = true,
                CRM_Archive_Theme__c = true,
                CRM_Code__c = 'DAG',
                CRM_Code_Set__c = 'Tema',
                CRM_Display_Name__c = '',
                CRM_UniqueKey__c = 'TemaDAG',
                Name = 'Dagpenger'
            )
        };
    }

    @IsTest
    static void getPersonBadgesAndInfo_FromAccount() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_IsNavEmployee__c = true;
        p.INT_SpokenLanguageIntepreter__c = 'AM;EN';
        p.INT_IsDeceased__c = true;
        p.INT_Confidential__c = 'FORTROLIG';
        p.INT_SecurityMeasures__c =
            '[{\"Tiltakstype\":\"FTUS\",\"Beskrivelse\":\"Telefonisk utestengelse\",\"GyldigFraOgMed\":\"' +
            toIso(Date.today().addDays(-30)) +
            '\",\"GyldigTilOgMed\":\"' +
            toIso(Date.today()) +
            '\",\"Kontaktperson\":null},{\"Tiltakstype\":\"FTUS\",\"Beskrivelse\":\"Telefonisk utestengelse\",\"GyldigFraOgMed\":\"' +
            toIso(Date.today().addDays(-60)) +
            '\",\"GyldigTilOgMed\":\"' +
            toIso(Date.today().addDays(-1)) +
            '\",\"Kontaktperson\":null}]';
        update p;

        Test.startTest();
        NKS_PersonBadgesController.PersonBadgeData pbd = NKS_PersonBadgesController.getPersonBadgesAndInfo(
            'CRM_Person__c',
            'Account',
            p.CRM_Account__c,
            false
        );

        System.assertEquals(1, pbd.securityMeasures.size(), 'Expected one');
        System.assertEquals(3, pbd.badges.size(), 'Expected three');
        System.assertEquals(2, pbd.spokenLanguagesIntepreter.size(), 'Expected two');
        Test.stopTest();
    }

    @IsTest
    static void getPersonBadgesAndInfo_FromCase() {
        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_IsNavEmployee__c = true;
        p.INT_SpokenLanguageIntepreter__c = 'AM;EN';
        p.INT_IsDeceased__c = true;
        p.INT_KRR_Reservation__c = true;
        p.INT_SecurityMeasures__c =
            '[{\"Tiltakstype\":\"FTUS\",\"Beskrivelse\":\"Telefonisk utestengelse\",\"GyldigFraOgMed\":\"' +
            toIso(Date.today().addDays(-30)) +
            '\",\"GyldigTilOgMed\":\"' +
            toIso(Date.today()) +
            '\",\"Kontaktperson\":null}]';
        update p;

        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );

        NKS_PersonBadgesController.PersonBadgeData pbd = NKS_PersonBadgesController.getPersonBadgesAndInfo(
            'Account.CRM_Person__c',
            'Case',
            c.Id,
            false
        );

        System.assertEquals(1, pbd.securityMeasures.size(), 'Expected one');
        System.assertEquals(5, pbd.badges.size(), 'Expected five');
        System.assertEquals(2, pbd.spokenLanguagesIntepreter.size(), 'Expected two');
    }

    @IsTest
    static void setBadgeData_GuardianshipOrFuturePowerOfAttorney() {
        String jsonString = '[{"type":"midlertidigForVoksen","omfangetErInnenPersonligOmraade":true,"omfang":"personligeOgOekonomiskeInteresser","navn":{"fornavn":"Motpart","mellomnavn":"Old Name" ,"etternavn":"Motpartsen"},"motpartsPersonident":"01234567890","embete":"Fylkesmannen i Rogaland"}]';

        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_GuardianshipOrFuturePowerOfAttorney__c = jsonString;
        update p;

        NKS_PersonBadgesController.PersonBadgeData result;
        Test.startTest();
        result = NKS_PersonBadgesController.getPersonBadgesAndInfo('CRM_Person__c', 'Account', p.CRM_Account__c, false);
        Test.stopTest();

        System.assertEquals(1, result.guardianships.size(), 'Expected one guardianship');
        System.assertEquals(
            'Ja',
            result.guardianships[0].omfangetErInnenPersonligOmraadeTxt,
            'Expected "Ja" since omfangetErInnenPersonligOmraade = "true"'
        );
        System.assertEquals(1, result.badges.size(), 'Expected one guardianship');
        System.assertEquals('Motpart Motpartsen', result.guardianships[0].navn.fullName, 'Wrong name');
        System.assertNotEquals(
            result.guardianships[0].omfang,
            result.guardianships[0].omfangLabel,
            'Expected omfang to have a label'
        );
        System.assertNotEquals(
            result.guardianships[0].type,
            result.guardianships[0].typeLabel,
            'Expected type to have a label'
        );
    }

    @IsTest
    static void setBadgeData_GuardianshipOrFuturePowerOfAttorneyError() {
        String jsonString = '{"type":"midlertidigForVoksen","omfangetErInnenPersonligOmraade":true,"omfang":"personligeOgOekonomiskeInteresser","navn":null,"motpartsPersonident":"01234567890","embete":"fylkesmannenITromsOgFinnmark"}]';

        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_GuardianshipOrFuturePowerOfAttorney__c = jsonString;
        update p;

        NKS_PersonBadgesController.PersonBadgeData result;
        Test.startTest();
        result = NKS_PersonBadgesController.getPersonBadgesAndInfo('CRM_Person__c', 'Account', p.CRM_Account__c, false);
        Test.stopTest();

        System.assertEquals(0, result.guardianships.size(), 'Expected one guardianship');
        System.assertEquals(1, result.errors.size(), 'Expected one error');
        System.assertEquals(1, result.badges.size(), 'Expected one guardianship badge');
    }

    @IsTest
    static void setBadgeData_PowerOfAttorneyAllAreas() {
        NKS_PersonBadgesController.PowerOfAttorney poa1 = new NKS_PersonBadgesController.PowerOfAttorney();
        poa1.motpartsRolle = 'FULLMEKTIG';
        poa1.motpartsPersonident = '01234567890';
        poa1.omraader = new List<String>{ '*' };
        poa1.gyldigFraOgMed = Date.today();
        poa1.gyldigTilOgMed = Date.today().addDays(1);

        NKS_PersonBadgesController.PowerOfAttorney poa2 = new NKS_PersonBadgesController.PowerOfAttorney();
        poa2.motpartsRolle = 'FULLMEKTIG';
        poa2.motpartsPersonident = '01234567890';
        poa2.omraader = new List<String>{ 'PEN', 'DAG' };
        poa2.gyldigFraOgMed = Date.today();
        poa2.gyldigTilOgMed = Date.today().addDays(1);

        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_PowerOfAttorney__c = JSON.serialize(new List<NKS_PersonBadgesController.PowerOfAttorney>{ poa1, poa2 });
        update p;

        NKS_PersonBadgesController.PersonBadgeData result;
        Test.startTest();
        result = NKS_PersonBadgesController.getPersonBadgesAndInfo('CRM_Person__c', 'Account', p.CRM_Account__c, false);
        Test.stopTest();

        System.assertEquals(2, result.powerOfAttorneys.size(), 'Expected one guardianship');
        System.assertEquals('01234567890', result.powerOfAttorneys[0].motpartsPersonident, 'Expected 01234567890');
        System.assertEquals('Fullmektig', result.powerOfAttorneys[0].motpartsRolle, 'Expected Fullmektig');
        System.assertEquals(
            'Gjelder alle ytelser',
            result.powerOfAttorneys[0].omraade,
            'Expected Gjelder alle ytelser'
        );

        System.assertEquals(1, result.badges.size(), 'Expected one guardianship');
    }

    @IsTest
    static void setBadgeData_PowerOfAttorneySomeAreas() {
        NKS_PersonBadgesController.PowerOfAttorney poa = new NKS_PersonBadgesController.PowerOfAttorney();
        poa.motpartsRolle = 'FULLMEKTIG';
        poa.motpartsPersonident = '40000000000';
        poa.omraader = new List<String>{ 'ARB' };
        poa.gyldigFraOgMed = Date.today();
        poa.gyldigTilOgMed = Date.today().addDays(1);

        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_PowerOfAttorney__c = JSON.serialize(new List<NKS_PersonBadgesController.PowerOfAttorney>{ poa });
        update p;

        NKS_PersonBadgesController.PersonBadgeData result;
        Test.startTest();
        result = NKS_PersonBadgesController.getPersonBadgesAndInfo('CRM_Person__c', 'Account', p.CRM_Account__c, false);
        Test.stopTest();

        System.assertEquals(1, result.powerOfAttorneys.size(), 'Expected one guardianship');
        System.assertEquals('40000000000', result.powerOfAttorneys[0].motpartsPersonident, 'Expected 40000000000');
        System.assertEquals('Fullmektig', result.powerOfAttorneys[0].motpartsRolle, 'Expected Fullmektig');
        System.assertEquals('ARB', result.powerOfAttorneys[0].omraade, 'Expected Gjelder alle ytelser');

        System.assertEquals(1, result.badges.size(), 'Expected one guardianship');
    }

    @IsTest
    static void setBadgeData_PowerOfAttorneyError() {
        String jsonString = '{"motpartsRolle": "FULLMEKTIG","motpartsPersonident": "40000000000","omraader": ["ARB"],"gyldigFraOgMed": "2020-02-05","gyldigTilOgMed": "2021-02-05"}]';

        Person__c p = [SELECT Id, CRM_Account__c FROM Person__c WHERE Name = '12345678901'];
        p.INT_PowerOfAttorney__c = jsonString;
        update p;

        NKS_PersonBadgesController.PersonBadgeData result;
        Test.startTest();
        result = NKS_PersonBadgesController.getPersonBadgesAndInfo('CRM_Person__c', 'Account', p.CRM_Account__c, false);
        Test.stopTest();

        System.assertEquals(0, result.powerOfAttorneys.size(), 'Expected no guardianships');
        System.assertEquals(1, result.errors.size(), 'Expected one error');

        System.assertEquals(0, result.badges.size(), 'Expected no guardianship badges');
    }

    @IsTest
    static void setOpenSTOTest() {
        Person__c p = [
            SELECT
                Id,
                CRM_Account__c,
                INT_PowerOfAttorney__c,
                INT_GuardianshipOrFuturePowerOfAttorney__c,
                INT_KRR_Reservation__c,
                NKS_NumberOfSecurityMeasures__c,
                INT_DateOfDeath__c,
                INT_IsDeceased__c,
                INT_SpokenLanguageIntepreter__c,
                INT_IsNavEmployee__c,
                INT_Confidential__c,
                INT_SecurityMeasures__c
            FROM Person__c
            WHERE Name = '12345678901'
        ];
        Case c = (Case) UTIL_TestDataFactory.createRecord(
            new Case(AccountId = p.CRM_Account__c, STO_Category__c = 'Arbeid', Status = 'New'),
            true
        );

        NKS_PersonBadgesController.PersonBadgeData pbd = new NKS_PersonBadgesController.PersonBadgeData(p);

        Test.startTest();
        pbd.setOpenSTO(c.Id.toString(), true);
        Test.stopTest();
    }
}
