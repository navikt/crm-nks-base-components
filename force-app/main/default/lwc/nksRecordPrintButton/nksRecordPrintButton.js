import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class NksRecordPrintButton extends NavigationMixin(LightningElement) {
    @api recordId;
    // TODO: Decide where button should go on pages (Probably on the conv note / thread / chat / utbetaling pages instead of header)
    // TODO: This component can be deleted and instead the custom nks-button component can be used with this handlePrint method on onclick()
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
        }).then((url) => {
            console.log('Opening URL:', url);
            window.open(url, '_self');
        });
    }
}
