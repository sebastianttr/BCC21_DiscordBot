const Discord = require("discord.js");
const fs = require("fs");
const date = require('date-and-time');
require('dotenv').config();

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

const DATA_FILE_PATH = "./data/";
let birthdayConfig = {};

function loadBirthdayConfig(_callback) {
    fs.readFile(DATA_FILE_PATH + "birthday.json", 'utf-8', (err, data) => {
        if (err) {
            console.error(`Error reading birthdays.json from disk: ${err})`);
            process.exit(1);
        } else {
            birthdayConfig = JSON.parse(data);
            _callback();
        }
    });
}

loadBirthdayConfig(() => {
    const today = new Date();
    for(let guild of (Object.keys(birthdayConfig))){
        for(let uid of (Object.keys(birthdayConfig[guild]["birthdays"]))){
            let bday = new Date(birthdayConfig[guild]["birthdays"][uid]);
            if (today.getDate() == bday.getDate() && today.getMonth() == bday.getMonth()){
                console.log("birthday found");
            }
        }
    }
    process.exit(0);
});