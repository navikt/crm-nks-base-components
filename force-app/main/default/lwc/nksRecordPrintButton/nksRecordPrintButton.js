import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class NksRecordPrintButton extends NavigationMixin(LightningElement) {
    @api recordId;

    handlePrint() {
        console.log(this.recordId);
        if (!this.recordId) {
            console.error('No record ID found!');
            return;
        }
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: `/apex/NKS_RecordPrint?id=${this.recordId}`
            }
        }).then(url => {
            console.log('Opening URL:', url);
            window.open(url, '_self');
        });
    }
}
