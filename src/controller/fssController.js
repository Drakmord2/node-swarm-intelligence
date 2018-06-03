
const config        = require('../config');
const fish          = require('../model/fish');
const Controller    = require('./controller');
const mathjs        = require('mathjs');

class FSSController extends Controller {

    static optimize(req, res, next) {
        const self          = FSSController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;
        const boundaries    = config.boundaries[func_name];

        let school      = self.generate_school(num_particles, func_name);
        let step_ind    = self.getStepInd(config.fss.step_ind_init, iterations);
        let step_vol    = self.getStepVol(config.fss.step_vol_init, iterations);

        let positions = [];
        let best_fitness;

        for(let i = 0; i < iterations; i++) {
            let school_weight = self.getSchoolWeight(school);
            step_ind = self.getStepInd(step_ind, iterations);
            step_vol = self.getStepVol(step_vol, iterations);

            school = self.getFitness(school);
            school = self.individual_movement(school, step_ind);
            school = self.getNextFitness(school);
            school = self.move(school, boundaries);
            school = self.feeding(school);
            school = self.instinctive_movement(school);
            school = self.volitive_movement(school, school_weight, step_vol);

            school_weight   = self.getSchoolWeight(school);
            school          = self.aquarium(school, boundaries);

            best_fitness = self.getBestFitness(best_fitness, school);

            let auxPos = [];
            school.forEach((fish, index, school) => {
                let posx = fish.position[0];
                let posy = fish.position[1];

                let obj = [[posx, posy], {solution: best_fitness}, fish.weight, {fish_fitness: fish.fitness}];
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

    // x(t+1) = x(t) + rand[-1, 1] * step_ind
    static individual_movement(school, step) {

        school.forEach((fish, index, school) => {
            step = this.randomBetween(-1, 1, false) * step;
            let nextPosition = mathjs.add(fish.position, step);

            fish.next_position = nextPosition;
        });

        return school;
    }

    // W(t+1) = W(t) + ∆f / max(|∆f|)
    static feeding(school) {
        let school_delta_f = [];
        school.forEach((fish, index, school) => {
            let df = mathjs.abs( mathjs.subtract(fish.next_fitness, fish.fitness));
            school_delta_f.push(df);
        });

        let max_delta_f = mathjs.max(school_delta_f);

        school.forEach((fish, index, school) => {
            let delta_f = fish.next_fitness - fish.fitness;

            let weight = fish.weight + delta_f / max_delta_f;

            if (weight < config.fss.min_weight) {
                weight = config.fss.min_weight;
            }

            fish.weight = weight;
        });

        return school;
    }

    // I = (∑ ∆x * ∆f) / ∑ ∆f
    // x(t+1) = x(t) + I
    static instinctive_movement(school) {
        let school_delta_f = 0;
        school.forEach((fish, index, school) => {
            school_delta_f += fish.next_fitness - fish.fitness;
        });

        let fishes_deltas = [];
        school.forEach((fish, index, school) => {
            let delta_f = fish.next_fitness - fish.fitness;

            let delta_x = mathjs.subtract(fish.next_position, fish.position);
            let dxdf    = mathjs.multiply(delta_x, delta_f);

            fishes_deltas.push(dxdf);
        });

        fishes_deltas = fishes_deltas.reduce((a, b) => {
            return mathjs.add(a, b);
        });

        let I = mathjs.divide(fishes_deltas, school_delta_f);

        school.forEach((fish, index, school) => {
            let position = mathjs.add(fish.position, I);

            fish.position = position;
        });

        return school;
    }

    // x(t+1) = x(t) - step_vol * rand[0, 1] * (x(t) - B) / distance[x(t), B] ; W(t) > W(t-1)
    // x(t+1) = x(t) + step_vol * rand[0, 1] * (x(t) - B) / distance[x(t), B] ; W(t) < W(t-1)
    static volitive_movement(school, school_weight, step) {
        let new_weight = this.getSchoolWeight(school);
        let barycenter = this.getBarycenter(school);

        school.forEach((fish, index, school) => {
            let distance = this.getDistance(fish.position, barycenter);

            let rand        = mathjs.multiply(step, this.randomBetween(-1, 1, false));
            let sub         = mathjs.subtract(fish.position, barycenter);
            let numerator   = mathjs.multiply(rand, sub);

            let movement = [];
            if (new_weight > school_weight) {
                movement = mathjs.subtract(fish.position, mathjs.divide(numerator, distance));
            } else {
                movement = mathjs.add(fish.position, mathjs.divide(numerator, distance));
            }

            fish.position = movement ;
        });

        return school;
    }

    // √[ ∑(p - q)^2 ]
    static getDistance(a, b) {
        let components  = mathjs.dotPow(mathjs.subtract(b, a), 2);
        let sum         = mathjs.sum(components);

        let distance = mathjs.sqrt(sum);

        return distance;
    }

    // B = (∑ ∆x * ∆W) / ∑ ∆W
    static getBarycenter(school) {
        let fishes_deltas = [];
        school.forEach((fish, index, school) => {
            let dxdw = mathjs.multiply(fish.position, fish.weight);
            fishes_deltas.push(dxdw);
        });

        fishes_deltas = fishes_deltas.reduce((a, b) => {
            return mathjs.add(a, b);
        });

        let school_weight = 0;
        school.forEach((fish, index, school) => {
            school_weight += fish.weight;
        });

        let barycenter = mathjs.divide(fishes_deltas, school_weight);

        return barycenter;
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

    static getSchoolWeight(school) {
        let school_weight = 0;

        school.forEach((fish, index, school) => {
            school_weight += fish.weight;
        });

        return school_weight;
    }

    static getStepInd(step, iterations) {
        let initial = config.fss.step_ind_init;

        let next_step = step - initial / iterations;

        if (next_step < config.fss.step_ind_final) {
            next_step = config.fss.step_ind_final;
        }

        return next_step;
    }

    static getStepVol(step, iterations) {
        let initial = config.fss.step_vol_init;

        let next_step = step - initial / iterations;

        if (next_step < config.fss.step_vol_final) {
            next_step = config.fss.step_vol_final;
        }
        return next_step;
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

    static move(school, boundary) {
        school.forEach((fish) => {
            if (mathjs.larger(fish.next_fitness, fish.fitness)) {
                for(let d = 0; d < config.dimensions; d++) {
                    if (mathjs.smallerEq(fish.next_position[d], boundary[0]) || mathjs.largerEq(fish.next_position[d],boundary[1])) {
                        fish.next_position = fish.position;
                        return;
                    }
                }

                fish.position = fish.next_position;
            }
        });

        return school;
    }

    static generate_school(amount, func_name) {
        let school      = [];
        let positions   = [];
        const boundary  = config.boundaries[func_name];

        while (amount > 0) {
            let pos = super.get_vector(boundary);
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

    static getBestFitness(fitness, school) {
        let best = [];

        school.forEach((fish, index, school) => {
            best.push(fish.fitness);
        });

        best = mathjs.min(best);

        if (!fitness) {
            return best;
        }

        if (mathjs.smaller(best, fitness)) {
            best = fitness;
        }

        return best;
    }

    static optimize_stats(req, res, next) {
        let solutions = [];
        const data = {
            solutions:  solutions
        };

        res.json(data);
    }
}


module.exports = FSSController;
