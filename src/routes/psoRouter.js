
// Modules
const express       = require('express');
const bodyParser    = require('body-parser');
const psoCtrl       = require('../controller/psoController');

// Router
const psoRouter = express.Router();
psoRouter.use(bodyParser.json());

// Routes
psoRouter.route('/')
    .all((req, res, next) => {
        cors(res);

        next();
    })
    .options((req, res, next) => {
        res.end();
    })
    .post(psoCtrl.optimize);

psoRouter.route('/stats')
    .all((req, res, next) => {
        cors(res);

        next();
    })
    .options((req, res, next) => {
        res.end();
    })
    .post(psoCtrl.optimize_stats);

function cors(res) {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
}

module.exports = psoRouter;
