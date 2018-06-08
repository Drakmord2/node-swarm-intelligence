
const config        = require('../config');
const fish          = require('../model/fish');
const Controller    = require('./controller');
const mathjs        = require('mathjs');

class FSSController extends Controller {

    /**
     * Fish School Search
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

        let school      = this.generate_school(num_particles, func_name);
        let step_ind    = this.getStepInd(boundaries, config.fss.step_ind_init, iterations);
        let step_vol    = this.getStepVol(boundaries, config.fss.step_vol_init, iterations);

        let positions = [];
        let best_fitness;

        for(let i = 0; i < iterations; i++) {
            let school_weight = this.getSchoolWeight(school);

            school = this.getFitness(school);
            school = this.individual_movement(school, step_ind);
            school = this.getNextFitness(school);
            school = this.move(school, boundaries);
            school = this.feeding(school);
            school = this.instinctive_movement(school, boundaries);
            school = this.volitive_movement(school, school_weight, step_vol, boundaries);

            step_ind        = this.getStepInd(boundaries, step_ind, iterations);
            step_vol        = this.getStepVol(boundaries, step_vol, iterations);
            best_fitness    = this.getBestFitness(best_fitness, school);

            positions.push(this.getData(school, best_fitness));
        }

        const data = {
            iterations: iterations,
            positions:  positions,
            boundary:   boundaries
        };

        res.json(data);
    };

    /**
     * Individual Movement Operator
     * x(t+1) = x(t) + rand[-1, 1] * step_ind
     *
     * @param school
     * @param step
     * @returns {*}
     */
    individual_movement(school, step) {

        school.forEach((fish) => {
            let rand            = this.randomBetween(-1, 1, false);
            let factor          = rand * step;
            let nextPosition    = mathjs.add(fish.position, factor);

            fish.next_position = nextPosition;
        });

        return school;
    }

    /**
     * Feeding Operator
     * W(t+1) = W(t) + ∆f / max(|∆f|)
     *
     * @param school
     * @returns {*}
     */
    feeding(school) {
        let school_delta_f = [];
        school.forEach((fish) => {
            let df = mathjs.abs( mathjs.subtract(fish.next_fitness, fish.fitness));
            school_delta_f.push(df);
        });

        let max_delta_f = mathjs.max(school_delta_f);

        school.forEach((fish) => {
            let delta_f = mathjs.subtract(fish.next_fitness, fish.fitness);

            let weight = fish.weight + mathjs.divide(delta_f, max_delta_f);

            if (weight < config.fss.min_weight) {
                weight = config.fss.min_weight;
            }

            fish.weight = weight;
        });

        return school;
    }

    /**
     * Instinctive Movement Operator
     * I = (∑ ∆x * ∆f) / ∑ ∆f
     * x(t+1) = x(t) + I
     *
     * @param school
     * @param boundaries
     * @returns {*}
     */
    instinctive_movement(school, boundaries) {
        let school_delta_f = 0;
        school.forEach((fish) => {
            school_delta_f += fish.next_fitness - fish.fitness;
        });

        let fishes_deltas = [];
        school.forEach((fish) => {
            let delta_x = mathjs.subtract(fish.next_position, fish.position);
            let delta_f = mathjs.subtract(fish.next_fitness, fish.fitness);

            let dxdf = mathjs.multiply(delta_x, delta_f);

            fishes_deltas.push(dxdf);
        });

        fishes_deltas = fishes_deltas.reduce((a, b) => {
            return mathjs.add(a, b);
        });

        let I = mathjs.divide(fishes_deltas, school_delta_f);

        school.forEach((fish) => {
            let position = mathjs.add(fish.position, I);

            position = this.checkBoundaries(fish, position, boundaries);

            fish.position = position;
        });

        return school;
    }

    /**
     * Volitive Motion Operator
     * x(t+1) = x(t) - step_vol * rand[0, 1] * (x(t) - B) / distance[x(t), B] ; W(t) > W(t-1)
     * x(t+1) = x(t) + step_vol * rand[0, 1] * (x(t) - B) / distance[x(t), B] ; W(t) < W(t-1)
     *
     * @param school
     * @param school_weight
     * @param step
     * @returns {*}
     */

    volitive_movement(school, school_weight, step, boundaries) {
        let new_weight = this.getSchoolWeight(school);
        let barycenter = this.getBarycenter(school);

        school.forEach((fish) => {
            let distance = this.getDistance(fish.position, barycenter);

            let rand        = mathjs.multiply(step, this.randomBetween(-1, 1, false));
            let sub         = mathjs.subtract(fish.position, barycenter);
            let numerator   = mathjs.multiply(rand, sub);

            let movement = [];
            const valid_distance = distance !== 0;

            if (new_weight > school_weight) {
                movement =  valid_distance ? mathjs.subtract(fish.position, mathjs.divide(numerator, distance)) : fish.position;
            } else {
                movement = valid_distance ? mathjs.add(fish.position, mathjs.divide(numerator, distance)) : fish.position;
            }

            movement = this.checkBoundaries(fish, movement, boundaries);

            fish.position = movement;
        });

        return school;
    }

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

