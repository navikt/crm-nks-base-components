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

    saveCaseTabInfo: function (tabId, tabInfo) {
        console.log(JSON.stringify(tabInfo));
        const objectApiName =
            tabInfo.pageReference && tabInfo.pageReference.attributes && tabInfo.pageReference.attributes.objectApiName
                ? tabInfo.pageReference.attributes.objectApiName
                : null;

        if (objectApiName !== 'Case') {
            return;
        }

        const map = this.getMap();
        const recordId =
            tabInfo.recordId ||
            (tabInfo.pageReference && tabInfo.pageReference.state && tabInfo.pageReference.state.recordId) ||
            null;

        map[tabId] = {
            isSubtab: !!tabInfo.isSubtab,
            recordId: recordId,
            showBobOnClose: true
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

    setShowBobOnClose: function (recordId) {
        const map = this.getMap();
        Object.keys(map).forEach((tabId) => {
            if (map[tabId].recordId === recordId) {
                map[tabId].showBobOnClose = false;
            }
        });
        this.setMap(map);
    }
});
