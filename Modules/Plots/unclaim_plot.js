parsePlot = require("./parse_plot");

uratelimit = new Map();

const moment = require("moment")

const DB = require("../database")
const denied = new DB("./data/denied.json", { formatting: "compact" })
const reminders = new DB("./data/reminders.json", { formatting: "compact" })

module.exports.parse = async (message, plots, village) => {
    plot = message.content.split("unclaim ")[1];
    if (plots[village].data[parsePlot(plot)] && message.author.id !== plots[village].governor) {
        plot = parsePlot(plot)
        message.member.nickname = message.member.nickname || message.member.user.username
        if(!plots[village].data[plot].owner) return message.reply(":x: `" + plot + ".owner` is undefined. ||<@896732255534338078>||")
        if (plots[village].data[plot].owner.toLowerCase() !== message.member.nickname.toLowerCase()) {
            message.react("❌").catch(e => {
                message.reply("Denied")
            })
            denied.write("m" + message.id, { date: (Date.now() + 7 * 24 * 60 * 60 * 1000), channel: message.channel.id })
            message.react("🇺").catch(e => {
            })
            r = (uratelimit.get(message.author) || 0) + 1
            uratelimit.set(message.author, r);
            if (r > 5) {
                message.delete()
                return
            }
            setTimeout(() => {
                r = (uratelimit.get(message.author) || 0) - 1
                if (r < 0) r = 0;
                uratelimit.set(message.author, r);
            }, 60 * 60 * 1000)
            message.member.createDM().then(c => {
                c.send(":x: Your request to unclaim plot `" + message.content + "` was **denied** because this plot isn't yours.").catch(e => {
                    m.channel.send("Failed to DM user <@" + m.member.id + ">.")
                })
            }).catch(e => {
                message.channel.send("Failed to DM user <@" + message.member.id + ">.")
            })
        } else {
            message.react("📤").catch(e => {
            })
        }
    }
}

module.exports.unclaim = async (plot, owner, m, plots, auth) => {
    let village = m.channel.parent.name.split("-").join(" ")
    if (!plots[village]) return
    if(!owner) {
        return m.reply("Invalid owner id.");
    }
    let p = await require("../spreadsheet").claimPlot(auth, plot, null, village, null)
    if (p.status !== 200) {
        m.channel.send("Failed to update status for plot " + plot + ". Server replied with error " + p.status)
    } else {
        await m.reactions.removeAll()
        reminders.delete(plot)
        plots[village] = await require("../spreadsheet").listPlots(auth, village)
        owner.createDM().then(c => {
            c.send("✅ Your plot `" + plot + "` was **unclaimed**! __Make sure that you haven't left anything there.__").catch(e => {
                m.channel.send("Failed to DM user <@" + owner.user.id + ">.")
            })
        }).catch(e => {
            console.log(e);
            m.channel.send("Failed to DM user <@" + owner.user.id + ">: ```" + e.name + ": " + e.message + "```")
        })
        m.react("✅").catch(e => {
            m.reply("Approved")
        })
    }
    return plots;
}