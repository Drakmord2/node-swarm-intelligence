
const config        = require('../config');
const fish          = require('../model/fish');
const Controller    = require('./controller');

class FSSController extends Controller {

    static optimize(req, res, next) {
        const self          = FSSController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;
        const boundaries    = config.boundaries[func_name];

        let school = self.generate_school(num_particles, func_name);

        let positions = [];

        for(let i = 0; i < iterations; i++) {

            school = self.getFitness(school);
            school = self.individual_movement(school);
            school = self.getNextFitness(school);
            school = self.move(school);
            school = self.feeding(school);
            school = self.instinctive_movement(school);
            school = self.volitive_movement(school);

            school = self.aquarium(school, boundaries);

            let auxPos = [];
            let barycenter = self.getBarycenter(school);
            school.forEach((fish, index, school) => {
                let posx = fish.position[0];
                let posy = fish.position[1];

                let obj = [[posx, posy], {solution: barycenter, position: [posx, posy]}, fish.weight];
                auxPos.push(obj);
            });

            positions.push(auxPos);
        }

        const data = {
            iterations: iterations,
            positions:  positions,
            boundary:   boundaries
        };

        res.json(data);
    }

    static aquarium(school, boundaries) {
        school.forEach((fish, index, school) => {
            for(let d = 0; d < config.dimensions; d++) {
                if (fish.position[d] < boundaries[0]) {
                    fish.position[d] = boundaries[0];
                }

                if (fish.position[d] > boundaries[1]) {
                    fish.position[d] = boundaries[1];
                }
            }
        });

        return school;
    }

    // x(t+1) = x(t) + rand[-1, 1] * step_ind
    static individual_movement(school) {
        const self  = FSSController;
        let step    = config.fss.step_ind_init;

        school.forEach((fish, index, school) => {
            let nextPosition = [];
            for(let d = 0; d < config.dimensions; d++) {
                nextPosition[d] = fish.position[d] + self.randomBetween(-1, 1, false) * step;
            }

            fish.next_position = nextPosition;
        });

        return school;
    }

    // W(t+1) = W(t) + ∆f / max(|∆f|)
    static feeding(school) {
        let dfs = [];
        school.forEach((fish, index, school) => {
            let df = Math.abs(fish.next_fitness - fish.fitness);
            dfs.push(df);
        });

        let maxdf = dfs.reduce((a, b) => {
            return Math.max(a,b);
        });

        school.forEach((fish, index, school) => {
            let df = fish.next_fitness - fish.fitness;

            let weight = fish.weight + df / maxdf;

            if (weight >= config.fss.min_weight) {
                fish.weight = weight;
            }
        });

        return school;
    }

    // I = (∑ ∆x * ∆f) / ∑ ∆f
    // x(t+1) = x(t) + I
    static instinctive_movement(school) {
        let I = [];

        // school.forEach((fish, index, school) => {
        //     fish.position = fish.position + I;
        // });

        return school;
    }

    static volitive_movement(school) {
        return school;
    }

    static getBarycenter(school) {
        let barycenter = school.length / 2;

        return barycenter;
    }

    static getFitness(school) {
        school.forEach((fish, index, school) => {
            fish.fitness = fish.evaluate(fish.position);
        });

        return school;
    }

    static getNextFitness(school) {
        school.forEach((fish, index, school) => {
            fish.next_fitness = fish.evaluate(fish.next_position);
        });

        return school;
    }

    static move(school) {
        school.forEach((fish) => {
            if (fish.next_fitness > fish.fitness) {
                fish.position = fish.next_position;
            }
        });

        return school;
    }

    static optimize_stats(req, res, next) {
        const self          = FSSController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;

        let school = self.generate_school(num_particles, func_name);

        let solutions = [];
        for(let i = 0; i < iterations; i++) {

            school.map(fish => fish.evaluate());
            school = self.individual_movement(school);
            school.map(fish => fish.evaluate());
            school = self.feeding(school);
            school = self.instinctive_movement(school);
            school = self.volitive_movement(school);

            let barycenter = self.getBarycenter(school);

            solutions.push(barycenter);
        }

        const data = {
            solutions:  solutions
        };

        res.json(data);
    }

    static generate_school(amount, func_name) {
        const self      = FSSController;
        let school      = [];
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
            let p = new fish(pos, heuristic);

            school.push(p);
        });

        return school
    }
}


module.exports = FSSController;
