const Database = require("../database.js")
let users = new Database("./linked.json")

module.exports = (c, member) => {
    let channel = member.guild.channels.cache.get("1178012954269061210")
    let extra = ""
    let a = users.read("u" + member.user.id)
    if (a) {
        extra = "\n## Make sure that you unwhitelist his minecraft account (`" + a.name + "`)."
    }
    channel.send("📤 A member has left: <@" + member.id + ">." + extra + " \nHis highest role was `" + member.roles.highest.name + "`. He joined the server <t:"  + Math.round(new Date(member.joinedAt).getTime()/1000)+ ":R>")
}