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