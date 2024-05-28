public with sharing class NKS_LabelGetter {
    @AuraEnabled(cacheable=true)
    public static String getLabel(String label) {
        return System.Label.get('', label);
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getLabels(List<String> labels) {
        List<String> labelList = new List<String>();
        for (String label : labels) {
            labelList.add(getLabel(label));
        }
        return labelList;
    }
}
