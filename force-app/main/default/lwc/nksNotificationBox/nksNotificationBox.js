import { LightningElement, api, track } from 'lwc';

export default class NksNotificationBox extends LightningElement {
    @track notificationList = [];
    count = 0;

    @api
    addNotification(mainText, optionalText = null, variant = 'success') {
        this.count++;
        this.notificationList.push({
            id: String(this.count),
            text: mainText,
            time: this.getCurrentTime(),
            optionalText: optionalText,
            variant: variant,
            isSuccess: variant === 'success',
            isWarning: variant === 'warning',
            isError: variant === 'error'
        });
    }

    @api
    filterNotification(inputText) {
        this.notificationList = this.notificationList.filter(
            (item) => !item.text.toLowerCase().includes(inputText.toLowerCase())
        );
    }

    @api
    clearNotifications() {
        this.notificationList = [];
    }

    @api
    clearNotificationsByVariant(...variants) {
        this.notificationList = this.notificationList.filter((item) => !variants.includes(item.variant));
    }

    getCurrentTime() {
        const nowTime = new Date();
        return `${('0' + nowTime.getHours()).slice(-2)}:${('0' + nowTime.getMinutes()).slice(-2)}`;
    }
}
