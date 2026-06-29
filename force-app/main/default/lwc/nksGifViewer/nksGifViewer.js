import getGifs from '@salesforce/apex/nksGifController.getGifs';
import { LightningElement, api } from 'lwc';

export default class NksGifViewer extends LightningElement {
    @api gifCount;

    gifList;
    shuffledGifList;
    currentOffset = 0;

    connectedCallback() {
        getGifs().then((result) => {
            this.gifList = Object.keys(result).map((key) => {
                return { title: key, url: result[key] };
            });
            this.shuffle();
            this.changeOffset();
        });
    }

    changeOffset() {
        if (this.gifCount >= this.gifList.length) {
            this.currentOffset = 0;
        }
        const currentTime = Date.now();
        this.currentOffset = Math.floor(currentTime / 5000) % this.gifList.length;
        const remainingTime = 1000 * 5 - (currentTime - this.currentRoundedTime(1000 * 5).getTime());
        setTimeout(() => {
            this.incrementOffset();
            setInterval(() => {
                this.incrementOffset();
            }, 1000 * 5);
        }, remainingTime);
    }

    incrementOffset() {
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

    get gifs() {
        if (this.shuffledGifList && this.gifCount) {
            let tempList = [...this.shuffledGifList];
            if (this.currentOffset + parseInt(this.gifCount) > this.shuffledGifList.length) {
                tempList = [...this.shuffledGifList, ...this.shuffledGifList];
            }
            return tempList.slice(this.currentOffset, this.currentOffset + parseInt(this.gifCount));
        }
        return this.shuffledGifList || [];
    }
}
