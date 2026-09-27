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

const Discord = require("discord.js")

module.exports = async (c, plots, message, auth) => {
    if (message.guild == null) return
    if (message.author.bot) return;
    if (message.author.id === "896732255534338078" && message.content.startsWith("-cooldown")) {
        return require("./cooldown").send(message.channel, require("./parse_plot")(message.content), message.content.split(" ")[1])
    }
    if (!message.channel.parent || !message.channel.parent.parent) return
    if (message.channel.parent.parent.id === "1001819329622450236") {
        let village = message.channel.parent.name.split("-").join(" ")
        if (!plots[village]) return
        if (message.content.startsWith("unclaim")) {
            require("./unclaim_plot").parse(message, plots, village);
            return;
        } else {
            if (plots[village].data[parsePlot(message.content)]) {
                require("./claim_plot").parse(message, plots, village);
                return;
            } else {
                if (message.author.id === "896732255534338078" && message.content === "-parse") {
                    if (!message.reference) return;
                    let m = await message.channel.messages.fetch(message.reference.messageId)
                    message.delete()
                    c.emit("messageCreate", m)
                    return;
                }
                if (message.author.id === "896732255534338078" && message.content.startsWith("-approve")) {
                    if (!message.reference) return;
                    let m = await message.channel.messages.fetch(message.reference.messageId)
                    plot = parsePlot(message.content.split(" ")[2])
                    message.guild.members.fetch(message.content.split(" ")[1]).then(owner => {
                        plots = require("./claim_plot").claim(plot, owner, m, plots, auth);
                    });
                    message.delete()
                }
                if (plots[village].governor.split(",").includes(message.author.id) || isHamletOwner(null, message.author.id)) {
                    if (!message.reference) return;
                    let m = await message.channel.messages.fetch(message.reference.messageId)
                    plot = parsePlot(m.content)
                    if (message.content.toLowerCase().startsWith("approved") || message.content.toLowerCase().startsWith("accepted")) {
                        await m.reactions.removeAll()
                        if (m.content.startsWith("unclaim")) {
                            owner = m.member;
                            plot = parsePlot(m.content.split("unclaim ")[1])
                            plots = require("./unclaim_plot").unclaim(plot, owner, m, plots, auth);
                        } else {
                            owner = m.member;
                            plots = require("./claim_plot").claim(plot, owner, m, plots, auth);
                        }
                    } else if (message.content.toLowerCase().startsWith("denied") && (isHamletOwner(message.content, message.author.id) || plots[village].governor.split(",").includes(message.author.id))) {
                        await m.reactions.removeAll();
                        reason = message.content.split(" ")
                        reason.shift()
                        reason = reason.join(" ")
                        m.react("❌").catch(e => {
                            m.reply("Denied")
                        })
                        if (message.content.toLowerCase().includes("blacklist")) {
                            m.react("🇧").catch(e => {
                            })
                        } else if (message.content.toLowerCase().includes("claim more then") || message.content.toLowerCase().includes("too many plots")) {
                            m.react("🇪").catch(e => {
                            })
                        } else {
                            m.react("🇴").catch(e => {
                            })
                        }
                        if (m.author == null) {
                            return;
                        }
                        m.author.createDM().then(c => {
                            if (m.content.startsWith("unclaim")) {
                                c.send(":x: Your request to unclaim plot `" + m.content.split("unclaim ")[1] + "` was **denied** for the following reason: `" + reason + "`.").catch(e => {
                                    m.channel.send("Failed to DM user <@" + m.member.id + ">.")
                                })
                            } else {
                                c.send(":x: Your request for plot `" + m.content + "` was **denied** for the following reason: `" + reason + "`.").catch(e => {
                                    m.channel.send("Failed to DM user <@" + m.member.id + ">.")
                                })
                            }
                            message.delete()
                        }).catch(e => {
                            m.channel.send("Failed to DM user <@" + m.member.id + ">.")
                        })
                    }
                }
            }
        }
    }
}