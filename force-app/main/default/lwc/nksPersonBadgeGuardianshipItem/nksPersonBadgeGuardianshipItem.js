import { LightningElement, api } from 'lwc';

export default class NksPersonBadgeGuardianshipItem extends LightningElement {
    @api guardianship;
    get navn(){
        let navn = []
        if(this.guardianship.navn.fornavn) navn.push(this.guardianship.navn.fornavn);
        if(this.guardianship.navn.mellomnavn) navn.push(this.guardianship.navn.mellomnavn);
        if(this.guardianship.navn.etternavn) navn.push(this.guardianship.navn.etternavn);
        return navn.join(' ');
    }
}
