
const config        = require('../config');
const dimensions    = config.dimensions;
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

        let positions       = [];
        let best_fitness    = null;
        let best_sources    = [];
        let colony          = [];

        for (let i = 0; i < iterations; i++) {

            employees       = this.employee_phase(employees);
            employees       = this.probabilites(employees);
            best_sources    = this.selection(best_sources, employees);
            onlookers       = this.onlooker_phase(onlookers,best_sources);
            colony          = onlookers.concat(employees);
            colony          = this.scout_phase(colony, boundaries);
            best_fitness    = this.best_fitness(colony, best_fitness);

            positions.push( this.getData(colony, best_fitness[0]));
        }

        const data = {
            iterations: iterations,
            boundary:   boundaries,
            positions:  positions,
            solution:   {
                position: best_fitness[1],
                fitness: best_fitness[0]
            }
        };

        res.json(data);
    };

    employee_phase(employees) {
        for (let employee of employees) {
            employee.explore();
        }

        return employees;
    }

    probabilites(employees) {
        let total_fitness = mathjs.sum(employees.map((bee)=>{
            return bee.get_fitness();
        }));

        for (let employee of employees) {
            employee.get_probability(total_fitness);
        }

        return employees
    }

    selection(best_sources, employees) {
        do {
            best_sources = employees.filter((bee)=>{
                return bee.probability > mathjs.random();
            });
        } while(best_sources.length === 0);

        return best_sources;
    }

    onlooker_phase(onlookers, best_sources) {
        for (let onlooker of onlookers) {
            onlooker.exploit(best_sources);
        }

        return onlookers
    }

    scout_phase(colony, boundaries) {
        colony.map((bee)=>{
            let new_position = this.get_position(boundaries);

            bee.reset(new_position);
        });

        return colony
    }

    generate_colony(amount, type, func_name) {
        let colony          = [];
        let positions       = [];
        const boundaries    = config.boundaries[func_name];
        const heuristic     = config.heuristics[func_name];

        amount = parseInt(amount / 2);

        while (amount > 0) {
            let vector = this.get_position(boundaries);

            if (positions.indexOf(vector) !== -1) {
                continue;
            }

            positions.push(vector);
            amount--;
        }

        positions.forEach((pos) => {
            let bee = type === 'onlooker' ? new Onlooker(pos, heuristic, boundaries) : new Employee(pos, heuristic, boundaries);

            colony.push(bee);
        });

        return colony
    }

    /**
     * x = min + rand[0,1] * (max - min)
     *
     * @returns {Array}
     */
    get_position(boundaries) {
        let vector  = [];
        let min     = boundaries[0];
        let max     = boundaries[1];

        for(let n = 0; n < dimensions; n++){
            let k = min + mathjs.random() * (max - min);

            vector.push(k);
        }

        return vector;
    }

    best_fitness(colony, best) {
        let best_bees = colony.map((bee)=>{
            return [bee.fitness, bee.position];
        });

        let best_bee = best_bees.sort((a,b)=>{
            if (a[0] > b[0]) {return 1;}
            if (a[0] < b[0]) {return -1;}
            return 0;
        })[0];

        if (best_bee[0] > best && best !== null) {
            return best;
        }

        return best_bee;
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
