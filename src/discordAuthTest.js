const express = require('express');
const axios = require("axios")
var buffer = require('buffer/').Buffer;
const GuildService = require('./Services/GuildService');
const AuthenticationService = require('./Services/AuthenticationService')
require('dotenv').config()

const app = express();

let guildService = new GuildService();
let authenticationService = new AuthenticationService();

var roles = [];
var members = [];


/********************************** Express Stuff **********************************/


app.get('/', async(request, response) => {
    if (request.query.code != undefined) {
        try {
            const oauthData = await authenticationService.exchangeCodeForToken(request)
            const userData = await authenticationService.fetchUserData(oauthData.access_token)

            let sessionUsername = await userData.username
            let res

            members.every(item => {
                if (item.user.username == sessionUsername) {

                    //console.log(JSON.stringify(replaceIdByRoleNames(item.roles)))

                    res = {
                        username: item.user.username,
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