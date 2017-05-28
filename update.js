'use strict';

var promise = require('bluebird');
var fs = promise.promisifyAll(require('fs'));
var db = require('./db.js');

let fileName = process.argv.length > 2 ? process.argv[2] : 'data.csv';

let csvPromise = fs.readFileAsync(fileName,'utf8');

csvPromise.then(processDataFile,fileError);

function processDataFile(data) {
  let headers = [];
  let rows = [];

  if(data) {
    data = data.trim();
    // Assume valid format for simplicity
    let tokens = data.split('\r\n');
    headers = tokens[0].split(',');
    rows = tokens.slice(1);

    db.updateCustomerData(rows);
  }
}

function fileError() {
  console.log(arguments);
}
