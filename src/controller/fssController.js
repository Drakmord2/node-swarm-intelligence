
const config        = require('../config');
const dimensions    = config.dimensions;
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

        let positions       = [];
        let best_fitness    = null;

        for(let i = 0; i < iterations; i++) {

            school = this.individual_movement(school, step_ind, boundaries);
            school = this.feeding(school);
            school = this.instinctive_movement(school, boundaries);
            school = this.volitive_movement(school, step_vol, boundaries);

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
     * @param boundaries
     * @returns {*}
     */
    individual_movement(school, step, boundaries) {

        school.forEach((fish) => {
            let rand    = mathjs.random([1, dimensions], -1, 1)[0];
            let factor  = mathjs.dotMultiply(rand, step);

            let nextPosition = mathjs.add(fish.position, factor);

            nextPosition = this.checkBoundaries(fish, nextPosition, boundaries);

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
            fish.next_fitness   = fish.evaluate(fish.next_position);
            let df              = mathjs.abs( mathjs.subtract(fish.next_fitness, fish.fitness));

            school_delta_f.push(df);
        });

        let max_delta_f = mathjs.max(school_delta_f);

        school.forEach((fish) => {
            let delta_f = mathjs.subtract(fish.next_fitness, fish.fitness);

            let ratio   = mathjs.dotDivide(delta_f, max_delta_f);
            let weight  = mathjs.add(fish.weight, ratio);

            if (weight < config.fss.min_weight) {
                weight = config.fss.min_weight;
            }

            fish.next_weight = weight;
        });

        return school;
    }

    /**
     * Instinctive Movement Operator
     * Drift = (∑ ∆x * ∆f) / ∑ ∆f
     * x(t+1) = x(t) + Drift
     *
     * @param school
     * @param boundaries
     * @returns {*}
     */
    instinctive_movement(school, boundaries) {
        let fishes_deltas = [];
        school.forEach((fish) => {
            let delta_x = mathjs.subtract(fish.next_position, fish.position);
            let delta_f = mathjs.subtract(fish.next_fitness, fish.fitness);

            let dxdf = mathjs.dotMultiply(delta_x, delta_f);
            fishes_deltas.push(dxdf);
        });

        fishes_deltas = fishes_deltas.reduce((a, b) => {
            return mathjs.add(a, b);
        });

        let school_delta_f = 0;
        school.forEach((fish) => {
            let delta_f     = mathjs.subtract(fish.next_fitness, fish.fitness);
            school_delta_f  = mathjs.add(school_delta_f, delta_f);
        });

        let drift = mathjs.dotDivide(fishes_deltas, school_delta_f);

        school.forEach((fish) => {
            let position = mathjs.add(fish.position, drift);

            position = this.checkBoundaries(fish, position, boundaries);

            fish.next_position = position;
        });

        return school;
    }

    /**
     * Volitive Motion Operator
     * x(t+1) = x(t) - step_vol * rand[0, 1] * (x(t) - B) / distance[x(t), B] ; W(t) > W(t-1)
     * x(t+1) = x(t) + step_vol * rand[0, 1] * (x(t) - B) / distance[x(t), B] ; W(t) < W(t-1)
     *
     * @param school
     * @param step
     * @param boundaries
     * @returns {*}
     */
    volitive_movement(school, step, boundaries) {
        let school_weight   = this.getSchoolWeight(school, 'current');
        let new_weight      = this.getSchoolWeight(school, 'next');
        let barycenter      = this.getBarycenter(school, new_weight);

        school.forEach((fish) => {
            let distance = this.getDistance(fish.next_position, barycenter);

            let rand    = mathjs.random([1, dimensions], 0, 1)[0];
            let diff    = mathjs.subtract(fish.next_position, barycenter);
            let stepi   = mathjs.dotMultiply(step, rand);
            stepi       = mathjs.dotMultiply(stepi, diff);
            let ratio   = mathjs.dotDivide(stepi, distance);

            let movement = [];
            const valid_distance = distance !== 0;

            if (new_weight > school_weight) {
                movement =  valid_distance ? mathjs.subtract(fish.next_position, ratio) : fish.next_position;
            } else {
                movement = valid_distance ? mathjs.add(fish.next_position, ratio) : fish.next_position;
            }

            movement = this.checkBoundaries(fish, movement, boundaries);

            fish.weight     = fish.next_weight;
            fish.fitness    = fish.next_fitness;
            fish.position   = movement;
        });

        return school;
    }

    /**
     * Euclidean Distance
     * √ ( ∑(q - p)^2)
     *
     * @param p
     * @param q
     * @returns {number}
     */
    getDistance(p, q) {
        let sub         = mathjs.subtract(q, p);
        let components  = mathjs.dotPow(sub, 2);
        let sum         = mathjs.sum(components);

        let distance = mathjs.sqrt(sum);

        return distance;
    }

    /**
     * School Barycenter
     * B = (∑ x * W) / ∑ W
     *
     * @param school
     * @param school_weight
     * @returns {*}
     */
    getBarycenter(school, school_weight) {
        let fishes_weight = [];

        school.forEach((fish) => {
            let weightdpos = mathjs.dotMultiply(fish.next_position, fish.next_weight);
            fishes_weight.push(weightdpos);
        });

        fishes_weight = fishes_weight.reduce((a, b) => {
            return mathjs.add(a, b);
        });

        let barycenter = mathjs.dotDivide(fishes_weight, school_weight);

        return barycenter;
    }

    checkBoundaries(fish, new_position, boundaries) {
        let min = boundaries[0];
        let max = boundaries[1];

        for(let d = 0; d < dimensions; d++) {
            if (mathjs.smaller(new_position[d], min) || mathjs.larger(new_position[d], max)) {
                return fish.position;
            }
        }

        return new_position;
    }

    getSchoolWeight(school, current) {
        let school_weight = 0;

        school.forEach((fish) => {
            let weight = current === 'current' ? fish.weight : fish.next_weight;
            school_weight = mathjs.add(school_weight, weight);
        });

        return school_weight;
    }

    getStepInd(boundaries, step, iterations) {
        let search_space_size   = mathjs.abs(boundaries[0]) + mathjs.abs(boundaries[1]);
        let initial             = mathjs.multiply(config.fss.step_ind_init, search_space_size);

        if (step === config.fss.step_ind_init) {
            step = initial;
        }

        let next_step = step - mathjs.divide(initial, iterations);

        if (next_step < config.fss.step_ind_final) {
            next_step = config.fss.step_ind_final;
        }

        return next_step;
    }

    getStepVol(boundaries, step, iterations) {
        let search_space_size   = mathjs.abs(boundaries[0]) + mathjs.abs(boundaries[1]);
        let initial             = mathjs.multiply(config.fss.step_vol_init, search_space_size);

        if (step === config.fss.step_vol_init) {
            step = initial;
        }

        let next_step = step - mathjs.divide(initial, iterations);

        if (next_step < config.fss.step_vol_final) {
            next_step = config.fss.step_vol_final;
        }

        return next_step;
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
            let stats           = [];
            let best_fitness    = null;

            for(let i = 0; i < iterations; i++) {

                school = this.individual_movement(school, step_ind, boundaries);
                school = this.feeding(school);
                school = this.instinctive_movement(school, boundaries);
                school = this.volitive_movement(school, step_vol, boundaries);

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
