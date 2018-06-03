
const config        = require('../config');
const dimensions    = config.dimensions;
const math          = require('mathjs');

class Fish {
    constructor(position, heuristic) {
        this.heuristic      = heuristic;
        this.position       = position;
        this.next_position  = position;
        const fitness       = this.evaluate(position);
        this.fitness        = fitness;
        this.next_fitness   = fitness;
        this.weight         = config.fss.min_weight;
    }

    evaluate(position, minimization=true) {
        let fitness = this.heuristic(position, dimensions);

        if (minimization) {
            if (math.equal(fitness, 0)) {
                return Infinity;
            }

            fitness = math.divide(1, fitness);
        }

        return fitness;
    }
}

module.exports = Fish;
