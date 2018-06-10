
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
        const weight        = mathjs.random(100, 600);
        this.weight         = weight;
        this.next_weight    = weight;
    }

    evaluate(position, minimization=true) {
        let fitness = this.heuristic(position, dimensions);

        if (minimization) {
            fitness = mathjs.divide(1, (1 + fitness));
        }

        return fitness;
    }
}

module.exports = Fish;
