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
        fmAlle.active = new List<FullmaktsgiverV2>();
        fmAlle.historical = new List<FullmaktsgiverV2>();
        
        Map<String, Theme> themeByThemeCode = new Map<String, Theme>();
        for( FullmaktsGiverAllWrapper fullmakt : fullmaktData){
            if(fullmakt.skriverettigheter.isEmpty()) {
                continue;
            }
           List<ThemeGroup> fullmaktThemeGroups = extractThemeGroupFromFullmakt(fullmakt, themeByThemeCode);

            if(fullmakt.gyldigTilOgMed == null || fullmakt.gyldigTilOgMed > System.today()) {
                fmAlle.active.add(new FullmaktsgiverV2(fullmakt, fullmaktThemeGroups));
            } else {
                fmAlle.historical.add(new FullmaktsgiverV2(fullmakt, fullmaktThemeGroups));
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

    public class FullmaktException extends Exception {
    }

    public virtual class FullmaktsgiverV2 {
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
                if (gyldigTilOgMed != null)
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
            this.status = !fmGiverWrapper.endringslogg.isEmpty() ? opphoertList.contains(fmGiverWrapper.endringslogg[0]?.hendelse) ? 'Avsluttet': 'Utløpt' : 'Utløpt';
            this.themeGroup = themeGroups;
        }
        public FullmaktsgiverV2() {
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
        @AuraEnabled
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
        public List<FullmaktsgiverV2> active;
        public List<FullmaktsgiverV2> historical;
    }
}
