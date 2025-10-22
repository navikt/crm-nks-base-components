({
    getMap: function () {
        try {
            return JSON.parse(sessionStorage.getItem('tabInfoMap')) || {};
        } catch (e) {
            return {};
        }
    },

    setMap: function (map) {
        sessionStorage.setItem('tabInfoMap', JSON.stringify(map));
    },

    saveTabInfo: function (tabId, tabInfo, objectApiName) {
        const map = this.getMap();
        const recordId =
            tabInfo.recordId ||
            (tabInfo.pageReference && tabInfo.pageReference.state && tabInfo.pageReference.state.recordId) ||
            null;

        map[tabId] = {
            recordId: recordId,
            objectApiName: objectApiName
        };
        this.setMap(map);
    },

    getTabInfo: function (tabId) {
        const map = this.getMap();
        return map[tabId];
    },

    removeTabInfo: function (tabId) {
        const map = this.getMap();
        if (map[tabId]) {
            delete map[tabId];
            this.setMap(map);
        }
    },

    getRecordStatus: function (component, recordId, callback) {
        var action = component.get('c.getStatus');
        action.setParams({ recordId: recordId });

        action.setCallback(this, function (response) {
            const state = response.getState();
            if (state === 'SUCCESS') {
                const status = response.getReturnValue();
                if (callback) callback(status);
            } else if (state === 'ERROR') {
                console.error('Error fetching case status:', response.getError());
            }
        });

        $A.enqueueAction(action);
    }
});
