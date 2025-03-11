import { LightningElement, api } from 'lwc';
import NAV_ICONS from '@salesforce/resourceUrl/NKS_navIcons';

export default class SkeletonLoadingComponent extends LightningElement {
    @api personId = '123'; // Default to true to show loading, will be overwritten once parent is done with wires

    get isPersonIdSet() {
        console.log(this.personId);
        return this.personId !== null;
    }

    get unknownIcon() {
        return NAV_ICONS + '/' + 'confidentialCircleFilled' + '.svg#' + 'confidentialCircleFilled';
    }
}
// TODO: Test with chats
// TODO: Test with Puzzel no person id
