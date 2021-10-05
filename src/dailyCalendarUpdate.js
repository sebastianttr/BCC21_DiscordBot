const { Console } = require('console');
const https = require('https');
const ical = require('node-ical');

const today = new Date();
today.setUTCHours(4,0,0,0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

let groupACalender = null;
let groupBCalender = null;
let groupACalenderDone = false;
let groupBCalenderDone = false;

let groupAEvents = null;
let groupBEvents = null;

const groupARequest = https.get("https://cis.fhstp.ac.at/addons/STPCore/cis/meincis/cal.php?tiny=stp60c9a6d405be7", function(response) {
    response.on('data', function(body){
        if (groupACalender == null) {
            groupACalender = body;
        } else {
            groupACalender += body;
        }
    });
    response.on('end', function() {
        groupACalenderDone = true;
        console.log("Calendar A done!")
        printCalenders();
    });
});

const groupBRequest = https.get("https://cis.fhstp.ac.at/addons/STPCore/cis/meincis/cal.php?tiny=stp60c9a6d8a4207", function(response) {
    response.on('data', function(body){
        if (groupBCalender == null) {
            groupBCalender = body;
        } else {
            groupBCalender += body;
        }
    });
    response.on('end', function() {
        groupBCalenderDone = true;
        console.log("Calendar B done!")
        printCalenders();
    });
});

function parseICS(){
    groupAEvents = ical.sync.parseICS(groupACalender);
    groupBEvents = ical.sync.parseICS(groupBCalender);

    for (k of Object.keys(groupAEvents)){
        if(groupAEvents[k].start != undefined){
           const day  = groupAEvents[k].start.getDate();
           const month = groupAEvents[k].start.getMonth();
           const year = groupAEvents[k].start.getFullYear();

           if (day == tomorrow.getDate() && month == tomorrow.getMonth() && year == tomorrow.getFullYear()){
               console.log(groupAEvents[k]);
           }
        }
    }
}

function bothCalendersLoaded() {
    return groupACalenderDone && groupBCalenderDone;
}

function printCalenders() {
    if (bothCalendersLoaded()) {
        parseICS();
    }
};