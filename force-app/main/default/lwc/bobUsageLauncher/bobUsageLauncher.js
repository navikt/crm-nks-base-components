import { LightningElement, api } from 'lwc';
import BobUsageModal from 'c/bobUsageModal';

export default class BobUsageLauncher extends LightningElement {
    @api
    openModal(recordId) {
        try {
            BobUsageModal.open({
                label: 'Brukte du Bob for å besvare denne henvendelsen?',
                size: 'small',
                disableClose: true,
                recordId
            });
        } catch (error) {
            console.error('Failed to open modal', error);
        }
    }
}
