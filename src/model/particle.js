
const config        = require('../config');
const dimensions    = config.dimensions;

let gbest = {
    solution: NaN,
    position: [NaN, NaN]
};

class Particle {
    constructor(position, velocity, heuristic, boundary) {
        this.heuristic  = heuristic;
        this.boundary   = boundary;
        this.position   = position;
        this.velocity   = velocity;
        this.pbest      = {
            solution: heuristic(position, dimensions),
            position: position
        };
    }

    evaluate() {
        for (let d = 0; d < dimensions; d++) {
            if (this.position[d] < this.boundary[0] || this.position[d] > this.boundary[1]) {
                this.getNextPosition_clerc();

                return gbest;
            }
        }

        let result = this.heuristic(this.position, dimensions);

        // Global topology
        //-----------------------------------------------------------------------------
        if (result < this.pbest.solution) {
            this.pbest.solution = result;
            this.pbest.position = this.position;
        }

        if (isNaN(gbest.solution) || this.pbest.solution < gbest.solution) {
            gbest = this.pbest;
        }
        //-----------------------------------------------------------------------------

        this.getNextPosition_clerc();

        return gbest;
    }

    getNextPosition_bratton() {
        // v(t+1) = w.v(t) + c1.r1.(pbest - x(t)) + c2.r2.(gbest - x(t))
        // x(t+1) = x(t) + v(t+1)

        let nextPosition    = [];
        let inertia         = config.pso.inertia;
        let accelp          = config.pso.accelP;
        let accelg          = config.pso.accelG;

        for (let i = 0; i < config.dimensions; i++) {
            let rp = Math.random();
            let rg = Math.random();

            let inertialComponent     = inertia * this.velocity[i];
            let cognitiveComponent    = accelp * rp * (this.pbest.position[i] - this.position[i]);
            let socialComponent       = accelg * rg * (gbest.position[i] - this.position[i]);

            let nextVelocity = inertialComponent + cognitiveComponent + socialComponent;
            this.velocity[i] = nextVelocity;

            let component = this.position[i] + nextVelocity;

            nextPosition.push(component);
        }

        this.position = nextPosition;
    }

    getNextPosition_clerc() {
        // v(t+1) = X.[ v(t) + c1.r1.(pbest - x(t)) + c2.r2.(gbest - x(t)) ]
        // Ω = c1 + c2
        // X = 2 / |2 - Ω - sqrt(Ω^2-4Ω)|
        // x(t+1) = x(t) + v(t+1)

        let nextPosition    = [];
        let accelp          = config.pso.accelP;
        let accelg          = config.pso.accelG;

        let ohm = accelp + accelg;
        let chi = 2 / Math.abs(2 - ohm - Math.sqrt(Math.pow(ohm, 2) - 4 * ohm));

        for (let i = 0; i < config.dimensions; i++) {
            let rp = Math.random();
            let rg = Math.random();

            let inertialComponent     = this.velocity[i];
            let cognitiveComponent    = accelp * rp * (this.pbest.position[i] - this.position[i]);
            let socialComponent       = accelg * rg * (gbest.position[i] - this.position[i]);

            let nextVelocity    = inertialComponent + cognitiveComponent + socialComponent;
            nextVelocity        = chi * nextVelocity;
            this.velocity[i]    = nextVelocity;

            let component = this.position[i] + nextVelocity;

            nextPosition.push(component);
        }

        this.position = nextPosition;
    }

    static clear() {
        gbest = {
            solution: NaN,
            position: [NaN, NaN]
        };
    }

    static getGbest() {
        return gbest;
    }
}

module.exports = Particle;
