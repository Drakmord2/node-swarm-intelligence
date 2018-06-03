
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

        let school      = self.generate_school(num_particles, func_name);
        let step_ind    = self.getStepInd(config.fss.step_ind_init, iterations);
        let step_vol    = self.getStepVol(config.fss.step_vol_init, iterations);

        let positions = [];

        for(let i = 0; i < iterations; i++) {
            let school_weight = self.getSchoolWeight(school);
            step_ind = self.getStepInd(step_ind, iterations);
            step_vol = self.getStepVol(step_vol, iterations);

            school = self.getFitness(school);
            school = self.individual_movement(school, step_ind);
            school = self.getNextFitness(school);
            school = self.move(school, boundaries);
            school = self.feeding(school);
            // school = self.instinctive_movement(school);
            school = self.volitive_movement(school, school_weight, step_vol);

            school_weight   = self.getSchoolWeight(school);
            school          = self.aquarium(school, boundaries);

            let auxPos = [];
            school.forEach((fish, index, school) => {
                let posx = fish.position[0];
                let posy = fish.position[1];

                let obj = [[posx, posy], {solution: fish.fitness, position: [posx, posy]}, fish.weight];
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
            let nextPosition = [];
            for(let d = 0; d < config.dimensions; d++) {
                nextPosition[d] = fish.position[d] + this.randomBetween(-1, 1, false) * step;
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

        let dxdfs = [];
        school.forEach((fish, index, school) => {
            let dxdf = [];
            let df = fish.next_fitness - fish.fitness;

            for(let d = 0; d < config.dimensions; d++) {
                dxdf.push(fish.position[d] * df);
            }

            dxdfs.push(dxdf);
        });

        dxdfs = dxdfs.reduce((a, b) => {
            let sum = [];
            for(let d = 0; d < config.dimensions; d++) {
                sum.push(a[d] + b[d]);
            }

            return sum;
        });

        let dfs = 0;
        school.forEach((fish, index, school) => {
            dfs += fish.next_fitness - fish.fitness;
        });

        for (let i = 0; i < dxdfs.length; i++) {
            let x = dxdfs[i] / dfs;
            I.push(x);
        }

        school.forEach((fish, index, school) => {
            let position = [];
            for(let d = 0; d < config.dimensions; d++) {
                let component = fish.position[d] + I[d];

                position.push(component);
            }

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

            let movement = [];
            for(let d = 0; d < config.dimensions; d++) {
                let sub     = fish.position[d] - barycenter[d];
                let factor  = step * this.randomBetween(-1, 1, false);

                if (new_weight > school_weight) {
                    movement.push( fish.position[d] - factor * sub / distance);
                } else {
                    movement.push( fish.position[d] + factor * sub / distance);
                }
            }

            fish.position = movement ;
        });

        return school;
    }

    // √[ ∑(p - q)^2 ]
    static getDistance(a, b) {
        let components = [];
        for(let d = 0; d < config.dimensions; d++) {
            let component = Math.pow(a[d] - b[d], 2);
            components.push(component);
        }

        let sum = components.reduce((a,b)=>{return a+b;});
        let distance = Math.sqrt(sum);

        return distance;
    }

    // B = (∑ ∆x * ∆W) / ∑ ∆W
    static getBarycenter(school) {
        let barycenter = [];

        let dxdws = [];
        school.forEach((fish, index, school) => {
            let dxdw = [];
            for(let d = 0; d < config.dimensions; d++) {
                dxdw.push(fish.position[d] * fish.weight);
            }
            dxdws.push(dxdw);
        });

        dxdws = dxdws.reduce((a, b) => {
            let sum = [];
            for(let d = 0; d < config.dimensions; d++) {
                sum.push(a[d] + b[d]);
            }

            return sum;
        });

        let school_weight = 0;
        school.forEach((fish, index, school) => {
            school_weight += fish.weight;
        });

        for (let i = 0; i < dxdws.length; i++) {
            let x = dxdws[i] / school_weight;
            barycenter.push(x);
        }

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

    static getFitness(school) {
        school.forEach((fish, index, school) => {
            fish.fitness = fish.evaluate(fish.position);
        });

        return school;
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

    static getNextFitness(school) {
        school.forEach((fish, index, school) => {
            fish.next_fitness = fish.evaluate(fish.next_position);
        });

        return school;
    }

    static move(school, boundary) {
        school.forEach((fish) => {
            if (fish.next_fitness > fish.fitness) {
                for(let d = 0; d < config.dimensions; d++) {
                    if (fish.next_position[d] <= boundary[0] || fish.next_position[d] >= boundary[1]) {
                        return;
                    }
                }

                fish.position = fish.next_position;
            }
        });

        return school;
    }

    static optimize_stats(req, res, next) {
        let solutions = [];
        const data = {
            solutions:  solutions
        };

        res.json(data);
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
}


module.exports = FSSController;
