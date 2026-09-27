module.exports = async  (c, reaction, user) => {
    if(!reaction.message.channel.id === "1023686386957701120" || !reaction.message.id === "1023689327735218216") return
    let m = reaction.message.content
    let r = m.replaceAll(" ", "").split(">-").join("\n").split("\n")
    reaction.user = user;
    reaction.member = await reaction.message.guild.members.fetch(reaction.user.id)
    let emoji = reaction._emoji.name
    let a = r.indexOf(emoji)
    let role = r[a-1]
    if(!role) return;
    let role2 = await reaction.message.guild.roles.fetch(role.replaceAll("<@&",""))
    if(!reaction.member.roles.cache.has(role.replaceAll("<@&",""))) {
    } else {
        reaction.member.send("You're no longer following **" + role2.name + "**!")
        reaction.member.roles.remove(role2)
    }
}