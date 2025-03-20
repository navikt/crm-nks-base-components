import { LightningElement, api } from 'lwc';
import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';

export default class SkeletonLoadingComponent extends LightningElement {
    // Default to true to show loading, will be overwritten once parent is done with wires
    // Will be set to null from resolve in nksPersonHighlightPanel if not found
    @api personId = '123';

    get isPersonIdSet() {
        return this.personId !== null;
    }

    get unknownIcon() {
        return NAV_ICONS + '/confidentialCircleFilled.svg#confidentialCircleFilled';
    }
}
