
const config        = require('../config');
const dimensions    = config.dimensions;

let gbest = {};

class Particle {
    constructor(position, velocity, heuristic, boundary) {
        this.heuristic  = heuristic;
        this.boundary   = boundary;
    }

    evaluate() {
        return {};
    }

    static clear() {
        gbest = {};
    }

    static getGbest() {
        return gbest;
    }
}

module.exports = Particle;
