
const config        = require('../config');
const dimensions    = config.dimensions;
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
            let component = mathjs.pickRandom(this.position);
            let phi       = mathjs.random([1, dimensions], -1, 1)[0];

            let sub             = mathjs.subtract(this.position, component);
            let mul             = mathjs.dotMultiply(sub, phi);
            let new_position    = mathjs.add(this.position, mul);

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

    get_probability(total_fitness) {
        let fitness = this.get_fitness();

        this.probability = mathjs.divide(fitness, total_fitness);
    }
}

module.exports = EmployeeBee;
