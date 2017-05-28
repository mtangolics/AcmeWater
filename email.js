'use strict';

var promise = require('bluebird');
var fs = promise.promisifyAll(require('fs'));

var transmit = function(addr,text) {
  var deliverySuccess = true;

  return deliverySuccess;
}

var sendMail = function(customer, amt, month, year) {

    // Would load template into memory once in real world application
    let template = fs.readFileSync('email-template','utf-8');
    let emailObj = customer;

    emailObj['amount_due'] = amt;
    emailObj['bill_month'] = month + '/' + year;

    var emailText = template.replace(/\{\w+\}/g, (tName) => {
       let dName = tName.replace(/[\{\}]/g,'');
       return emailObj[dName] || tName;
    });

    console.log('Sending email: \n' + emailText);
    return transmit(emailObj['email'],emailText);
}

exports.sendMail = sendMail;
