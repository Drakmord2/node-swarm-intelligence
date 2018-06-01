
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

    res.status(err.status || 500);
    res.send('An error ocurred: '+err);
});

// Export module
module.exports = app;
