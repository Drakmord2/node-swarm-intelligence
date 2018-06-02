
const config        = require('../config');
const Particle      = require('../model/particle');
const Controller    = require('./controller');


class PSOController extends Controller {
    
    static optimize (req, res, next) {
        const self          = PSOController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;
    
        Particle.clear();
        let particles = self.generate_particles(num_particles, func_name);

        let positions = [];
        let gbest = {
            solution: NaN,
            position: [NaN, NaN]
        };
    
        for(let i = 0; i < iterations; i++) {
            let auxPos = [];
            particles.forEach((agent, index, particles) => {
                if (i !== 0) {
                    gbest = agent.evaluate();
                }
    
                let posx = agent.position[0];
                let posy = agent.position[1];
    
                let obj = [[posx, posy], gbest];
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

    static generate_particles (amount, func_name) {
        const self      = PSOController;
        let particles   = [];
        let positions   = [];
        let velocities  = [];
        const boundary  = config.boundaries[func_name];

        while (amount > 0) {
            let pos = self.get_vector(boundary);
            if (positions.indexOf(pos) !== -1) {
                continue;
            }

            let vel = self.get_vector(boundary);
            if (velocities.indexOf(vel) !== -1) {
                continue;
            }

            positions.push(pos);
            velocities.push(vel);

            amount--;
        }

        const heuristic = config.heuristics[func_name];

        positions.forEach((pos, index, positions) => {
            let p = new Particle(pos, velocities[index], heuristic, boundary);

            particles.push(p);
        });

        return particles
    }

    static optimize_stats (req, res, next) {
        const self          = PSOController;
        const func_name     = req.body.func_name;
        const num_particles = req.body.num_particles;
        const iterations    = req.body.max_iteration;

        Particle.clear();
        let particles = self.generate_particles(num_particles, func_name);

        let stats = [];
        for(let i = 0; i < iterations; i++) {
            particles.forEach((agent, index, particles) => {
                agent.evaluate();
            });

            let gbest   = Particle.getGbest();
            gbest       = +gbest.solution.toFixed(10);

            stats.push(gbest);
        }

        const data = {
            stats: stats
        };

        res.json(data);
    }
}

module.exports = PSOController;
