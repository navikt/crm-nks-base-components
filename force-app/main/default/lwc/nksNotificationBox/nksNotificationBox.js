import { LightningElement, api, track } from 'lwc';

export default class NksNotificationBox extends LightningElement {
    @track notificationList = [];
    count = 0;

    @api
    addNotification(text) {
        this.count++;
        this.notificationList.push({ id: String(this.count), text: text });
    }

    removeNotification(event) {
        const dataId = event.currentTarget.dataset.id;
        const notificationIndex = this.notificationList.findIndex((notification) => notification.id === dataId);
        if (notificationIndex >= 0) {
            this.notificationList.splice(notificationIndex, 1);
        }
    }
}
