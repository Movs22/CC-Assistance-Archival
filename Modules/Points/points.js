const DB = require("../database.js")
const pointsDB = new DB("./data/points.json")
const Discord = require("discord.js")
module.exports.getPoints = getPoints;
function getPoints(u) {
    let a = pointsDB.read("u" + u);
    if (a == null) {
        return { mc: [], dc: [] }
    } else {
        return a
    }
}

const canvas = require("canvas")

function givePoints(u, c, r, t, e, m, id, att) {
    let z = Math.round(Date.now()/1000)
    let a = { amount: c, reason: r, evidence: e, mod: m, id: (t ? "MC-" : "DC-") + id, timestamp: z }
    let b = pointsDB.read("u" + u.user.id);
    if(!b) {
        b = { mc: [], dc: [] };
    }
    if (t) {
        b.mc.push(a)
    } else {
        b.dc.push(a)
    }
    if (t) {
        amount = 0;
        b.mc.forEach(bp => {
            amount = amount + bp.amount
        })
        if (amount >= 20) {
            action = `You currently have **${amount} points**. \n> ⛔ You've reached **20** points. You are now permanently banned.`
            u.ban();
        } else if (amount < 20 && b.mcLast !== "7d" && amount >= 15) {
            action = `You currently have **${amount} points**. \n> 🔨 You've been banned for 7 days.`
            b.mcLast = "7d"
        } else if (amount < 15 && b.mcLast !== "48h" && amount >= 10) {
            action = `You currently have **${amount} points**. \n> 🔨 You've been banned for 1 day.`
            b.mcLast = "48h"
        } else if (amount < 10 && b.mcLast !== "24h" && amount >= 5) {
            action = `You currently have **${amount} points**. \n> 🚷 You've been muted/put in adventure for 1 day.`
            b.mcLast = "24j"
        } else if (amount < 5) {
            action = `You currently have **${amount} points**. (**${5 - amount} points** until you get **muted/in adventure for 24 hours**)
`
        } else if (amount > 5 && amount < 10) {
            action = `You currently have **${amount} points**. (**${10 - amount} points** until you get **banned for 24 hours**)
    `
        } else if (amount > 10 && amount < 15) {
            action = `You currently have **${amount} points**. (**${15 - amount} points** until you get **banned for 7 days**)
    `
        } else if (amount > 15) {
            action = `You currently have **${amount} points**. (**${20 - amount} points** until you get **permanently banned**)
`
        }
    } else {
        amount = 0;
        b.dc.forEach(bp => {
            amount = amount + bp.amount
        })
        if (amount > 19) {
            action = `You currently have **${amount} points**. \n> ⛔ You've reached **20** points. You are now permanently banned.`
            u.ban();
        } else if (amount < 20 && b.dcLast !== "7d" && amount >= 15) {
            action = `You currently have **${amount} points**. \n> 🔇 You've been timed out for 7 days.`
            b.dcLast = "7d"
            u.timeout(7 * 24 * 60 * 60 * 1000)
        } else if (amount < 15 && b.dcLast !== "48h" && amount >= 10) {
            action = `You currently have **${amount} points**. \n> 🔇 You've been timed out for 48 hours.`
            b.dcLast = "48h"
            u.timeout(48 * 60 * 60 * 1000)
        } else if (amount < 10 && b.dcLast !== "24h" && amount >= 5) {
            b.dcLast = "24h"
            action = `You currently have **${amount} points**. \n> 🔇 You've been timed out for 24 hours.`
            u.timeout(24 * 60 * 60 * 1000)
        } else if (amount < 5) {
            action = `You currently have **${amount} points**. (**${5 - amount} points** until you get **timed out for 24 hours**)
`
        } else if (amount > 5 && amount < 10) {
            action = `You currently have **${amount} points**. (**${10 - amount} points** until you get **timed out for 48 hours**)
    `
        } else if (amount > 10 && amount < 15) {
            action = `You currently have **${amount} points**. (**${15 - amount} points** until you get **timed out for 7 days**)
    `
        } else if (amount > 15) {
            action = `You currently have **${amount} points**. (**${20 - amount} points** until you get **permanently banned**)
    `
        }
    }
    u.createDM().then(cn => {
        cn.send({content: `## :warning: You've received ${c} ${t ? "minecraft" : "discord"} points.
:information_source: __You've received **${c}** ${t ? "minecraft" : "discord"}  points for the following reason:__ \`${r}\`.
${action}
*If you wish to appeal these points, please create a ticket. (Warn ID: \`${(t ? "MC-" : "DC-") + id}\`)*`, files: att})
    }).catch(e => {
        console.log("FAILED to DM " + u.user.username)
    });
    pointsDB.write("u" + u.user.id, b);
}

