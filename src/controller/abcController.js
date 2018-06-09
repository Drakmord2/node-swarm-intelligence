
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

        let onlookers = this.generate_colony(num_particles, 'onlooker', func_name);
        let employees = this.generate_colony(num_particles, 'employee', func_name);

        let positions   = [];
        let colony      = onlookers.concat(employees);

        for (let i = 0; i < iterations; i++) {
            positions.push( this.getData(colony, 0));
        }

        const data = {
            iterations: iterations,
            positions:  positions,
            boundary:   boundaries
        };

        res.json(data);
    };

    /**
     * x = min + rand[0,1] * (max - min)
     *
     * @param amount
     * @param type
     * @param func_name
     * @returns {Array}
     */
    generate_colony(amount, type, func_name) {
        let colony          = [];
        let positions       = [];
        const boundaries    = config.boundaries[func_name];
        const heuristic     = config.heuristics[func_name];
        amount              = parseInt(amount / 2);

        while (amount > 0) {
            let pos = this.get_vector(boundaries);
            if (positions.indexOf(pos) !== -1) {
                continue;
            }

            positions.push(pos);

            amount--;
        }

        positions.forEach((pos) => {
            let bee = type === 'onlooker' ? new Onlooker(pos, heuristic, boundaries) : new Employee(pos, heuristic, boundaries);

            colony.push(bee);
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

            let obj = [[posx, posy], {solution: best_fitness}, null, bee.type];
            auxPos.push(obj);
        });

        return auxPos;
    }
}

module.exports = ABCController;
