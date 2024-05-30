import { LightningElement, api, track } from 'lwc';

export default class NksNotificationBox extends LightningElement {
    @track notificationList = [];
    count = 0;

    @api
    addNotification(mainText, optionalText = null) {
        this.count++;
        this.notificationList.push({
            id: String(this.count),
            text: mainText,
            time: this.getCurrentTime(),
            optionalText: optionalText,
            success: true
        });
    }

    @api
    addErrorMessage(mainText, optionalText = null) {
        this.count++;
        this.notificationList.push({
            id: String(this.count),
            text: mainText,
            time: this.getCurrentTime(),
            optionalText: optionalText,
            success: false
        });
    }

    removeNotification(event) {
        const dataId = event.currentTarget.dataset.id;
        const notificationIndex = this.notificationList.findIndex((notification) => notification.id === dataId);
        if (notificationIndex >= 0) {
            this.notificationList.splice(notificationIndex, 1);
        }
    }

    getCurrentTime() {
        const nowTime = new Date();
        return `${('0' + nowTime.getHours()).slice(-2)}:${('0' + nowTime.getMinutes()).slice(-2)}`;
    }
}
