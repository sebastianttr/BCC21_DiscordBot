const Discord = require("discord.js");
require('dotenv').config()

const express = require('express')
const app = express()

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;


/********************************** Discord Stuff **********************************/


client.once("ready", () => {
    console.log("Bot is ready.");
});

let birthdayChannelID = 

client.on("message", message => { // runs whenever a message is sent
    if (message.content.startsWith("/birthdaySelectChannel")) {
        birthdayChannelID = message.channel.id
        console.log(birthdayChannelID)
        message.channel.send("Birthday channel selected succesfully. ")
    } else if (message.content.startsWith("/birthday")) {
        if (birthdayChannelID != "") {
            console.log(JSON.stringify(message))
            let content = message.content
            const name = message.content.substring(
                content.indexOf(" "),
                content.indexOf(":"),
            )
            message.channel.send(`Ok, ${name}, I'll note that down, Thank You. `); // sends a message to the channel with the number
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

app.listen(8080, () => {
    console.log(`Bot has started listening for requests at http://localhost:8080`)
})