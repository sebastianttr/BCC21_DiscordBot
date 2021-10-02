const express = require('express');
const axios = require("axios")
const GuildService = require('./Services/GuildService');
require('dotenv').config()

const app = express();

let guildService = new GuildService();

var roles = [];
var members = [];


/********************************** Express Stuff **********************************/


app.get('/', async(request, response) => {
    //console.log("URL Query: " + JSON.stringify(request.query))

    const urlencodedData = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: request.query.code,
        grant_type: 'authorization_code',
        redirect_uri: `http://localhost:8084`,
        scope: 'identify'
    })

    if (request.query.code != undefined) {
        try {
            const responseData = await axios.post('https://discord.com/api/oauth2/token', urlencodedData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            })

            const oauthData = await responseData;
            //console.log(oauthData.data)


            const userData = await axios.get("https://discord.com/api/users/@me", {
                headers: {
                    authorization: `${oauthData.data.token_type} ${oauthData.data.access_token}`,
                },
            })

            //console.log(await userData.data.username);

            let sessionUsername = await userData.data.username
            let res

            members.every(item => {
                if (item.user.username == sessionUsername) {
                    //console.log(JSON.stringify(replaceIdByRoleNames(item.roles)))
                    res = {
                        username: item.user.username,
                        roles: replaceIdByRoleNames(item.roles),
                        birthday: "01.01.1970",
                        avatarURL: "https://cdn.discordapp.com/avatars/" + item.user.id + "/" + item.user.avatar + ".png"
                    }

                    return false
                } else {
                    res = {
                        error: "user not in Creative Computing channel"
                    }
                    return true
                }
            })

            console.log("Response: " + JSON.stringify(res));
            response.status(301).redirect("http://localhost:8080/?userdata=" + JSON.stringify(res))
        } catch (e) {
            console.error(e);
        }

    }
});

/********************************** Functions & Handlers **********************************/

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


app.listen(8084, async() => {
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

    console.log(`App listening at http://localhost:8084`)
});