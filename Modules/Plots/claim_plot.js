parsePlot = require("./parse_plot");
uratelimit = new Map();

const moment = require("moment")

const DB = require("../database")
const denied = new DB("./data/denied.json", { formatting: "compact" })
const reminders = new DB("./data/reminders.json", { formatting: "compact" })

const users = new DB("./data/users.json", { formatting: "compact" })

module.exports.parse = async (message, plots, village) => {
    plot = message.content;
    if (plots[village].data[parsePlot(plot)]) {
        plot = parsePlot(plot)
        message.member = (await message.guild.members.fetch(message.author.id));
        message.member.nickname = message.member.nickname || message.author.username
        if (plots[village].data[parsePlot(message.content)] && message.author.id !== plots[village].governor) {
            message.content = parsePlot(message.content)
            if (plots[village].data[message.content].owner !== "" && plots[village].data[message.content].owner !== undefined) {
                message.react("❌").catch(e => {
                    message.reply("Denied")
                })
                denied.write("m" + message.id, { date: (Date.now() + 7 * 24 * 60 * 60 * 1000), channel: message.channel.id })
                message.react("🇨").catch(e => {
                })
                r = (uratelimit.get(message.author) || 0) + 1
                uratelimit.set(message.author, r);
                if (r > 5) {
                    message.delete()
                    return
                }
                if (r > 4) {
                    require("./cooldown").send(message.channel, message.content);
                }
                setTimeout(() => {
                    r = (uratelimit.get(message.author) || 0) - 1
                    if (r < 0) r = 0;
                    uratelimit.set(message.author, r);
                }, 60 * 60 * 1000)
                message.member.createDM().then(c => {
                    c.send(":x: Your request for plot `" + message.content + "` was **denied** because this plot is already owned by " + plots[village].data[message.content].owner + ".").catch(e => {
                        message.channel.send("Failed to DM user <@" + message.member.id + ">.")
                    })
                }).catch(e => {
                    console.log(e);
                    m.channel.send("Failed to DM user <@" + owner.id + ">: ```" + e.name + ": " + e.message + "```")
                })
            } else {
                message.react("📥").catch(e => {
                })
            }
        }
    }
}

let mcUsers = new DB("./data/linked.json")

module.exports.claim = async (plot, owner, m, plots, auth) => {
    let village = m.channel.parent.name.split("-").join(" ")
    if (!plots[village]) return
    if(!owner) {
        return m.reply("Invalid owner id.");
    }
    
    let u = mcUsers.read("u" + owner.user.id)
    if (!u) {
        await m.reactions.removeAll()
        m.react("❌")
        m.react("🇱")
        return m.reply("<:CC_Cross:1180965168440692807> " + (u === m.member ? "You aren't" : "That user isn't") + " linked to a minecraft account. Please run `!link`")
    }
    let uuid = u.uuid;
    let p = await require("../spreadsheet").claimPlot(auth, plot, (owner.nickname), village, owner.user.id, uuid)
    if (p.status !== 200) {
        m.channel.send("Failed to update status for plot " + plot + ". Server replied with error " + p.status)
    } else {
        await m.reactions.removeAll()
        reminders.delete(plot)
        plots[village] = await require("../spreadsheet").listPlots(auth, village)
        owner.createDM().then(c => {
            if(!users.read("completed_member").find(a => a === owner.user.id)) {
                let m = `# :tada: You've claimed your first plot.\n### :warning: You must complete your plot within 2 weeks of claiming it or else you'll face heavy sanctions.\n\n:mailbox_with_mail: You'll be DMed by me whenever your plot request is approved/denied by a Village Governor. If your plot gets approved, my message will also include the date/time left until it expires.\n\n:map: When requesting a plot in any of the four village threads (or under the Hamlets thread), I'll react with :inbox_tray: for plot requests and with a :outbox_tray: for plot unclaiming requests. To claim a plot just send its plot code in the thread. If you, however, wish to unclaim a plot, you can send \`unclaim [plot code here]\`. \n**:warning: Keep in mind that you can only build on a plot AFTER it's been approved by the Village Governor/Hamlet Developer.**\n\n<:CC_happy:1026181344629366895> If you have any questions, feel free to DM \<@896732255534338078>!\n\n:question: If you have any questions, feel free to open a ticket in \<#928590105940226068>. \n\n*:information_source: This is a one-time message. If you know already how the bot works, you may ignore it*\n=====`;
                c.send(m);
                let z = (users.read("completed_member"));
                z.push(owner.user.id);
                users.write("completed_member", z  );
            }
            c.send("✅ Your request for plot `" + plot + "` was **approved**! __You have until <t:" + moment((p.time), "DD/MM/YYYY") / 1000 + "> (<t:" + moment((p.time), "DD/MM/YYYY") / 1000 + ":R>) to build it.__").catch(e => {
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