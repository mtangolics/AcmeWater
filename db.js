'use strict';

var sqlite3 = require('sqlite3').verbose();
var sdb = new sqlite3.Database('customerdata.db');

// Note: real prod usage would require sanitizing inputs

var updateCustomers = function(rows) {
  sdb.serialize(() => {
    rows.forEach((val) => {
      val = val.split(',').map((v) => { return '\'' + v + '\''; });
      sdb.exec("INSERT OR REPLACE INTO customers (uuid,name,email,address,city,state,zip) values (" + val + ")");
    });
  });

  sdb.close();
}

var updateBilling = function(uuid,mo,yr,amt,email,gen) {
  let key = uuid + '-' + mo + '-' + yr;
  sdb.serialize(() => {
    let parms = [uuid,mo,yr,amt,email,gen,key].map((v) => { return '\'' + v + '\''; });
    sdb.exec("INSERT OR REPLACE INTO billing (uuid,month,year,amount_due,email_sent,generated,key) values (" + parms + ")");
  });
}

var getBillingInfo = function(uuid,mo,yr,cb) {
  let key = uuid + '-' + mo + '-' + yr;
  sdb.serialize(() => {
    sdb.get("SELECT * FROM billing WHERE key='" + key + "'",function(err,row) {
      cb(row);
    });
  });
}

var getCustomers = function(cb) {
  sdb.serialize(() => {
    sdb.all("SELECT * FROM customers",function(err,rows) {
      cb(rows);
    });
  });
}

var getReportData = function(mo,yr,cb) {
  sdb.serialize(() => {
    sdb.all("SELECT * FROM billing WHERE month=" + mo + " and year=" + yr,function(err,rows) {
      cb(rows);
    });
  });
}


exports.updateCustomerData = updateCustomers;
exports.updateBilling = updateBilling;
exports.getCustomers = getCustomers;
exports.getBillingInfo = getBillingInfo;
exports.getReportData = getReportData;
