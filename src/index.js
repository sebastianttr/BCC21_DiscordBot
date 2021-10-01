const Discord = require("discord.js"); // imports the discord library
const fs = require("fs"); // imports the file io library
const express = require('express')
const app = express()

const client = new Discord.Client(); // creates a discord client
const token = " "; // gets your token from the file



/********************************** Discord Stuff **********************************/


client.once("ready", () => { // prints "Ready!" to the console once the bot is online
    console.log("Ready!");
});

var birthdayChannelID = ""

client.on("message", message => { // runs whenever a message is sent
    if (message.content.startsWith("/birthdaySelectChannel")) {
        birthdayChannelID = message.channel.id
        console.log(birthdayChannelID)
        message.channel.send("Birthday channel selected succesfully. ")
    } else if (message.content.startsWith("/birthday")) { // checks if the message says "?random"
        if (birthdayChannelID != "") {
            console.log(JSON.stringify(message))
            var content = message.content
            const name = message.content.substring(
                content.indexOf(" "),
                content.indexOf(":"),
            )
            message.channel.send(`Ok, ${name}, i'll note that down, Thank You. `); // sends a message to the channel with the number
        } else {
            message.channel.send("You forgot to select a birthday channel. Go to your channel and type   /birthdaySelectChannel ")
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

app.listen(80, () => {
    console.log(`Example app listening at http://localhost`)
})