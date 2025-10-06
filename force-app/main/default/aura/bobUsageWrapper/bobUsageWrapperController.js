({
    onTabCreated: function (component, event, helper) {
        const workspaceAPI = component.find('workspace');
        const tabId = event.getParam('tabId');

        workspaceAPI
            .getTabInfo({ tabId })
            .then((tabInfo) => {
                if (tabInfo && tabInfo.recordId) {
                    helper.checkCaseStatus(component, tabInfo.recordId, (status) => {
                        if (status !== 'Closed') {
                            helper.saveCaseTabInfo(tabId, tabInfo);
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
            helper.checkCaseStatus(component, info.recordId, (status) => {
                if (status === 'Closed' || status === 'On Hold') {
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
