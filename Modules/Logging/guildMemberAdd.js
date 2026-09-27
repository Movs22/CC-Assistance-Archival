const Database = require("../database.js")
let users = new Database("./linked.json")

module.exports = (c, member) => {
    let channel = member.guild.channels.cache.get("1178012954269061210")
    let extra = " Make sure that he's whitelisted and received the proper permissions."
    let a = users.read("u" + member.user.id)
    if (a) {
        extra = " This user was previously linked to a minecraft account (`" + a + "`)."
    }
    channel.send("📥 A new member has joined: <@" + member.id + ">." + extra )
}