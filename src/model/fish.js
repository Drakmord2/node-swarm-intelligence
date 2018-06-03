
const config        = require('../config');
const dimensions    = config.dimensions;
const mathjs        = require('mathjs');

class Fish {
    constructor(position, heuristic) {
        this.heuristic      = heuristic;
        this.position       = position;
        this.next_position  = position;
        const fitness       = this.evaluate(position);
        this.fitness        = fitness;
        this.next_fitness   = fitness;
        this.weight         = 1;
    }

    evaluate(position, minimization=true) {
        let fitness = this.heuristic(position, dimensions);

        if (minimization) {
            if (mathjs.equal(fitness, 0)) {
                return Infinity;
            }

            fitness = mathjs.divide(1, fitness);
        }

        return fitness;
    }
}

module.exports = Fish;
