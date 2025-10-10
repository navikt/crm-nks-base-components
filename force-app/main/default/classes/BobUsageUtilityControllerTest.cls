@IsTest
public class BobUsageUtilityControllerTest {
    @TestSetup
    static void makeData() {
        UTIL_TestDataFactory.createRecord(new Case(Origin = 'STO', STO_Category__c = 'Arbeid'), true);
    }

    @IsTest
    public static void getCaseStatusTest() {
        Case c = [SELECT Id FROM Case LIMIT 1];

        Test.startTest();
        String status = BobUsageUtilityController.getCaseStatus(c.Id);
        Test.stopTest();

        Assert.areEqual('New', status);
    }

    @IsTest
    public static void getCaseStatusIdNullTest() {
        Exception ex;

        Test.startTest();
        try {
            BobUsageUtilityController.getCaseStatus(null);
        } catch (Exception e) {
            ex = e;
        }
        Test.stopTest();

        Assert.isNotNull(ex);
    }
}
