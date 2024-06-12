public with sharing class NKS_PersonBadgesController {
    // Static final class for holding all the HOT entitlement fields.
    public static final Set<String> HOT_ENTITLEMENT_FIELDS = new Set<String>{
        'HOT_DailyLifeInterpreter__c',
        'HOT_EducationInterpreter__c',
        'HOT_Escort__c',
        'HOT_HapticCommunication__c',
        'HOT_InterpreterAtWork__c',
        'HOT_RemoteInterpreter__c',
        'HOT_SignLanguage__c',
        'HOT_SignLanguageWithLimitedFieldOfView__c',
        'HOT_SignToSupportMouthReading__c',
        'HOT_SpeechInterpreting__c',
        'HOT_TactileSignLanguage__c',
        'HOT_WritenInterpreting__c'
    };

    private static Map<String, String> languageMap {
        get {
            if (languageMap == null) {
                languageMap = new Map<String, String>();
                for (Common_Code__c land : [
                    SELECT Id, Name, CRM_Code__c
                    FROM Common_Code__c
                    WHERE CRM_Code_set__c = 'Språk'
                ]) {
                    languageMap.put(land.CRM_Code__c, land.Name);
                }
            }
            return languageMap;
        }
        private set {
        }
    }
    /**
     * @description Get an apex type holding all the data we need for showing badges.
     */
    @AuraEnabled(cacheable=true)
    public static PersonBadgeData getPersonBadgesAndInfo(String field, String parentObject, String parentRecordId) {
        Id personId = getPersonId(field, parentObject, parentRecordId);
        Person__c person = getPerson(personId);
        PersonBadgeData badges = new PersonBadgeData(person);
        if (parentObject == 'Case') {
            badges.setOpenSTO(parentRecordId);
        }
        return badges;
    }

    /**
     * @description Dynamically find the person ID
     * Example: field = 'Account.CRM_Person__c', parentObject = 'Case', parentRecordId = '5001X000007xMSuQAM'
     */
    private static Id getPersonId(String field, String parentObject, String parentRecordId) {
        String queryString = 'SELECT ' + field + ' FROM ' + parentObject + ' WHERE Id = :parentRecordId LIMIT 1';
        List<SObject> objList = Database.query(String.escapeSingleQuotes(queryString));
        return !objList.isEmpty() ? (Id) getFieldValue(objList[0], field) : null;
    }

    /**
     * @description recursive method for collecting the value of a field on a sObject
     */
    private static Object getFieldValue(SObject obj, String fieldName) {
        if (obj == null) {
            return null;
        }
        List<String> fieldNameList = fieldName.split('\\.');

        return fieldNameList.size() > 1
            ? getFieldValue(obj.getSObject(fieldNameList.remove(0)), String.join(fieldNameList, '.'))
            : obj.get(fieldNameList[0]);
    }

    /**
     * @description The get Person query is made dynamic in order to use some HOT fields without having a package dependancy.
     */
    private static Person__c getPerson(Id personId) {
        Set<String> objectFields = Schema.SObjectType.Person__c.fields.getMap().keySet();
        Set<String> fields = new Set<String>{
            'Id',
            'INT_GuardianshipOrFuturePowerOfAttorney__c',
            'INT_IsDeceased__c',
            'INT_DateOfDeath__c',
            'INT_PowerOfAttorney__c',
            'INT_SpokenLanguageIntepreter__c',
            'INT_KRR_Reservation__c',
            'NKS_NumberOfSecurityMeasures__c'
        };
        Set<String> fieldsToLabel = new Set<String>{ 'HOT_DegreeOfHearingAndVisualImpairment__c' };

        String queryString = 'SELECT ';
        for (String str : fields) {
            if (objectFields.contains(str.toLowerCase())) {
                queryString += str += ', ';
            }
        }

        for (String str : fieldsToLabel) {
            if (objectFields.contains(str.toLowerCase())) {
                queryString += 'toLabel(' + str + '), ';
            }
        }

        queryString +=
            '(' +
            '	SELECT Id,' +
            '		INT_Person__c,' +
            '		toLabel(INT_SecurityMeasure__c),' +
            '		INT_ValidFromDate__c,' +
            '		INT_ValidToDate__c' +
            '	FROM SecurityMeasures__r' +
            ')';
        queryString += ' FROM Person__c WHERE Id = :personId';

        List<Person__c> personList = (List<Person__c>) Database.query(queryString);
        return personList.isEmpty() ? null : personList[0];
    }

    /**
     * @description Apex type as an inner class. The constructor accepts a person record to populate all the variables.
     */
    public class PersonBadgeData {
        @AuraEnabled
        public List<Badge> badges;
        @AuraEnabled
        public List<SecurityMeasure> securityMeasures;
        @AuraEnabled
        public List<String> spokenLanguagesIntepreter;
        @AuraEnabled
        public List<GuardianshipOrFuturePowerOfAttorney> guardianships;
        @AuraEnabled
        public List<NKS_FullmaktController.Fullmaktsgiver> powerOfAttorneys;
        @AuraEnabled
        public List<String> errors;
        @AuraEnabled
        public Date dateOfDeath;
        // @AuraEnabled
        // public List<String> entitlements;

        private Person__c person;
        private Set<String> fieldSet;
        private Map<String, String> personIdentNameMap;

        public PersonBadgeData(Person__c person) {
            this.badges = new List<Badge>();
            this.securityMeasures = new List<SecurityMeasure>();
            this.spokenLanguagesIntepreter = new List<String>();
            this.guardianships = new List<GuardianshipOrFuturePowerOfAttorney>();
            this.powerOfAttorneys = new List<NKS_FullmaktController.Fullmaktsgiver>();
            this.errors = new List<String>();
            this.personIdentNameMap = new Map<String, String>();
            // this.entitlements = new List<String>();

            if (person != null) {
                this.dateOfDeath = person.INT_DateOfDeath__c;
                this.person = person;
                //Get field set for use later in the class
                this.fieldSet = Schema.SObjectType.Person__c.fields.getMap().keySet();
                setBadgeData();
            }
        }

        private void setBadgeData() {
            setSecurityMeasures();
            setIsDeceased();
            setPowerOfAttorney();
            setGuardianshipOrFuturePowerOfAttorney();
            setSpokenLanguagesIntepreter();
            setDegreeOfHearingAndVisualImpairment();
            setPersonName();
            setKrrReservation();
            // setEntitlements();
        }

        private void setSecurityMeasures() {
            try {
                for (SecurityMeasure__c sm : person.SecurityMeasures__r) {
                    if (sm.INT_ValidToDate__c == null || sm.INT_ValidToDate__c >= Date.today()) {
                        securityMeasures.add(
                            new SecurityMeasure(
                                sm.Id,
                                sm.INT_ValidToDate__c,
                                sm.INT_ValidFromDate__c,
                                sm.INT_SecurityMeasure__c
                            )
                        );
                    }
                }
                if (person.NKS_NumberOfSecurityMeasures__c > 0 && !securityMeasures.isEmpty()) {
                    badges.add(
                        new Badge(
                            'securityMeasures',
                            person.NKS_NumberOfSecurityMeasures__c + ' sikkerhetstiltak',
                            'slds-theme_error slds-m-left_x-small slds-m-vertical_xx-small pointer',
                            '',
                            '',
                            true
                        )
                    );
                }
            } catch (Exception e) {
                errors.add('Feil ved uthenting av sikkerhetstiltak');
            }
        }

        private void setSpokenLanguagesIntepreter() {
            if (String.isNotBlank(person.INT_SpokenLanguageIntepreter__c)) {
                badges.add(
                    new Badge(
                        'spokenLanguageIntepreter',
                        getFieldLabel('INT_SpokenLanguageIntepreter__c'),
                        'slds-theme_warning slds-m-left_x-small slds-m-vertical_xx-small pointer',
                        '',
                        '',
                        true
                    )
                );

                try {
                    for (String language : person.INT_SpokenLanguageIntepreter__c.split(';')) {
                        String capCase = languageMap.containsKey(language)
                            ? languageMap.get(language).toLowerCase().capitalize() + ' (' + language + ')'
                            : language;
                        spokenLanguagesIntepreter.add(capCase);
                    }
                } catch (Exception e) {
                    errors.add('Feil ved uthenting av språk for talespråktolk');
                }
            }
        }

        private void setKrrReservation() {
            if (person.INT_KRR_Reservation__c) {
                badges.add(new Badge('krr', getFieldLabel('INT_KRR_Reservation__c')));
            }
        }

        private void setIsDeceased() {
            if (person.INT_IsDeceased__c) {
                badges.add(
                    new Badge(
                        'isDeceased',
                        getFieldLabel('INT_IsDeceased__c'),
                        'slds-theme_warning slds-m-left_x-small slds-m-vertical_xx-small pointer',
                        '',
                        '',
                        true
                    )
                );
            }
        }

        private void setPowerOfAttorney() {
            try {
                List<NKS_FullmaktController.Fullmaktsgiver> fullmaktsgivere = NKS_FullmaktController.getFullmaktsgiver(
                    person.Id,
                    'Person__c'
                );
                if (fullmaktsgivere == null || fullmaktsgivere.isEmpty())
                    return;
                Date today = Date.today();

                for (Integer i = 0; i < fullmaktsgivere.size(); i++) {
                    NKS_FullmaktController.Fullmaktsgiver poa = fullmaktsgivere[i];
                    if (poa.gyldigFraOgMed <= today && (poa.gyldigTilOgMed >= today || poa.gyldigTilOgMed == null)) {
                        poa.id = String.valueOf(i);
                        personIdentNameMap.put(poa.motpartsPersonident, '');
                        powerOfAttorneys.add(poa);
                    }
                }

                if (!powerOfAttorneys.isEmpty()) {
                    badges.add(
                        new Badge(
                            'powerOfAttorney',
                            'Fullmakt',
                            'slds-theme_warning slds-m-left_x-small slds-m-vertical_xx-small pointer',
                            '',
                            '',
                            true
                        )
                    );
                }
            } catch (Exception e) {
                errors.add('Feil ved uthenting av fullmakts detaljer');
            }
        }

        private void setGuardianshipOrFuturePowerOfAttorney() {
            if (String.isNotBlank(person.INT_GuardianshipOrFuturePowerOfAttorney__c)) {
                badges.add(
                    new Badge(
                        'guardianshipOrFuturePowerOfAttorney',
                        'Vergemål',
                        'slds-theme_warning slds-m-left_x-small slds-m-vertical_xx-small pointer',
                        '',
                        '',
                        true
                    )
                );

                try {
                    List<GuardianShipOrFuturePowerOfAttorney> guardianshipList = (List<GuardianshipOrFuturePowerOfAttorney>) JSON.deserialize(
                        person.INT_GuardianshipOrFuturePowerOfAttorney__c,
                        List<GuardianshipOrFuturePowerOfAttorney>.class
                    );
                    for (Integer i = 0; i < guardianshipList.size(); i++) {
                        GuardianShipOrFuturePowerOfAttorney guardianship = guardianshipList[i];
                        guardianship.id = String.valueOf(i);
                        if (String.isNotBlank(guardianship.motpartsPersonident)) {
                            personIdentNameMap.put(guardianship.motpartsPersonident, '');
                        }
                        guardianships.add(guardianship);
                    }
                } catch (Exception e) {
                    errors.add('Feil ved uthenting av vergemål detaljer');
                }
            }
        }

        /**
         * @description We don't have the HOT fields in all sanboxes or scratch orgs, therefore we need to check if they exist before trying to add any badges;
         */
        private void setDegreeOfHearingAndVisualImpairment() {
            if (fieldSet.contains('hot_degreeofhearingandvisualimpairment__c')) {
                String degreeOfHearingAndVisualImpairment = (String) person.get(
                    'HOT_DegreeOfHearingAndVisualImpairment__c'
                );

                if (String.isNotBlank(degreeOfHearingAndVisualImpairment)) {
                    badges.add(new Badge('degreeOfHearingAndVisualImpairment', degreeOfHearingAndVisualImpairment));
                }
            }
        }

        /**
         * @description We don't have the HOT fields in all sanboxes or scratch orgs, therefore we need to check if they exist before trying to add any badges;
         */

        // private void setEntitlements() {
        //     if (fieldSet.contains('hot_hasentitlement__c')) {
        //         if (true == (Boolean) person.get('HOT_HasEntitlement__c')) {
        //             badges.add(
        //                 new Badge(
        //                     'entitlements',
        //                     getFieldLabel('HOT_HasEntitlement__c'),
        //                     'slds-theme_warsning slds-m-left_x-small slds-m-vertical_xx-small pointer',
        //                     '',
        //                     '',
        //                     true
        //                 )
        //             );

        //             for (String entitlementField : NKS_PersonBadgesController.HOT_ENTITLEMENT_FIELDS) {
        //                 if (true == (Boolean) person.get(entitlementField)) {
        //                     entitlements.add(getFieldLabel(entitlementField));
        //                 }
        //             }
        //         }
        //     }
        // }

        /**
         * @description Setting badge for open STOs
         */
        public void setOpenSTO(String caseId) {
            Case c = [
                SELECT Id, RecordType.DeveloperName, AccountId, STO_Category__c, NKS_Theme_Group__r.Name
                FROM Case
                WHERE Id = :caseId
                LIMIT 1
            ];

            if (c == null) {
                return;
            }

            List<AggregateResult> aggRes = [
                SELECT COUNT(Id) numHenv, STO_Category__c, Origin
                FROM Case
                WHERE
                    AccountId = :c.AccountId
                    AND IsClosed = FALSE
                    AND STO_Category__c != NULL
                    AND Status NOT IN ('In progress', 'On Hold', 'Reserved')
                GROUP BY STO_Category__c, Origin
            ];

            if (aggRes.isEmpty()) {
                return;
            }

            Integer count = 0;
            for (AggregateResult agg : aggRes) {
                count += Integer.valueOf(agg.get('numHenv'));
            }

            badges.add(
                new Badge(
                    'openSTO',
                    String.valueOf(count) + (count == 1 ? ' åpen STO' : ' åpne STO-er'),
                    'slds-theme_success slds-m-left_x-small slds-m-vertical_xx-small pointer',
                    '',
                    '',
                    true,
                    JSON.serialize(aggRes)
                )
            );
        }

        private void setPersonName() {
            for (Account acc : [
                SELECT Name, CRM_Person__r.Name, CRM_Person__r.NKS_Full_Name__c
                FROM Account
                WHERE CRM_Person__c != NULL AND CRM_Person__r.Name IN :personIdentNameMap.keySet()
                WITH SYSTEM_MODE
            ]) {
                String name = String.isNotBlank(acc.CRM_Person__r.NKS_Full_Name__c)
                    ? acc.CRM_Person__r.NKS_Full_Name__c
                    : acc.Name;
                personIdentNameMap.put(acc.CRM_Person__r.Name, name);
            }

            for (GuardianshipOrFuturePowerOfAttorney gofoa : guardianships) {
                String name = personIdentNameMap.get(gofoa.motpartsPersonident);
                if (String.isNotBlank(name)) {
                    gofoa.navn = new Navn(name);
                }
            }

            for (NKS_FullmaktController.Fullmaktsgiver poa : powerOfAttorneys) {
                String name = personIdentNameMap.get(poa.motpartsPersonident);
                if (String.isNotBlank(name)) {
                    poa.motpartsNavn = name;
                }
            }
        }

        private String getFieldLabel(String fieldApiName) {
            SObjectType type = Schema.getGlobalDescribe().get('Person__c');
            Map<String, Schema.SObjectField> mfields = type.getDescribe().fields.getMap();
            return mfields.get(fieldApiName).getDescribe().getLabel();
        }
    }

    public class Badge {
        @AuraEnabled
        public String name;
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String styling;
        @AuraEnabled
        public String iconName;
        @AuraEnabled
        public String iconAltText;
        @AuraEnabled
        public Boolean clickable;
        @AuraEnabled
        public String tabindex;
        @AuraEnabled
        public String badgeInfo; //Optional additional info to be sent to frontend

        /**
         * @description Constructor for only showing a badge without any formatting or logic
         * @param name name to use in the LWC to identify the badge
         * @param label the label for the badge
         *
         */
        public Badge(String name, String label) {
            this(name, label, 'slds-theme_warning slds-m-left_x-small slds-m-vertical_xx-small', '', '', false);
        }

        /**
         * @description Constructor for showing badge with formatting or icons
         * @param name  name to use in the LWC to identify the badge
         * @param label the label for the badge
         * @param styling styling to use on the component in the LWC
         * @param iconName icon to use in the LWC, use the icons from SF
         * @param iconAltText alt text to add to the icon
         * @param clickable true if the user should be able to click on the badge to show more info
         */
        public Badge(
            String name,
            String label,
            String styling,
            String iconName,
            String iconAltText,
            Boolean clickable
        ) {
            this.name = name;
            this.label = label;
            this.styling = styling;
            this.iconName = iconName;
            this.iconAltText = iconAltText;
            this.clickable = clickable;
            this.tabindex = this.clickable ? '0' : '-1';
        }

        /**
         * @description Constructor for showing badge with formatting or icons
         * @param name  name to use in the LWC to identify the badge
         * @param label the label for the badge
         * @param styling styling to use on the component in the LWC
         * @param iconName icon to use in the LWC, use the icons from SF
         * @param iconAltText alt text to add to the icon
         * @param clickable true if the user should be able to click on the badge to show more info
         */
        public Badge(
            String name,
            String label,
            String styling,
            String iconName,
            String iconAltText,
            Boolean clickable,
            String badgeInfo
        ) {
            this(name, label, styling, iconName, iconAltText, clickable);
            this.badgeInfo = badgeInfo;
        }
    }

    public class Navn {
        @AuraEnabled
        public String fornavn;
        @AuraEnabled
        public String mellomnavn;
        @AuraEnabled
        public String etternavn;
        public Navn(String navn) {
            fornavn = navn;
        }
        @AuraEnabled
        public String fullName {
            get {
                return String.join(new List<String>{ this.fornavn, this.mellomnavn, this.etternavn }, ' ')
                    .normalizeSpace();
            }
        }
    }

    public class Tjenesteomraade {
        @AuraEnabled
        public String tjenesteoppgave;
        @AuraEnabled
        public String tjenestevirksomhet;
    }

    public class GuardianshipOrFuturePowerOfAttorney {
        private Map<String, String> omfangMap {
            get {
                return new Map<String, String>{
                    'utlendingssakerPersonligeOgOekonomiskeInteresser' => 'Ivareta personens interesser innenfor det personlige og økonomiske området herunder utlendingssaken (kun for EMA)',
                    'personligeOgOekonomiskeInteresser' => 'Ivareta personens interesser innenfor det personlige og økonomiske området',
                    'oekonomiskeInteresser' => 'Ivareta personens interesser innenfor det økonomiske området',
                    'personligeInteresser' => 'Ivareta personens interesser innenfor det personlige området'
                };
            }
        }

        private Map<String, String> typeMap {
            get {
                return new Map<String, String>{
                    'ensligMindreaarigAsylsoeker' => 'Enslig mindreårig asylsøker',
                    'ensligMindreaarigFlyktning' => 'Enslig mindreårig flyktning inklusive midlertidige saker for denne gruppen',
                    'voksen' => 'Voksen',
                    'midlertidigForVoksen' => 'Voksen midlertidig',
                    'mindreaarig' => 'Mindreårig (unntatt EMF)',
                    'midlertidigForMindreaarig' => 'Mindreårig midlertidig (unntatt EMF)',
                    'forvaltningUtenforVergemaal' => 'Forvaltning utenfor vergemål',
                    'stadfestetFremtidsfullmakt' => 'Fremtidsfullmakt'
                };
            }
        }

        @AuraEnabled
        public String type;
        @AuraEnabled
        public String embete;
        @AuraEnabled
        public Navn navn;
        @AuraEnabled
        public String motpartsPersonident;
        @AuraEnabled
        public String omfang;
        @AuraEnabled
        public List<Tjenesteomraade> tjenesteomraade;
        @AuraEnabled
        public Boolean omfangetErInnenPersonligOmraade;
        @AuraEnabled
        public String omfangetErInnenPersonligOmraadeTxt {
            get {
                return true == omfangetErInnenPersonligOmraade ? 'Ja' : 'Nei';
            }
        }
        @AuraEnabled
        public String id;

        @AuraEnabled
        public String tjenesteomraadeLabel {
            get {
                String label = '';
                if (this.tjenesteomraade != null) {
                    for (Tjenesteomraade omraade : this.tjenesteomraade) {
                        if (omraade.tjenestevirksomhet == 'nav') {
                            label +=
                                omraade.tjenesteoppgave.replaceAll('([A-Z])', ' $1').toLowerCase().capitalize() + ', ';
                        }
                    }
                }
                return label.removeEnd(', ');
            }
        }

        @AuraEnabled
        public String omfangLabel {
            get {
                String label = this.omfangMap.get(this.omfang);
                return String.isNotBlank(label) ? label : this.omfang;
            }
        }

        @AuraEnabled
        public String typeLabel {
            get {
                String label = this.typeMap.get(this.type);
                return String.isNotBlank(label) ? label : this.type;
            }
        }
    }

    public class SecurityMeasure {
        @AuraEnabled
        public Id RecordId;
        @AuraEnabled
        public Date ToDate;
        @AuraEnabled
        public Date FromDate;
        @AuraEnabled
        public string SecurityMeasure;

        public SecurityMeasure(Id recordId, Date toDate, Date fromDate, String securityMeasure) {
            this.RecordId = recordId;
            this.ToDate = toDate;
            this.FromDate = fromDate;
            this.SecurityMeasure = securityMeasure;
        }
    }
}
