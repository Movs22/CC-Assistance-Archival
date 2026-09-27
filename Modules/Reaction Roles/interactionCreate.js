const Discord = require("discord.js")

function getToken(len) {
    let str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let r = ""
    for(let i = 0; i < len; i++) {
        r = r + str[Math.floor(Math.random()*str.length)]
    }
    return r;
}

let db = require("../../index.js").ticketsDB

let ownerId = db.read("ownerId");

let awaitingCreation = {}

module.exports = async (c, interaction) => {

    if(interaction.isModalSubmit()) {
        if(interaction.customId === "cashModal") {
            let owner = (await c.users.fetch(ownerId))
            owner.send({content: "**Who are you reporting? ** " + "`" + (interaction.fields.getTextInputValue("reportInput") + "`" ||  "`none`") + "\n**Why are you making this ticket?** ```\n" + interaction.fields.getTextInputValue("reasonInput") + "\n```"})
            let info = awaitingCreation[interaction.user.id]
            db.write(info.id.toString(), info)
            interaction.user.createDM().then(c => {
                c.send("## You're now in contact with Cash! \nTo send him a message, please DM me and **include `[" + info.id + "]` at the start of your message.** He should respond to you within 1 week. \n**Keep in mind** that he won't know who made this ticket.").then(e => {
                    interaction.reply({content: "✅ Ticket created! Please check your DMs.", ephemeral: true})
                })
            })
            return;
        } else {
            return;
        }
    }
    if (interaction.isButton()) {
        if(interaction.customId.startsWith("rr-")) {
            let role = interaction.customId.split("-")[1]
            let r = interaction.guild.roles.cache.find(a => a.name === role)
            if(!r) {
                return interaction.reply({content:"<:CC_Cross:1180965168440692807> Role not found.", ephemeral: true})
            }
            if(!interaction.member.roles.cache.has(r.id)) {
                interaction.reply({content:"You're now following **" + r.name + "**!", ephemeral: true})
                interaction.member.roles.add(r)
            } else {
                interaction.reply({content:"You're no longer following **" + r.name + "**!", ephemeral: true})
                interaction.member.roles.remove(r)
            }
        }
        if(interaction.customId === "tickets-cash") {
            if(Object.values(db.all()).find(a => a.owner === interaction.member.id.toString())) return interaction.reply({content: "<:CC_Cross:1180965168440692807> You already have a ticket open. Please close that before opening another one.", ephemeral: true})
            let u = interaction.member;
            if((db.read("blocked")).includes(u.id)) return interaction.reply({content: "<:CC_Cross:1180965168440692807> You've been blacklisted from making tickets.", ephemeral: true})
            let id = getToken(6)
            let info = {owner: u.id, msgs: [], created: Date.now(), id: id, closed: false, closedTimestamp: undefined, claimedBy: undefined}
            const modal = new Discord.ModalBuilder()
                .setCustomId('cashModal')
                .setTitle('New Cash Ticket');
            reportInput = new Discord.TextInputBuilder()
                .setCustomId('reportInput')
                .setLabel("Who are you reporting? (OPTIONAL)")
                .setPlaceholder("cameforthecash")
                .setStyle(Discord.TextInputStyle.Short)
            reasonInput = new Discord.TextInputBuilder()
                .setCustomId('reasonInput')
                .setLabel("Why are you making this ticket?")
                .setPlaceholder("Because Cash is the owner")
                .setStyle(Discord.TextInputStyle.Paragraph)
                .setRequired(true);
            [reportInput, reasonInput].forEach(m => {
                row = new Discord.ActionRowBuilder().addComponents(m);
                modal.addComponents(row)
            })
            interaction.showModal(modal)
            awaitingCreation[u.id] = info
            let owner = (await c.users.fetch(ownerId))
            owner.send({content: "**A new ticket has been opened!** \nCase ID: `" + id + "`\n\n*Good luck*\n\nPre-ticket form responses:"})

        }
        if(interaction.customId.startsWith("close-")) {
            let caseId = interaction.customId.split("-")[1]
            let ticket = db.read(caseId)
            if(!ticket) {
                return message.reply("<:CC_Cross:1180965168440692807> Invalid case ID. If you think this was a mistake, please DM <@896732255534338078>.")
            }
            ticket.closed = true;
            ticket.closedTimestamp = Date.now()
            interaction.reply({content: "Your ticket `" + caseId  + "` is now closed."})
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
            let serverOwner = (await c.users.fetch(db.read("ownerId")))
            serverOwner.send("Ticket `" + caseId + "` has been closed by the user. \n📊 Statistics: \n> Total messages: `" + ticket.msgs.length + "`\n> Ticket duration: `" + dur + "`")
                    row = new Discord.ActionRowBuilder()
                    let revoke = new Discord.ButtonBuilder()
                        .setCustomId('close-' + caseId)
                        .setLabel("Close ticket")
                        .setDisabled(true)
                        .setStyle(Discord.ButtonStyle.Danger);
                    row.addComponents(revoke);
                    interaction.message.edit({content: "Click the button below if there's nothing else that needs to be sorted.", components:[row]})
            db.write(caseId, ticket)
        }
    }
}