module.exports.revoke = async (interaction) => {
    if(interaction.member.roles.cache.has("955534024443592704")) {
    let a = interaction.customId.split("-")
    let t = (a[1] === "mc")
    let id = a[2]
    let d = a[3]
    let e = getPoints(d);
    let u = await interaction.guild.members.fetch(d)
    if(t) {
        let f = e.mc.find(a => a.id === "MC-" + id)
        e.mc.splice(e.mc.indexOf(f), 1)
        interaction.reply({content: "✅ Removed **" + f.amount + " point" +  (f.amount === 1 ? "" : "s") + "** from **" + (u.nickname || u.user.username) + "**.", ephemeral: true})
        u.createDM().then(cn => {
            cn.send({content: `## <:CC_happy:1026181344629366895> A total of ${f.amount} ${t ? "minecraft" : "discord"} points have been removed.
> :information_source: A server operator has removed these plots from your record. __Don't forget to follow the rules to avoid getting points again!__`
        })
        });
        interaction.message.delete();
    } else {
        let f = e.dc.find(a => a.id === "DC-" + id)
        e.dc.splice(e.dc.indexOf(f), 1)
        interaction.reply({content: "✅ Removed **" + f.amount + " points** from **" + (u.nickname || u.user.username) + "**.", ephemeral: true})
        u.createDM().then(cn => {
            cn.send({content: `## <:CC_happy:1026181344629366895> A total of ${f.amount} ${t ? "minecraft" : "discord"} points have been removed.
    :information_source: A server operator has removed these plots from your record. __Don't forget to follow the rules to avoid getting points again!__`
        })
        });
        interaction.message.delete();
    }
    pointsDB.write("u" + u.user.id, e);
} else {
    interaction.reply({content: ":x: You can't revoke points.", ephemeral: true})
}
};

module.exports.parsePoints = async (m, t) => {
    let a = m.content;
    let b = a.split("\n").join(": ").split(": ")
    let name = "";
    let amount = 0;
    let reason = "";
    let evidence = "";
    for (let i = 0; i < b.length; i += 2) {
        if (b[i].toLowerCase() === "name") {
            name = b[i + 1];
        }
        if (b[i].toLowerCase() === "amount") {
            if (isNaN(b[i + 1]) || parseInt(b[i + 1]) < 1 || parseInt(b[i + 1]) > 6) {
                m.react("❌")
                m.channel.send("❌ Invalid amount of points.").then(m2 => {
                    setTimeout(() => {
                        if(m2) {
                            m2.delete()
                        }
                    }, 5000)
                })
                return;
            }
            amount = parseInt(b[i + 1]);
        }
        if (b[i].toLowerCase() === "reason") {
            reason = b[i + 1];
        }
    }
    if (name === "" || amount === 0 || reason === "") {
        m.react("❌")
        m.channel.send("❌ Missing " + (name === "" ? "a player name" : reason === "" ? "a valid reason" : "a valid amount of points") + ".").then(m2 => {
            setTimeout(() => {
                if(m2) {
                    m2.delete()
                }
            }, 5000)
        })
        return;
    }
    await m.guild.members.fetch();
    let u = m.guild.members.cache.find(a => (a.nickname ? a.nickname.toLowerCase().includes(name.toLowerCase()) : false) || (a.user.globalName ? a.user.globalName.toLowerCase().includes(name.toLowerCase()) : false) || a.user.username.toLowerCase().includes(name.toLowerCase()))
    if (!u) {
        m.react("❌")
        m.channel.send("❌ Couldn't find someone named **" + name + "**.").then(m2 => {
            setTimeout(() => {
                if(m2) {
                    m2.delete()
                }
            }, 5000)
        })
        return;
    }
    u = await m.guild.members.fetch(u.user.id)
    /*if (u.roles.cache.has("953720555515826236") || (u.roles.cache.has("1146544652711907370") && !m.member.roles.cache.has("955534024443592704")) || u.roles.cache.has("903238945226227742")) {
        m.react("❌")
        m.channel.send("❌ You can't give points to **" + u.user.username + "**.").then(m2 => {
            setTimeout(() => {
                if(m2) {
                    m2.delete()
                }
            }, 5000)
        })
        return;
    }*/
    if(m.attachments.first()) {
        evidence = m.attachments.first().url || evidence;
    } else {
        m.react("❌")
        m.channel.send("❌ You need to provide a screenshot as evidence.").then(m2 => {
            setTimeout(() => {
                m2.delete()
            }, 5000)
        })
        return;
    }
    let total = 0;
    b = getPoints(u.user.id);
    if(t) {
        b.mc.forEach(bp => {
            total = total + bp.amount
        })
    } else {
        b.dc.forEach(bp => {
            total = total + bp.amount
        })
    }
    total = total + amount;
    let embed = new Discord.EmbedBuilder()
        .setTitle((t ? "Minecraft" : "Discord") + " Point Record")
        .setColor("#e91e63")
        .addFields({
            name: "Player",
            value: "`" + name + "`",
            inline: true
        }, {
            name: "Amount of points",
            value: "`" + amount + "` (Total: " + (total) + " points)",
            inline: true
        }, {
            name: "Reason",
            value: reason,
        })
    let att = []
    if(m.attachments.first()) {
        let attachment = m.attachments.first()
        let img = canvas.createCanvas(attachment.width, attachment.height)
        let ctx = img.getContext("2d")
        let img2 = await canvas.loadImage(attachment.attachment)
        ctx.drawImage(img2, 0, 0, attachment.width, attachment.height)
        att.push({
            attachment: img.toBuffer(),
            name:"evidence.png"
        })
        embed
            .setImage("attachment://evidence.png")
    }
    var id = await require('crypto').randomBytes(4).toString('hex');

        embed
            .setTimestamp()
            .setFooter({ text: ("Points given by " + (m.member.nickname || m.author.globalName || m.author.username) + " | Warn ID: " + id) })
        let revoke = new Discord.ButtonBuilder()
            .setCustomId('revoke-' + (t ? 'mc' : 'dc') + '-' + id + '-' + u.user.id)
            .setLabel('Revoke Points')
            .setStyle(Discord.ButtonStyle.Danger);
        let row = new Discord.ActionRowBuilder()
            .addComponents(revoke);
        givePoints(u, amount, reason, t, evidence, m.author.id, id, att)
        m.channel.send({ embeds: [embed], components: [row], files: att })
        m.delete();
}