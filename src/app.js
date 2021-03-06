
// Modules
const express       = require('express');
const path          = require('path');
const favicon       = require('serve-favicon');
const logger        = require('morgan');
const bodyParser    = require('body-parser');

// Global Settings
const config = require('./config');

// Routers
const index = require('./routes/index');
const pso   = require('./routes/psoRouter');
const fss   = require('./routes/fssRouter');
const abc   = require('./routes/abcRouter');

// Application
const app = express();

// App Middlewares
app.use( favicon( path.join(__dirname, 'public', 'favicon.ico')));
app.use( logger('dev'));
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({ extended: false }));
app.use( express.static( path.join(__dirname, 'public')));

// Mount Routes
app.use('/', index);
app.use('/pso', pso);
app.use('/fss', fss);
app.use('/abc', abc);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err     = new Error('Not Found');
    err.status    = 404;

    next(err);
});

// Error handler
app.use(function(err, req, res, next) {
    res.locals.message    = err.message;
    res.locals.error      = req.app.get('env') === 'development' ? err : {};
    let json              = JSON.stringify({error: err.message});

    console.error(err);

    res.status(err.status || 500);
    res.send(json);
});

// Export module
module.exports = app;
