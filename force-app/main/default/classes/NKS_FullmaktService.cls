public with sharing class NKS_FullmaktService {
    private final static string API_CONFIG_NAME = 'Fullmakt'; //API Config name to set when using the ApiController
    private final static string SERVICE_AUTH_HEADER = 'PDLfullmakt';

    public static HttpResponse getFullmakt(String identNr) {
        ApiController apiCtrl = new ApiController();
        apiCtrl.initRequest(API_CONFIG_NAME, 'GET_FULLMAKT');
        apiCtrl.addServiceAuthHeader(SERVICE_AUTH_HEADER);
        apiCtrl.addHeader('Nav-Call-Id', apiCtrl.getLogUuid());
        String encodedIdent = EncodingUtil.base64Encode(Blob.valueOf(identNr));
        apiCtrl.doCallout();

        Integer statusCode = apiCtrl.getResponse().getStatusCode();
        String bodyString = apiCtrl.getResponse().getBody();
        return apiCtrl.getResponse();

        // Vurder dette.

        // Map<String, String> paramMap = new Map<String, String>{ 'ident' => navid };
        // ApiController apiController = new ApiController();
        // apiController.initRequest(CONFIG_NAME, 'GET_ACCESS', paramMap);
        // apiController.addServiceAuthHeader(SERVICE_AUTH_HEADER);

        // CRM_ApplicationDomain.Domain domain = CRM_ApplicationDomain.Domain.NKS;
        // apiController.setLogger(new LoggerUtility('Axsys'))
        //     .setLogCalloutRequest()
        //     .setLogCategory('AXSYS')
        //     .setLogDomain(domain)
        //     .setLogUuid(new Uuid().getValue())
        //     .addHeader('Nav-Call-Id', apiController.getLogUuid())
        //     .addHeader('Nav-Consumer-Id', domain == null ? 'salesforce' : 'sf-' + domain.name());

        // apiController.doCallout();
    }
}
