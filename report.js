'use strict';

var db = require('./db.js');

let month = new Date().getMonth()+1;
let year = new Date().getFullYear();

if(process.argv.length > 3) {
  month = process.argv[2];
  year = process.argv[3];
}

var generateReport = function(month,year) {

  db.getReportData(month,year, (rows) => {
    let totalBilled = 0;
    let totalGenerated = 0;

    rows.forEach((r) => {
      if(r['email_sent']) {
        totalGenerated++;
        totalBilled += r['amount_due'];
      }
    });

    console.log('------');
    console.log('Report for ' + month + '/' + year);
    console.log('Total Bills Generated and Sent: ' + totalGenerated);
    console.log('Total Amount Billed: $' + totalBilled);
    console.log('------');
  });
}

generateReport(month,year);
