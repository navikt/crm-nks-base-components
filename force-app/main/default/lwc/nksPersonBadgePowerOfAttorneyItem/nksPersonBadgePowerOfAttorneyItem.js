import { LightningElement, api } from 'lwc';

export default class NksPersonBadgePowerOfAttorneyItem extends LightningElement {
    @api powerOfAttorney;

    // TODO: To be determined how PoA should look with permissions
    get omraadeList() {
        if (this.powerOfAttorney && this.powerOfAttorney.omraade) {
            return Object.keys(this.powerOfAttorney.omraade).map((key) => {
                return {
                    name: key,
                    permissions: this.powerOfAttorney.omraade[key].join(', ')
                };
            });
        }
        return [];
    }
}
