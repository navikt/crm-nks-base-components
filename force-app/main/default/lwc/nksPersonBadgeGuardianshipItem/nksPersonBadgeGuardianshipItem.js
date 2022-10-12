import { LightningElement, api } from 'lwc';

export default class NksPersonBadgeGuardianshipItem extends LightningElement {
    @api guardianship;
    get motpart() {
        let motpartList = [];

        if (this.guardianship?.navn?.fullName) {
            motpartList.push(this.guardianship.navn.fullName);
        }
        if (this.guardianship.motpartsPersonident) {
            motpartList.push(this.guardianship.motpartsPersonident);
        }

        return motpartList.join(' - ');
    }
}
