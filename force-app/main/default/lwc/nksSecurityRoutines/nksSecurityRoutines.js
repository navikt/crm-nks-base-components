import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import OPEN_SECURITY_ROUTINES_LABEL from '@salesforce/label/c.NKS_Open_Security_Rutines';

export default class NksSecurityRoutines extends NavigationMixin(LightningElement) {
    @api articleId;

    openSecurityRoutines = OPEN_SECURITY_ROUTINES_LABEL;

    handleSecurity() {
        this.articleId.split(',').forEach((article, index) => {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                // Without timeout the loading won't complete on first article
                this[NavigationMixin.Navigate]({
                    type: 'standard__knowledgeArticlePage',
                    attributes: {
                        actionName: 'view',
                        articleType: 'Knowledge',
                        urlName: encodeURIComponent(article)
                    }
                });
            }, 1000 * index);
        });
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            this.handleSecurity();
        }
    }
}
