
const config        = require('../config');
const dimensions    = config.dimensions;
const mathjs        = require('mathjs');

class Bee {
    constructor(position, heuristic, boundaries) {
        this.position       = position;
        this.heuristic      = heuristic;
        this.boudaries      = boundaries;
        this.fitness        = this.evaluate(position);
        this.trial          = 0;
        this.probability    = 0.0;
        this.type           = "bee";
    }

    evaluate(position) {
        let fitness = this.heuristic(position, dimensions);

        return fitness;
    }

    checkBoundaries(position) {
        let min = this.boundaries[0];
        let max = this.boundaries[1];

        for(let d = 0; d < dimensions; d++) {
            if (mathjs.smaller( position[d], min)) {
                position[d] = min;
            }

            if (mathjs.larger( position[d], max)) {
                position[d] = max;
            }
        }

        return position;
    }

    update(new_position, new_fitness) {
        if (new_fitness <= this.fitness) {
            this.trial      = 0;
            this.position   = new_position;
            this.fitness    = new_fitness;
            return;
        }

        this.trial++;
    }

    reset(position) {
        this.position       = position;
        this.fitness        = this.evaluate(position);
        this.trial          = 0;
        this.probability    = 0.0;
    }
}

module.exports = Bee;
