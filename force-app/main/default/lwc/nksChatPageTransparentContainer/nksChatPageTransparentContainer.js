import { LightningElement, wire } from 'lwc';
import { IsConsoleNavigation, getFocusedTabInfo, getAllTabInfo } from 'lightning/platformWorkspaceApi';

// Our flexipage for Live Chat Transcript / Messaging records have a known issue where if you have a pinned header and a pinned left side with 3 sections template it will not be possible to scroll to the bottom of the page on some occasions.
// Also sometimes the header completely disappears. This cmp is a workaround so that the empty space here is cut off instead of the actual content. Known issue: https://issues.salesforce.com/issue/a02Ka00000eNoRsIAK/
export default class NksChatPageTransparentContainer extends LightningElement {
    @wire(IsConsoleNavigation) isConsoleNavigation;

    showContainer = false;

    connectedCallback() {
        this.getAllTabs();
    }

    async getAllTabs() {
        if (!this.isConsoleNavigation) {
            return;
        }
        try {
            const tabInfo = await getAllTabInfo();
            await this.getFocusedTab(tabInfo);
        } catch (error) {
            console.error(error);
        }
    }

    async getFocusedTab(allTabsInfo) {
        try {
            let focusedTabInfo = await getFocusedTabInfo();
            const focusedTabObjectApiName = focusedTabInfo?.pageReference?.attributes?.objectApiName;

            if (focusedTabObjectApiName === 'MessagingSession' || focusedTabObjectApiName === 'LiveChatTranscript') {
                this.showContainer = true;
            } else if (focusedTabInfo.isSubtab && focusedTabObjectApiName === 'Knowledge__kav') {
                const parentTab = allTabsInfo.find((tabInfo) => tabInfo.tabId === focusedTabInfo.parentTabId);
                const parentObjectApiName = parentTab?.pageReference?.attributes?.objectApiName;

                if (parentObjectApiName === 'MessagingSession' || parentObjectApiName === 'LiveChatTranscript') {
                    this.showContainer = true;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}
