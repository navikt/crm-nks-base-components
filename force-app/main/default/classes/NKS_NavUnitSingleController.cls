public with sharing class NKS_NavUnitSingleController {
    private static NKS_NorgNavUnitService service {
        get {
            if (null == service) {
                service = new NKS_NorgNavUnitService();
            }
            return service;
        }
        set;
    }

    @AuraEnabled(cacheable=true)
    public static NKS_NorgNavUnitService.NavUnitResponse findUnit(
        String field,
        String parentObject,
        String parentRecordId,
        String type
    ) {
        switch on type {
            when 'PERSON_LOCATION' {
                return getNavUnitFromPerson(field, parentObject, parentRecordId);
            }
            when 'UNIT_NUMBER' {
                return getNavUnitFromNavUnitNumbers(field, parentObject, parentRecordId);
            }
        }

        return null;
    }

    @InvocableMethod(label='Fetch Nav Unit' category='Nav Unit')
    public static List<NKS_NorgNavUnitService.NavUnitResponse> findUnits(List<String> navUnitNumber) {
        return service.getNavUnitListFromUnitNumbers(navUnitNumber, true);
    }

    @AuraEnabled(cacheable=true)
    public static NKS_NorgNavUnitService.NavUnitContactInformationResponse getContactInformation(String unitNumber) {
        return service.getNavUnitContactInformation(unitNumber);
    }

    @AuraEnabled(cacheable=true)
    public static NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 getContactInformationV2(
        String unitNumber
    ) {
        if (String.isBlank(unitNumber)) {
            NKS_NorgNavUnitService.NavUnitContactInformationResponseV2 resp = new NKS_NorgNavUnitService.NavUnitContactInformationResponseV2();
            resp.success = false;
            resp.errorMessage = 'Enhetsnummer mangler.';
            return resp;
        }
        return service.getNavUnitContactInformationV2(unitNumber);
    }

    private static NKS_NorgNavUnitService.NavUnitResponse getNavUnitFromPerson(
        String field,
        String parentObject,
        String parentRecordId
    ) {
        List<Object> objectList = getQueryValue(field, parentObject, parentRecordId);

        if (objectList.isEmpty()) {
            NKS_NorgNavUnitService.NavUnitResponse resp = new NKS_NorgNavUnitService.NavUnitResponse();
            resp.errorMessage = 'Kunne ikke finne bruker.';
            return resp;
        }

        Id personId = (Id) objectList[0];

        NKS_NavUnitPersonUtility util = new NKS_NavUnitPersonUtility(service);
        return util.getNavUnitFromPerson(personId);
    }

    private static NKS_NorgNavUnitService.NavUnitResponse getNavUnitFromNavUnitNumbers(
        String field,
        String parentObject,
        String parentRecordId
    ) {
        List<Object> objectList = getQueryValue(field, parentObject, parentRecordId);

        if (objectList.isEmpty()) {
            NKS_NorgNavUnitService.NavUnitResponse resp = new NKS_NorgNavUnitService.NavUnitResponse();
            resp.errorMessage = 'Kunne ikke finne enhetsnummer.';
            return resp;
        }

        String navUnitNumber = (String) objectList[0];

        return service.getNavUnitFromUnitNumber(navUnitNumber);
    }

    /**
     * *Example
     * - field = 'Account.CRM_Person__c';
     * - objString = 'Case';
     * - recordId = '5001X000007xMSuQAM';
     * - relation = 'Id';
     */
    private static List<Object> getQueryValue(String field, String parentObject, String parentRecordId) {
        List<Object> values = new List<Object>();

        if (String.isBlank(field) || String.isBlank(parentObject) || String.isBlank(parentRecordId)) {
            return values;
        }

        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        if (!globalDescribe.containsKey(parentObject)) {
            return values;
        }

        if (!isValidFieldExpression(field)) {
            return values;
        }

        try {
            String queryString = 'SELECT ' + field + ' FROM ' + parentObject + ' WHERE Id = :parentRecordId';
            List<SObject> objList = Database.query(queryString);

            for (SObject obj : objList) {
                Object value = getFieldValue(obj, field);
                if (value != null) {
                    values.add(value);
                }
            }
        } catch (Exception e) {
            return values;
        }

        return values;
    }

    private static Boolean isValidFieldExpression(String fieldExpression) {
        if (String.isBlank(fieldExpression)) {
            return false;
        }

        for (String part : fieldExpression.split('\\.')) {
            if (String.isBlank(part) || !Pattern.matches('^[a-zA-Z_][a-zA-Z0-9_]*$', part)) {
                return false;
            }
        }

        return true;
    }

    private static Object getFieldValue(SObject obj, String fieldName) {
        if (obj == null || String.isBlank(fieldName)) {
            return null;
        }

        List<String> fieldNameList = fieldName.split('\\.');

        if (1 < fieldNameList.size()) {
            SObject child = obj.getSObject(fieldNameList.remove(0));
            if (child == null) {
                return null;
            }
            return getFieldValue(child, String.join(fieldNameList, '.'));
        }

        return obj.get(fieldNameList[0]);
    }
}
