public with sharing class nksGifController {
    @auraEnabled(cacheable=true)
    public static Map<String, String> getGifs() {
        ContentWorkspace workspace = [SELECT Id FROM ContentWorkspace WHERE Name = 'Giphy' LIMIT 1];

        List<ContentDocument> gifs = [SELECT Id, Title FROM ContentDocument WHERE FileType = 'GIF' AND ParentId = :workspace.Id];
        List<String> gifNames = new List<String>();
        for (ContentDocument gif : gifs) {
            gifNames.add(gif.Title);
        }
        List<ContentVersion> versions = [SELECT VersionDataUrl, Title FROM ContentVersion WHERE Title in :gifNames AND IsLatest = true];
        Map<String, String> gifUrlsByTitle = new Map<String, String>();
        for (ContentVersion gifVersion : versions) {
            gifUrlsByTitle.put(gifVersion.Title, gifVersion.VersionDataUrl);
        }
        return gifUrlsByTitle;
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isGifReject() {
        String rejectedGroupName = 'NKS_GIF_rejected';

        try {
            List<Id> groups = new List<Id>();
            Group g = [SELECT Id FROM Group WHERE DeveloperName = :rejectedGroupName LIMIT 1];
            List<GroupMember> members = [SELECT Id FROM GroupMember WHERE GroupId = :g.Id AND UserOrGroupId = :UserInfo.getUserId()];
            return !members.isEmpty();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=false)
    public static void approveGifMember(){
        addGroupMember('NKS_GIF_approved');
    }

    @AuraEnabled(cacheable=false)
    public static void rejectGifMember(){
        addGroupMember('NKS_GIF_rejected');
    }

    private static void addGroupMember(String groupName){
        try {
            Group g = [SELECT Id FROM Group WHERE DeveloperName = :groupName LIMIT 1];
            GroupMember groupMember = new GroupMember();
            groupMember.GroupId = g.Id;
            groupMember.UserOrGroupId = UserInfo.getUserId();
            insert groupMember;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}

// public with sharing class nksGifController {
//     @auraEnabled(cacheable=true)
//     public static Map<String, String> getGifs() {
//         List<StaticResource> gifs = [SELECT Name FROM StaticResource WHERE ContentType = 'image/gif'];
//         Map<String, String> gifUrlsByTitle = new Map<String, String>();
//         for (StaticResource gif : gifs) {
//             gifUrlsByTitle.put(gif.Name, '/resource/' + gif.Name);
//         }
//         return gifUrlsByTitle;
//     }
// }