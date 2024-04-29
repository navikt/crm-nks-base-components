import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import OPEN_SECURITY_RUTINE_LABEL from '@salesforce/label/c.NKS_Open_Security_Rutine';

export default class NksSecurityRoutine extends NavigationMixin(LightningElement) {
    @api articleId;

    openSecurityRutine = OPEN_SECURITY_RUTINE_LABEL;

    handleSecurity() {
        this[NavigationMixin.Navigate]({
            type: 'standard__knowledgeArticlePage',
            attributes: {
                actionName: 'view',
                articleType: 'Knowledge',
                urlName: encodeURIComponent(this.articleId)
            }
        });
    }
}
