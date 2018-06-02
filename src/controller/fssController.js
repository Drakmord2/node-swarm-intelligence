
const config        = require('../config');
const fish          = require('../model/fish');
const Controller    = require('./controller');

class FSSController extends Controller {

    static optimize(req, res, next) {
        const self          = FSSController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;

        let fishes = self.generate_school(num_particles, func_name);

        let positions = [];

        for(let i = 0; i < iterations; i++) {

            fishes.map(agent => agent.evaluate());
            fishes = self.individual_movement(fishes);
            fishes.map(agent => agent.evaluate());
            fishes = self.feeding(fishes);
            fishes = self.instinctive_movement(fishes);
            fishes = self.volitive_movement(fishes);

            let auxPos = [];
            let barycenter = self.getBarycenter(fishes);
            fishes.forEach((agent, index, fishes) => {
                let posx = agent.position[0];
                let posy = agent.position[1];

                let obj = [[posx, posy], {solution: barycenter, position: [posx, posy]}];
                auxPos.push(obj);
            });

            positions.push(auxPos);
        }

        const data = {
            iterations: iterations,
            positions:  positions,
            boundary:   config.boundaries[func_name]
        };

        res.json(data);
    }

    static feeding(fishes) {
        return fishes;
    }

    static individual_movement(fishes) {
        return fishes;
    }

    static instinctive_movement(fishes) {
        return fishes;
    }

    static volitive_movement(fishes) {
        return fishes;
    }

    static getBarycenter(fishes) {
        let barycenter = fishes.length / 2;

        return barycenter;
    }

    static optimize_stats(req, res, next) {
        const self          = FSSController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;

        let fishes = self.generate_school(num_particles, func_name);

        let solutions = [];
        for(let i = 0; i < iterations; i++) {

            fishes.map(agent => agent.evaluate());
            fishes = self.individual_movement(fishes);
            fishes.map(agent => agent.evaluate());
            fishes = self.feeding(fishes);
            fishes = self.instinctive_movement(fishes);
            fishes = self.volitive_movement(fishes);

            let barycenter = self.getBarycenter(fishes);

            solutions.push(barycenter);
        }

        const data = {
            solutions:  solutions
        };

        res.json(data);
    }

    static generate_school(amount, func_name) {
        const self      = FSSController;
        let fishes      = [];
        let positions   = [];
        const boundary  = config.boundaries[func_name];

        while (amount > 0) {
            let pos = self.get_vector(boundary);
            if (positions.indexOf(pos) !== -1) {
                continue;
            }

            positions.push(pos);

            amount--;
        }

        const heuristic = config.heuristics[func_name];

        positions.forEach((pos, index, positions) => {
            let p = new fish(pos, heuristic, boundary);

            fishes.push(p);
        });

        return fishes
    }
}


module.exports = FSSController;
