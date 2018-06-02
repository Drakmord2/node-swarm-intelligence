
const config        = require('../config');
const dimensions    = config.dimensions;

class Fish {
    constructor(position, heuristic, boundary) {
        this.heuristic  = heuristic;
        this.boundary   = boundary;
        this.position   = position;
        this.weight     = this.evaluate();
    }

    evaluate() {
        let weight = this.heuristic(this.position, dimensions);

        if (weight < config.fss.min_weight) {
            return config.fss.min_weight;
        }

        if (weight > config.fss.weight_scale / 2) {
            return config.fss.weight_scale / 2;
        }

        return weight;
    }
}

module.exports = Fish;
