const Discord = require("discord.js")
const DB = require("../database")

const converter = require('hex2dec');

const canvas = require("canvas")
const minecraftPlayer = require("../getMcInfo.js");

let polls = new DB("./data/polls.json")
let mcUsers = new DB("./data/linked.json")
let hamlets = require("../../config/hamlets.json");

parsePlot = require("./parse_plot");
checkPlots = require("./check_plots");
module.exports = async (c, plots, interaction, auth) => {

    if (interaction.isModalSubmit()) {
        if (interaction.customId === "pollModal") {
            let blocked = interaction.fields.getTextInputValue("blockedInput")
            let question = interaction.fields.getTextInputValue("questionInput")
            let embed = new Discord.EmbedBuilder()
                .setTitle("Poll")
                .setColor("#e91e63")
                .setDescription("## " + question + "\n\n:white_check_mark: Yes - `0` \n:x: No - `0`")
                .setTimestamp()
                .setFooter({ text: "Poll made by " + (interaction.member.nickname || interaction.user.globalName), iconURL: (interaction.member.displayAvatarURL({ size: 4096, format: 'png' }) || interaction.user.avatarURL({ size: 4096, format: 'png' })) })

            let m = await interaction.channel.send({ embeds: [embed] })

            let favour = new Discord.ButtonBuilder()
                .setCustomId(m.id + "-" + m.channel.id + "-favour")
                .setLabel("Yes")
                .setStyle(Discord.ButtonStyle.Success)

            let against = new Discord.ButtonBuilder()
                .setCustomId(m.id + "-" + m.channel.id + "-against")
                .setLabel("No")
                .setStyle(Discord.ButtonStyle.Danger)
            let results = new Discord.ButtonBuilder()
                .setCustomId(m.id + "-" + m.channel.id + "-close-" + interaction.user.id)
                .setLabel("Close poll")
                .setStyle(Discord.ButtonStyle.Primary)

            polls.write("p" + m.id + m.channel.id, { b: blocked, voted: [], favour: 0, against: 0, q: question })

            const row = new Discord.ActionRowBuilder()
                .addComponents(favour, against, results)
            m.edit({ embeds: [embed], components: [row] })
            interaction.reply({ content: "✅ Created poll.", ephemeral: true })
            return;
        }
        if (interaction.customId === "pointsModal") {
            let message = interaction.fields.getTextInputValue('messageLink').split("/")
            let amount = interaction.fields.getTextInputValue('amount')
            let reason = interaction.fields.getTextInputValue('reason')
            let originalMessage = await interaction.channel.messages.fetch(message[message.length - 1])
            if (originalMessage.author.bot) return interaction.reply({ content: "<:CC_Cross:1180965168440692807> You can't give points to a bot!", ephemeral: true })
            await interaction.guild.members.fetch(originalMessage.author.id)
            if (originalMessage.member.roles.cache.has("953720555515826236")) return interaction.reply({ content: "<:CC_Cross:1180965168440692807> You can't give points to a staff member! Please use <#1039641515078721687> instead.", ephemeral: true })
            if (originalMessage.member.roles.cache.has("1146544652711907370")) return interaction.reply({ content: "<:CC_Cross:1180965168440692807> You can't give points to a staff member! Please use <#903232454721171466> instead.", ephemeral: true })
            let content = originalMessage.content;
            c2 = content.split("\n")
            h = 70 + c2.length * 50
            let w = 1;
            if (originalMessage.attachments.size > 0) {
                w = originalMessage.attachments.first().width;
                // resize to fit 2k
                h += originalMessage.attachments.first().height * 1860 / w;
            }
            let img;
            if (content.length * 30 < (originalMessage.member.nickname || originalMessage.author.globalName || originalMessage.author.username).length * 50) {
                if (originalMessage.attachments.size > 0) {
                    img = canvas.createCanvas(2000, h)
                } else {
                    img = canvas.createCanvas((originalMessage.member.nickname || originalMessage.author.globalName || originalMessage.author.username).length * 50 + 140, h)
                }
            } else if (content.length * 30 + 140 < 2000) {
                if (originalMessage.attachments.size > 0) {
                    img = canvas.createCanvas(2000, h)
                } else {
                    img = canvas.createCanvas(content.length * 30 + 140, h)
                }
            } else {
                img = canvas.createCanvas(2000, h + 30 * Math.ceil((content.length * 30 - 2000) / 2000))
            }
            let ctx = img.getContext("2d")

            ctx.fillStyle = "#313338"
            ctx.fillRect(0, 0, img.width, img.height)

            canvas.registerFont('./Ubuntu/Ubuntu-Regular.ttf', { family: 'Ubuntu' })
            canvas.registerFont('./Ubuntu/Ubuntu-Bold.ttf', { family: 'Ubuntu Bold' })

            ctx.font = '30px Ubuntu';
            ctx.fillStyle = originalMessage.member.displayHexColor;
            ctx.fillText((originalMessage.member.nickname || originalMessage.author.globalName || originalMessage.author.username), 140, 40)

            ctx.font = '40px Ubuntu';
            ctx.fillStyle = "#ffffff"
            let i = 0;
            if (ctx.measureText(originalMessage.content).width > 2000) {
                content = originalMessage.content.match(/(.|[\r\n]){1,120}/g);
                content.forEach(l => {
                    ctx.fillText(l, 140, 80 + i)
                    i += 50;
                })
            } else {
                ctx.fillText((originalMessage.content), 140, 80)
            }
            if (originalMessage.attachments.size > 0) {
                let img = await canvas.loadImage(originalMessage.attachments.first().url)
                ctx.drawImage(img, 140, 80 + i, 1860, originalMessage.attachments.first().height * 1860 / w)
            }
            ctx.restore()
            ctx.save()

            //pfp
            ctx.beginPath();
            ctx.arc(55, 55, 50, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            let avatar = await canvas.loadImage((originalMessage.member.displayAvatarURL({ size: 4096, format: 'png' }) || originalMessage.author.avatarURL({ size: 4096, format: 'png' })).replaceAll(".webp", ".png"))
            ctx.drawImage(avatar, 5, 5, 100, 100)

            originalMessage.delete();


            let m = {};
            m.author = interaction.user;
            m.member = interaction.member;
            m.content = "Name: " + (originalMessage.member.nickname || originalMessage.author.globalName || originalMessage.author.username) + "\nAmount: " + amount + "\nReason: " + reason
            m.attachments = new Discord.Collection()
            m.attachments.set("0", { attachment: img.toBuffer(), name: "evidece.png", height: img.height, width: img.width })
            m.channel = interaction.guild.channels.cache.get("1167867661351407786") || await interaction.guild.channels.fetch("1167867661351407786")
            m.guild = interaction.guild;
            m.delete = () => {
                interaction.reply("✅ " + amount + " points were given.")
            };
            m.react = () => {
                interaction.reply({ content: "<:CC_Cross:1180965168440692807> You can't give points to this user", ephemeral: true })
            }
            c.emit("messageCreate", m)

        } else {
            return await interaction.reply("<:CC_Cross:1180965168440692807> Unknown error")
        }
        return;
    }

    if (interaction.isMessageContextMenuCommand()) {
        if (interaction.commandName === "Give points") {
            const modal = new Discord.ModalBuilder()
                .setCustomId('pointsModal')
                .setTitle('Give points');
            messageLinkInput = new Discord.TextInputBuilder()
                .setCustomId('messageLink')
                .setLabel("Message Link")
                .setStyle(Discord.TextInputStyle.Short)
                .setValue(interaction.targetMessage.url);
            amountInput = new Discord.TextInputBuilder()
                .setCustomId('amount')
                .setLabel("Amount of points")
                .setValue("1")
                .setStyle(Discord.TextInputStyle.Short)
                .setRequired(true);
            reasonInput = new Discord.TextInputBuilder()
                .setCustomId('reason')
                .setLabel("Reason")
                .setPlaceholder("Reason")
                .setStyle(Discord.TextInputStyle.Paragraph)
                .setRequired(true);
            [messageLinkInput, amountInput, reasonInput].forEach(m => {
                row = new Discord.ActionRowBuilder().addComponents(m);
                modal.addComponents(row)
            })
            await interaction.showModal(modal)

            return;
        } else {
            return interaction.reply("<:CC_Cross:1180965168440692807> Invalid context menu.")
        }
    }

    if (interaction.isUserContextMenuCommand()) {
        if (interaction.commandName === "Userinfo") {
            let u2 = interaction.targetMember;
            let u = mcUsers.read("u" + u2.user.id)
            if (!u) {
                return interaction.reply("<:CC_Cross:1180965168440692807> " + (u2 === interaction.member ? "You aren't" : "That user isn't") + " linked to a minecraft account. Please run `!link`")
            }

            let img = canvas.createCanvas(1024, 1024)
            let ctx = img.getContext("2d")
            let data;
            if (u) {
                if (u.name.startsWith(".")) {

                } else {
                    data = await minecraftPlayer.uuid(u.uuid);
                    if (data.textures) {
                        let avatar = await canvas.loadImage(data.textures.SKIN.url)
                        ctx.imageSmoothingEnabled = false
                        ctx.drawImage(avatar, -1024, -1024, 8192, 8192)
                        ctx.drawImage(avatar, -5120, -1024, 8192, 8192)
                    } else {
                        ctx.fillStyle = "#000000"
                        ctx.fillRect(0, 0, 1024, 1024)
                        ctx.fillStyle = "#ff00ff"
                        ctx.fillRect(512, 512, 512, 512)
                        ctx.fillRect(0, 0, 512, 512)
                    }
                }
            }
            let c = u2.displayHexColor;
            let embed = new Discord.EmbedBuilder()
                .setTitle("Information of " + (u2.nickname || u2.user.globalName || u2.user.username))
                .setColor("#" + c.substring(c.length - 6, c.length))
                .addFields({
                    name: "MC account:",
                    value: (u.name.startsWith(".") ? u.name : (data ? data.name : "*This user hasn't linked their account yet*")),
                    inline: true
                }, {
                    name: "Joined:",
                    value: "<t:" + Math.round(new Date(u2.joinedAt).getTime() / 1000) + ":R>",
                    inline: true
                }, {
                    name: "Current role:",
                    value: "<@&" + u2.roles.highest.id + ">"
                })
            if (!u.name.startsWith(".")) embed.setThumbnail("attachment://skin.png")
                .setTimestamp()
            if (!u.name.startsWith(".") && data.name !== u.name) {
                u.name = data.name;
                mcUsers.write("u" + u2.user.id, u)
            }
            if (!u.name.startsWith(".")) {
                return interaction.reply({ embeds: [embed], files: [{ attachment: img.toBuffer(), name: "skin.png" }], ephemeral: true })
            } else {
                return interaction.reply({ embeds: [embed], ephemeral: true })
            }
        }
        if (interaction.commandName === "List plots") {
            let user = interaction.member.nickname || interaction.user.globalName || interaction.user.username;
            let m = interaction.targetMember;
            user = m.nickname || m.user.globalName || m.user.username;
            a = Object.values(plots.ailsbury.data).filter(z => (z.owner === user || z.ownerId === m.id.toString()))
            let u = mcUsers.read("u" + m.user.id)
            if (!u) return interaction.reply("<:CC_Cross:1180965168440692807> This user isn't whitelisted.")
            if (u.name.startsWith(".")) {
                u = undefined;
            }
            if (u) {
                a = a.concat(Object.values(plots.ailsbury.data).filter(z => z.ownerUUID === u.uuid).filter(z => !a.includes(z)))
            }
            atxt = ""
            for (let i = 0; i < a.length; i++) {
                atxt = atxt + a[i].plot
                if ((i + 1) < a.length) {
                    atxt = atxt + ", "
                }
            }
            c = Object.values(plots.cashvillage.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
            if (u) {
                c = c.concat(Object.values(plots.cashvillage.data).filter(z => z.ownerUUID === u.uuid).filter(z => !c.includes(z)))
            }
            ctxt = ""
            for (let i = 0; i < c.length; i++) {
                ctxt = ctxt + c[i].plot
                if ((i + 1) < c.length) {
                    ctxt = ctxt + ", "
                }
            }
            h = Object.values(plots.hemstead.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
            if (u) {
                h = h.concat(Object.values(plots.hemstead.data).filter(z => z.ownerUUID === u.uuid).filter(z => !h.includes(z)))
            }
            htxt = ""
            for (let i = 0; i < h.length; i++) {
                htxt = htxt + h[i].plot
                if ((i + 1) < h.length) {
                    htxt = htxt + ", "
                }
            }
            n = Object.values(plots["new arbridge"].data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
            if (u) {
                n = n.concat(Object.values(plots["new arbridge"].data).filter(z => z.ownerUUID === u.uuid).filter(z => !n.includes(z)))
            }
            ntxt = ""
            for (let i = 0; i < n.length; i++) {
                ntxt = ntxt + n[i].plot
                if ((i + 1) < n.length) {
                    ntxt = ntxt + ", "
                }
            }
            t = Object.values(plots["development zones"].data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
            if (u) {
                t = t.concat(Object.values(plots["development zones"].data).filter(z => z.ownerUUID === u.uuid).filter(z => !t.includes(z)))
            }
            ttxt = ""
            for (let i = 0; i < t.length; i++) {
                ttxt = ttxt + t[i].plot
                if ((i + 1) < t.length) {
                    ttxt = ttxt + ", "
                }
            }
            z = Object.values(plots.airport.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
            if (u) {
                z = z.concat(Object.values(plots.airport.data).filter(z => z.ownerUUID === u.uuid).filter(y => !z.includes(y)))
            }
            ztxt = ""
            for (let i = 0; i < z.length; i++) {
                ztxt = ztxt + z[i].plot
                if ((i + 1) < z.length) {
                    ztxt = ztxt + ", "
                }
            }
            d = Object.values(plots.harlowfield.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
            if (u) {
                d = d.concat(Object.values(plots.harlowfield.data).filter(z => z.ownerUUID === u.uuid).filter(y => !z.includes(y)))
            }
            dtxt = ""
            for (let i = 0; i < d.length; i++) {
                dtxt = dtxt + d[i].plot
                if ((i + 1) < d.length) {
                    dtxt = dtxt + ", "
                }
            }
            let embed = new Discord.EmbedBuilder()
                .setTitle(user + "'s plots")
                .setDescription("Total plots: " + (a.length + c.length + h.length + n.length + t.length))
                .addFields({
                    name: "🏖️ Ailsbury (" + a.length + ")",
                    value: atxt || "*None*"
                }, {
                    name: "🏠 Cashvillage (" + c.length + ")",
                    value: ctxt || "*None*"
                }, {
                    name: "🌲 Hemstead (" + h.length + ")",
                    value: htxt || "*None*"
                }, {
                    name: "🏭 New Arbridge (" + n.length + ")",
                    value: ntxt || "*None*"
                }, {
                    name: "🛫 Airport (" + z.length + ")",
                    value: ztxt || "*None*"
                }, {
                    name: "🏰 Harlowfield (" + d.length + ")",
                    value: dtxt || "*None*"
                }, {
                    name: "🏝️ Hamlets (" + t.length + ")",
                    value: ttxt || "*None*"
                })
                .setColor("#E91E63")
                .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
        } else if (interaction.commandName === "Check points") {
            let user = interaction.targetMember;
            let self = (user === interaction.member);
            let u = require("../Points/points").getPoints(user.user.id)
            let dc = 0;
            let embed = new Discord.EmbedBuilder()
                .setTitle((self ? "Your points" : (user.nickname || user.user.globalName) + "'s points"))
                .setColor("#e91e63")
            let mc = 0;
            u.mc.forEach(d => {
                mc = mc + d.amount;
                embed
                    .addFields({
                        name: d.amount + " minecraft points (ID: " + d.id + ")",
                        value: "Reason: " + d.reason + " | Points given <t:" + d.timestamp + ":R>"
                    })
            })
            u.dc.forEach(d => {
                dc = dc + d.amount;
                embed
                    .addFields({
                        name: d.amount + " discord points (ID: " + d.id + ")",
                        value: "Reason: " + d.reason + " | Points given <t:" + d.timestamp + ":R>"
                    })
            })
            embed
                .setDescription((self ? "You've got " : (user.nickname || user.user.globalName) + " has ") + " a total of `" + mc + "` minecraft points and `" + dc + "` discord points.")

            interaction.reply({ embeds: [embed], ephemeral: true })
            return;
        } else {
            return interaction.reply("<:CC_Cross:1180965168440692807> Invalid context menu.")
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "chill") {
            interaction.reply({ content: "This button does nothing lol", ephemeral: true })
        } else if (interaction.customId === "plots") {
            interaction.reply({ embeds: [new Discord.EmbedBuilder().setDescription("Click [here](https://www.youtube.com/watch?v=xvFZjo5PgG0) to view who owns the most plots in cashcraft :D").setTimestamp().setColor("#ff6666")], ephemeral: true })
        } else if (interaction.customId.startsWith("revoke-")) {
            require("../Points/points").revoke(interaction)
        } else {
            let data = interaction.customId.split("-")
            let msg = data[0]
            let channel = data[1]
            let action = data[2]
            if (action === "favour") {
                let pollInfo = polls.read("p" + msg + "" + channel)
                if (!pollInfo) return interaction.reply({ content: "Please try again in 1 minute.", ephemeral: true })
                if (pollInfo.b.includes(interaction.user.id)) return interaction.reply({ content: "You can't vote on this poll.", ephemeral: true })
                if (pollInfo.voted.indexOf(interaction.user.id) == -1) {
                    interaction.reply({ content: "You've voted in favour of it.", ephemeral: true })
                    //interaction.member.roles.add("1186455975654346772")
                    let m = await interaction.guild.channels.cache.get(channel).messages.fetch(msg)
                    pollInfo.favour += 1;
                    pollInfo.voted.push(interaction.member.id.toString())
                    m.embeds[0].data.description = "## " + pollInfo.q + "\n\n:white_check_mark: Yes - `??` \n:x: No - `??`"
                    m.edit({ embeds: m.embeds })
                    polls.write(("p" + msg + "" + channel), pollInfo)
                } else {
                    interaction.reply({ content: "You've already voted.", ephemeral: true })
                }
            }
            if (action === "against") {
                let pollInfo = polls.read("p" + msg + "" + channel)
                if (!pollInfo) return interaction.reply({ content: "Please try again in 1 minute.", ephemeral: true })
                if (pollInfo.b.includes(interaction.user.id)) return interaction.reply({ content: "You can't vote on this poll.", ephemeral: true })
                if (pollInfo.voted.indexOf(interaction.user.id) == -1) {
                    interaction.reply({ content: "You've voted against it.", ephemeral: true })
                    //interaction.member.roles.add("1186455975654346772")
                    let m = await interaction.guild.channels.cache.get(channel).messages.fetch(msg)
                    pollInfo.against += 1;
                    pollInfo.voted.push(interaction.member.id.toString())
                    m.embeds[0].data.description = "## " + pollInfo.q + "\n\n:white_check_mark: Yes - `??` \n:x: No - `??`"
                    m.edit({ embeds: m.embeds })
                    polls.write(("p" + msg + "" + channel), pollInfo)
                } else {
                    interaction.reply({ content: "You've already voted.", ephemeral: true })
                }
            }
            if (action === "close") {
                let u = data[3]
                if (interaction.member.id.toString() !== u) return interaction.reply({ content: "You can't close this poll.", ephemeral: true })
                interaction.reply({ content: "Closed the poll.", ephemeral: true })
                let pollInfo = polls.read("p" + msg + "" + channel)
                let m = await interaction.guild.channels.cache.get(channel).messages.fetch(msg)
                m.embeds[0].data.description = "## " + pollInfo.q + "\n\n" + (pollInfo.against < pollInfo.favour ? "### " : "") + ":white_check_mark: Yes - `" + pollInfo.favour + "` \n" + (pollInfo.against > pollInfo.favour ? "### " : "") + ":x: No - `" + pollInfo.against + "`"
                m.edit({ embeds: m.embeds, components: [] })
            }
        }
    }
    if (interaction.isAutocomplete()) {
        const command = c.commands.get(interaction.commandName.replaceAll("-", ""));
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }


        let choices = []

        let focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === "user") {
            let content = interaction.options.getString("user")
            if (content === "*") {
                choices = [];
            } else {
                let base = content.split(",").slice(0, content.split(",").length - 1).join(",");
                Object.values(mcUsers.all()).forEach(o => (!base.includes(o.name) ? choices.push(base + (base === "" ? "" : ",") + o.name) : false))
                let input = content.split(",")[content.split(",").length - 1];
                content === "" ? choices.push("*") : null;
                if (input !== "") choices = choices.filter(a => (a.toLowerCase().startsWith(base.toLowerCase() + (base === "" ? "" : ",") + input.toLowerCase())));
                choices.sort()
                choices = choices.slice(0, 25)
            }
            try {
                await interaction.respond(choices.map(c => ({ name: c, value: c })))
            } catch (error) {
                console.error(error);
            }
        }
        if (focusedOption.name === "hamlet") {
            choices = []
            Object.values(hamlets).forEach(h => {
                if (h.code !== null) choices.push(h)
            })
            let content = interaction.options.getString("hamlet")
            let input = content.split(",")[content.split(",").length - 1];
            if (input !== "") choices = choices.filter(a => (a.name.toLowerCase().startsWith(input.toLowerCase())));
            choices.sort((a, b) => {
                if (a.name < b.name) return -1
                if (a.name > b.name) return 1
                return 0;
            })
            try {
                await interaction.respond(choices.map(c => ({ name: "[" + c.kind + "] " + c.name, value: c.code })))
            } catch (error) {
                console.error(error);
            }
        }
        if (focusedOption.name === "code") {
            let content = interaction.options.getString("code")
            if (content === "*") {
                choices = [];
            } else {
                let users = interaction.options.getString("user")
                let base = content.split(",").slice(0, content.split(",").length - 1).join(",");
                Object.values(plots).forEach(vil => {
                    Object.values(vil.data).forEach(a => {
                        if (users === "*" && !base.includes(a.plot)) {
                            choices.push(base + (base === "" ? "" : ",") + a.plot);
                        } else if (users.split(",").indexOf(a.owner) > -1 && !base.includes(a.plot)) {
                            choices.push(base + (base === "" ? "" : ",") + a.plot);
                        }
                    })
                })
                let input = content.split(",")[content.split(",").length - 1];
                content === "" ? choices.push("*") : choices = choices.filter(a => (input === "" || a.toLowerCase().startsWith(input.toLowerCase())));
                choices.sort()
                choices = choices.slice(0, 25)
            }
            try {
                await interaction.respond(choices.map(c => ({ name: c, value: c })))
            } catch (error) {
                console.error(error);
            }
        }
    }
    if (interaction.isCommand()) {
        if (interaction.commandName === "eval" && (interaction.user.id === "896732255534338078" || interaction.user.id === "746250102162718800"  || interaction.user.id === "610107955244826653")) {
            try {
                eval("(async () => { " + interaction.options.getString("code") + "})()")
            } catch (e) {
                interaction.reply({ content: e.toString(), ephemeral: true })
            }
            return
        } else if (interaction.commandName === "message" && (interaction.member.roles.cache.has("955534024443592704"))) {
            try {
                let user;
                if (interaction.options.getUser("user")) {
                    user = await interaction.guild.members.fetch(interaction.options.getUser("user").id)
                }
                if (!user) {
                    return interaction.reply("<:CC_Cross:1180965168440692807> User not found")
                }
                let msg = interaction.options.getString("message")
                let prefix = "Server Owner"
                if (interaction.member.roles.cache.has("949618715262066689")) prefix = "Server Technician"
                else if (interaction.member.id === "856950391556276305") prefix = "Server Technician"
                else if (interaction.member.roles.cache.has("953376180357173279")) prefix = "Community Manager"
                user.createDM().then(cn => {
                    cn.send({ content: `You've received a message from the ${prefix}, **${interaction.member.nickname || interaction.user.globalName}**: \`\`\`${msg}\`\`\`` })
                }).catch(e => {
                    console.log("FAILED to DM " + u.user.username)
                    interaction.reply("FAILED to DM " + u.user.username)
                    return;
                })
                interaction.reply({ content: "DMed " + (user.nickname || user.user.globalName || user.user.username), ephemeral: true })
            } catch (e) {
                interaction.reply({ content: e.toString, ephemeral: true })
            }
            return
        }
        if (interaction.commandName === "poll") {
            const modal = new Discord.ModalBuilder()
                .setCustomId('pollModal')
                .setTitle('New poll');
            questionInput = new Discord.TextInputBuilder()
                .setCustomId('questionInput')
                .setLabel("Question")
                .setStyle(Discord.TextInputStyle.Short)
                .setPlaceholder("Should Ailsbury expand?");
            blockedInput = new Discord.TextInputBuilder()
                .setCustomId('blockedInput')
                .setLabel("Blocked IDs")
                .setPlaceholder("The users with these IDs won't be allowd to vote on this poll.")
                .setStyle(Discord.TextInputStyle.Short)
                .setRequired(false);
            [questionInput, blockedInput].forEach(m => {
                row = new Discord.ActionRowBuilder().addComponents(m);
                modal.addComponents(row)
            })
            await interaction.showModal(modal)

            return;
        }
        if (interaction.commandName === "points") {
            let user = interaction.member;
            if (interaction.member.roles.cache.has("953720555515826236")) {
                if (interaction.options.getUser("user")) {
                    user = await interaction.guild.members.fetch(interaction.options.getUser("user").id)
                }
            }
            let self = (user === interaction.member);
            let u = require("../Points/points").getPoints(user.user.id)
            let dc = 0;
            let embed = new Discord.EmbedBuilder()
                .setTitle((self ? "Your points" : (user.nickname || user.user.globalName) + "'s points"))
                .setColor("#e91e63")
            let mc = 0;
            u.mc.forEach(d => {
                mc = mc + d.amount;
                embed
                    .addFields({
                        name: d.amount + " minecraft points (ID: " + d.id + ")",
                        value: "Reason: " + d.reason + " | Points given <t:" + d.timestamp + ":R>"
                    })
            })
            u.dc.forEach(d => {
                dc = dc + d.amount;
                embed
                    .addFields({
                        name: d.amount + " discord points (ID: " + d.id + ")",
                        value: "Reason: " + d.reason + " | Points given <t:" + d.timestamp + ":R>"
                    })
            })
            embed
                .setDescription((self ? "You've got " : (user.nickname || user.user.globalName) + " has ") + " a total of `" + mc + "` minecraft points and `" + dc + "` discord points.")

            interaction.reply({ embeds: [embed], ephemeral: true })
            return;
        }
        interaction.deferReply().then(async a => {
            if (interaction.commandName === "list-plots") {
                let code = interaction.options.getString("code")
                let village = interaction.options.getString("village")
                if (!village && !code) {
                    interaction.editReply("❌ You must enter a village and/or a valid plot code.")
                }
                let z;
                if (village === "global") {
                    z = Object.values(plots.ailsbury.data)
                    z = z.concat(Object.values(plots.cashvillage.data))
                    z = z.concat(Object.values(plots.hemstead.data))
                    z = z.concat(Object.values(plots["new arbridge"].data))
                    z = z.concat(Object.values(plots.harlowfield.data))
                    z = z.concat(Object.values(plots["development zones"].data))
                    z = z.concat(Object.values(plots.airport.data))
                } else {
                    z = Object.values(plots[village].data)
                }
                if (code) {
                    z = z.filter(a => a.plot.replace(/[0-9]/g, '') === code)
                }
                let y = z.filter(a => (a.owner === "" || a.owner === "[BANNED]"))
                ytxt = ""
                for (let i = 0; i < y.length; i++) {
                    ytxt = ytxt + y[i].plot
                    if ((i + 1) < y.length) {
                        ytxt = ytxt + ", "
                    }
                }
                let x = z.filter(a => (a.owner !== "" && a.owner !== "[BANNED]"))
                xtxt = ""
                let v = []
                v.push({ owner: "[BANNED]", count: 0 })
                z.forEach(p => {
                    if (p.owner !== "") {
                        if (!v.find(a => a.owner === p.owner)) {
                            v.push({ owner: p.owner, count: 1 })
                        } else {
                            u = v.find(a => a.owner === p.owner)
                            v.splice(v.indexOf(u), 1);
                            u.count++;
                            v.push(u);
                        }
                    }
                })

                v.sort((a, b) => b.count - a.count)
                t = z.filter(a => a.owner === "[BANNED]")
                for (let i = 0; i < x.length; i++) {
                    xtxt = xtxt + x[i].plot
                    if ((i + 1) < x.length) {
                        xtxt = xtxt + ", "
                    }
                }
                ttxt = ""
                for (let i = 0; i < t.length; i++) {
                    ttxt = ttxt + t[i].plot
                    if ((i + 1) < t.length) {
                        ttxt = ttxt + ", "
                    }
                }
                ytxt2 = ""
                xtxt2 = ""
                if (ytxt.length > 100) {
                    ytxt2 = "*(Result trimmed, please read console for the entire list)*"
                }
                if (xtxt.length > 100) {
                    xtxt2 = "*(Result trimmed, please read console for the entire list)*"
                }
                let embed = new Discord.EmbedBuilder()
                    .setTitle(village.toUpperCase() + " plots")
                    .setDescription("Total plots: " + (z.length) + "\nAverage plots per person: " + Math.round(x.length / v.length * 100) / 100 + " plots.\nFree plots per claimed plots: " + Math.round(y.length / x.length * 100) / 100 + " plots.")
                    .addFields({
                        name: "✅ Available plots (" + y.length + ")",
                        value: (ytxt.substring(0, 100) + ytxt2) || "*None*"
                    }, {
                        name: "❌ Claimed plots (" + x.length + ")",
                        value: (xtxt.substring(0, 100) + xtxt2) || "*None*"
                    }, {
                        name: "👥 Person with the most plots (" + v[0].count + "/" + Math.round(v[0].count / z.length * 100) + "%)",
                        value: v[0].owner || "*None*"
                    }, {
                        name: "⛔ Plots owned by banned people (" + v[v.indexOf(v.find(a => a.owner === "[BANNED]"))].count + "/" + Math.round(v[v.indexOf(v.find(a => a.owner === "[BANNED]"))].count / z.length * 100) + "%)",
                        value: ttxt || "*None*"
                    })
                    .setColor("#E91E63")
                    .setTimestamp()
                console.log("====== Plot info of " + village + " @ " + (code || "ALL") + " ======")
                console.log("  - Free plots: " + ytxt)
                console.log("  - Claimed plots: " + xtxt)
                console.log("  - Total plots: " + z.length)
                console.log("  - Average plots per player: " + Math.round(x.length / v.length * 100) / 100)
                console.log("  - Free plots per claimed plots: " + Math.round(y.length / x.length * 100) / 100)
                console.log("  - Plot owners: (TOTAL: " + v.length + ")")
                v.forEach(pown => {
                    console.log("    - " + pown.owner + " >> " + pown.count + " plots")
                })
                console.log("  - Test ran on " + (new Date(Date.now())).toString())
                console.log("====== Plot info of " + village + " @ " + (code || "ALL") + " ======")
                interaction.editReply({ embeds: [embed], ephemeral: true })
            } else if (interaction.commandName === "extend") {
                let users = interaction.options.getString("user").split(",")
                let reason = interaction.options.getString("reason")
                let codes = interaction.options.getString("code").split(",")
                let dates = interaction.options.getString("date").split("-")
                let plotsToExtend = [];
                Object.keys(plots).forEach(vil => {
                    Object.values(plots[vil].data).forEach(a => {
                        a.village = vil
                        if (users[0] === "*") {
                            plotsToExtend.push(a)
                        } else if (users.indexOf(a.owner) > -1) {
                            plotsToExtend.push(a)
                        }
                    })
                })
                let plotsToExtendFinal = [];
                plotsToExtend.forEach(plot => {
                    if (codes[0] === "*" || codes.indexOf(plot.plot) > -1) {
                        let expires = plot.expires * 1000;
                        let lower = (new Date(dates[0] + " 00:00:00 ")).getTime()
                        let upper = (new Date(dates[1] + " 23:59:59 ")).getTime()
                        if (expires >= lower && expires < upper) {
                            plotsToExtendFinal.push(plot)
                        }
                    }
                })
                let dms = {}
                let monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
                plotsToExtendFinal.forEach(plot => {
                    if (!dms[plot.owner]) {
                        dms[plot.owner] = [];
                    }
                    let newDate = dates[1].split("/")
                    newDate[1] = parseInt(newDate[1]) + 1;
                    if (newDate[1] > monthLength[parseInt(newDate[0] - 1)]) {
                        newDate[1] -= monthLength[parseInt(newDate[0] - 1)]
                        newDate[0] = parseInt(newDate[0]) + 1;
                        if (newDate[0] > 12) {
                            newDate[0] = 1;
                            newDate[2] = parseInt(newDate[2]) += 1;
                        }
                    }
                    require("../spreadsheet.js").extendPlot(auth, plot.plot, plot.owner, plot.village, plot.ownerId, plot.ownerUUID, plot.claimedAt, (new Date(newDate + " 00:00:00")).getTime())
                    dms[plot.owner].push({ plot: plot.plot, newDate: (new Date(newDate + " 00:00:00")).getTime() })
                })
                let responsetxt = ""
                let r = 0;
                let newDate = 0;
                Object.keys(dms).forEach(user => {
                    let usersAll = mcUsers.all();
                    let userId = Object.keys(usersAll).find(z => usersAll[z].name === user);
                    if (!userId) return console.log(user)
                    userId = userId.replace("u", "");
                    newDate = dms[user][0].newDate;
                    responsetxt = responsetxt + "\n" + " > " + user + " - " + dms[user].length + " plots";
                    interaction.guild.members.fetch(userId).then(member => {
                        member.createDM().then(c => {
                            let plotsTxt = "";
                            for (let i = 0; i < dms[user].length; i++) {
                                let a = dms[user][i];
                                plotsTxt = plotsTxt + "\n" + a.plot;
                                newDate = a.newDate;
                            }
                            c.send("A total of " + dms[user].length + " plots have been extended for the following reason: **" + reason + "**. They'll now expire <t:" + (Math.floor(newDate / 1000)) + ":R>. \nThe plots that were extended are the following: ```" + plotsTxt + "```").catch(e => {
                                console.log(e);
                                interaction.channel.send("Failed to DM <@" + member.id + ">.");
                            });
                        }).catch(e => {
                            console.log(e);
                            interaction.channel.send("Failed to DM <@" + member.id + ">.");
                        });
                    });
                    r += dms[user].length;
                })
                interaction.editReply("Extended " + r + " plots' deadlines. They'll now expire <t:" + (Math.floor(newDate / 1000)) + ":R>. ```" + responsetxt + "```")
            } else if (interaction.commandName === "plots") {
                let user = interaction.member.nickname || interaction.user.globalName || interaction.user.username;
                if (interaction.member.roles.cache.has("953720555515826236")) {
                    user = interaction.options.getString("user") || interaction.member.nickname || interaction.user.globalName || interaction.user.username
                }
                let m = interaction.guild.members.cache.find(z => (z.nickname === user || z.user.globalName === user || z.user.username === user));
                a = Object.values(plots.ailsbury.data).filter(z => (z.owner === user || z.ownerId === m.id.toString()))
                let u = mcUsers.read("u" + m.id)
                if (u.name.startsWith(".")) {
                    u = undefined;
                }
                if (u) {
                    a = a.concat(Object.values(plots.ailsbury.data).filter(z => z.ownerUUID === u.uuid).filter(z => !a.includes(z)))
                }
                atxt = ""
                for (let i = 0; i < a.length; i++) {
                    atxt = atxt + a[i].plot
                    if ((i + 1) < a.length) {
                        atxt = atxt + ", "
                    }
                }
                c = Object.values(plots.cashvillage.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
                if (u) {
                    c = c.concat(Object.values(plots.cashvillage.data).filter(z => z.ownerUUID === u.uuid).filter(z => !c.includes(z)))
                }
                ctxt = ""
                for (let i = 0; i < c.length; i++) {
                    ctxt = ctxt + c[i].plot
                    if ((i + 1) < c.length) {
                        ctxt = ctxt + ", "
                    }
                }
                h = Object.values(plots.hemstead.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
                if (u) {
                    h = h.concat(Object.values(plots.hemstead.data).filter(z => z.ownerUUID === u.uuid).filter(z => !h.includes(z)))
                }
                htxt = ""
                for (let i = 0; i < h.length; i++) {
                    htxt = htxt + h[i].plot
                    if ((i + 1) < h.length) {
                        htxt = htxt + ", "
                    }
                }
                n = Object.values(plots["new arbridge"].data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
                if (u) {
                    n = n.concat(Object.values(plots["new arbridge"].data).filter(z => z.ownerUUID === u.uuid).filter(z => !n.includes(z)))
                }
                ntxt = ""
                for (let i = 0; i < n.length; i++) {
                    ntxt = ntxt + n[i].plot
                    if ((i + 1) < n.length) {
                        ntxt = ntxt + ", "
                    }
                }
                t = Object.values(plots["development zones"].data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
                if (u) {
                    t = t.concat(Object.values(plots["development zones"].data).filter(z => z.ownerUUID === u.uuid).filter(z => !t.includes(z)))
                }
                ttxt = ""
                for (let i = 0; i < t.length; i++) {
                    ttxt = ttxt + t[i].plot
                    if ((i + 1) < t.length) {
                        ttxt = ttxt + ", "
                    }
                }
                z = Object.values(plots.airport.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
                if (u) {
                    z = z.concat(Object.values(plots.airport.data).filter(z => z.ownerUUID === u.uuid).filter(y => !z.includes(y)))
                }
                ztxt = ""
                for (let i = 0; i < z.length; i++) {
                    ztxt = ztxt + z[i].plot
                    if ((i + 1) < z.length) {
                        ztxt = ztxt + ", "
                    }
                }
                d = Object.values(plots.harlowfield.data).filter(a => (a.owner === user || a.ownerId === m.id.toString()))
                if (u) {
                    d = d.concat(Object.values(plots.harlowfield.data).filter(z => z.ownerUUID === u.uuid).filter(y => !z.includes(y)))
                }
                dtxt = ""
                for (let i = 0; i < d.length; i++) {
                    dtxt = dtxt + d[i].plot
                    if ((i + 1) < d.length) {
                        dtxt = dtxt + ", "
                    }
                }
                let embed = new Discord.EmbedBuilder()
                    .setTitle(user + "'s plots")
                    .setDescription("Total plots: " + (a.length + c.length + h.length + n.length + t.length))
                    .addFields({
                        name: "🏖️ Ailsbury (" + a.length + ")",
                        value: atxt || "*None*"
                    }, {
                        name: "🏠 Cashvillage (" + c.length + ")",
                        value: ctxt || "*None*"
                    }, {
                        name: "🌲 Hemstead (" + h.length + ")",
                        value: htxt || "*None*"
                    }, {
                        name: "🏭 New Arbridge (" + n.length + ")",
                        value: ntxt || "*None*"
                    }, {
                        name: "🛫 Airport (" + z.length + ")",
                        value: ztxt || "*None*"
                    }, {
                        name: "🏰 Harlowfield (" + d.length + ")",
                        value: dtxt || "*None*"
                    }, {
                        name: "🏝️ Hamlets (" + t.length + ")",
                        value: ttxt || "*None*"
                    })
                    .setColor("#E91E63")
                    .setTimestamp()
                interaction.editReply({ embeds: [embed], ephemeral: true })
            } else if (interaction.commandName === "create-plot") {
                try {
                    let v = interaction.options.getString("village")
                    let p = interaction.options.getString("plot-code")
                    p = parsePlot(p)
                    let a = interaction.options.getInteger("amount")
                    let o = interaction.options.getInteger("offset")

                    if (!a) a = 1
                    if (!o) o = 0
                    v = v.toLowerCase()
                    let r = await require("../spreadsheet").createPlot(auth, p, null, v, a, o)
                    if (r.status === 200) {
                        plots[v] = r.plots
                        pr = (plots.ailsbury.rows - 7) + (plots.hemstead.rows - 7) + (plots.cashvillage.rows - 7) + (plots["new arbridge"].rows - 7)
                        interaction.editReply("Succesefully created **" + a + "** plots in **" + v + "**. (" + p + (o + 1) + " to " + p + (o + a) + ")")
                        c.user.setActivity(pr + " plots.", { type: Discord.ActivityType.Watching })
                        return;
                    } else {
                        interaction.editReply("Failed to create plots in **" + v + "**.  Received the following error: `" + r.status + "`.")
                        return;
                    }
                } catch (e) {
                    console.log(e)
                    interaction.editReply("<:CC_Cross:1180965168440692807> An unknown error has occured.")
                }
            } else if (interaction.commandName === "create-hplot") {
                try {
                    let v = interaction.options.getString("hamlet")
                    let p = interaction.options.getString("plot-type")
                    let a = interaction.options.getInteger("amount")
                    let o = interaction.options.getInteger("offset")
                    if (!a) a = 1
                    if (!o) o = 0
                    let h = Object.values(hamlets).find(a => a.code === v)
                    if (h.developer !== interaction.user.id.toString() && (h["co-developer"] ? h["co-developer"].includes(interaction.user.id.toString()) : true)) {
                        return interaction.editReply("<:CC_Cross:1180965168440692807> You can't create plots in this hamlet.")
                    }
                    if (!p.match(/[A-F]/g)) {
                        return interaction.editReply("<:CC_Cross:1180965168440692807> Invalid plot type. It can only be A, B, C, D, E or F")
                    }
                    let code = "O" + v + p
                    let r = await require("../spreadsheet").createPlot(auth, code, null, "Development Zones", a, o)
                    if (r.status === 200) {
                        plots["development zones"] = r.plots
                        pr = (plots.ailsbury.rows - 7) + (plots.hemstead.rows - 7) + (plots.cashvillage.rows - 7) + (plots["new arbridge"].rows - 7) + (plots["development zones"].rows - 7)
                        interaction.editReply("Succesefully created **" + a + "** plots in your Hamlet (" + code + (o + 1) + " to " + code + (o + a) + ")")
                        c.user.setActivity(pr + " plots.", { type: Discord.ActivityType.Watching })
                        return;
                    } else {
                        interaction.editReply("Failed to create plots in **" + h.name + "**.  Received the following error: `" + r.status + "`.")
                        return;
                    }
                } catch (e) {
                    console.log(e)
                    interaction.editReply("<:CC_Cross:1180965168440692807> An unknown error has occured.")
                }
            } else if (interaction.commandName === "who-has-the-most-plots") {
                interaction.editReply("Reading database...")
                setTimeout(() => {
                    let row = new Discord.ActionRowBuilder()
                    let chill = new Discord.ButtonBuilder()
                        .setCustomId('plots')
                        .setLabel('Who owns the most plots?')
                        .setStyle(Discord.ButtonStyle.Primary);
                    row.addComponents(chill);
                    interaction.editReply({ content: "Click below to see who has the most plots in cashcraft!", components: [row] })
                }, 2000)
            } else if (interaction.commandName === "reload") {
                interaction.editReply("Reloading...")
                plots.ailsbury = await require("../spreadsheet").listPlots(auth, "Ailsbury")
                plots.hemstead = await require("../spreadsheet").listPlots(auth, "Hemstead")
                plots.cashvillage = await require("../spreadsheet").listPlots(auth, "Cashvillage")
                plots["new arbridge"] = await require("../spreadsheet").listPlots(auth, "New Arbridge")
                plots.harlowfield = await require("../spreadsheet").listPlots(auth, "Harlowfield")
                plots.airport = await require("../spreadsheet").listPlots(auth, "Airport")
                plots["development zones"] = await require("../spreadsheet").listPlots(auth, "Development Zones")
                pr = (plots.ailsbury.rows - 7) + (plots.hemstead.rows - 7) + (plots.airport.rows - 7) + (plots.harlowfield.rows - 7) + (plots["development zones"].rows - 7) + (plots.cashvillage.rows - 7) + (plots["new arbridge"].rows - 7)
                c.user.setActivity(pr + " plots.", { type: Discord.ActivityType.Watching })
                cc = 0
                mc = 0
                channels = ["1023634411817795644", "1023646602713370674", "1023646688465924096", "1023646725090582548"]
                interaction.editReply("Reload complete. (Loaded " + pr + " plots).")
                channels.forEach(async channel => {
                    let cha = (await c.guilds.cache.get("903230722603614279").channels.fetch(channel))
                    channels2 = cha.guild.channels.cache.filter(c => c.parent === cha)
                    channels2.forEach(channel2 => {
                        channel2.messages.fetch({ limit: 100 }).then(m => {
                            mc += m.size
                            cc += 1
                        })
                    })
                })
                setTimeout(() => {
                    interaction.followUp("Cached " + mc + " messages in " + cc + " channels.")
                    checkPlots(interaction.guild, plots)
                    interaction.followUp("Sending reminders...")
                }, 1000)
            }
        }).catch(e => {
            console.log(e)
            interaction.editReply("<:CC_Cross:1180965168440692807> An unknown error has occured.")
        })
    }
}