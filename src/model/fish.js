
const config        = require('../config');
const dimensions    = config.dimensions;

class Fish {
    constructor(position, heuristic) {
        this.heuristic      = heuristic;
        this.position       = position;
        this.next_position  = position;
        this.fitness        = this.evaluate(position);
        this.next_fitness   = this.evaluate(position);
        this.weight         = config.fss.min_weight;
    }

    evaluate(position) {
        let fitness = this.heuristic(position, dimensions);


        if (fitness === 0) {
            return 1;
        }

        // Minimization
        fitness = 1 / fitness;

        return fitness;
    }
}

module.exports = Fish;
