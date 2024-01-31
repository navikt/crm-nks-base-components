({
    onTabCreated: function (component, event) {
        var newTabId = event.getParam('tabId');
        var workspace = component.find('workspace');

        workspace.getAllTabInfo().then(function (response) {
            if (response.length === 1) {
                workspace
                    .isSubtab({
                        tabId: newTabId
                    })
                    .then(function () {
                        if (!response) {
                            workspace.focusTab({
                                tabId: newTabId
                            });
                        }
                    });
            }
        });

        workspace
            .getTabInfo({
                tabId: newTabId
            })
            .then(function (response) {
                var action = component.get('c.getTabName');
                action.setParams({ recordId: response.recordId });
                action.setCallback(this, function (data) {
                    if (data.getReturnValue() != null && data.getReturnValue().length > 0) {
                        workspace.setTabLabel({
                            tabId: newTabId,
                            label: data.getReturnValue()
                        });
                        workspace.setTabIcon({
                            tabId: newTabId,
                            icon: response.icon,
                            iconAlt: ' '
                        });
                    }
                });
                $A.enqueueAction(action);
            });
    },

    doInit: function (component) {
        let omniAPI = component.find('omniToolkit');
        let action = component.get('c.getOnlineId');
        action.setCallback(this, function (data) {
            if (data.getReturnValue() != null && data.getReturnValue().length > 0) {
                // eslint-disable-next-line @lwc/lwc/no-async-operation, @locker/locker/distorted-window-set-interval
                let poll = setInterval(function () {
                    omniAPI
                        .login({ statusId: data.getReturnValue() })
                        .then(function () {
                            clearInterval(poll);
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }, 2000);
            }
        });
        $A.enqueueAction(action);
    }
});
