public with sharing class NKS_FullmaktController {
    private static LoggerUtility logger = new LoggerUtility('Fullmakt');

    private static Map<String, Set<String>> fullmaktThemesByGroups = new Map<String, Set<String>>{
        'Arbeid' => new Set<String>{
            'AAP',
            'AAR',
            'DAG',
            'FOS',
            'IND',
            'KLL',
            'OPP',
            'SAP',
            'TSO',
            'TSR',
            'VEN',
            'YRK'
        },
        'Familie' => new Set<String>{ 'BAR', 'BID', 'ENF', 'FAR', 'FOR', 'GRA', 'GRU', 'KON', 'OMS' },
        'Helse' => new Set<String>{ 'SYK', 'SYM', 'UFO' },
        'Hjelpemidler' => new Set<String>{ 'BIL', 'HEL', 'HJE' },
        'Pensjon' => new Set<String>{ 'EYB', 'EYO', 'FIP', 'PEN', 'SUP' },
        'Øvrig' => new Set<String>{ 'AGR', 'ERS', 'FEI', 'GEN', 'MED', 'RPO', 'SAK', 'SER', 'UFM', 'TRY' }
    };

    @AuraEnabled(cacheable=true)
    public static FullmaktsgiverAlle getAllFullmaktsgiver(Id recordId, String objectApiName){
        String personIdent = fetchPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }
        try {
            HttpResponse resp = FullmaktService.getAllFullmakter(personIdent);
            if (resp.getStatusCode() == 200) {
                List<FullmaktsGiverAllWrapper> data = (List<FullmaktsGiverAllWrapper>) JSON.deserialize(resp.getBody(), List<FullmaktsGiverAllWrapper>.class); 
                
                return processData(data);
            } else {
                logError(resp, 'Error retrieving Fullmakts data');
                throw new FullmaktException();
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving Fullmakts data: ' + e.getMessage());
            throw new FullmaktException(e.getMessage());
        }
    }

    private static FullmaktsgiverAlle processData(List<FullmaktsGiverAllWrapper> fullmaktData) {
        FullmaktsGiverAlle fmAlle = new FullmaktsgiverAlle();
        fmAlle.aktive = new List<FullmaktsgiverV2>();
        fmAlle.historiske = new List<FullmaktsgiverV2>();
        
        Map<String, Theme> themeByThemeCode = new Map<String, Theme>();
        for( FullmaktsGiverAllWrapper fullmakt : fullmaktData){
            if(fullmakt.skriverettigheter.isEmpty()) {
                continue;
            }
           List<ThemeGroup> fullmaktThemeGroups = extractThemeGroupFromFullmakt(fullmakt, themeByThemeCode);

            if(fullmakt.gyldigTilOgMed == null || fullmakt.gyldigTilOgMed > System.today()) {
                fmAlle.aktive.add(new FullmaktsgiverV2(fullmakt, fullmaktThemeGroups));
            } else {
                fmAlle.historiske.add(new FullmaktsgiverV2(fullmakt, fullmaktThemeGroups));
            }
        }
        populateThemeNamesFromCommonCodes(themeByThemeCode.values());
        return fmAlle;
    }

    private static List<ThemeGroup> extractThemeGroupFromFullmakt(FullmaktsGiverAllWrapper fullmakt, Map<String, Theme> themeByThemeCode) {
        Map<String, ThemeGroup> fullmaktThemeGroup = new Map<String, ThemeGroup>();
        for(String themeCode : fullmakt.skriverettigheter) {
            for(String themeGroupKey : fullmaktThemesByGroups.keySet()) {
                Set<String> codesInThemeGroup = fullmaktThemesByGroups.get(themeGroupKey);
                if(codesInThemeGroup.contains(themeCode)) {
                    Theme currentTheme;
                    if(themeByThemeCode.containsKey(themeCode)) {
                        currentTheme = themeByThemeCode.get(themeCode);
                    } else {
                        currentTheme = new Theme(themeCode);
                        themeByThemeCode.put(themeCode, currentTheme);
                    }

                    if(fullmaktThemeGroup.containsKey(themeGroupKey)) {
                        fullmaktThemeGroup.get(themeGroupKey).themes.add(currentTheme);
                    } else {
                        fullmaktThemeGroup.put(themeGroupKey, new ThemeGroup(themeGroupKey, new Set<Theme>{ currentTheme }));
                    }
                    break;
                }
            }
        }
        return fullmaktThemeGroup.values();
    }

    private static void populateThemeNamesFromCommonCodes(List<Theme> themes) {
        if (themes.isEmpty()) {
            return;
        }
        Set<String> themeCodes = new Set<String>();
        for (Theme theme : themes) {
            themeCodes.add(theme.themeCode);
        }

        List<Common_Code__c> themeNames = [
            SELECT Name, CRM_Code__c
            FROM Common_Code__c
            WHERE CRM_Code__c IN :themeCodes AND CRM_Code_Set__c = 'Tema'
        ];
        
        Map<String, String> themeNameByThemeCode = new Map<String, String>();
        for(Common_Code__c commonCode : themeNames) {
            themeNameByThemeCode.put(commonCode.CRM_Code__c, commonCode.Name);
        }

        for (Theme iterationTheme : themes) {
            String themeName = themeNameByThemeCode.get(iterationTheme.themeCode);
            if(themeName != null) {
                iterationTheme.themeName = themeName;
            }
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<FullmaktsgiverHistorikk> getHistorikk(Id recordId, String objectApiName) {
        String personIdent = fetchPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }

        try {
            HttpResponse resp = FullmaktService.getFullmaktsgiverHistorikk(personIdent);
            if (resp.getStatusCode() == 200) {
                List<HistorikkWrapper> historikkData = (List<HistorikkWrapper>) JSON.deserialize(
                    resp.getBody(),
                    List<HistorikkWrapper>.class
                );
                return processHistorikkData(historikkData);
            } else {
                logError(resp, 'Error retrieving FullmaktsgiverHistorikk');
                throw new FullmaktException();
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving FullmaktsgiverHistorikk: ' + e.getMessage());
            throw new FullmaktException(e.getMessage());
        }
    }

    @TestVisible
    private static List<FullmaktsgiverHistorikk> processHistorikkData(List<HistorikkWrapper> historikkData) {
        if (historikkData == null || historikkData.isEmpty()) {
            return null;
        }

        Set<Omraade> omraader = extractOmraaderFromOmraadeList(historikkData);
        Map<String, String> omraadeNameByOmraadeTema = getOmraadeNamesFromCommonCodes(omraader);

        List<FullmaktsgiverHistorikk> historikkList = new List<FullmaktsgiverHistorikk>();
        for (HistorikkWrapper historikkResponse : historikkData) {
            HistorikkEndringer sisteEndring = historikkResponse.sisteEndring;
            if (
                sisteEndring != null &&
                (sisteEndring.opphoert == true ||
                (sisteEndring.gyldigFraOgMed != null &&
                Date.valueOf(sisteEndring.gyldigTilOgMed) < Date.today()))
            ) {
                historikkList.add(new FullmaktsgiverHistorikk(sisteEndring, omraadeNameByOmraadeTema));
                if (historikkList.size() == 3) {
                    // Only show last 3 changes to historical power of attorney
                    break;
                }
            }
        }
        return historikkList;
    }

    @AuraEnabled(cacheable=true)
    public static List<Fullmaktsgiver> getFullmaktsgiver(Id recordId, String objectApiName) {
        String personIdent = fetchPersonIdent(recordId, objectApiName);
        if (personIdent == null) {
            return null;
        }

        try {
            HttpResponse resp = FullmaktService.getFullmaktsgiver(personIdent);
            if (resp.getStatusCode() == 200) {
                List<FullmaktsgiverWrapper> fullmaktsgiverData = (List<FullmaktsgiverWrapper>) JSON.deserialize(
                    resp.getBody(),
                    List<FullmaktsgiverWrapper>.class
                );
                return processFullmaktsgiverData(fullmaktsgiverData);
            } else {
                logError(resp, 'Error retrieving Fullmaktsgiver');
                throw new FullmaktException();
            }
        } catch (Exception e) {
            logError('Exception occurred while retrieving Fullmaktsgiver: ' + e.getMessage());
            throw new FullmaktException(e.getMessage());
        }
    }

    @TestVisible
    private static List<Fullmaktsgiver> processFullmaktsgiverData(List<FullmaktsgiverWrapper> fullmaktsgiverData) {
        if (fullmaktsgiverData == null || fullmaktsgiverData.isEmpty()) {
            return null;
        }

        Set<Omraade> omraader = extractOmraaderFromOmraadeList(fullmaktsgiverData);
        Map<String, String> omraadeNameByOmraadeTema = getOmraadeNamesFromCommonCodes(omraader);

        List<Fullmaktsgiver> fmList = new List<Fullmaktsgiver>();
        for (FullmaktsgiverWrapper fmResponse : fullmaktsgiverData) {
            fmList.add(new Fullmaktsgiver(fmResponse, omraadeNameByOmraadeTema));
        }
        return fmList;
    }

    private static Set<Omraade> extractOmraaderFromOmraadeList(List<Object> dataList) {
        Set<Omraade> omraader = new Set<Omraade>();

        for (Object data : dataList) {
            List<Omraade> omraadeList;

            if (data instanceof HistorikkWrapper) {
                HistorikkEndringer sisteEndring = ((HistorikkWrapper) data).sisteEndring;
                omraadeList = sisteEndring != null ? sisteEndring.omraade : null;
            } else if (data instanceof FullmaktsgiverWrapper) {
                omraadeList = ((FullmaktsgiverWrapper) data).omraade;
            } else {
                continue;
            }

            if (omraadeList != null) {
                for (Omraade omd : omraadeList) {
                    omraader.add(omd);
                }
            }
        }
        return omraader;
    }

    private static Map<String, String> getOmraadeNamesFromCommonCodes(Set<Omraade> omdList) {
        if (omdList.isEmpty()) {
            return new Map<String, String>();
        }
        Set<String> omraadeTemaer = new Set<String>();
        for (Omraade omd : omdList) {
            omraadeTemaer.add(omd.tema);
        }

        List<Common_Code__c> omdNames = [
            SELECT Name, CRM_Code__c
            FROM Common_Code__c
            WHERE CRM_Code__c IN :omraadeTemaer AND CRM_Code_Set__c = 'Tema'
        ];

        Map<String, String> omraadeNameByOmraadeTema = new Map<String, String>();
        for (Common_Code__c oCode : omdNames) {
            omraadeNameByOmraadeTema.put(oCode.CRM_Code__c, oCode.Name);
        }
        return omraadeNameByOmraadeTema;
    }

    private static Map<String, String> getOmraadeNamesFromCommonCodes(Set<String> themeList) {
        if (themeList.isEmpty()) {
            return new Map<String, String>();
        }

        Map<String, String> themeNamesByThemeCode = new Map<String, String>();
        for (Common_Code__c code : [
            SELECT Name, CRM_Code__c
            FROM Common_Code__c
            WHERE CRM_Code__c IN :themeList AND CRM_Code_Set__c = 'Tema'
        ]) {
            themeNamesByThemeCode.put(code.CRM_Code__c, code.Name);
        }
        return themeNamesByThemeCode;
    }

    private static List<Omraade> setFullmaktOmraadeList(
        List<Omraade> omraader,
        Map<String, String> omraadeNameByOmraadeTema
    ) {
        if (omraader == null || omraader.isEmpty()) {
            return new List<Omraade>();
        }
        List<Omraade> omraaderWithHandlinger = new List<Omraade>();
        for (Omraade omraade : omraader) {
            Omraade omd = new Omraade();
            String omraadeName = omraadeNameByOmraadeTema.get(omraade.tema);
            omd.tema = omraadeName != null ? omraadeName : omraade.tema;
            omd.temaKode = omraade.tema;
            omd.handling = omraade.handling;
            omraaderWithHandlinger.add(omd);
        }
        return omraaderWithHandlinger;
    }

    @TestVisible
    private static String fetchPersonIdent(Id recordId, String objectApiName) {
        Id personId = getPersonId(recordId, objectApiName);
        if (personId == null || !hasReadAccess(personId)) {
            return null;
        }
        return [SELECT Name FROM Person__c WHERE Id = :personId].Name;
    }

    private static Id getPersonId(Id recordId, String objectApiName) {
        if (objectApiName == 'Case') {
            return [SELECT Account.CRM_Person__c FROM Case WHERE Id = :recordId].Account.CRM_Person__c;
        } else if (objectApiName == 'Account') {
            return [SELECT CRM_Person__c FROM Account WHERE Id = :recordId].CRM_Person__c;
        } else if (objectApiName == 'Person__c') {
            return recordId;
        }
        return null;
    }

    private static Boolean hasReadAccess(Id personId) {
        Id userId = UserInfo.getUserId();
        return [SELECT RecordId, HasReadAccess FROM UserRecordAccess WHERE UserId = :userId AND RecordId = :personId]
        .HasReadAccess;
    }

    private static String getGyldigFraOgMed(HistorikkEndringer fmResp) {
        return fmResp.gyldigFraOgMed == null ? null : formatDate(fmResp.gyldigFraOgMed);
    }

    private static String getGyldigTilOgMed(HistorikkEndringer fmResp) {
        return fmResp.gyldigTilOgMed == null ? null : formatDate(fmResp.gyldigTilOgMed);
    }

    private static String formatDate(Date d) {
        return d == null ? null : DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0)).format('dd.MM.yyyy');
    }

    private static void logError(HttpResponse resp, String message) {
        logger.error(
            message +
                '\n ' +
                'Status code: ' +
                resp.getStatusCode() +
                '\n' +
                'Status: ' +
                resp.getStatus() +
                '\n' +
                'Body: ' +
                resp.getBody(),
            null,
            CRM_ApplicationDomain.Domain.NKS
        );
        logger.publish();
    }

    @TestVisible
    private static void logError(String message) {
        logger.error(message + '\n ', null, CRM_ApplicationDomain.Domain.NKS);
        logger.publish();
    }

    @TestVisible
    private static List<OmraadeGroup> getFormattedOmraadeList(List<Omraade> omraader) {
        List<OmraadeGroup> formattedList = new List<OmraadeGroup>();
        if (omraader != null) {
            Set<String> allThemes = new Set<String>();
            Map<String, Omraade> omraadeMap = new Map<String, Omraade>();
            for (Omraade omder : omraader) {
                allThemes.add(omder.temaKode);
                omraadeMap.put(omder.temaKode, omder);
            }
            for (String themeGroup : fullmaktThemesByGroups.keySet()) {
                Set<String> themesInThemeGroup = fullmaktThemesByGroups.get(themeGroup);
                List<String> tempList;
                // Helse is a special case where we never want to say "Gjelder alle ytelser"
                if (themeGroup != 'Helse' && allThemes.containsAll(themesInThemeGroup)) {
                    tempList = new List<String>{ 'Gjelder alle ytelser' };
                } else {
                    tempList = new List<String>();
                    for (String th : allThemes) {
                        if (themesInThemeGroup.contains(th)) {
                            tempList.add(omraadeMap.get(th).tema);
                        }
                    }
                }
                if (!tempList.isEmpty()) {
                    formattedList.add(new OmraadeGroup(themeGroup, tempList));
                }
            }
        }
        return formattedList;
    }

    //
    // WRAPPERS
    //
    public class HistorikkWrapper {
        public String fullmaktId;
        public List<HistorikkEndringer> fullmaktEndringsloggDetails;
        public HistorikkEndringer sisteEndring {
            get {
                if (!fullmaktEndringsloggDetails.isEmpty()) {
                    return fullmaktEndringsloggDetails[0];
                }
                return null;
            }
        }
    }

    public class HistorikkEndringer {
        public String fullmaktsgiver;
        public String fullmektig;
        public List<Omraade> omraade;
        public Date gyldigFraOgMed;
        public Date gyldigTilOgMed;
        public String fullmaktsgiverNavn;
        public String fullmektigsNavn;
        public Boolean opphoert;
        public String kilde;
        public String kommentar;
    }

    public class FullmaktsgiverHistorikk {
        @AuraEnabled
        public String fullmektig;
        @AuraEnabled
        public List<Omraade> omraader;
        @AuraEnabled
        public List<OmraadeGroup> formattedOmraadeListByThemeGroup {
            get {
                return getFormattedOmraadeList(omraader);
            }
        }
        @AuraEnabled
        public String gyldigFraOgMed;
        @AuraEnabled
        public String gyldigTilOgMed;
        @AuraEnabled
        public String periode {
            get {
                if (gyldigFraOgMed != null && gyldigTilOgMed != null)
                    return gyldigFraOgMed + '-' + gyldigTilOgMed;
                if (gyldigFraOgMed != null)
                    return gyldigFraOgMed + '- Tidsubegrenset';
                return '';
            }
        }
        @AuraEnabled
        public String fullmektigsNavn;
        @AuraEnabled
        public Boolean opphoert;
        @AuraEnabled
        public String status {
            get {
                return opphoert ? 'Avsluttet' : 'Utløpt';
            }
        }

        public FullmaktsgiverHistorikk(HistorikkEndringer sisteEndring, Map<String, String> omraadeNameByOmraadeTema) {
            this.fullmektig = sisteEndring.fullmektig;
            this.omraader = setFullmaktOmraadeList(sisteEndring.omraade, omraadeNameByOmraadeTema);
            this.gyldigFraOgMed = getGyldigFraOgMed(sisteEndring);
            this.gyldigTilOgMed = getGyldigTilOgMed(sisteEndring);
            this.fullmektigsNavn = sisteEndring.fullmektigsNavn;
            this.opphoert = sisteEndring.opphoert;
        }
    }

    public class FullmaktsgiverWrapper {
        public String fullmaktsgiver;
        public String fullmektig;
        public List<Omraade> omraade;
        public Date gyldigFraOgMed;
        public Date gyldigTilOgMed;
        public String fullmaktsgiverNavn;
        public String fullmektigsNavn;
        public String opphoert;
        public String status;
        public String kilde;
    }

    public class FullmaktsGiverAllWrapper {
        public String fullmaktId;
        public String fullmaktsgiver;
        public String fullmektig;
        public Date gyldigFraOgMed;
        public Date gyldigTilOgMed;
        public List<String> leserettigheter;
        public List<String> skriverettigheter;
        public List<EndringslogWrapper> endringslogg;
    }

    public class EndringslogWrapper {
        public String hendelse;
    }

    public virtual class Fullmaktsgiver {
        @AuraEnabled
        public String motpartsRolle;
        @AuraEnabled
        public String motpartsPersonident;
        @AuraEnabled
        public String motpartsNavn;
        @AuraEnabled
        public List<Omraade> omraader;
        @AuraEnabled
        public List<OmraadeGroup> formattedOmraadeListByThemeGroup {
            get {
                return getFormattedOmraadeList(omraader);
            }
        }
        @AuraEnabled
        public Date gyldigFraOgMed;
        @AuraEnabled
        public Date gyldigTilOgMed;
        @AuraEnabled
        public String id;

        public Fullmaktsgiver() {
        }

        public Fullmaktsgiver(FullmaktsgiverWrapper fmGiverWrapper, Map<String, String> omraadeNameByOmraadeTema) {
            this.motpartsPersonident = fmGiverWrapper.fullmektig;
            this.motpartsNavn = fmGiverWrapper.fullmektigsNavn;
            this.motpartsRolle = 'Fullmektig';
            this.omraader = setFullmaktOmraadeList(fmGiverWrapper.omraade, omraadeNameByOmraadeTema);
            this.gyldigFraOgMed = fmGiverWrapper.gyldigFraOgMed;
            this.gyldigTilOgMed = fmGiverWrapper.gyldigTilOgMed;
        }
    }

    public class Omraade {
        public String tema;
        public String temaKode;
        public List<String> handling;
    }

    public class OmraadeGroup {
        @AuraEnabled
        public String themeGroup;
        public List<String> temaKoder;
        @AuraEnabled
        public String temaString {
            get {
                return String.join(temaKoder, ', ').removeEnd(', ');
            }
        }

        public OmraadeGroup(String themeGroup, List<String> temaKoder) {
            this.themeGroup = themeGroup;
            this.temaKoder = temaKoder;
        }
    }

    public class FullmaktException extends Exception {
    }

    public class FullmaktsgiverV2 {
        private final List<String> opphoertList = new List<String>{'OPPHOER_AV_BRUKER','OPPHOER_AV_NAV'};

        @AuraEnabled
        public String fullmektig;
        @AuraEnabled
        public Date gyldigFraOgMed;
        @AuraEnabled
        public Date gyldigTilOgMed;
        @AuraEnabled
        public String periode {
            get {
                if (gyldigFraOgMed != null && gyldigTilOgMed != null)
                    return gyldigFraOgMed.format() + ' - ' + gyldigTilOgMed.format();
                if (gyldigFraOgMed != null)
                    return gyldigFraOgMed.format() + ' - Tidsubegrenset';
                return '';
            }
        }
        @AuraEnabled
        public List<ThemeGroup> themeGroup;
        @AuraEnabled
        public String status;

        public FullmaktsgiverV2(FullmaktsGiverAllWrapper fmGiverWrapper, List<ThemeGroup> themeGroups) {
            this.fullmektig = fmGiverWrapper.fullmektig; 
            this.gyldigFraOgMed = fmGiverWrapper.gyldigFraOgMed; 
            this.gyldigTilOgMed = fmGiverWrapper.gyldigTilOgMed;
            this.status = opphoertList.contains(fmGiverWrapper.endringslogg[0]?.hendelse) ? 'Avsluttet': 'Utløpt';
            this.themeGroup = themeGroups;
        }

    }
    
    public class Theme {
        public String themeCode;
        public String themeName;
        @AuraEnabled
        public String theme { get {
            return themeName ?? themecode;
        }}

        public Theme(String themeCode) {
            this.themeCode = themeCode;
        }
    }

    public class ThemeGroup {
        public String name;
        public Set<Theme> themes;
        @AuraEnabled
        public String displayValue {
            get {
                Set<String> tempList = new Set<String>();
                String returnString = '';
                for (Theme theme : themes) {
                    tempList.add(theme?.themeCode);
                    returnString += theme.theme + ', ';
                }
                if(name == 'Helse') return returnString.removeEnd(', ');
                return fullmaktThemesByGroups.get(name).equals(tempList) ? 'Gjelder alle ytelser' : returnString.removeEnd(', ');
            }
        }

        public ThemeGroup(String name, Set<Theme> themes) {
            this.name = name;
            this.themes = themes;
        }
    }

    public class FullmaktsgiverAlle {
        public List<FullmaktsgiverV2> aktive;
        public List<FullmaktsgiverV2> historiske;
    }
}
