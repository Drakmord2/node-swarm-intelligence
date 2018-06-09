
const config        = require('../config');
const mathjs        = require('mathjs');
const Bee           = require('./bee');

class EmployeeBee extends Bee {

    constructor(position, heuristic, boundaries) {
        super(position, heuristic, boundaries);
        this.type = "employee";
    }

    /**
     * x(t+1) = x(t) + ø * (x(t) - randx)
     */
    explore() {
        if (this.trial <= config.abc.max_trials) {
            let component = mathjs.pickRandom(position);
            let phi       = mathjs.random([1, dimensions], -1, 1);

            let sub             = mathjs.subtract(position, component);
            let mul             = mathjs.multiply(sub, phi);
            let new_position    = mathjs.add(position, mul);

            new_position        = this.checkBoundaries(new_position);
            let new_fitness     = this.evaluate(new_position);

            this.update(new_position, new_fitness);
        }
    }

    get_fitness(maximize=false) {
        let fitness = this.fitness;

        if (maximize) {
            return fitness;
        }

        if (fitness >= 0) {
            return mathjs.divide(1, (1 + fitness));
        }

        return 1 + mathjs.abs(fitness);
    }

    get_probability(max_fitness) {
        let fitness = this.get_fitness();

        this.probability = mathjs.divide(fitness, max_fitness);
    }
}

module.exports = EmployeeBee;
