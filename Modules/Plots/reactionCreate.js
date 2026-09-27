parsePlot = require("./parse_plot");

const hamlets = require("../../config/hamlets.json")

function isHamletOwner(channel, user) {
    let n = null;
    if(channel !== null) {
        n = channel[1] + channel[2];
    }
    let h = Object.values(hamlets).find(a => a.code ? a.code.includes(n) : false)
    if(!h) return false;
    if(h.developer === user) return true;
    if(h["co-developer"].includes(user)) return true;
    return false;
}


module.exports = async  (c, plots, reaction, user, auth) => {
    if (reaction.message.guild == null) return
    reaction.user = user
    if (user.bot) return
    if (reaction.emoji.name === "✅") {
        let village = reaction.message.channel.parent.name.split("-").join(" ")
        if (!plots[village]) return
        if (plots[village].data[parsePlot(reaction.message.content.replaceAll("unclaim",""))] && (plots[village].governor.split(",").includes(reaction.user.id)) || isHamletOwner(reaction.message.content, reaction.user.id)) {
            if(reaction.message.content.startsWith("unclaim")) {
                owner = reaction.message.member;
                if(!owner) owner = await reaction.message.guild.members.fetch(reaction.message.author.id);
                plot = parsePlot(reaction.message.content.split("unclaim ")[1])
                plots = require("./unclaim_plot").unclaim(plot, owner, reaction.message, plots, auth);
            } else {
                owner = reaction.message.member;
                if(!owner) owner = await reaction.message.guild.members.fetch(reaction.message.author.id);
                plot = parsePlot(reaction.message.content)
                plots = require("./claim_plot").claim(plot, owner, reaction.message, plots, auth);
            }
        }
    }
}