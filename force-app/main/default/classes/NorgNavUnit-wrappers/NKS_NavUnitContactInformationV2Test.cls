@IsTest
private class NKS_NavUnitContactInformationV2Test {
    private class ContactInfoV2Mock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;

        ContactInfoV2Mock(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setHeader('Content-Type', 'application/json');

            if (responseBody != null) {
                res.setBody(responseBody);
            }

            return res;
        }
    }

    @IsTest
    static void getNavUnitContactInformationV2_blankUnitNumber_returnsFailure() {
        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2(null);
        Test.stopTest();

        Assert.areEqual(false, resp.success);
        Assert.areEqual('Enhetsnummer mangler.', resp.errorMessage);
        Assert.areEqual(null, resp.contactInformation);
    }

    @IsTest
    static void getNavUnitContactInformationV2_200_deserializesFieldsAndComputedValues() {
        String body =
            '{"enhetNr":"0901","navn":"Nav Risør","telefonnummer":"55553333","telefonnummerKommentar":null,' +
            '"postadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":"Tjenngata","husnummer":"9","husbokstav":null,"adresseTilleggsnavn":null},' +
            '"besoeksadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":"Tjenngata","husnummer":"9","husbokstav":null,"adresseTilleggsnavn":null},' +
            '"brukerkontakt":{"publikumsmottak":[],"publikumskanaler":[],"brukertjenesteTilbud":{"tjenester":[{"type":"FLYKTNINGTJENESTE"}],"ytterligereInformasjon":""},"sosialhjelp":{"digitaleSoeknader":[],"papirsoeknadInformasjon":""},"informasjonUtbetalinger":"","skriftspraak":"NB"}}';

        Test.setMock(HttpCalloutMock.class, new ContactInfoV2Mock(200, body));

        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2('0901');
        Test.stopTest();

        Assert.areEqual(true, resp.success);
        Assert.areNotEqual(null, resp.contactInformation);
        Assert.areEqual('0901', resp.contactInformation.enhetNr);
        Assert.areEqual('Nav Risør', resp.contactInformation.navn);
        Assert.areEqual('55553333', resp.contactInformation.telefonnummer);

        Assert.areNotEqual(null, resp.contactInformation.postadresse);
        Assert.areEqual('Tjenngata', resp.contactInformation.postadresse.gatenavn);
        Assert.areEqual('9', resp.contactInformation.postadresse.husnummer);
        Assert.areEqual('4950', resp.contactInformation.postadresse.postnummer);
        Assert.areEqual('RISØR', resp.contactInformation.postadresse.poststed);
        Assert.areEqual('Tjenngata 9, 4950 RISØR', resp.contactInformation.postadresse.concatenatedAddress);

        Assert.areNotEqual(null, resp.contactInformation.besoeksadresse);
        Assert.areEqual('Tjenngata', resp.contactInformation.besoeksadresse.gatenavn);
        Assert.areEqual('9', resp.contactInformation.besoeksadresse.husnummer);
        Assert.areEqual('4950', resp.contactInformation.besoeksadresse.postnummer);
        Assert.areEqual('RISØR', resp.contactInformation.besoeksadresse.poststed);
        Assert.areEqual('Tjenngata 9, 4950 RISØR', resp.contactInformation.besoeksadresse.concatenatedAddress);

        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt);
        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt.publikumsmottak);
        Assert.areEqual(0, resp.contactInformation.brukerkontakt.publikumsmottak.size());
        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt.publikumskanaler);
        Assert.areEqual(0, resp.contactInformation.brukerkontakt.publikumskanaler.size());
        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt.brukertjenesteTilbud);
        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt.brukertjenesteTilbud.tjenester);
        Assert.areEqual(1, resp.contactInformation.brukerkontakt.brukertjenesteTilbud.tjenester.size());
        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt.sosialhjelp);
        Assert.areNotEqual(null, resp.contactInformation.brukerkontakt.sosialhjelp.digitaleSoeknader);
        Assert.areEqual(0, resp.contactInformation.brukerkontakt.sosialhjelp.digitaleSoeknader.size());
        Assert.areEqual('', resp.contactInformation.brukerkontakt.sosialhjelp.papirsoeknadInformasjon);
        Assert.areEqual('', resp.contactInformation.brukerkontakt.informasjonUtbetalinger);
        Assert.areEqual('NB', resp.contactInformation.brukerkontakt.skriftspraak);

        NKS_NavUnitContactInformationV2.Tjenestetilbud tjeneste = resp.contactInformation.brukerkontakt.brukertjenesteTilbud.tjenester[0];
        Assert.areEqual('FLYKTNINGTJENESTE', tjeneste.typeMapValue);
        Assert.areEqual('Flyktningtjeneste', tjeneste.type);
    }

    @IsTest
    static void getNavUnitContactInformationV2_200_skipsBlankAddressParts() {
        String body =
            '{"enhetNr":"0901","navn":"Nav Risør",' +
            '"postadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":"Tjenngata","husnummer":null,"husbokstav":"","adresseTilleggsnavn":null},' +
            '"besoeksadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":"Tjenngata","husnummer":null,"husbokstav":"","adresseTilleggsnavn":null},' +
            '"brukerkontakt":{"publikumsmottak":[],"publikumskanaler":[],"brukertjenesteTilbud":{"tjenester":[],"ytterligereInformasjon":""},"sosialhjelp":{"digitaleSoeknader":[],"papirsoeknadInformasjon":""},"informasjonUtbetalinger":"","skriftspraak":"NB"}}';

        Test.setMock(HttpCalloutMock.class, new ContactInfoV2Mock(200, body));

        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2('0901');
        Test.stopTest();

        Assert.areEqual(true, resp.success);
        Assert.areEqual('Tjenngata, 4950 RISØR', resp.contactInformation.postadresse.concatenatedAddress);
        Assert.areEqual('Tjenngata, 4950 RISØR', resp.contactInformation.besoeksadresse.concatenatedAddress);
    }

    @IsTest
    static void getNavUnitContactInformationV2_200_returnsPostalOnlyWhenStreetMissing() {
        String body =
            '{"enhetNr":"0901","navn":"Nav Risør",' +
            '"postadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":null,"husnummer":null,"husbokstav":null,"adresseTilleggsnavn":null},' +
            '"besoeksadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":null,"husnummer":null,"husbokstav":null,"adresseTilleggsnavn":null},' +
            '"brukerkontakt":{"publikumsmottak":[],"publikumskanaler":[],"brukertjenesteTilbud":{"tjenester":[],"ytterligereInformasjon":""},"sosialhjelp":{"digitaleSoeknader":[],"papirsoeknadInformasjon":""},"informasjonUtbetalinger":"","skriftspraak":"NB"}}';

        Test.setMock(HttpCalloutMock.class, new ContactInfoV2Mock(200, body));

        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2('0901');
        Test.stopTest();

        Assert.areEqual(true, resp.success);
        Assert.areEqual('4950 RISØR', resp.contactInformation.postadresse.concatenatedAddress);
        Assert.areEqual('4950 RISØR', resp.contactInformation.besoeksadresse.concatenatedAddress);
    }

    @IsTest
    static void getNavUnitContactInformationV2_200_returnsStreetOnlyWhenPostalMissing() {
        String body =
            '{"enhetNr":"0901","navn":"Nav Risør",' +
            '"postadresse":{"type":"stedsadresse","postnummer":null,"poststed":null,"gatenavn":"Tjenngata","husnummer":"9","husbokstav":null,"adresseTilleggsnavn":null},' +
            '"besoeksadresse":{"type":"stedsadresse","postnummer":null,"poststed":null,"gatenavn":"Tjenngata","husnummer":"9","husbokstav":null,"adresseTilleggsnavn":null},' +
            '"brukerkontakt":{"publikumsmottak":[],"publikumskanaler":[],"brukertjenesteTilbud":{"tjenester":[],"ytterligereInformasjon":""},"sosialhjelp":{"digitaleSoeknader":[],"papirsoeknadInformasjon":""},"informasjonUtbetalinger":"","skriftspraak":"NB"}}';

        Test.setMock(HttpCalloutMock.class, new ContactInfoV2Mock(200, body));

        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2('0901');
        Test.stopTest();

        Assert.areEqual(true, resp.success);
        Assert.areEqual('Tjenngata 9', resp.contactInformation.postadresse.concatenatedAddress);
        Assert.areEqual('Tjenngata 9', resp.contactInformation.besoeksadresse.concatenatedAddress);
    }

    @IsTest
    static void getNavUnitContactInformationV2_200_formatsPostboksAddress() {
        String body =
            '{"enhetNr":"0901","navn":"Nav Risør",' +
            '"postadresse":{"type":"postboksadresse","postnummer":"4950","poststed":"RISØR","postboksnummer":"123","postboksanlegg":"Sentrum","adresseTilleggsnavn":"NAV","gatenavn":null,"husnummer":null,"husbokstav":null},' +
            '"besoeksadresse":{"type":"stedsadresse","postnummer":"4950","poststed":"RISØR","gatenavn":"Tjenngata","husnummer":"9","husbokstav":null,"adresseTilleggsnavn":null},' +
            '"brukerkontakt":{"publikumsmottak":[],"publikumskanaler":[],"brukertjenesteTilbud":{"tjenester":[],"ytterligereInformasjon":""},"sosialhjelp":{"digitaleSoeknader":[],"papirsoeknadInformasjon":""},"informasjonUtbetalinger":"","skriftspraak":"NB"}}';

        Test.setMock(HttpCalloutMock.class, new ContactInfoV2Mock(200, body));

        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2('0901');
        Test.stopTest();

        Assert.areEqual(true, resp.success);
        Assert.areEqual(
            'NAV Postboks 123 Sentrum, 4950 RISØR',
            resp.contactInformation.postadresse.concatenatedAddress
        );
    }

    @IsTest
    static void getNavUnitContactInformationV2_404_returnsFailure() {
        Test.setMock(HttpCalloutMock.class, new ContactInfoV2Mock(404, '{"field":"x","message":"not found"}'));

        Test.startTest();
        NKS_NorgNavUnitService svc = new NKS_NorgNavUnitService();
        NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = svc.getNavUnitContactInformationV2('9999');
        Test.stopTest();

        Assert.areEqual(false, resp.success);
        Assert.isTrue(resp.errorMessage != null && resp.errorMessage.contains('Kunne ikke finne enhetsinformasjon.'));
    }
}
