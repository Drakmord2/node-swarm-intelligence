# NodeJS Swarm Intelligence
NodeJS implementation of Swarm Intelligence algorithms with visualization

## Swarm Intelligence
Swarm intelligence (SI) is the collective behavior of decentralized, 
self-organized systems, natural or artificial.
SI systems consist typically of a population of simple agents or boids 
interacting locally with one another and with their environment. 
The inspiration often comes from nature, especially biological systems.

## Algorithms
- **Particle Swarm Optimization** ([PSO](https://en.wikipedia.org/wiki/Particle_swarm_optimization))
  
- **Fish School Search** ([FSS](https://en.wikipedia.org/wiki/Fish_School_Search))

- **Artificial Bee Colony** ([ABC](https://en.wikipedia.org/wiki/Artificial_bee_colony_algorithm))
  
## How to use
The quickest way to get started is by starting a [Docker](https://www.docker.com/what-docker) 
container with docker-compose.

```bash
$> docker-compose up --build
```

After setting up you can use this software in two ways:

- **Web Interface**
  - Just type ```http://localhost:8181``` on your browser and you're good to go.

![Web Interface](https://github.com/Drakmord2/node-swarm-intelligence/blob/master/src/public/images/main.png)

- **REST API**
  - Using a tool like [Postman](https://www.getpostman.com/) you can send requests to the NodeJS server and get
the raw data for the web interface or the simplified data for convergence graphs.

  - **Routes**
    - ```POST /pso /fss /abc```
    - ```POST /pso/stats /fss/stats /abc/stats```
