const DATA_FILE_PATH = './data/';

const Discord = require("discord.js");
const fs = require("fs");
require('dotenv').config();

const express = require('express')
const app = express()

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

let BIRTHDAY_CHANNEL_IDS = {};

function loadBirthdayChannelIDs() {
    fs.readFile(DATA_FILE_PATH + "birthdayChannelIds.json", 'utf-8', (err, data) => {
        if (err) {
            console.error(`Error reading birthdayChannelIds.json from disk: ${err})`);
        } else {
            BIRTHDAY_CHANNEL_IDS = JSON.parse(data);
            console.log(BIRTHDAY_CHANNEL_IDS);
        }
    });
}

function saveBirthdayChannelIDs() {
    const data = JSON.stringify(BIRTHDAY_CHANNEL_IDS);

    fs.writeFile(DATA_FILE_PATH + "birthdayChannelIds.json", data, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Updated birthdayChannelIds.json");
        }
    })
}

/********************************** Discord Stuff **********************************/
client.once("ready", () => {
    console.log("Loading BirthdayChannelIDs.");
    loadBirthdayChannelIDs();
    console.log("Bot is ready.");
});


client.on("message", message => { // runs whenever a message is sent
    if (message.content.startsWith("/birthdaySelectChannel")) {
        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const channelName = message.channel.name;
        BIRTHDAY_CHANNEL_IDS[guildId] = channelId;
        console.log(`Set channel ID for server ${guildId} to ${channelId}`);
        channel = client.channels.cache.get(channelId);
        channel.send(`Okay ${channelName} is now the new channel for birthday messages!`);
        saveBirthdayChannelIDs();
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