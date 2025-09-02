import { LightningElement } from 'lwc';

export default class NksChatPageTransparentContainer extends LightningElement {}
// Our flexipage for Live Chat Transcript records have a known issue where if you have a pinned header and a pinned left side with 3 sections template it will not be possible to scroll to the bottom of the page on some occasions. 
// Also sometimes the header completely disappears. This cmp is a potential workaround. Known issue: https://issues.salesforce.com/issue/a02Ka00000eNoRsIAK/
