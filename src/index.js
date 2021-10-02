const Discord = require("discord.js");
const fs = require("fs");
const date = require('date-and-time');
require('dotenv').config();

const express = require('express');
const moment = require("moment");
const app = express()

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

const DATA_FILE_PATH = "./data/";

let birthdayConfig = {};

function loadBirthdayConfig() {
    fs.readFile(DATA_FILE_PATH + "birthday.json", 'utf-8', (err, data) => {
        if (err) {
            console.error(`Error reading birthdays.json from disk: ${err})`);
        } else {
            birthdayConfig = JSON.parse(data);
            console.log(birthdayConfig);
        }
    });
}

function saveBirthdayConfig() {
    const data = JSON.stringify(birthdayConfig);

    fs.writeFile(DATA_FILE_PATH + "birthday.json", data, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Updated birthday.json");
        }
    })
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/********************************** Discord Stuff **********************************/
client.once("ready", () => {
    console.log("Loading birthday config.");
    loadBirthdayConfig();
    console.log("Bot is ready.");
});

var birthdayChannelID = ""

client.on("message", message => { // runs whenever a message is sent
    if (message.content.startsWith("/birthdaySelectChannel")) {
        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const channelName = message.channel.name;
        birthdayConfig[guildId] = { channel: channelId };
        console.log(`Set channel ID for server ${guildId} to ${channelId}`);
        const channel = client.channels.cache.get(channelId);
        channel.send(`Okay ${channelName} is now the new channel for birthday messages!`);
        saveBirthdayConfig();
    } else if (message.content.startsWith("/birthday ")) {
        let dateString = message.content.replace("/birthday ", "");
        dateString = replaceAll(dateString, ".", "-");
        const parsedDate = date.parse(dateString, "DD-MM-YYYY", true);
        const channel = client.channels.cache.get(message.channel.id);
        const guild = client.guilds.cache.get(message.guild.id);
        const member = guild.members.cache.get(message.author.id);
        const nickname = member.displayName;
        if (!isNaN(parsedDate)) {
            birthdayConfig[message.guild.id][message.author.id] = parsedDate;
            saveBirthdayConfig();
            channel.send(`Thank you ${nickname}. I'll write that down and remember!`);
        } else {
            channel.send(`I am sorry ${nickname}. I didn't understand that, please give me your birthday in \`DD.MM.YYYY\` format!`);
        }
    }
});

/********************************** HTTP Endpoints **********************************/

app.get('/send', (req, res) => {
    console.log("Birthday Channel ID: " + birthdayChannelID)
    client.channels.cache.get(birthdayChannelID).send("Happy Birthday Sebastian. We wish you all the best.")
    res.send('Sending birthday congratulations.')
})

app.get('/notify', (req, res) => {
    const notification = req.query.text
    client.channels.cache.get(birthdayChannelID).send("AUTO NOTIFICATION: " + notification);
    res.send("Notified the channels.")
})

/************************************* Startups *************************************/


client.login(token); // starts the bot up

app.listen(8080, () => {
    console.log(`Bot has started listening for requests at http://localhost:8080`)
})