    /**
     * School Barycenter
     * B = (∑ x * W) / ∑ W
     *
     * @param school
     * @returns {*}
     */
    getBarycenter(school) {
        let fishes_weight = [];
        school.forEach((fish) => {
            let dxdw = mathjs.multiply(fish.position, fish.weight);
            fishes_weight.push(dxdw);
        });

        fishes_weight = fishes_weight.reduce((a, b) => {
            return mathjs.add(a, b);
        });

        let school_weight = 0;
        school.forEach((fish) => {
            school_weight += fish.weight;
        });

        let barycenter = mathjs.divide(fishes_weight, school_weight);

        return barycenter;
    }

    checkBoundaries(fish, position, boundaries) {
        for(let d = 0; d < config.dimensions; d++) {
            if (mathjs.smallerEq(position[d],boundaries[0]) || mathjs.largerEq(position[d], boundaries[1])) {
                return fish.position;
            }
        }

        return position;
    }

    getSchoolWeight(school) {
        let school_weight = 0;

        school.forEach((fish) => {
            school_weight += fish.weight;
        });

        return school_weight;
    }

    getStepInd(boundaries, step, iterations) {
        let search_space_size = mathjs.abs(boundaries[0]) + mathjs.abs(boundaries[1]);
        let initial = config.fss.step_ind_init * search_space_size;

        if (step === config.fss.step_ind_init) {
            step = initial;
        }

        let next_step = step - initial / iterations;

        if (next_step < config.fss.step_ind_final) {
            next_step = config.fss.step_ind_final;
        }

        return next_step;
    }

    getStepVol(boundaries, step, iterations) {
        let search_space_size = mathjs.abs(boundaries[0]) + mathjs.abs(boundaries[1]);
        let initial = config.fss.step_vol_init * search_space_size;

        if (step === config.fss.step_vol_init) {
            step = initial;
        }

        let next_step = step - initial / iterations;

        if (next_step < config.fss.step_vol_final) {
            next_step = config.fss.step_vol_final;
        }
        return next_step;
    }

    getFitness(school) {
        school.forEach((fish) => {
            fish.fitness = fish.evaluate(fish.position);
        });

        return school;
    }

    getNextFitness(school) {
        school.forEach((fish) => {
            fish.next_fitness = fish.evaluate(fish.next_position);
        });

        return school;
    }

    move(school, boundary, minimization=true) {
        school.forEach((fish) => {
            let fitness_improved = minimization ?
                mathjs.larger(fish.next_fitness, fish.fitness) :
                mathjs.smaller(fish.next_fitness, fish.fitness);

            if (fitness_improved) {

                for(let d = 0; d < config.dimensions; d++) {
                    let tooLow = mathjs.smallerEq(fish.next_position[d], boundary[0]);
                    let tooHigh = mathjs.largerEq(fish.next_position[d],boundary[1]);

                    if (tooLow || tooHigh) {
                        fish.next_position = fish.position;
                        return;
                    }
                }
                fish.position = fish.next_position;
            }

            fish.next_position = fish.position;
        });

        return school;
    }

    generate_school(amount, func_name) {
        let school      = [];
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
            let p = new fish(pos, heuristic);

            school.push(p);
        });

        return school
    }

    getBestFitness(best, school) {
        let new_best = [];

        school.forEach((fish) => {
            new_best.push(1/fish.fitness);
        });

        new_best = mathjs.min(new_best);

        if (!best) {
            return new_best;
        }

        if (mathjs.larger(new_best, best)) {
            new_best = best;
        }

        return new_best;
    }

    optimize_stats(req, res, next) {
        const func_name         = req.body.func_name;
        const num_particles     = req.body.num_particles;
        const iterations        = req.body.max_iteration;
        const num_experiments   = req.body.experiments;
        const boundaries        = config.boundaries[func_name];

        let school      = this.generate_school(num_particles, func_name);
        let step_ind    = this.getStepInd(boundaries, config.fss.step_ind_init, iterations);
        let step_vol    = this.getStepVol(boundaries, config.fss.step_vol_init, iterations);

        let experiments = [];
        for(let j = 0; j < num_experiments; j++) {
            let stats = [];
            let best_fitness;
            for(let i = 0; i < iterations; i++) {
                let school_weight = this.getSchoolWeight(school);

                school = this.getFitness(school);
                school = this.individual_movement(school, step_ind);
                school = this.getNextFitness(school);
                school = this.move(school, boundaries);
                school = this.feeding(school);
                school = this.instinctive_movement(school, boundaries);
                school = this.volitive_movement(school, school_weight, step_vol, boundaries);

                step_ind        = this.getStepInd(boundaries, step_ind, iterations);
                step_vol        = this.getStepVol(boundaries, step_vol, iterations);
                best_fitness    = this.getBestFitness(best_fitness, school);

                stats.push(best_fitness);
            }
            experiments.push(stats);
        }

        res.json(experiments);
    };

    getData(school, best_fitness) {
        let auxPos = [];
        school.forEach((fish) => {
            let posx = fish.position[0];
            let posy = fish.position[1];

            let obj = [[posx, posy], {solution: best_fitness}, fish.weight, {fish_fitness: fish.fitness}];
            auxPos.push(obj);
        });

        return auxPos;
    }
}


module.exports = FSSController;
