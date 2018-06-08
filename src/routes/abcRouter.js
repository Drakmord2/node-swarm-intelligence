
// Modules
const express       = require('express');
const bodyParser    = require('body-parser');
const _             = require('underscore');
const ABC           = require('../controller/abcController');
const Controller    = new ABC();

_.bindAll(Controller, 'optimize', 'optimize_stats');

// Router
const abcRouter = express.Router();
abcRouter.use(bodyParser.json());

// Routes
abcRouter.route('/')
    .all((req, res, next) => {
        cors(res);

        next();
    })
    .options((req, res, next) => {
        res.end();
    })
    .post(Controller.optimize);

abcRouter.route('/stats')
    .all((req, res, next) => {
        cors(res);

        next();
    })
    .options((req, res, next) => {
        res.end();
    })
    .post(Controller.optimize_stats);

function cors(res) {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
}

module.exports = abcRouter;
