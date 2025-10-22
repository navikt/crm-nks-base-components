({
    onTabCreated: function (component, event, helper) {
        const workspaceAPI = component.find('workspace');
        const tabId = event.getParam('tabId');

        workspaceAPI
            .getTabInfo({ tabId })
            .then((tabInfo) => {
                if (tabInfo && tabInfo.recordId) {
                    const objectApiName =
                        tabInfo.pageReference &&
                        tabInfo.pageReference.attributes &&
                        tabInfo.pageReference.attributes.objectApiName
                            ? tabInfo.pageReference.attributes.objectApiName
                            : null;
                    if ((objectApiName !== 'Case' && objectApiName !== 'LiveChatTranscript') || !!tabInfo.isSubtab) {
                        return;
                    }
                    helper.getRecordStatus(component, tabInfo.recordId, (status) => {
                        if (
                            status !== 'Closed' &&
                            status !== 'On Hold' &&
                            status !== 'Completed' &&
                            status !== 'Missed' &&
                            status !== 'Blocked'
                        ) {
                            helper.saveTabInfo(tabId, tabInfo, objectApiName);
                        }
                    });
                }
            })
            .catch((error) => {
                console.error('Error fetching tab info:', error);
            });
    },

    onTabClosed: function (component, event, helper) {
        const closedTabId = event.getParam('tabId');
        const launcher = component.find('launcher');
        const info = helper.getTabInfo(closedTabId);

        if (info && info.recordId && launcher && typeof launcher.openModal === 'function') {
            helper.getRecordStatus(component, info.recordId, (status) => {
                if (status === 'Closed' || status === 'On Hold' || info.objectApiName === 'LiveChatTranscript') {
                    try {
                        launcher.openModal(info.recordId);
                    } catch (error) {
                        console.error('Failed to open modal', error);
                    }
                }
            });
        }
        helper.removeTabInfo(closedTabId);
    }
});
