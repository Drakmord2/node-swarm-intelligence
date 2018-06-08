
const config        = require('../config');
const mathjs        = require('mathjs');
const Controller    = require('./controller');
const Onlooker      = require('../model/onlooker');
const Employee      = require('../model/employee');

class ABCController extends Controller {

    /**
     * Artificial Bee Colony
     *
     * @param req
     * @param res
     * @param next
     */
    optimize(req, res, next) {
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;
        const boundaries    = config.boundaries[func_name];

        let colony = this.generate_colony(num_particles, func_name);

        let positions = [];

        const data = {
            iterations: iterations,
            positions:  positions,
            boundary:   boundaries
        };

        res.json(data);
    };

    /**
     * Euclidean Distance
     * √ ( ∑(p - q)^2)
     *
     * @param a
     * @param b
     * @returns {number}
     */
    getDistance(a, b) {
        let components  = mathjs.dotPow(mathjs.subtract(b, a), 2);
        let sum         = mathjs.sum(components);

        let distance = mathjs.sqrt(sum);

        return distance;
    }

    checkBoundaries(bee, position, boundaries) {
        for(let d = 0; d < config.dimensions; d++) {
            if (mathjs.smallerEq(position[d],boundaries[0]) || mathjs.largerEq(position[d], boundaries[1])) {
                return bee.position;
            }
        }

        return position;
    }

    generate_colony(amount, func_name) {
        let colony      = [];
        let positions   = [];
        const boundary  = config.boundaries[func_name];

        while (amount > 0) {
            let pos = this.get_vector(boundary);
            if (positions.indexOf(pos) !== -1) {
                continue;
            }

            positions.push(pos);

            amount--;
        }

        const heuristic = config.heuristics[func_name];

        positions.forEach((pos) => {
            let onlooker = new Onlooker(pos, heuristic);
            let employee = new Employee(pos, heuristic);

            colony.push(onlooker);
            colony.push(employee);
        });

        return colony
    }

    optimize_stats(req, res, next) {
        const func_name         = req.body.func_name;
        const num_particles     = req.body.num_particles;
        const iterations        = req.body.max_iteration;
        const num_experiments   = req.body.experiments;
        const boundaries        = config.boundaries[func_name];

        let experiments = [];

        res.json(experiments);
    };

    getData(colony, best_fitness) {
        let auxPos = [];
        colony.forEach((bee) => {
            let posx = bee.position[0];
            let posy = bee.position[1];

            let obj = [[posx, posy], {solution: best_fitness}, bee.type, {bee_fitness: bee.fitness}];
            auxPos.push(obj);
        });

        return auxPos;
    }
}

module.exports = ABCController;
