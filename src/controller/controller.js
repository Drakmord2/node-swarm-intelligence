
const config = require('../config');

class Controller {

    static get_vector (boundary) {
        const dimensions    = config.dimensions;
        let vector          = [];

        for(let n = 0; n < dimensions; n++){
            let k = this.randomBetween(boundary[0], boundary[1]);

            vector.push(k);
        }

        return vector;
    }

    static randomBetween (min, max) {
        return Math.floor(Math.random() * (max-min+1)) + min;
    }
}

module.exports = Controller;
