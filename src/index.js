const Discord = require("discord.js");
const fs = require("fs");
const axios = require("axios")
var buffer = require('buffer/').Buffer;
const GuildService = require('./Services/GuildService');
const AuthenticationService = require("./Services/AuthenticationService");

const date = require('date-and-time');
var bodyParser = require('body-parser');

require('dotenv').config();

const express = require('express');
const moment = require("moment");
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

const guildService = new GuildService();
const authenticationService = new AuthenticationService();

let roles = [];
let members = [];
let birthdayConfig = {};

const DATA_FILE_PATH = "./data/";


/********************************** Functions & Helpers **********************************/


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

async function loadGuildData() {
    roles = await guildService.fetchGuildRoles();
    members = await guildService.fetchGuildMembers();
    //console.log("These are the roles of our BCC guild:")


    try {
        roles.forEach(item => {
            console.log(`${JSON.stringify(item)}`)
        });

        var members1 = members.map(users => users.user.username)

        console.log(members1)
            //console.log(members)
    } catch (e) {
        console.log("Error!")
    }

}

function replaceIdByRoleNames(userRoles) {

    var names = []
    userRoles.forEach(role => {
        names.push(getRoleById(role))
    })

    return names
}

function getRoleById(id) {
    var role = roles.filter(item => {
        return item.id == id;
    })

    return {
        name: role[0].name,
        color: role[0].color.toString(16)
    }
}


/********************************** Discord Stuff **********************************/

client.once("ready", async() => {
    console.log("Loading birthday config.");
    loadBirthdayConfig();
    await loadGuildData();
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
            channel.send(`I am sorry ${nickname}. I didn't understand that, please give me your birthday in DD.MM.YYYY format!`);
        }
    }
});

/********************************** HTTP Endpoints **********************************/

app.get('/', async(request, response) => {
    if (request.query.code != undefined) {
        try {
            const oauthData = await authenticationService.exchangeCodeForToken(request)
            const userData = await authenticationService.fetchUserData(oauthData.access_token)

            let sessionUsername = await userData.username
            let res

            members.every(item => {
                console.log(item)

                if (item.user.username == sessionUsername) {

                    //console.log(JSON.stringify(replaceIdByRoleNames(item.roles)))

                    res = {
                        username: item.user.username,
                        id: item.user.id,
                        roles: replaceIdByRoleNames(item.roles),
                        birthday: "01.01.1970",
                        avatarURL: "https://cdn.discordapp.com/avatars/" + item.user.id + "/" + item.user.avatar + ".png",
                        access_token: oauthData.access_token,
                        refresh_token: oauthData.refresh_token
                    }

                    return false
                } else {
                    res = {
                        error: "user not in Creative Computing channel"
                    }
                    return true
                }
            })

            response.status(301).redirect("http://localhost:8080/?userdata=" + buffer.from(JSON.stringify(res)).toString('base64'))
        } catch (e) {
            console.error(e);
        }

    }
});

app.get('/send', (req, res) => {
    console.log("Birthday Channel ID: " + birthdayChannelID)
    client.channels.cache.get(birthdayChannelID).send("Happy Birthday Sebastian. We wish you all the best.")
    res.send('Sending birthday congratulations.')
})

app.get('/notify', (req, res) => {
    const notification = req.query.text
    res.send("Notified the channels.")
})

app.post('/setBirthdate', async(req, res) => {
    //console.log(req.body)

    var userData = JSON.parse(buffer.from(req.body.userdata, 'base64').toString('ascii'));

    //console.log(userData)

    var userCheck = await authenticationService.checkUser(userData);
    //console.log((userCheck) ? "User is authorised. " : "User is not authorised.")

    var allBirthdayGuilds = Object.keys(birthdayConfig)
        //console.log(JSON.stringify(allBirthdayGuilds))

    allBirthdayGuilds.forEach(item => {
        birthdayConfig[item][userData.id] = userData.birthday;
    })

    saveBirthdayConfig();

    res.send(`Thank you ${userData.username}. I'll write that down and remember!`)
})

app.post('/notify', (req, res) => {
    var userData = JSON.parse(buffer.from(req.body.userdata, 'base64').toString('ascii'));

    var userCheck = await authenticationService.checkUser(userData);
    console.log((userCheck) ? "User is authorised. " : "User is not authorised.")

    client.channels.cache.get("893508171061145690").send("AUTO NOTIFICATION: " + notification);

    res.send(`Thank you ${userData.username}. Broadcasting to everyone.`)
})

/************************************* Startups *************************************/


client.login(token); // starts the bot up

app.listen(8084, () => {
    console.log(`Bot has started listening for requests at http://localhost:8084`)
})