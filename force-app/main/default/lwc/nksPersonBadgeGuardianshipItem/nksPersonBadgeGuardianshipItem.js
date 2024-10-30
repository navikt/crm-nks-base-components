import { LightningElement, api } from 'lwc';

export default class NksPersonBadgeGuardianshipItem extends LightningElement {
    @api guardianship;
    get motpart() {
        let motpartList = [];

        if (this.guardianship?.vergeEllerFullmektig?.navn?.fullName) {
            motpartList.push(this.guardianship.vergeEllerFullmektig.navn.fullName);
        }
        if (this.guardianship.vergeEllerFullmektig.motpartsPersonident) {
            motpartList.push(this.guardianship.vergeEllerFullmektig.motpartsPersonident);
        }

        return motpartList.join(' - ');
    }
}
