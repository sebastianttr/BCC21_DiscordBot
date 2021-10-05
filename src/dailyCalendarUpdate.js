const https = require('https');

let groupACalender = null;
let groupBCalender = null;

const groupARequest = https.get("https://cis.fhstp.ac.at/addons/STPCore/cis/meincis/cal.php?tiny=stp60c9a6d405be7", function(response) {
    response.on('data', function(body){
        groupACalender = body;
        printCalenders();
    });
});

const groupBRequest = https.get("https://cis.fhstp.ac.at/addons/STPCore/cis/meincis/cal.php?tiny=stp60c9a6d8a4207", function(response) {
    response.on('data', function(body){
        groupBCalender = body;
        printCalenders();
    });
});

function bothCalendersLoaded() {
    return groupACalender != null && groupBCalender != null;
}

function printCalenders() {
    if (bothCalendersLoaded()) {
        console.log("GROUP A: " + groupACalender);
        console.log("GROUP B: " + groupBCalender);
    }
}