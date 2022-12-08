//To retrict th use of javascript language
'use strict';

//Multiple contracts used are imported here
const userContract = require('./contract.js');
const registrarContract = require('./contract1.js');

module.exports.UserContract = userContract;
module.exports.RegistrarContract = registrarContract;


module.exports.contracts = [userContract, registrarContract];

