
const config        = require('../config');
const mathjs        = require('mathjs');
const Bee           = require('./bee');
const dimensions    = config.dimensions;

class EmployeeBee extends Bee {
    constructor() {
        super();
        this.type = "employee";
    }

}
