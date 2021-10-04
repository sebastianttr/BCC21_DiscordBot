const Discord = require("discord.js");
const fs = require("fs");
const date = require('date-and-time');
require('dotenv').config();

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

const DATA_FILE_PATH = "./data/";
let birthdayConfig = {};

client.once("ready", async() => {
    console.log("Script started!")
    loadBirthdayConfig(() => {
        const today = new Date();
        for(let guild of (Object.keys(birthdayConfig))){
            const channel = client.channels.cache.get(birthdayConfig[guild]["channel"]);
            for(let uid of (Object.keys(birthdayConfig[guild]["birthdays"]))){
                let bday = new Date(birthdayConfig[guild]["birthdays"][uid]);
                if (today.getDate() == bday.getDate() && today.getMonth() == bday.getMonth()){
                    const guildObj = client.guilds.cache.get(guild);
                    const member = guildObj.members.cache.get(uid)
                    const nickname = member.displayName;
                    channel.send(`Hey ${nickname} it's your birthday! We wish you all the best!`)
                        .then(message => console.log(`Sent message: ${message.content}`))
                        .catch(console.error);
                }
            }
        }
    });
    setTimeout(function () {
        process.exit(0);
    }, 10000);
});

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

client.login(token); 