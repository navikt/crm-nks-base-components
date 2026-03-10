@isTest
public class NKS_KrrInformationController_Test {
    @isTest
    static void testGetKrrInformation() {
        ApiMock.setTestMock('POST_KRR_QUERY', 200, 'OK');

        NKS_KrrInformationController.KrrData result;

        Test.startTest();
        result = NKS_KrrInformationController.getKrrInformation('01048800153');
        Test.stopTest();

        Assert.isNotNull(result, 'Expected KrrData to be returned');
    }
}
