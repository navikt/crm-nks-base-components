/**
 * @description       :
 * @author            : mamikals
 * @group             :
 * @last modified on  : 19-12-2022
 * @last modified by  : mamikals
 **/
@IsTest
public with sharing class NKS_FagsystemControllerTest {
    @TestSetup
    static void makeData() {
        Person__c person = new Person__c(
            Name = '12345678901',
            INT_MunicipalityNumber__c = '0301',
            INT_LastName__c = 'Test1',
            INT_Confidential__c = 'UGRADERT',
            INT_MaritalStatus__c = 'UOPPGITT',
            INT_ActorId__c = '12345678905'
        );
        insert person;
        String personAccountRecordType = Schema.getGlobalDescribe()
            .get('Account')
            .getDescribe()
            .getRecordTypeInfosByDeveloperName()
            .get('PersonAccount')
            .getRecordTypeId();
        Account acc = new Account(
            FirstName = 'Harry',
            LastName = 'Potter',
            INT_PersonIdent__c = '12345678901',
            RecordTypeId = personAccountRecordType,
            CRM_Person__c = person.Id
        );
        insert acc;
        person.CRM_Account__c = acc.Id;
        update person;
        System.debug(person.CRM_Account__c);
        Case caseWithAccount = new Case(AccountId = person.CRM_Account__c, Status = 'New', Origin = 'Web');
        insert caseWithAccount;
    }

    @IsTest
    static void testGetFagsystemData() {
        Person__c pers = [
            SELECT Id, Name, INT_ActorId__c, CRM_Account__c
            FROM Person__c
            WHERE INT_ActorId__c = '12345678905'
        ][0];
        Id accountId = pers.CRM_Account__c;
        Case c = [SELECT Id FROM Case WHERE AccountId = :accountId];

        Test.startTest();
        NKS_FagsystemController.FagsystemData dataFromAccount = NKS_FagsystemController.getFagsystemData(
            accountId,
            'Id',
            'Account',
            false
        );
        NKS_FagsystemController.FagsystemData dataFromCase = NKS_FagsystemController.getFagsystemData(
            c.Id,
            'Account',
            'Case',
            false
        );
        NKS_FagsystemController.FagsystemData dataFromPerson = NKS_FagsystemController.getFagsystemData(
            pers.Id,
            'Id',
            'Person__c',
            true
        );
        Test.stopTest();

        System.assertEquals(pers.Name, dataFromCase.personIdent);
        System.assertEquals(pers.Name, dataFromAccount.personIdent);
        System.assertEquals(pers.Name, dataFromPerson.personIdent);
        System.assertEquals(pers.INT_ActorId__c, dataFromCase.actorId);
        System.assertEquals(pers.INT_ActorId__c, dataFromAccount.actorId);
        System.assertEquals(pers.INT_ActorId__c, dataFromPerson.actorId);
    }

    @IsTest
    static void testGetModiaSosialLink() {
        Person__c pers = [SELECT Id, Name FROM Person__c WHERE Name != NULL][0];
        ApiMock.setTestMock('POST_SOSIAL_LINK', 200, 'OK');
        String expectedModiaSosialLinkFromMock = 'http://localhost:8383/sosialhjelp/modia-api/local/cookie';
        Test.startTest();
        String link = NKS_FagsystemController.getModiaSosialLink(pers.Name);
        Test.stopTest();
        System.assertEquals(expectedModiaSosialLinkFromMock, link);
    }

    @IsTest
    static void testGetModiaSosialLinkErr() {
        Person__c pers = [SELECT Id, Name FROM Person__c WHERE Name != NULL LIMIT 1];
        ApiMock.setTestMock('POST_SOSIAL_LINK', 500, 'Internal Server Error');

        Exception ex;
        Test.startTest();
        try {
            NKS_FagsystemController.getModiaSosialLink(pers.Name);
        } catch (Exception e) {
            ex = e;
        }
        Test.stopTest();

        System.assertNotEquals(null, ex, 'Exception should be thrown');
        System.assertEquals('Script-thrown exception', ex.getMessage());
    }

    @IsTest
    static void testGetFagsoneIpAndOrgType() {
        Test.startTest();
        NKS_FagsystemController.FagsoneIp ipInfo = new NKS_FagsystemController.FagsoneIp('192.168.0.1', false);
        NKS_FagsystemController.FagsoneIpAndOrgType result = NKS_FagsystemController.getFagsoneIpAndOrgType();
        result.ipResult = ipInfo;
        Test.stopTest();

        System.assertNotEquals(null, result.isSandboxOrScratch);
    }
}
