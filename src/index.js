const Discord = require("discord.js");
const fs = require("fs");
const axios = require("axios")
const buffer = require('buffer/').Buffer;
const GuildService = require('./Services/GuildService');
const AuthenticationService = require("./Services/AuthenticationService");
const ical = require('node-ical');
const dirTree = require('directory-tree');
const date = require('date-and-time');
const bodyParser = require('body-parser');

require('dotenv').config();

const express = require('express');
const cors = require('cors')
const moment = require("moment");
const { res } = require("date-and-time");
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const client = new Discord.Client();
const token = process.env.CLIENT_TOKEN;

let guildService = new GuildService();
let authenticationService = new AuthenticationService();

let birthdayConfig = {};

const DATA_FILE_PATH = "./data/";

const openEndpoints = ['/', '/test', '/getAllChannels', '/getDailyCalendar', '/getCalendar', '/getFileSystemStructure', '/getFile']


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

    /*
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
    */

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
        if (typeof birthdayConfig[guildId] == "undefined") {
            birthdayConfig[guildId] = { channel: channelId };
        } else {
            birthdayConfig[guildId]["channel"] = channelId;
        }
        if (typeof birthdayConfig[guildId]["birthdays"] == "undefined") {
            birthdayConfig[guildId]["birthdays"] = {};
        }
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
            birthdayConfig[message.guild.id]["birthdays"][message.author.id] = parsedDate;
            console.log(message.author.id)
            saveBirthdayConfig();
            channel.send(`Thank you ${nickname}. I'll write that down and remember!`);
        } else {
            channel.send(`I am sorry ${nickname}. I didn't understand that, please give me your birthday in \`DD.MM.YYYY\` format!`);
        }
    }
});

/********************************** HTTP Endpoints **********************************/

app.use(express.json());
app.use(cors())

app.set('trust proxy', true)
app.disable('x-powered-by');

//Auth interceptor
app.use(async(req, res, next) => {

    if (openEndpoints.includes(req.path))
        next();
    else {
        const userData = JSON.parse(buffer.from(req.body.userdata, 'base64').toString('ascii'));
        const userCheck = await authenticationService.checkUser(userData);

        if (userCheck) {
            //console.log("User authenticated.")
            next();
        } else {
            //console.log("User authenticated.")
            res.sendStatus(401)
        }
    }

});


app.get('/', async(request, response) => {

    console.log(request.connection.remoteAddress +
        ":" + request.connection.remotePort)

    if (request.query.code != undefined) {
        try {
            const oauthData = await authenticationService.exchangeCodeForToken(request)
            const userData = await authenticationService.fetchUserData(oauthData.access_token)

            let sessionUsername = await userData.username
            let res

            members.every(item => {
                //console.log(item)

                let guildID = Object.keys(birthdayConfig)[0]

                if (item.user.username == sessionUsername) {

                    //console.log(JSON.stringify(replaceIdByRoleNames(item.roles)))

                    res = {
                        username: item.user.username,
                        id: item.user.id,
                        roles: replaceIdByRoleNames(item.roles),
                        birthday:
                            (birthdayConfig[guildID].birthdays[item.user.id] == undefined) ?
                            "1970-01-01T00:00:00.000Z" : birthdayConfig[guildID].birthdays[item.user.id],
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

            response.status(301).redirect(`${process.env.REDIRECT_URI}?userdata=${buffer.from(JSON.stringify(res)).toString('base64')}`)
        } catch (e) {
            console.error(e);
        }

    }
});

app.post('/setBirthdate', (req, res) => {
    const userData = JSON.parse(buffer.from(req.body.userdata, 'base64').toString('ascii'));

    var allBirthdayGuilds = Object.keys(birthdayConfig)

    allBirthdayGuilds.forEach(item => {
        birthdayConfig[item].birthdays[userData.id] = userData.birthday;
    })

    saveBirthdayConfig();

    res.send(`Thank you ${userData.username}. I'll write that down and remember!`)

})

app.post('/notify', (req, res) => {
    const userData = JSON.parse(buffer.from(req.body.userdata, 'base64').toString('ascii'));
    const text = req.body.text;


    client.channels.cache.get(req.body.channelId).send("BCC Bot Announcement: " + text)
    res.send(`Thank you ${userData.username}. Broadcasting to everyone.`)
})

app.post('/notifyEmbedded', (req, res) => {
    const userData = JSON.parse(buffer.from(req.body.userdata, 'base64').toString('ascii'));

    const messageEmbedded = new Discord.MessageEmbed()
        .setColor('#3ca6a6')
        .setTitle(req.body.title)
        .setDescription(req.body.description)
        .addFields({ name: "Sent by", value: userData.username });

    client.channels.cache.get(req.body.channelId).send(messageEmbedded)
    res.send(`Thank you ${userData.username}. Broadcasting to everyone.`)
})

app.get('/getAllChannels', async(req, res) => {
    const channels = await guildService.fetchGuildChannels();

    var filteredChannels = channels.filter(item => {
        return item.type == 0
    })

    var newMapping = filteredChannels.map(item => {
        return {
            channelName: item.name,
            channelId: item.id
        }
    })

    console.log(newMapping)

    res.send(newMapping)
})

app.get('/getCalendar', async(req, res) => {
    let group = req.query.group
    let type = req.query.type

    let requestData

    if (group == "a") {
        requestData = await makeGetRequest("https://cis.fhstp.ac.at/addons/STPCore/cis/meincis/cal.php?tiny=stp60c9a6d405be7")
            //console.log(requestData)
    } else {
        requestData = await makeGetRequest("https://cis.fhstp.ac.at/addons/STPCore/cis/meincis/cal.php?tiny=stp60c9a6d8a4207")
            //console.log(requestData)
    }

    var course = ical.sync.parseICS(requestData);

    let groupCollection = []

    let today = new Date();
    today.setUTCHours(4, 0, 0, 0);

    for (k of Object.keys(course)) {
        if (course[k].start != undefined) {
            const day = course[k].start.getDate();
            const month = course[k].start.getMonth();
            const year = course[k].start.getFullYear();

            if (type == "daily") {
                if (day == today.getDate() && month == today.getMonth() && year == today.getFullYear()) {
                    groupCollection.push(course[k]);
                }
            } else groupCollection.push(course[k]);

        }
    }


    res.send(groupCollection)
})

app.get("/getFileSystemStructure", (req, res) => {
    res.send(dirTree("contentDelivery", { attributes: ["size", "type", "extension"] }))
})

app.get("/getFile", (req, res) => {
    let filePath = req.query.path;
    res.download(__dirname + `/../${filePath}`);
})


async function makeGetRequest(url) {
    const request = await axios.get(url)
    const reqResult = await request.data
    return reqResult
}

/************************************* Startups *************************************/


client.login(token); // starts the bot up

app.listen(8084, () => {
    console.log(`Bot has started listening for requests at http://localhost:8084`)
})