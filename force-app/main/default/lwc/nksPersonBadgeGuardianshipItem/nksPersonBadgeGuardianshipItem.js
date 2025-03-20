import { LightningElement, api } from 'lwc';

export default class NksPersonBadgeGuardianshipItem extends LightningElement {
    @api guardianship;
    get motpart() {
        let motpartList = [];

        if (this.guardianship?.actualNavn?.fullName) {
            motpartList.push(this.guardianship.actualNavn.fullName);
        }
        if (this.guardianship.actualMotpartsPersonident) {
            motpartList.push(this.guardianship.actualMotpartsPersonident);
        }

        return motpartList.join(' - ');
    }
}
