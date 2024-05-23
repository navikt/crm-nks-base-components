@IsTest
public with sharing class NKS_LabelGetter_Test {
    @IsTest
    static void getLabelTest() {
        Test.startTest();
        String testLabel = NKS_LabelGetter.getLabel('NKS_Create_NAV_Task');
        Test.stopTest();
        Assert.areEqual('Create NAV Task', testLabel);
    }

    @IsTest
    static void getLabelsTest() {
        List<String> labelList = new List<String>{ 'NKS_Create_NAV_Task', 'NKS_Journal' };
        Test.startTest();
        List<String> testLabels = NKS_LabelGetter.getLabels(labelList);
        Test.stopTest();
        Assert.areEqual(2, testLabels.size());
    }
}
