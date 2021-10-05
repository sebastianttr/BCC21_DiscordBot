const https = require('https');

let groupACalender = null;
let groupBCalender = null;
let groupACalenderDone = false;
let groupBCalenderDone = false;

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
        printCalenders();
    });
});

function bothCalendersLoaded() {
    return groupACalenderDone && groupBCalenderDone;
}

function printCalenders() {
    if (bothCalendersLoaded()) {
        console.log(groupACalender);
        console.log(groupBCalender);
    }
};