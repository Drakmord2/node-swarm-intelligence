
// Modules
const express       = require('express');
const bodyParser    = require('body-parser');
const fssCtrl       = require('../controller/fssController');

// Router
const fssRouter = express.Router();
fssRouter.use(bodyParser.json());

// Routes
fssRouter.route('/')
    .all((req, res, next) => {
        cors(res);

        next();
    })
    .options((req, res, next) => {
        res.end();
    })
    .post(fssCtrl.optimize);

fssRouter.route('/stats')
    .all((req, res, next) => {
        cors(res);

        next();
    })
    .options((req, res, next) => {
        res.end();
    })
    .post(fssCtrl.optimize_stats);

function cors(res) {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
}

module.exports = fssRouter;
