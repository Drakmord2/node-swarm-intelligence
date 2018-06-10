
const configs = {
    dimensions: 30,
    pso: {
        accelP: 2.05,
        accelG: 2.05,
        inertia: 0.4,
    },
    fss: {
        step_ind_init: 0.01,
        step_ind_final: 0.001,
        step_vol_init: 0.1,
        step_vol_final: 0.01,
        min_weight: 1
    },
    abc: {
        max_trials: 100
    },
    heuristics: {
        sphere: (position, dimensions) => {
            let pos = [];
            for(let n = 0; n < dimensions; n++){
                pos.push(position[n]);
            }

            // ∑ x^2
            let result = Math.pow(pos[0], 2);

            for(let n = 1; n < dimensions; n++){
                result += Math.pow(pos[n], 2);
            }

            return result
        },
        rosenbrock: (position, dimensions) => {
            let pos = [];
            for(let n = 0; n < dimensions; n++){
                pos.push(position[n]);
            }

            // ∑ [ 100 * (y - x^2)^2 + (1 - x)^2 ]
            let result = 100 * Math.pow((pos[1] - Math.pow(pos[0], 2)), 2) + Math.pow((1 - pos[0]), 2);

            for(let n = 1; n < dimensions-1; n++){
                result += 100 * Math.pow((pos[n+1] - Math.pow(pos[n], 2)), 2) + Math.pow((1 - pos[n]), 2);
            }

            return result
        },
        rastrigin: (position, dimensions) => {
            let pos = [];
            for(let n = 0; n < dimensions; n++){
                pos.push(position[n]);
            }

            // 10 * n + ∑ [ x^2 - 10 * cos(2 * pi * x) ]
            let result = 10 * dimensions;

            for(let n = 0; n < dimensions; n++){
                result += Math.pow(pos[n], 2) - 10 * Math.cos(2 * Math.PI * pos[n]);
            }

            return result
        }
    },
    boundaries: {
        sphere: [-100, 100],
        rosenbrock: [-30, 30],
        rastrigin: [-5.12, 5.12]
    }
};

module.exports = configs;
