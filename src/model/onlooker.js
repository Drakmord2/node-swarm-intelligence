
const config        = require('../config');
const dimensions    = config.dimensions;
const mathjs        = require('mathjs');
const Bee           = require('./bee');

class OnlookerBee extends Bee {

    constructor(position, heuristic, boundaries) {
        super(position, heuristic, boundaries);
        this.type = "onlooker";
    }

    /**
     * x(t+1) = x(t) + ø * (x(t) - randx)
     */
    exploit(sources) {
        let bee         = mathjs.pickRandom(sources);
        let position    = bee.position;
        let fitness     = bee.fitness;

        if (this.trial <= config.abc.max_trials) {

            let component = mathjs.pickRandom(position);
            let phi       = mathjs.random([1, dimensions], -1, 1)[0];

            let sub             = mathjs.subtract(position, component);
            let mul             = mathjs.dotMultiply(sub, phi);
            let new_position    = mathjs.add(position, mul);

            new_position        = this.checkBoundaries(new_position);
            let new_fitness     = this.evaluate(new_position);

            if (new_fitness <= fitness) {
                this.trial      = 0;
                this.position   = new_position;
                this.fitness    = new_fitness;
                return;
            }

            this.trial++;
        }
    }
}

module.exports = OnlookerBee;
