'use strict';

/*
  Known issues:
  - customerData is not properly reflecting updates to billinfo (ran out of time to debug)
  - Monthly report shows 0 due to above bug

  To Do:
  - Fix ugly email template replace hack for billinfo (model changed after writing)
  - Move email template loading to a different location
  - Remove default function call flow and add command-line params for generating bill, reports, etc
  - Refactor data model and persistence (misread one of the requirements and didn't have time to go back)
*/

var fs = require('fs');

const API_BASE_URL = 'http://api.acme.fake/due/';//{UUID}/{MONTH}/{YEAR}';

var customerData = {};

fs.readFile('customerData.json','utf8', (err, data) => {
  customerData = JSON.parse(data);
  processDataFile('data.csv');
});


function processDataFile(fileName) {
  fs.readFile(fileName,'utf8', (err,data) => {
    let headers = [];
    let rows = [];

    if(data) {
      // Assume valid format for simplicity
      let tokens = data.split('\n');
      headers = tokens[0].split(',');
      for(let i = 1; i < tokens.length; i++) {
        if(tokens[i]) {
          let row = tokens[i].split(',');
          let dataObj = {};
          // Reduce array of values to customer object
          let custObj = row.reduce((result,curVal,curIndex,arr) => {
              result[headers[curIndex]] = curVal;
              return result;
          },{});

          rows.push(custObj);
        }
      }
    }
    else {
      console.log('Error loading data CSV: ' + err);
    }
    updateCustomerData(rows);
    generateBill('A2B4G60','05','2017');
    generateReport('05','2017');
    saveData();
  });
}

function updateCustomerData(newCustomerData) {
  if(newCustomerData) {
    for(let i = 0; i < newCustomerData.length; i++) {
      var uuid = newCustomerData[i]['uuid'];
      for(var prop in newCustomerData[i]) {
        if(customerData[uuid]) {
          customerData[uuid][prop] = newCustomerData[i][prop];
        }
        else {
          customerData[uuid] = newCustomerData[i];
          customerData[uuid]['billinfo'] = {};
        }

      }
    };
  }
}

function generateBill(uuid,month,year) {
  let template = '';
  fs.readFile('email-template','utf-8', (err,data) => {
    if(data) {
      template = data;
      for(var uuid in customerData) {
            let resp = generateFakeApiResponse(API_BASE_URL + uuid + '/' + month + '/' + year);
            if(resp && resp['amount_due']) {

              let selectedCustomer = customerData[uuid];
              let dateStr = month + '-' + year;
              //console.log(selectedCustomer);
              if(selectedCustomer['billinfo'][dateStr] && !selectedCustomer['billinfo'][dateStr]['generated']) {
                selectedCustomer['billinfo'][dateStr]['amount_due'] = resp['amount_due'];
                selectedCustomer['billinfo'][dateStr]['generated'] = true;
              }
              else {
                selectedCustomer['billinfo'][dateStr] = { 'amount_due' : resp['amount_due'], 'email_sent': false, 'generated': true };
              }

              customerData[uuid] = selectedCustomer;

              sendEmail(selectedCustomer, month, year, template);
            }
            else {
              console.log("Error hitting API for UUID: " + uuid + ". No bill has been generated.");
            }
        }
    }
    else {
      console.log('Error loading email template: ' + err);
    }
  });
}

function generateReport(month,year) {
  let totalBilled = 0;
  let totalGenerated = 0;
  let dateStr = month + '-' + year;

  for(var uuid in customerData) {
    if(customerData[uuid] && customerData[uuid]['billinfo'] && customerData[uuid]['billinfo'][dateStr]) {
      if(customerData[uuid]['billinfo'][dateStr]['generated'] && customerData[uuid]['billinfo'][dateStr]['email_sent']) {
        totalGenerated++;
        totalBilled += Number(customerData[uuid]['billinfo'][dateStr]['amount_due']);
      }
    }
  }
  console.log('------');
  console.log('Report for ' + dateStr);
  console.log('Total Bills Generated and Sent: ' + totalGenerated);
  console.log('Total Amount Billed: $' + totalBilled);
  console.log('------');
}

function sendEmail(customer, month, year, template) {
  let dateStr = month + '-' + year;
  if(!customer['billinfo'][dateStr]['email_sent']) {
    var emailText = template.replace(/\{\w+\}/g, (tName) => {
       let dName = tName.replace(/[\{\}]/g,'');
       // TODO: Fix ugly hack
       if(dName == 'amount_due') {
         return customer['billinfo'][dateStr]['amount_due'];
       }
       if(dName == 'bill_month') {
         return dateStr;
       }
       return customer[dName] || tName;
    });

    console.log('Sending email: \n' + emailText);
  }
}

function saveData() {
  fs.writeFile('customerData.json',JSON.stringify(customerData));
}


function generateFakeApiResponse(url) {
  return {'amount_due': (Math.random()*100).toFixed(2)};
}
