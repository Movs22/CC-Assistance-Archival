let awaitingVerification = [];
const converter = require('hex2dec');

const fetch = require("node-fetch")

const Database = require("../database.js")
const Discord = require("discord.js")

const canvas = require("canvas")

const levelToXP = require("../../config/levelToXP.json")


const BOTCHANNELS = ["903232257639194634", "992828543128047706", "1177344531327373393", "903232257639194634"]

const XPCHANNELS = ["965182948422864937", "903232152513150977", "944511757261615114", "1127353282822680636", "1177691851436859493"]


let cooldown = [];

let lastMsg = {};

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function similar(a, b) {
    if (!a || !b) return 0;
    if (a.length > b.length) {
        return similarity(a.toLowerCase(), b.toLowerCase())
    } else {
        return similarity(b.toLowerCase(), a.toLowerCase())
    }
}

let users = new Database("./data/linked.json")

let xp = new Database("./data/xp.json")

const minecraftPlayer = require("../getMcInfo.js");

function parse(v) {
    if (v < 0) {
        return 0
    }
    if (v < 1000) {
        return v;
    } else if (v < 100000) {
        return (v / 1000).toString().substring(0, 4) + "K";
    } else if (v < 1000000) {
        return (v / 1000).toString().substring(0, 3) + "K";
    } else if (v < 100000000) {
        return (v / 1000).toString().substring(0, 4) + "M";
    } else if (v < 100000000) {
        return (v / 1000).toString().substring(0, 3) + "M";
    } else if (v < 100000000000) {
        return (v / 1000).toString().substring(0, 4) + "B";
    } else if (v < 100000000000) {
        return (v / 1000).toString().substring(0, 3) + "B";
    }

}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

lastMsg = {}

