const DB = require("../database.js")
const reminders = new DB("./data/reminders.json", { formatting: "compact" })
const Discord = require("discord.js")
const hamletsMain = require("../../config/hamlets.json")
module.exports = async (g, plots) => {
    channels = g.channels.cache.filter(a => a.parent !== null && a.parent.id === "1001819329622450236" && a.type === Discord.ChannelType.GuildForum && a.name !== "development-zones")
    channels.forEach(cha => {
            channels2 = cha.guild.channels.cache.filter(c => c.parent === cha && c.name === "Full list of available plots")
            channel2 = channels2.first()
            let b = false;
            channel2.messages.fetch({ limit: 100 }).then(m => {
                m.forEach(msg => {
                    if (msg.author !== undefined && msg.author.id === "1075469164413735014") {
                        b = true;
                        village = msg.channel.parent.name.replaceAll("-", " ")
                        p = Object.values(plots[village].data).filter(a => (a.owner === "" || !a.owner))
                        pts = ""
                        warn = ""
                        for(let i = 0; i < p.length; i++) {
                            if((pts.length + p[i].plot.length) < 2048) {
                                pts = pts + "**" + p[i].plot + "**" + ((i < (p.length -1) && (pts.length + p[i].plot.length) < 2048)? ", " : "");
                            } else {
                                pts = pts + "..."
                                break;
                            }
                        }
                        /*if(p.length < 20) {
                            warn = "\n \n > :warning: **" + village.toUpperCase() + "** is running out of plots. Consider looking for plots in other villages such as <#1023646725090582548> or <#1023634411817795644>."
                        } else if(p.length < Object.values(plots[village].data).length*.1) {
                            warn = "\n \n > :warning: Consider looking for plots in other villages that have a considerable amount of free plots such as <#1023646725090582548> or <#1023634411817795644>."
                        }*/
                        let embed = new Discord.EmbedBuilder()
                            .setTitle("Free plots in " + village.toUpperCase() + " (" + p.length + "/" + Object.values(plots[village].data).length + ")")
                            .setDescription(pts + warn)
                            .setFooter({ text: "Last updated" })
                            .setColor("#e91e63")
                            .setTimestamp()
                        msg.edit({ content: "_ _", embeds: [embed] })

                    }
                })
                if (b === false) {
                    console.log("Loaded embed in " + m.first().channel.parent.name + "/" + cha.name)
                    m.first().channel.send("Loading...")
                }
            })
    })
    

    hamlets = Object.values(hamletsMain)
    g.channels.fetch("1143891345761640588").then(cha => {
        channels2 = cha.guild.channels.cache.filter(c => c.parent === cha && c.name === "Full list of available plots")
        channel2 = channels2.first()
        let b = false;
        for(let i = 0; i < hamlets.length; i++) {
            hamlets[i].plots = []
            hamlets[i].amount = 0
        }
        channel2.messages.fetch({ limit: 100 }).then(m => {
            m.forEach(msg => {
                if (msg.author !== undefined && msg.author.id === "1075469164413735014") {
                    b = true;
                    village = msg.channel.parent.name.replaceAll("-", " ")
                    p = Object.values(plots[village].data);
                    p2 = Object.values(plots[village].data).filter(a => (a.owner === "" || !a.owner));
                    
                    p.forEach(plot => {
                        z = hamlets.find(a => plot.plot.includes(a.code));
                        hamlets.splice(hamlets.indexOf(z), 1)
                        z.plots.push(plot)
                        ++z.amount;
                        hamlets.push(z)
                    })
                    let embed = new Discord.EmbedBuilder()
                    .setTitle("Free plots in ALL Development Zones: " + p2.length + "/" + Object.values(plots[village].data).length)
                    .setFooter({ text: "Last updated" })
                    .setColor("#e91e63")
                    .setTimestamp()

                    hamlets2 = hamlets.filter(a => a.kind === "Hamlet")
                    hamlets3 = hamlets.filter(a => a.kind !== "Hamlet")
                    hamlets2.sort((b, a) => a.amount - b.amount)
                    hamlets3.sort((b, a) => a.amount - b.amount)
                    hamlets2.forEach(hamlet => {
                        if(!hamlet.emoji || !hamlet.code || hamlet.invisible) return;
                        if(!hamlet.plots) hamlet.plots = []
                        hamlet.p2 = hamlet.plots.filter(a => (a.owner === "" || !a.owner))
                        pts = ""
                        warn = ""
                        for(let i = 0; i < hamlet.p2.length; i++) {
                            if((pts.length + hamlet.p2[i].plot.length) < 2048) {
                                pts = pts + "**" + hamlet.p2[i].plot + "**" + ((i < (hamlet.p2.length -1) && (pts.length + hamlet.p2[i].plot.length) < 2048)? ", " : "");
                            } else {
                                pts = pts + "..."
                                break;
                            }
                        }
                        embed.addFields({
                            name: (hamlet.emoji ? hamlet.emoji : "❓") + " " + hamlet.name + " | " + hamlet.p2.length + "/" + hamlet.plots.length + " plots" + " | " + hamlet.kind,
                            value: "> " + (pts !== "" ? pts  : "❌ No plots were found.")
                        })
                    })

                    embed.addFields({
                        name: "=======",
                        value: "_ _"
                    })
                    
                    hamlets3.forEach(hamlet => {
                        if(!hamlet.emoji || !hamlet.code || hamlet.invisible) return;
                        if(!hamlet.plots) hamlet.plots = []
                        hamlet.p2 = hamlet.plots.filter(a => (a.owner === "" || !a.owner))
                        pts = ""
                        warn = ""
                        for(let i = 0; i < hamlet.p2.length; i++) {
                            if((pts.length + hamlet.p2[i].plot.length) < 2048) {
                                pts = pts + "**" + hamlet.p2[i].plot + "**" + ((i < (hamlet.p2.length -1) && (pts.length + hamlet.p2[i].plot.length) < 2048)? ", " : "");
                            } else {
                                pts = pts + "..."
                                break;
                            }
                        }
                        embed.addFields({
                            name: (hamlet.emoji ? hamlet.emoji : "❓") + " " + hamlet.name + " | " + hamlet.p2.length + "/" + hamlet.plots.length + " plots" + " | " + hamlet.kind,
                            value: "> " + (pts !== "" ? pts + warn : "❌ No plots were found.")
                        })
                    })

                    msg.edit({ content: "_ _", embeds: [embed] })

                }
            })
            if (b === false) {
                console.log("Loaded embed in " + m.first().channel.parent.name + "/" + cha.name)
                m.first().channel.send("Loading...")
            }
        })
    })

    let c = g.channels.cache.get("1030128958089478155")
    let z = Date.now()
    Object.values(plots).forEach(village => {
        Object.values(village.data).forEach(plot => {
            if (plot.owner !== "") {
                let m = plot.ownerId
                if (m !== "[UNKNOWN]") {
                    if(!plot.plot) {
                        return;
                    }
                    if ((!reminders.read(plot.plot) && plot.r48 < (z / 1000) && plot.status == "FALSE")) {
                        c.send("<@" + m + "> your plot **" + plot.plot + "** is going to expire in **2 days**, better go and build it if you haven't already!")
                        console.log("@" + plot.owner + " your plot **" + plot.plot + "** is going to expire in **2 days**, better go and build it if you haven't already!")
                        reminders.write(plot.plot, "48h")
                    }
                    if ((reminders.read(plot.plot) == "48h" && plot.r24 < (z / 1000) && plot.status == "FALSE")) {
                        c.send("<@" + m + "> your plot **" + plot.plot + "** is going to expire in **1 day**, better go and build it if you haven't already!")
                        reminders.write(plot.plot, "24h")
                        console.log("@" + plot.owner + " your plot **" + plot.plot + "** is going to expire in **1 day**, better go and build it if you haven't already!")
                    }
                }
            }
        })
    })
}