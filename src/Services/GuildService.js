'use strict';
const axios = require("axios")
require('dotenv').config()


class GuildService {
    async fetchGuildRoles() {
        const reqRes = await this.makeGetReq("https://discord.com/api/guilds/892431622580883477")
        return reqRes.data.roles
    }

    async fetchGuildMembers() {
        const reqRes = await this.makeGetReq("https://discord.com/api/guilds/892431622580883477/members?limit=999")
        return reqRes.data
    }

    async fetchGuildChannels() {
        const reqRes = await this.makeGetReq("https://discord.com/api/guilds/892431622580883477/channels")
        return reqRes.data
    }

    async makeGetReq(url) {
        const request = await axios.get(url, {
            headers: {
                authorization: `Bot ${process.env.CLIENT_TOKEN}`,
            },
        })

        const reqResult = await request
        return reqResult
    }
}

module.exports = GuildService