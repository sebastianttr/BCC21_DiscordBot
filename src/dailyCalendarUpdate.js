const https = require('https');
const ical = require('node-ical');
const fs = require("fs");
const Discord = require("discord.js");

require('dotenv').config();

const DATA_FILE_PATH = "./data/";

let today = new Date();
today.setUTCHours(4,0,0,0);
let tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

let groupACalender = null;
let groupBCalender = null;
let groupACalenderDone = false;
let groupBCalenderDone = false;

let groupAEvents = null;
let groupBEvents = null;

let calendarConfig = null;

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

function getLectureName(lectureInfo){
    return lectureInfo.substring(lectureInfo.indexOf("Bezeichnung: ")+13,lectureInfo.indexOf("\nLehrfach:"))
}

function getCourseColor(lectureInfo){
    let lectureName = getLectureName(lectureInfo);
    switch(lectureName){
      case "Client-Side Coding":
        return "#B1D4BF"
      case "Game Design and Digital Storytelling":
        return "#F8DCB3"
      case "2D Game Mathematics and Physics":
        return "#ABDDE2"
      case "Graphics Design":
        return "#D2C6E3"
      case "Agile Software Life Cycle Management":
        return "#D1B4A4"
      case "2D Game Graphics":
        return "#97B5E1"
      case "2D Browser Game Coding":
        return "#E3E79A"
      case "Introduction to Web Technologies":
        return "#FCD0E9"
      case "Design Thinking":
        return "#F4B0AD"
      default:
        return "#384045"
    }
}

function loadICS(){
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
}

function sendingDone(){
    return sendingADone && sendingBDone;
}

function exitProgram(){
    if ( sendingDone() ) {
        process.exit(0);
    }
}

function loadConfig(_callback) {
    fs.readFile(DATA_FILE_PATH + "calendar.json", 'utf-8', (err, data) => {
        if (err) {
            console.error(`Error reading calendar.json from disk: ${err})`);
            process.exit(1);
        } else {
            calendarConfig = JSON.parse(data);
            console.log(calendarConfig);
            _callback();
        }
    });
}

function sendMessages(collection, channelId) {
    console.log("Send to channel: " + channelId);
    const channel = client.channels.cache.get(channelId);
    console.log(collection);
    if (collection.length == 0) {
        channel.send("Good news! You don't have any events planned for today.");
    } else {
        channel.send("Good morning! You have upcoming event(s) today. I prepared your shedule.");
        for (ev of collection){
            const embed = new Discord.MessageEmbed()
                .setColor(getCourseColor(ev.description))
                .setTitle(ev.summary)
                .setDescription(ev.description)
                .addFields(
                    { name: "Location", value: ev.location },
                    { name: "start", value: ev.start.toLocaleTimeString(),inline: true },
                    { name: "end", value: ev.end.toLocaleTimeString(),inline: true },
                );
            console.log(embed);
            channel.send(embed);
        }
    }
}

function parseICS(){
    groupAEvents = ical.sync.parseICS(groupACalender);
    groupBEvents = ical.sync.parseICS(groupBCalender);

    groupAEventCollection = [];
    groupBEventCollection = [];

    for (k of Object.keys(groupAEvents)){
        if(groupAEvents[k].start != undefined){
           const day  = groupAEvents[k].start.getDate();
           const month = groupAEvents[k].start.getMonth();
           const year = groupAEvents[k].start.getFullYear();

           if (day == today.getDate() && month == today.getMonth() && year == today.getFullYear()){
               groupAEventCollection.push(groupAEvents[k]);
           }
        }
    }

    for (k of Object.keys(groupBEvents)){
        if(groupBEvents[k].start != undefined){
           const day  = groupBEvents[k].start.getDate();
           const month = groupBEvents[k].start.getMonth();
           const year = groupBEvents[k].start.getFullYear();

           if (day == today.getDate() && month == today.getMonth() && year == today.getFullYear()){
               groupBEventCollection.push(groupBEvents[k]);
           }
        }
    }

    sendMessages(groupAEventCollection, calendarConfig["groupAChannel"]);
    sendMessages(groupBEventCollection, calendarConfig["groupBChannel"]);
}

function bothCalendersLoaded() {
    return groupACalenderDone && groupBCalenderDone;
}

function printCalenders() {
    if (bothCalendersLoaded()) {
        parseICS();
    }
}

client.once("ready", async() => {
    loadConfig(loadICS);

    setTimeout(function () {
        process.exit(0);
    }, 10000);
});

client.login(token);
