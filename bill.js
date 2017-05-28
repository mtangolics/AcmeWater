'use strict';

var db = require('./db.js');
var email = require('./email.js');

const API_BASE_URL = 'http://api.acme.fake/due/';

let month = new Date().getMonth()+1;
let year = new Date().getFullYear();

if(process.argv.length > 3) {
  month = process.argv[2];
  year = process.argv[3];
}

var generateFakeApiResponse = function(url) {
  return {'amount_due': (Math.random()*100).toFixed(2)};
}

var generateBills = function(month,year) {
  db.getCustomers((rows) =>
    rows.forEach((r) => generateBill(r,month,year))
  );
}

var generateBill = function(custData,month,year) {
    db.getBillingInfo(custData['uuid'],month,year, (data) => {
      let emailSent = false;
      if(data) {
          emailSent = data['email_sent'] ? true : false;
      }
      if(!emailSent) {
        let resp = generateFakeApiResponse(API_BASE_URL + custData['uuid'] + '/' + month + '/' + year);
        if(resp && resp['amount_due']) {
          let amt = resp['amount_due'];

          let eResult = email.sendMail(custData,amt,month,year) ? Date.now() : 'NULL';
          let generated = Date.now();

          db.updateBilling(custData['uuid'],month,year,amt,eResult,generated);
        }
        else {
          console.log('Error hitting API for UUID: ' + custData['uuid'] + '. No bill has been generated.');
        }
      }
      else {
        console.log('Billing email has already been sent for UUID: ' + custData['uuid']);
      }
    });
}

generateBills(month,year);
