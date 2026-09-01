import getGifs from '@salesforce/apex/nksGifController.getGifs';
import approveGifMember from '@salesforce/apex/nksGifController.approveGifMember';
import rejectGifMember from '@salesforce/apex/nksGifController.rejectGifMember';
import isGifReject from '@salesforce/apex/nksGifController.isGifReject';
import { LightningElement } from 'lwc';

export default class NksGifViewer extends LightningElement {
    gifList;
    shuffledGifList;
    currentOffset = 0;
    gifsFound = false;
    hideGifs = true;

    connectedCallback() {
        this.checkGifReject();
    }

    async checkGifReject() {
        try {
            this.hideGifs = await isGifReject();
            if (!this.hideGifs) {
                this.startGifRotation();
            }
        } catch (error) {
            console.log('Gamer', error);
        }
    }

    startGifRotation() {
        if (this.gifList != null) {
            return;
        }
        getGifs().then((result) => {
            if (result == null) {
                this.gifsFound = false;
                console.error('No GIFs found');
                return;
            }
            this.gifsFound = true;
            this.gifList = Object.keys(result).map((key) => {
                return { title: key, url: result[key] };
            });
            this.shuffle();
            this.changeOffset();
        });
    }

    buttonDisabled = false;

    handleGifButton(event) {
        this.buttonDisabled = true;
        const value = event.target.value;

        if (value === 'approve') {
            approveGifMember()
                .then(() => {
                    console.log('User approved for GIFs');
                    this.startGifRotation();
                    this.buttonDisabled = false;
                })
                .catch((error) => {
                    console.error('Error approving user for GIFs', error);
                });
        } else if (value === 'reject') {
            rejectGifMember()
                .then(() => {
                    console.log('User rejected for GIFs');
                    this.hideGifs = true;
                    this.buttonDisabled = false;
                })
                .catch((error) => {
                    console.error('Error rejecting user for GIFs', error);
                });
        }
    }

    changeOffset() {
        if (!this.gifList.length) {
            return;
        }
        const currentTime = Date.now();
        this.currentOffset = Math.floor(currentTime / 3000) % this.gifList.length;
        const remainingTime = 1000 * 3 - (currentTime - this.currentRoundedTime(1000 * 3).getTime());
        setTimeout(() => {
            this.incrementOffset();
            setInterval(() => {
                this.incrementOffset();
            }, 1000 * 3);
        }, remainingTime);
    }

    incrementOffset() {
        if (!this.gifList.length) {
            return;
        }
        this.currentOffset = (this.currentOffset + 1) % this.gifList.length;
    }

    currentRoundedTime(coeff) {
        const date = new Date(); //or use any other date
        return new Date(Math.floor(date.getTime() / coeff) * coeff);
    }

    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        const random = x - Math.floor(x);
        return random;
    }

    // Basert på denne https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed
    shuffle() {
        console.log('Shuffling gifs');
        let array = [...this.gifList];
        // <-- ADDED ARGUMENT
        var m = array.length,
            t,
            i;
        let seed = this.currentRoundedTime(1000 * 60 * 5).getTime();
        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(this.seededRandom(seed) * m--); // <-- MODIFIED LINE

            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
            ++seed; // <-- ADDED LINE
        }

        this.shuffledGifList = array;
        const remainingTime = 1000 * 60 * 5 - (new Date().getTime() - this.currentRoundedTime(1000 * 60 * 5).getTime());
        setTimeout(() => this.shuffle(), remainingTime);
    }

    get gif() {
        return this.shuffledGifList ? this.shuffledGifList[this.currentOffset] : undefined;
    }
}