module.exports = async (c, message) => {
    if (message.guild == null) return
    if (((message.author.bot && message.author.id === "904658068913139752") || message.author.id === "896732255534338078") && message.channel.id === "1022950029159301201") {
        let m = message.content.split("] ");
        let u = m[0].replaceAll("[", "");
        m.shift()
        m = m.join("] ");
        let z = awaitingVerification.find(a => a.code === m);
        if (z) {
            if (z.expires > Date.now()) {
                message.guild.channels.cache.get(z.channel).send("||<@" + z.user + ">|| Verification successful! You've been linked to the minecraft account **" + u + "**.")
                awaitingVerification.slice(awaitingVerification.indexOf(z), 1)
                let z2 = await minecraftPlayer(u);
                z2 = z2.id
                users.write("u" + z.user, { name: u, uuid: z2 })
                return;
            } else {
                message.guild.channels.cache.get(z.channel).send("||<@" + z.user + ">|| That code has expired <t:" + Math.round(z.expires / 1000) + ":R>. Please do `!link` again.")
                awaitingVerification.slice(awaitingVerification.indexOf(z), 1)
                return;
            }
        }
        let a = Object.keys(users.content).find(k => users.content[k].name === u);
        if (a) {
            id = a;
            if (!cooldown.includes(id.toString().replaceAll("u", "") || id !== "u856950391556276305")) {
                if (similar(lastMsg[id.toString().replaceAll("u", "")], m) > 0.9) {

                } else {
                    let u = xp.read(id)
                    if (!u) {
                        u = { xp: 0, msgs: 0, mcMsgs: 0, level: 0, user: id.toString() }
                    }
                    u.mcMsgs += 1;
                    u.xp += (5 + Math.ceil(Math.random() * 5))
                    if (u.boostLeft > 0) {
                        let z = Math.round((15 + Math.ceil(Math.random() * 5)) * (u.boost - 1))
                        u.xp += z;
                        u.boostLeft -= z;
                    }
                    u.xp = Math.round(u.xp)
                    let lvl = levelToXP[u.level]
                    let user = message.guild.members.cache.get(id.replaceAll("u", ""));
                    if (!user) {
                        user = await message.guild.members.fetch(id.replaceAll("u", ""))
                    }
                    if (lvl.totalXp < u.xp) {
                        u.level += 1;
                        message.guild.channels.cache.get("903232152513150977").send("GG " + (user.nickname || user.user.globalName || user.user.username) + ", You've reached level **" + u.level + "**!")
                    }
                    xp.write(id, u)
                    cooldown.push(id.toString().replaceAll("u", ""))
                    lastMsg[id.toString().replaceAll("u", "")] = m;
                    setTimeout(() => {
                        cooldown.splice(cooldown.indexOf(id.toString().replaceAll("u", "")), 1)
                    }, 45 * 1000)
                }
            } else {
                let u = xp.read(id)
                if (!u) {
                    u = { xp: 0, msgs: 0, mcMsgs: 0, level: 0, user: id.toString() }
                }
                u.mcMsgs += 1;
                xp.write(id, u)
            }
        }
    };
    if (message.author.bot) return;
    if (!cooldown.includes(message.author.id.toString()) && XPCHANNELS.includes(message.channel.id)) {
        if (similar(lastMsg[message.author.id.toString()], message.content) > 0.9) {

        } else {
            let u = xp.read("u" + message.author.id)
            if (!u) {
                u = { xp: 0, msgs: 0, mcMsgs: 0, level: 0, user: message.author.id.toString() }
            }
            u.msgs += 1;
            u.xp += (15 + Math.ceil(Math.random() * 5))
            if (u.boostLeft > 0) {
                let z = (15 + Math.ceil(Math.random() * 5)) * (u.boost - 1)
                u.xp += z;
                u.boostLeft -= z;
            }
            let lvl = levelToXP[u.level]
            if (lvl.totalXp < u.xp) {
                u.level += 1;
                user = message.member
                message.channel.send("GG " + (user.nickname || user.user.globalName || user.user.username) + ", You've reached level **" + u.level + "**!")
            }
            xp.write("u" + message.author.id, u)
            cooldown.push(message.author.id.toString())
            lastMsg[message.author.id.toString()] = message.content;
            setTimeout(() => {
                cooldown.splice(cooldown.indexOf(message.author.id.toString()), 1)
            }, 45 * 1000)
        }
    } else {
        let u = xp.read("u" + message.author.id)
        if (!u) {
            u = { xp: 0, msgs: 0, mcMsgs: 0, level: 0, user: message.author.id.toString() }
        }
        u.msgs += 1;
        xp.write("u" + message.author.id, u)
    }
    if (!message.content.startsWith("!")) return;
    let args = message.content.split(" ")
    let cmd = args[0];
    cmd = cmd.toLowerCase();
    args.shift()
    if (cmd === "!clear" && message.member.roles.cache.has("953720555515826236")) {
        let amount = args[0]
        if (!amount || isNaN(amount) || parseInt(amount) < 1 || parseInt(amount) > 100) {
            return message.reply("<:CC_Cross:1180965168440692807> Invalid amount")
        }
        await message.channel.bulkDelete(parseInt(amount)).then(() => {
            message.channel.send("Deleted " + amount + " messages.").then(msg => setTimeout(() => { msg.delete(), 5000 }));
        });
    }
    if (cmd === "!link") {
        if (!BOTCHANNELS.includes(message.channel.id)) {
            return message.reply("<:CC_Cross:1180965168440692807> You can only run this command in <#" + BOTCHANNELS[0] + ">.")
        }
        let m = makeid(6)
        awaitingVerification.push({ user: message.author.id, code: m, channel: message.channel.id, expires: (Date.now() + 15 * 60 * 1000) })
        message.member.createDM().then(c => {
            c.send("Please send the following code: `" + m + "` when you're on the server. This code expires <t:" + Math.round((Date.now() + 15 * 60 * 1000) / 1000) + ":R>").then(m => {
                message.reply("Please check your DMs.")
            }).catch(e => {
                message.reply("Failed to DM you. Please make sure that you haven't blocked me and that your privacy settings in this server allow anyone to DM you.")
                return;
            })
        }).catch(e => {
            console.log(e)
            message.reply("Failed to DM you. Please make sure that you haven't blocked me and that your privacy settings in this server allow anyone to DM you.")
        })
    }
    if (cmd === "!userinfo") {
        if (!BOTCHANNELS.includes(message.channel.id)) {
            return message.reply("<:CC_Cross:1180965168440692807> You can only run this command in <#" + BOTCHANNELS[0] + ">.")
        }
        let u2 = message.mentions.members.first() || message.member;
        let u = users.read("u" + u2.user.id)
        if (!u) {
            return message.reply("<:CC_Cross:1180965168440692807> " + (u2 === message.member ? "You aren't" : "That user isn't") + " linked to a minecraft account. Please run `!link`")
        }

        let img = canvas.createCanvas(1024, 1024)
        let ctx = img.getContext("2d")
        let data;
        if (u) {
            if(u.name.startsWith(".")) {
                
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
        let c = ("000000" + converter.decToHex(u2.roles.highest.color.toString()).replaceAll("0x", ""));
        let embed = new Discord.EmbedBuilder()
            .setTitle("Information of " + u2.nickname)
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
            if(!u.name.startsWith(".")) embed.setThumbnail("attachment://skin.png")
            .setTimestamp()
        if (!u.name.startsWith(".") && data.name !== u.name) {
            u.name = data.name;
            users.write("u" + u2.user.id, u)
        }
        if (!u.name.startsWith(".")) {
            message.reply({ embeds: [embed], files: [{ attachment: img.toBuffer(), name: "skin.png" }] })
        } else {
            message.reply({ embeds: [embed]})
        }
    }
    if (cmd === "!rank") {
        if (!BOTCHANNELS.includes(message.channel.id)) {
            return message.reply("<:CC_Cross:1180965168440692807> You can only run this command in <#" + BOTCHANNELS[0] + ">.")
        }
        let u = message.mentions.members.first() || message.member;


        let img = canvas.createCanvas(800, 250)
        let ctx = img.getContext("2d")

        let info = xp.read("u" + u.user.id)
        if (!info) {
            return message.reply("<:CC_Cross:1180965168440692807> This user hasn't sent any message yet.")
        }

        let a = Object.values(xp.all());
        a.sort((c, b) => b.xp - c.xp)
        let rank = "#" + (a.indexOf(a.find(b => b.user === u.user.id.toString())) + 1)

        ctx.imageSmoothingEnabled = false
        canvas.registerFont('./Ubuntu/Ubuntu-Regular.ttf', { family: 'Ubuntu' })
        canvas.registerFont('./Ubuntu/Ubuntu-Bold.ttf', { family: 'Ubuntu Bold' })

        let gradient = ctx.createLinearGradient(125, 0, 800, 125)
        let c = ("000000" + converter.decToHex(u.roles.highest.color.toString()).replaceAll("0x", ""));
        gradient.addColorStop(0, "#" + c.substring(c.length - 6, c.length))
        gradient.addColorStop(1, "#4f5f6f")

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 250)
            ctx.fillStyle = "rgba(40, 50, 60, 0.9)";
            ctx.fillRect(0, 0, 800, 250)
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(20, 20, 760, 210)

        let name = (u.nickname || u.user.globalName)

        ctx.font = '35px Ubuntu Bold';
        ctx.fillStyle = "#ffffff"
        ctx.fillText(name, 240, 75)
        ctx.font = '15px Ubuntu';
        ctx.fillStyle = "#cfcfcf"
        ctx.fillText(parse(info.msgs) + " discord msgs | " + parse(info.mcMsgs) + " minecraft msgs", 240, 95)

        ctx.font = '30px Ubuntu Bold';
        ctx.fillStyle = "#ffffff"
        ctx.fillText("Level " + info.level, 240, 150)

        let lvl = levelToXP[(info.level).toString()]
        let lvl2 = levelToXP[(info.level - 1).toString()]

        let x = parse(info.xp - lvl2.totalXp);
        let x2 = " / " + parse(lvl.xp) + " XP";
        let x3 = (info.xp - lvl2.totalXp) / lvl.xp
        ctx.font = '25px Ubuntu';
        ctx.fillStyle = "#7f7f7f";
        ctx.fillText(x2, 760 - ctx.measureText(x2).width, 150)
        ctx.font = '25px Ubuntu';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(x, 760 - ctx.measureText(x2).width - ctx.measureText(x).width, 150)

        ctx.font = '65px Ubuntu Bold';
        ctx.fillStyle = "#ffffff"
        ctx.fillText(rank, 760 - ctx.measureText(rank).width, 95)

        ctx.restore()
        ctx.save()
        // progress bar

        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(240, 155, 520, 60, 30);
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = "#000000"
        ctx.fillRect(240, 155, 520, 60)

        ctx.restore()
        ctx.save()
        ctx.beginPath();
        ctx.roundRect(250, 165, 500, 40, 20);
        ctx.closePath()
        ctx.clip()

        ctx.fillStyle = "#7f7f7f"
        ctx.fillRect(250, 165, 500, 40)

        ctx.restore()
        ctx.save()
        ctx.beginPath();
        ctx.roundRect(250, 165, 500 * x3, 40, 20);
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = "#" + c.substring(c.length - 6, c.length)
        ctx.fillRect(250, 165, 500 * x3, 40)

        ctx.restore()

        ctx.save()

        ctx.beginPath();
        ctx.arc(125, 125, 85, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        let avatar = await canvas.loadImage((u.displayAvatarURL({ size: 4096, format: 'png' }) || u.user.avatarURL({ size: 4096, format: 'png' })).replaceAll(".webp", ".png"))
        ctx.drawImage(avatar, 40, 40, 170, 170)
        ctx.restore()
        ctx.save()

        // boost bar
        if (info.boostLeft > 0) {
            x3 = info.boostLeft / info.boostMax

            ctx.beginPath();
            ctx.roundRect(240, 215, 520, 10, 5);
            ctx.closePath()
            ctx.clip()
            ctx.fillStyle = "#000000"
            ctx.fillRect(240, 215, 520, 10)

            ctx.restore()
            ctx.save()
            ctx.beginPath();
            ctx.roundRect(241, 216, 518, 8, 4);
            ctx.closePath()
            ctx.clip()

            ctx.fillStyle = "rgba(63, 63, 63, 0.5)"
            ctx.fillRect(241, 216, 518, 8)

            ctx.restore()
            ctx.save()
            ctx.beginPath();
            ctx.roundRect(241, 216, 518 * x3, 8, 4);
            ctx.closePath()
            ctx.clip()
            ctx.fillStyle = "#ff00bc"
            ctx.fillRect(241, 216, 518 * x3, 8)

            ctx.restore()
            ctx.save()

        }

        message.channel.send({ files: [{ attachment: img.toBuffer(), name: "rankcard.png" }] })
    }
    if (cmd === "!levels") {
        if (!BOTCHANNELS.includes(message.channel.id)) {
            return message.reply("<:CC_Cross:1180965168440692807> You can only run this command in <#" + BOTCHANNELS[0] + ">.")
        }
        let msg = await message.reply("<a:CC_buffering:1165782264769155083> Loading...")
        let page = 1;
        if (args.length > 0) {
            page = parseInt(args[0]);
        }
        let img = canvas.createCanvas(1000, 1200)
        let ctx = img.getContext("2d")

        ctx.imageSmoothingEnabled = false

        let a = Object.values(xp.all());
        a.sort((c, b) => b.xp - c.xp)
        a = a.filter(a => a.xp >= 1);

        if (Math.ceil(a.length / 10) < page) {
            return msg.edit("<:CC_Cross:1180965168440692807> No users could be found on this page. Please try `!levels` or `!levels " + Math.ceil(a.length / 10) + "` instead.")
        }

        canvas.registerFont('./Ubuntu/Ubuntu-Regular.ttf', { family: 'Ubuntu' })
        canvas.registerFont('./Ubuntu/Ubuntu-Bold.ttf', { family: 'Ubuntu Bold' })
        let gradient = ctx.createLinearGradient(0, 600, 100, 600)
        gradient.addColorStop(0, "#e91e63")
        gradient.addColorStop(1, "#4f5f6f")

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 1200)
        ctx.fillStyle = "rgba(40, 50, 60, 0.9)";
        ctx.fillRect(0, 0, 1000, 1200)
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(20, 20, 960, 1160)

        ctx.font = '30px Ubuntu Bold';
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Username", 50, 60)
        ctx.fillText("Rank", 900 - ctx.measureText("Rank").width / 2, 60)
        ctx.fillText("Level", 800 - ctx.measureText("Level").width / 2, 60)
        ctx.fillText("XP", 700 - ctx.measureText("XP").width / 2, 60)

        for (let i = (page - 1) * 10; i < page * 10; i++) {
            if (i >= a.length) break;
            let u = a[i];
            ctx.font = '50px Ubuntu Bold';
            ctx.fillStyle = "#ffffff";

            let m = await message.guild.members.fetch(u.user);

            let gradient = ctx.createLinearGradient(30, 50, 950, 50)
            let c = ("000000" + converter.decToHex(m.roles.highest.color.toString()).replaceAll("0x", ""));
            gradient.addColorStop(0, "#" + c.substring(c.length - 6, c.length))
            gradient.addColorStop(1, "#4f5f6f")
            ctx.fillStyle = gradient;
            ctx.fillRect(30, 70 + (i - (page - 1) * 10) * 110, 940, 100)
            ctx.fillStyle = "rgba(40, 50, 60, 0.9)";
            ctx.fillRect(30, 70 + (i - (page - 1) * 10) * 110, 940, 100)

            let lvl = u.level
            let xp = parse(u.xp)
            ctx.font = '40px Ubuntu';
            ctx.fillStyle = "#ffffff"
            ctx.fillText((m.nickname || m.user.globalName), 50, 135 + (i - (page - 1) * 10) * 110)

            ctx.font = '45px Ubuntu Bold';
            ctx.fillText("#" + (i + 1), 900 - ctx.measureText("#" + (i + 1)).width / 2, 137.5 + (i - (page - 1) * 10) * 110)
            ctx.fillText(lvl, 800 - ctx.measureText(lvl).width / 2, 137.5 + (i - (page - 1) * 10) * 110)
            ctx.font = '40px Ubuntu';
            ctx.fillText(xp, 700 - ctx.measureText(xp).width / 2, 135 + (i - (page - 1) * 10) * 110)
            ctx.save();

        }


        msg.edit({ content: "Page " + page + "/" + Math.ceil(a.length / 10), files: [{ attachment: img.toBuffer(), name: "leaderboard.png" }] })
    }
    if (cmd === "!linkall" && message.author.id === "910438728420446210") {
        console.log("success")
        let w = require("./whitelist.json")
        let objects = Object.values(w);
        async function getNextMember(index) {
            if (objects.length < index) {
                return message.channel.send(index + "/" + (objects.length) + " | Reached the last user! Shutting down")
            }
            let key = objects[index];
            if (Object.values(users.content).find(a => a.name === key.name)) {
                await getNextMember(index + 1);
                return
            }
            if (key.uuid.startsWith("0000")) {
                await getNextMember(index + 1);
                return
            }
            fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + key.uuid.replaceAll("-", "")).then(async a => {
                if (a.status !== 200) {
                    await getNextMember(index + 1);
                    return message.channel.send(index + "/" + (objects.length) + " | Failed to find info of " + key.name + ". Was this account deleted? Received error `" + a.status + "`")
                }
                a = await a.json();
                if (Object.values(users.content).find(b => b.name === a.name)) {
                    await getNextMember(index + 1);
                    return
                }
                let member = message.guild.members.cache.find(z => (z.nickname === a.name || z.user.globalName === a.name || z.user.username === a.name || (z.nickname ? z.nickname.includes(a.name) : false) || (z.user.globalName ? z.user.globalName.includes(a.name) : false) || z.user.username.includes(a.name)));
                if (!member) {
                    await getNextMember(index + 1);
                    return message.channel.send(index + "/" + (objects.length) + " | Couldn't find a discord account for " + a.name + ". Did this member leave?")
                }
                message.channel.send(index + "/" + (objects.length) + " | Found <@" + member.id + "> for minecraft account " + a.name + ". He was whitelisted as " + key.name + ". Link this account?").then(async msg => {
                    await msg.react("✅")
                    await msg.react("❌")
                    const filter = (reaction, user) => {
                        return (reaction.emoji.name == "✅" || reaction.emoji.name == "❌")
                            && user.id === "896732255534338078"
                    }
                    setTimeout(() => {
                        let collector = msg.createReactionCollector(filter, { time: 5000, max: 1 });
                        collector.on('collect', (reaction, collector) => {
                            if (reaction.emoji.name === '✅') {
                                reaction.message.edit(index + "/" + (objects.length) + " | Linked <@" + member.id + "> to `" + a.name + "`!")
                                reaction.message.reactions.removeAll();
                                if(!member.roles.cache.has("953720555515826236") && !member.roles.cache.has("1146544652711907370")) member.setNickname(a.name)
                                users.write("u" + member.user, { name: a.name, uuid: a.id});
                                getNextMember(index + 1);
                            } else {
                                reaction.message.edit(index + "/" + (objects.length) + " | Linking cancelled!")
                                getNextMember(index + 1);
                            }
                        });
                    }, 100)
                })
            })
        }
        getNextMember(0)
    }

    if (cmd === "!importXp" && message.author.id === "896732255534338078") {
        let w = message.guild.members.cache.map(a => a);
        let objects = Object.values(w);
        async function getNextA(index) {
            let member = objects[index]
            message.channel.send(index + "/" + (objects.length) + " | Found <@" + member.user.id + ">. Input XP/Messages or type `none` to exit.").then(async msg => {
                const mfilter = (m) => {
                    return m.author.id === "896732255534338078"
                }
                setTimeout(() => {
                    let collector = msg.channel.createMessageCollector({ filter: mfilter, time: 60000, max: 1 });
                    collector.on('collect', (message, collector) => {
                        if (message.content === "none") {
                            msg.edit(index + "/" + (objects.length) + " | Cancelled")
                            getNextA(index + 1)
                        } else {
                            let a = message.content.split("/")
                            let xp2 = parseInt(a[0])
                            let msgs = parseInt(a[1])
                            let u = xp.read("u" + member.user.id)
                            if (!u) {
                                u = { xp: 0, msgs: 0, mcMsgs: 0, level: 0, user: member.user.id.toString() }
                            }
                            u.msgs = msgs;
                            u.boostLeft = xp2;
                            u.boost = 1.5
                            xp.write("u" + member.user.id, u)
                            msg.edit(index + "/" + (objects.length) + " | Set <@" + member.user.id + ">'s xp to " + u.boostLeft + " and message count to " + u.msgs + ".")
                            getNextA(index + 1)
                        }
                    });
                })
            })
        }
        getNextA(0);
    }
    if (cmd === "!cleanDB" && message.author.id === "896732255534338078") {
        let i = 0;
        message.channel.send("Refreshing database... (**0/" + Object.keys(xp.all()).length + "**) | `0`% done").then(msg => {
            Object.keys(xp.all()).forEach(key => {
                let z = xp.content[key];
                z.xp = 0;
                z.level = 0;
                z.mcMsgs = 0;
                z.boostMax = z.boostLeft
                xp.write(key, z)
                i++;
                msg.edit("Refreshing database... (**" + i + "/" + Object.keys(xp.all()).length + "**) | `" + Math.round(i / Object.keys(xp.all()).length * 1000) / 100 + "`% done")
            })
        })
    }
    if (cmd === "!rankcard" && message.author.id === "896732255534338078") {
        if (!BOTCHANNELS.includes(message.channel.id)) {
            return message.reply("<:CC_Cross:1180965168440692807> You can only run this command in <#" + BOTCHANNELS[0] + ">.")
        }

        let img = canvas.createCanvas(800, 250)
        let ctx = img.getContext("2d")

        let a = Object.values(xp.all());
        a.sort((c, b) => b.xp - c.xp)
        let rank = "#0"

        ctx.imageSmoothingEnabled = false
        canvas.registerFont('./Ubuntu/Ubuntu-Regular.ttf', { family: 'Ubuntu' })
        canvas.registerFont('./Ubuntu/Ubuntu-Bold.ttf', { family: 'Ubuntu Bold' })

        ctx.fillStyle = "#0000ff";
        ctx.fillRect(0, 0, 800, 250)
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(20, 20, 760, 210)

        let name = "TEMPLATE"

        ctx.font = '35px Ubuntu Bold';
        ctx.fillStyle = "#ffffff"
        ctx.fillText(name, 240, 75)
        ctx.font = '15px Ubuntu';
        ctx.fillStyle = "#cfcfcf"
        ctx.fillText("123 discord msgs | 123 minecraft msgs", 240, 95)

        ctx.font = '30px Ubuntu Bold';
        ctx.fillStyle = "#ffffff"
        ctx.fillText("Level X", 240, 150)

        ctx.font = '25px Ubuntu';
        ctx.fillStyle = "#7f7f7f";
        ctx.fillText("123", 760 - ctx.measureText("123").width, 150)
        ctx.font = '25px Ubuntu';
        ctx.fillStyle = "#ffffff";
        ctx.fillText("456", 760 - ctx.measureText("456").width - ctx.measureText("123").width, 150)

        ctx.font = '65px Ubuntu Bold';
        ctx.fillStyle = "#ffffff"
        ctx.fillText(rank, 760 - ctx.measureText(rank).width, 95)

        ctx.restore()
        ctx.save()
        // progress bar

        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(240, 155, 520, 60, 30);
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = "#000000"
        ctx.fillRect(240, 155, 520, 60)

        ctx.restore()
        ctx.save()
        ctx.beginPath();
        ctx.roundRect(250, 165, 500, 40, 20);
        ctx.closePath()
        ctx.clip()

        ctx.fillStyle = "#7f7f7f"
        ctx.fillRect(250, 165, 500, 40)

        ctx.restore()
        ctx.save()
        ctx.beginPath();
        ctx.roundRect(250, 165, 500 * 0.5, 40, 20);
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(250, 165, 500 * 0.5, 40)

        ctx.restore()

        ctx.save()

        ctx.beginPath();
        ctx.arc(125, 125, 85, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = "#ff0000"
        ctx.fillRect(40, 40, 170, 170)
        ctx.restore()
        ctx.save()


        message.channel.send({ files: [{ attachment: img.toBuffer(), name: "rankcard.png" }] })
    }
}