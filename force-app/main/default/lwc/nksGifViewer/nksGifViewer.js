import { LightningElement, api, track } from 'lwc';

export default class NksGifViewer extends LightningElement {
    @api staticResourceNames;

    get gifs() {
        if (!this.staticResourceNames) return [];
        return this.staticResourceNames.split(',').map((entry) => {
            const trimmed = entry.trim();
            const url = trimmed.startsWith('http') ? trimmed : `/resource/${trimmed}`;
            return { name: trimmed, url };
        });
    }
}