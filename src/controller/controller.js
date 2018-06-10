
const config = require('../config');
const mathjs = require('mathjs');

class Controller {

    get_vector (boundary) {
        const dimensions    = config.dimensions;
        let vector          = [];

        for(let n = 0; n < dimensions; n++){
            let k = mathjs.random(boundary[0], boundary[1]);

            vector.push(k);
        }

        return vector;
    }
}

module.exports = Controller;
