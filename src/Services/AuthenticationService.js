'use strict';
const axios = require("axios")
require('dotenv').config()

class AuthenticationService {

    async exchangeCodeForToken(request) {
        const urlencodedData = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: request.query.code,
            grant_type: 'authorization_code',
            redirect_uri: `http://localhost:8084`,
            scope: 'identify'
        })

        const responseData = await axios.post('https://discord.com/api/oauth2/token', urlencodedData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })

        const oauthData = await responseData.data;
        return oauthData;
    }

    async fetchUserData(access_token) {
        const userDataRequest = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                authorization: `Bearer ${access_token}`,
            },
        })

        const userData = await userDataRequest.data;
        return userData;
    }

    async checkUser(userdata) {

        const userDataRequest = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                authorization: `Bearer ${userdata.access_token}`,
            },
        })

        const responseData = await userDataRequest.data;

        return responseData.id == userdata.id
    }
}

module.exports = AuthenticationService