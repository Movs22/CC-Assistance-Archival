const Discord = require("discord.js")


const ticketsDB = require("../../index.js").ticketsDB


module.exports = async (c, message) => {
    if (message.guild === null && !message.author.bot && message.content.length > 0) {
        if(message.content.startsWith("[")) {
            let ownerId = ticketsDB.read("ownerId");
            respond = false
            if(message.author.id.toString() === ownerId) respond = true
            let caseId = message.content.split("] ")[0]
            caseId = caseId.replace("[", "")
            let msg = message.content.split("] ")
            msg.shift()
            msg = msg.join("] ")
            let ticket = ticketsDB.read(caseId)
            if(!ticket) {
                return message.reply("<:CC_Cross:1180965168440692807> Invalid case ID. If you think this was a mistake, please DM <@896732255534338078>.")
            }
            if(!respond) {
                let owner = (await c.users.fetch(ownerId))
                if(ticket.owner !== message.author.id) return message.reply("<:CC_Cross:1180965168440692807> You don't own this ticket. If you think this was a mistake, please DM <@896732255534338078>.")
                let att = "";
                message.attachments.forEach(a => {
                    att = att + a.url + "\n"
                })
                owner.send({content: "You've received a message from ticket **[" + caseId + "]**: ```" + msg + "``` \nRespond to it by sending **[" + caseId + "] (response)**!" + (att !== "" ? "\nAttachments: \n" + att : "")})
                message.channel.send("✅ Message sent to " + (owner.globalName || owner.username))
                ticket.msgs.push({content: msg, attachments: att, timestamp: Date.now()})
            } else {
                ticket.claimedBy = message.author.id.toString()
                if(msg === "!close") {
                    let owner = (await c.users.fetch(ticket.owner))
                    row = new Discord.ActionRowBuilder()
                    let revoke = new Discord.ButtonBuilder()
                        .setCustomId('close-' + caseId)
                        .setLabel("Close ticket")
                        .setStyle(Discord.ButtonStyle.Danger);
                    row.addComponents(revoke);
                    if(ticket.bypass) {
                        (await c.guilds.cache.get("1151900914844696629").channels.fetch("1189902016307269682")).send({content: "Click the button below if there's nothing else that needs to be sorted.", components:[row]})
                    } else {
                        owner.send({content: "Click the button below if there's nothing else that needs to be sorted.", components:[row]})
                    }
                } else if(msg === "!force-close") {
                    let owner = (await c.users.fetch(ticket.owner))
                    ticket.closed = true;
                    ticket.closedTimestamp = Date.now()
                    let durTS = ticket.closedTimestamp - ticket.created
                    let s = Math.floor(durTS/100)/10
                    let min = Math.floor(s / 60)
                    let h = Math.floor(min / 60)
                    let d = Math.floor(h / 24)
                    s = s % 60
                    s = Math.floor(s*10)/10
                    min = min % 60
                    h = h % 24
                    let dur = `${d} days, ${h} hours, ${min} mins and ${s} seconds`
                    let serverOwner = (await c.users.fetch(ticketsDB.read("ownerId")))
                    serverOwner.send("Ticket `" + caseId + "` has been closed by yourself. \n📊 Statistics: \n> Total messages: `" + ticket.msgs.length + "`\n> Ticket duration: `" + dur + "`")
                    owner.send({content: "This ticket has been closed by an admin."})
                } else {
                    let owner = (await c.users.fetch(ticket.owner))
                    let serverOwner = (await c.users.fetch(ownerId))
                    if(ticket.bypass) {
                        (await c.guilds.cache.get("1151900914844696629").channels.fetch("1189902016307269682")).send({content: "You've received a message from **" + (serverOwner.globalName || serverOwner.username) + "**: ```" + msg + "``` \nTo reply to this message, please send your message and include `[" + caseId + "]` at the start."})
                    } else {
                        owner.send({content: "You've received a message from **" + (serverOwner.globalName || serverOwner.username) + "**: ```" + msg + "``` \nTo reply to this message, please send your message and include `[" + caseId + "]` at the start."})
                    }
                    message.channel.send("✅ Message sent to the ticket owner")
                }
                ticket.msgs.push({content: msg, attachments: message.attachments, timestamp: Date.now()})
            }
            ticketsDB.write(caseId, ticket)
            return;
        };
        let logs = await c.guilds.cache.get("903230722603614279").channels.fetch("1178013347652833471")
        logs.send({embeds:[new Discord.EmbedBuilder().setTitle("**A new DM has been sent to the bot!**").setDescription(message.content).setFooter({text: "Sent by " + (message.author.globalName || message.author.username), iconURL: message.author.avatarURL({size: 4096, format: 'png'})}).setTimestamp().setColor("#e91e63")]})
        return;
    }
    if (message.guild !== null && message.guild.id === "1151900914844696629" && !message.author.bot && message.content.length > 0 && message.channel.id === "1189902016307269682") {
        let ownerId = ticketsDB.read("ownerId");
            respond = false
            if(message.author.id.toString() === ownerId) respond = true
            let caseId = message.content.split("] ")[0]
            caseId = caseId.replace("[", "")
            let msg = message.content.split("] ")
            msg.shift()
            msg = msg.join("] ")
            let ticket = ticketsDB.read(caseId)
            if(!ticket) {
                return
            }
            if(!respond) {
                let owner = (await c.users.fetch(ownerId))
                //if(ticket.owner !== ownerId) return message.reply("<:CC_Cross:1180965168440692807> You don't own this ticket. If you think this was a mistake, please DM <@896732255534338078>.")
                let att = "";
                message.attachments.forEach(a => {
                    att = att + a.url + "\n"
                })
                owner.send({content: "You've received a message from ticket `[" + caseId + "]`: ```" + msg + "``` \nRespond to it by sending `[" + caseId + "] (response)`!" + (att !== "" ? "\nAttachments: \n" + att : "")})
                message.channel.send("✅ Message sent to " + (owner.globalName || owner.username))
                ticket.msgs.push({content: msg, attachments: att, timestamp: Date.now()})
            } else {
                ticket.claimedBy = message.author.id.toString()
                if(msg === "!close") {
                    let owner = (await c.users.fetch(ticket.owner))
                    row = new Discord.ActionRowBuilder()
                    let revoke = new Discord.ButtonBuilder()
                        .setCustomId('close-' + caseId)
                        .setLabel("Close ticket")
                        .setStyle(Discord.ButtonStyle.Danger);
                    row.addComponents(revoke);
                    if(ticket.bypass) {
                        (await c.guilds.cache.get("1151900914844696629").channels.fetch("1189902016307269682")).send({content: "Click the button below if there's nothing else that needs to be sorted.", components:[row]})
                    } else {
                        owner.send({content: "Click the button below if there's nothing else that needs to be sorted.", components:[row]})
                    }
                } else if(msg === "!force-close") {
                    let owner = (await c.users.fetch(ticket.owner))
                    ticket.closed = true;
                    ticket.closedTimestamp = Date.now()
                    let durTS = ticket.closedTimestamp - ticket.created
                    let s = Math.floor(durTS/100)/10
                    let min = Math.floor(s / 60)
                    let h = Math.floor(min / 60)
                    let d = Math.floor(h / 24)
                    s = s % 60
                    s = Math.floor(s*10)/10
                    min = min % 60
                    h = h % 24
                    let dur = `${d} days, ${h} hours, ${min} mins and ${s} seconds`
                    let serverOwner = (await c.users.fetch(ticketsDB.read("ownerId")))
                    serverOwner.send("Ticket `" + caseId + "` has been closed by yourself. \n📊 Statistics: \n> Total messages: `" + ticket.msgs.length + "`\n> Ticket duration: `" + dur + "`")
                    owner.send({content: "This ticket has been closed by an admin."})
                } else {
                    let owner = (await c.users.fetch(ticket.owner))
                    let serverOwner = (await c.users.fetch(ownerId))
                    if(ticket.bypass) {
                        (await c.guilds.cache.get("1151900914844696629").channels.fetch("1189902016307269682")).send({content: "You've received a message from **" + (serverOwner.globalName || serverOwner.username) + "**: ```" + msg + "``` \nTo reply to this message, please send your message and include `[" + caseId + "]` at the start."})
                    } else {
                        owner.send({content: "You've received a message from **" + (serverOwner.globalName || serverOwner.username) + "**: ```" + msg + "``` \nTo reply to this message, please send your message and include `[" + caseId + "]` at the start."})
                    }
                    message.channel.send("✅ Message sent to the ticket owner")
                }
                ticket.msgs.push({content: msg, attachments: message.attachments, timestamp: Date.now()})
            }
            ticketsDB.write(caseId, ticket)
            return;
    }
    if (message.author.bot) return;
    if(message.channel.id === "1167871151922487398" || message.channel.id === "1167867661351407786") {
        require("./points").parsePoints(message, (message.channel.id === "1167871151922487398"))
        return;
    }
    if(!message.member) return;
    if(!message.member.roles.cache.has("955534024443592704") && /\d{1,3}(?:\.\d{1,3}){3}/.test(message.content.replaceAll(" ","").replaceAll("*","").replaceAll("_","").replaceAll("(dot)","."))) {
        message.channel.send(":warning: | Make sure that you don't send IP addresses in public channels, " + message.author.toString() + ".").then(msg => setTimeout(() => msg.delete(), 5000))
        return message.delete()
    }
    
}