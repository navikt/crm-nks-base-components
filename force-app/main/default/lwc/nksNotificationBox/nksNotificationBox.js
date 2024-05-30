import { LightningElement, api, track } from 'lwc';

export default class NksNotificationBox extends LightningElement {
    @track notificationList = [];
    count = 0;

    @api
    addNotification(mainText, optionalText = null) {
        this.count++;
        const nowTime = new Date();
        const time = `${nowTime.getHours()}:${nowTime.getMinutes()}`;
        this.notificationList.push({ id: String(this.count), text: mainText, time: time, optionalText: optionalText });
    }

    removeNotification(event) {
        const dataId = event.currentTarget.dataset.id;
        const notificationIndex = this.notificationList.findIndex((notification) => notification.id === dataId);
        if (notificationIndex >= 0) {
            this.notificationList.splice(notificationIndex, 1);
        }
    }
}
