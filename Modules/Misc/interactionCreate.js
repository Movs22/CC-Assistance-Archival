const Discord = require("discord.js")
const DB = require("../database")
const os = require("os")

let villages = require("../../config/villages.json");

let users = new DB("./wiki/users.json");
let terms = new DB("./wiki/terms.json");

function getOs() {
    let type = os.type()
    let release = os.release();
    if(type === "Windows_NT") return type + " " + release.split(".")[0] + " (Build " + release.split(".")[2] + ")"
    if(type === "Darwin") {
        let v = parseInt(release.split(".")[0])
        v < 20 ? type = "MACOSX" : type = "macOs"
        v > 19 ? release = (v - 9) + "." + release.split(".")[1] : release = "10." + (v - 4) + "." + release.split(".")[1]
        return type + " " + release
    }
    return type + " " + release
}

module.exports = async (c, interaction) => {
    if (interaction.isAutocomplete()) {
        const command = c.commands.get(interaction.commandName.replaceAll("-", ""));
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        let focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === "user") {
            let choices = Object.keys(users.all())
            let written = interaction.options.getString("user")
            if (written !== "") choices = choices.filter(a => (a.toLowerCase().startsWith(written.toLowerCase())));
            choices.sort()
            choices = choices.slice(0, 25)
            try {
                await interaction.respond(choices.map(c => ({ name: c, value: c })))
            } catch (error) {
                console.error(error);
            }
        }
        if (focusedOption.name === "term") {
            let choices = Object.keys(terms.all())
            let written = interaction.options.getString("term")
            if (written !== "") choices = choices.filter(a => (a.toLowerCase().startsWith(written.toLowerCase())));
            choices.sort()
            choices = choices.slice(0, 25)
            try {
                await interaction.respond(choices.map(c => ({ name: c, value: c })))
            } catch (error) {
                console.error(error);
            }
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId === "termModal") {
            let term = interaction.fields.getTextInputValue("termInput")
            let desc = interaction.fields.getTextInputValue("infoInput")
            terms.write(term, { desc: desc, author: interaction.member.id, timestamp: Date.now() })
            interaction.reply(":white_check_mark: Added term " + term + " to the database!")
            return;
        }
        if (interaction.customId.startsWith("wikiModal-")) {
            let name = interaction.customId.split("-")[1]
            let info = users.read(name)
            if(!info) return interaction.reply("<:CC_Cross:1180965168440692807> That user isn't in my database.")
            let name2 = interaction.fields.getTextInputValue("nameInput")
            let nick = interaction.fields.getTextInputValue("nickInput")
            let desc = interaction.fields.getTextInputValue("descInput")
            info.name = name2;
            info.nick = nick;
            info.description = desc;
            users.write(name, info)
            interaction.reply(":white_check_mark: Updated your about page!")
            return;
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("edit-")) {
            let name = interaction.customId.split("-")[1]
            let id = interaction.customId.split("-")[2]
            if(id !== interaction.user.id) return interaction.reply("<:CC_Cross:1180965168440692807> You can't edit this user's about page.")
            let info = users.read(name)
            if(!info) return interaction.reply("<:CC_Cross:1180965168440692807> That user isn't in my database.")
            const modal = new Discord.ModalBuilder()
                .setCustomId('wikiModal-' + name)
                .setTitle('Edit your about page');
            nameInput = new Discord.TextInputBuilder()
                .setCustomId('nameInput')
                .setLabel("Name")
                .setValue(info.name)
                .setStyle(Discord.TextInputStyle.Short)
                .setRequired(true);
            nickInput = new Discord.TextInputBuilder()
                .setCustomId('nickInput')
                .setLabel("Nickname")
                .setValue(info.nick)
                .setStyle(Discord.TextInputStyle.Short)
                .setRequired(true);
            descInput = new Discord.TextInputBuilder()
                .setCustomId('descInput')
                .setLabel("Description")
                .setValue(info.description)
                .setStyle(Discord.TextInputStyle.Paragraph)
                .setRequired(true);
            [nameInput, nickInput, descInput].forEach(m => {
                row = new Discord.ActionRowBuilder().addComponents(m);
                modal.addComponents(row)
            })
            await interaction.showModal(modal)
            return;
        }
    }
    if (interaction.isCommand()) {
        if (interaction.commandName === "add-term") {
        const modal = new Discord.ModalBuilder()
                .setCustomId('termModal')
                .setTitle('New term');
            termInput = new Discord.TextInputBuilder()
                .setCustomId('termInput')
                .setLabel("Term")
                .setStyle(Discord.TextInputStyle.Short)
            infoInput = new Discord.TextInputBuilder()
                .setCustomId('infoInput')
                .setLabel("Term info")
                .setPlaceholder("Lorem ipsum dolor sit amet, consectetur adipiscing elit.")
                .setStyle(Discord.TextInputStyle.Paragraph)
                .setRequired(false);
            [termInput, infoInput].forEach(m => {
                row = new Discord.ActionRowBuilder().addComponents(m);
                modal.addComponents(row)
            })
            await interaction.showModal(modal)

            return;
        }
        if (interaction.commandName === "term") {
            let term = interaction.options.getString("term")
            if (!terms.read(term)) return interaction.reply("<:CC_Cross:1180965168440692807> Term not found. You can write about it by doing `/add-term`!")
            let info = terms.read(term)
            if(info.desc.startsWith("#")) info = terms.read(info.desc.replace("#",""))
            let a = interaction.guild.members.cache.get(info.author) || await interaction.guild.members.fetch(info.author)
            interaction.reply({ embeds: [new Discord.EmbedBuilder().setTitle(term).setDescription(info.desc).setColor("#e91e63").setFooter({ text: "Written by " + (a.nickname || a.user.globalName || a.user.username), iconURL: (a.displayAvatarURL() || a.user.avatarURL()) }).setTimestamp(info.timestamp)] })
            return;
        }
        if (interaction.commandName === "nuke-term") {
            let term = interaction.options.getString("term")
            if (!terms.read(term)) return interaction.reply("<:CC_Cross:1180965168440692807> Term not found. You can write about it by doing `/add-term`!")
            let reason = interaction.options.getString("reason")
            let info = terms.read(term)
            let a = interaction.guild.members.cache.get(info.author) || await interaction.guild.members.fetch(info.author)
            terms.delete(term)
            a.send({content: "Your term `" + term + "` was deleted from the bot's database for the following reason: ```\n" + reason + "\n```", files: [{ attachment: "https://media.discordapp.net/attachments/903232454721171466/1202053054543970384/Screenshot_2024-01-31_at_00.49.35.png?ex=65cc0e25&is=65b99925&hm=9ab4a7bcd82187a2629f3093a9172aea3d852c5461a726ffc9762787262be5dc&=&format=webp&quality=lossless&width=1019&height=1369", name: "message.png" }]})
            interaction.reply("✅ Deleted term `" + term + "` from the database and sent *a lovely DM* to " + (a.nickname || a.user.globalName || a.user.username))
            return;
        }
        if (interaction.commandName === "about") {
            if (interaction.options.getSubcommand() === 'village') {
                let village = interaction.options.getString("village")
                let info = villages[village]
                let embed = new Discord.EmbedBuilder()
                    .setTitle("Info about " + info.name)
                    .setDescription(info.description + "\n## Features: \n" + (info.features.length > 0 ? "- " + info.features.join("\n- ") : "*none*"))
                    .addFields({
                        name: "Village Governor",
                        value: (isNaN(parseInt(info.governor)) ? info.governor : "<@" + info.governor + ">"),
                        inline: true
                    }, {
                        name: "Foundation",
                        value: info.founded,
                        inline: true
                    }, {
                        name: "State",
                        value: (info.dissolved ? "Dissolved" : "Active"),
                        inline: true
                    }, {
                        name: "Local wood",
                        value: info.localWood || "*None*",
                        inline: true
                    }, {
                        name: "Local operator",
                        value: info.localOperator || "*None*",
                        inline: true
                    }, {
                        name: "Plot code",
                        value: info.code || "*None*",
                        inline: true
                    })
                    .setColor("#e91e63")
                    .setTimestamp()
                return interaction.reply({ embeds: [embed] })
            } else if (interaction.options.getSubcommand() === 'bot') {
                let embed = new Discord.EmbedBuilder()
                    .setTitle("Info about CC Assistance")
                    .addFields({
                        name: "Version",
                        value: require("../../config/config.json").version,
                        inline: true
                    }, {
                        name: "Developer",
                        value: "<@896732255534338078>",
                        inline: true
                    }, {
                        name: "Ping",
                        value: "`" + Math.round(c.ws.ping) + "`ms",
                        inline: true
                    }, {
                        name: "RAM Usage",
                        value: Math.round(process.memoryUsage().heapUsed/10240)/100 + "MB",
                        inline: true
                    }, {
                        name: "OS Version",
                        value: getOs(),
                        inline: true
                    })
                    .setColor("#e91e63")
                    .setTimestamp()
                return interaction.reply({ embeds: [embed] })
            } else if (interaction.options.getSubcommand() === 'user') {
                let user = interaction.options.getString("user")
                let info = users.read(user)
                if(!info) return interaction.reply("<:CC_Cross:1180965168440692807> That user isn't in my database.")
                let rhist = ""
                for(hist of info.rankHistory) {
                    rhist = rhist + "\n> **" + hist.role + "**: " + hist.start + " - " + (hist.end ? hist.end : "Present") + (hist.notes ? " | " + hist.notes : "")
                }
                let u = interaction.guild.members.cache.get(info.id) || await interaction.guild.members.fetch(info.id)
                let embed = new Discord.EmbedBuilder()
                    .setTitle("Info about " + info.name)
                    .setDescription(info.description + "\n### **Rank history: **" + rhist + "\n")
                    .addFields({
                        name: "Current position",
                        value: info.rankHistory[info.rankHistory.length-1].role,
                        inline: true
                    }, {
                        name: "Nickname",
                        value: info.nick,
                        inline: true
                    }, {
                        name: "User",
                        value: "<@" + info.id + ">",
                        inline: true
                    })
                    .setThumbnail(u.displayAvatarURL() || u.user.avatarURL())
                    .setColor("#e91e63")
                    .setTimestamp()
                if(info.id === interaction.user.id) {
                    let row = new Discord.ActionRowBuilder()
                    let edit = new Discord.ButtonBuilder()
                    .setCustomId('edit-' + info.name + "-" + info.id)
                    .setLabel("Edit this page")
                    .setStyle(Discord.ButtonStyle.Primary);
                    row.addComponents(edit);
                    return interaction.reply({ embeds: [embed], components:[row] })
                }
                return interaction.reply({ embeds: [embed] })
            }
        }
    }
}