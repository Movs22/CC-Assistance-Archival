const spreadsheets = require("../spreadsheet")
const DB = require("../database")

const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")

const sizeOf = require('image-size');

const fs = require("fs")

const db = new DB("../../SSD/Adverts/index.json")

const ROLE = "1208134302055927838" //"1208134302055927838"

let guild;

let validSizes = []

let prevAd = 0

let prevPing = 0;

function findRatio(x, y) {
    let a = parseInt(x)
    let b = parseInt(y)
    let ratio = a / b  // x / y
    switch (ratio) {
        case 1:
            return [2, 2]
        case 2:
            return [2, 1]
        case 0.5:
            return [1, 2]
        case (4 / 3):
            return [4, 3]
        case (3 / 4):
            return [3, 4]
        default:
            return [a, b]
    }
}

module.exports.fetchAll = async (auth, c) => {
    let ads = await spreadsheets.listAdverts(auth)
    if (ads.adverts.length === 0) return;
    if (!guild) guild = await c.guilds.cache.get("903230722603614279");
    let ops = await guild.channels.fetch("992828543128047706")
    if (ads.adverts.length !== prevAd) console.log("Loaded " + ads.adverts.length + " ads.")
    prevAd = ads.adverts.length;
    let id = db.read("id") || 1
    let adsDone = db.read("imported") || []
    let d = false;
    guild.members.fetch();
    ads.adverts.forEach(async a => {
        if (d) return;
        for (let i = 0; i < a.link.length; i++) {
            link = a.link[i]
            if (adsDone.includes(link.fileId)) return;
            d = true;
            adsDone.push(link.fileId)

            originalId = await spreadsheets.downloadFile(auth, link.fileId, (id + i) + "-" + a.name[0].value)
            console.log(originalId)
            //let size = await sizeOf('../../SSD/Adverts/' + originalId + "-" + a.name[0].value + ".png",)
            let user = guild.members.cache.find(z => z.nickname === a.name[0].value || z.user.globalname === a.name[0].value || z.user.username === a.name[0].value)
            if (!user) {
                fs.unlinkSync('../../SSD/Adverts/' + originalId + "-" + a.name[0].value + ".png")
                return;
            }
            let w = 128;//.width;
            let h = 128;//size.height;
            let attachment = new AttachmentBuilder('../../SSD/Adverts/' + originalId + "-" + a.name[0].value + ".png", { name: 'advert.png' })
            if (w % 128 > 0 || h % 128 > 0) {
                user.send("<:CC_Cross:1180965168440692807> Your advert has been denied because it didn't follow the guidelines for the dimensions. __It MUST be 128 by 128 (or multiples), instead of " + w + " by " + h + ".__ You may resize this ad and resubmit it! (I.e.: " + (w - w % 128) + " by " + (h - h % 128) + ")")
                user.send({ files: [attachment] }).then(z => {
                    fs.unlinkSync('../../SSD/Adverts/' + originalId + "-" + a.name[0].value + ".png")
                })
                return;
            };
            user.send({ content: "✅ Your advert has been sent for review!" })
            db.write(("ad" + originalId), { name: a.name[0].value, link: a.link[originalId], status: "AWAITING", file: originalId + "-" + a.name[0].value + ".png", id: originalId })
            //logs.send({ embeds: [new EmbedBuilder().setTitle("**A new advert has been submited! It is now awaiting to be reviewed**").setImage("attachment://advert.png").setFooter({ text: "Sent by " + a.name[0].value }).setTimestamp().setColor("#e91e63")], files: [attachment] })
            let msg = "."
            if (prevPing < (Date.now() + 5 * 60 * 1000)) {
                prevPing = Date.now()
                msg = "||<@&" + ROLE + ">||"
            }
            ops.send({ content: msg, embeds: [new EmbedBuilder().setTitle("**A new advert has been submited!**").setImage("attachment://advert.png").setDescription((w / 128) + " by " + (h / 128) + " blocks.").setFooter({ text: "Sent by " + a.name[0].value }).setTimestamp().setColor("#e91e63")], files: [attachment] }).then(msg => {
                let approve = new ButtonBuilder()
                    .setCustomId("ad-" + originalId + "-" + a.name[0].value + "-approve")
                    .setLabel("Approve")
                    .setStyle(ButtonStyle.Success)

                let deny = new ButtonBuilder()
                    .setCustomId("ad-" + originalId + "-" + a.name[0].value + "-deny")
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger)
                msg.edit({ components: [new ActionRowBuilder().addComponents(approve, deny)] })
            })
        }
        id += a.link.length;
        db.write("id", id)
    })
    db.write("imported", adsDone)
}


function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

module.exports.interactionCreate = async (c, interaction) => {
    if (!guild) guild = await c.guilds.cache.get("903230722603614279");
    let logs = await guild.channels.fetch("1178013347652833471")
    let ads = await guild.channels.fetch("1208204707450060810")
    if (interaction.isButton() && interaction.customId.startsWith("ad-")) {
        let msg = interaction.message;
        if (interaction.customId.endsWith("-deny")) {
            msg.edit({ components: [], content: "||<@&" + ROLE + ">||", embeds: [new EmbedBuilder().setDescription("***This advert has been denied by a Server Operator.***").setColor("#cf3f3f")], files: [] })
            let attachment = new AttachmentBuilder('../../SSD/Adverts/' + interaction.customId.replaceAll("ad-", "").replaceAll("-deny", "") + ".png", { name: 'advert.png' })
            logs.send({ embeds: [new EmbedBuilder().setTitle("**Advert denied**").setDescription("The advert below has been denied by <@" + interaction.user.id + ">! \n\n").setImage("attachment://advert.png").setFooter(msg.embeds[0].footer).setTimestamp().setColor("#cf3f3f")], files: [attachment] })

            let info = db.read(("ad" + interaction.customId.split("-")[1]))

            let user = guild.members.cache.find(z => z.nickname === info.name || z.user.globalName === info.name || z.user.username === info.name)
            if (!user) {
                user.send("<:CC_Cross:1180965168440692807> Your advert has been denied by a Server Operator.")
                user.send({ files: [attachment] }).then(z => {
                    fs.unlinkSync('../../SSD/Adverts/' + interaction.customId.replaceAll("ad-", "").replaceAll("-deny", "") + ".png")
                })
                return;
            }

            db.delete(("ad" + interaction.customId.split("-")[1]))
        } else if (interaction.customId.endsWith("-approve")) {
            let attachment = new AttachmentBuilder('../../SSD/Adverts/' + interaction.customId.replaceAll("ad-", "").replaceAll("-approve", "") + ".png", { name: 'advert.png' })
            msg.edit({ components: [], content: "||<@&" + ROLE + ">||", embeds: [new EmbedBuilder().setDescription("***This advert has been approved by a Server Operator.***").setColor("#3fcf3f")], files: [] })
            logs.send({ embeds: [new EmbedBuilder().setTitle("**Advert approved**").setDescription("The advert below has been approved by <@" + interaction.user.id + ">!").setImage("attachment://advert.png").setFooter(msg.embeds[0].footer).setTimestamp().setColor("#3fcf3f")], files: [attachment] })
            let size = await sizeOf('../../SSD/Adverts/' + interaction.customId.replaceAll("ad-", "").replaceAll("-approve", "") + ".png")

            let info = db.read(("ad" + interaction.customId.split("-")[1]))

            let user = guild.members.cache.find(z => z.nickname === info.name || z.user.globalName === info.name || z.user.username === info.name)
            if (!user) {
                user.send({ files: [attachment] }).then(z => {
                    fs.unlinkSync('../../SSD/Adverts/' + interaction.customId.replaceAll("ad-", "").replaceAll("-deny", "") + ".png")
                })
                return;
            }
            user.send(":tada: Your advert has been approved by a Server Operator!")
            info.status = "APPROVED"
            info.width = Math.round(size.width / 128);
            info.height = Math.round(size.height / 128);
            info.date = Date.now();
            info.lastUse = Date.now();
            info.uses = 0;
            db.write(("ad" + interaction.customId.split("-")[1]), info)
            ads.send({ content: "**SIZE:** " + (Math.round(size.width / 128) + " by " + Math.round(size.height / 128)), files: [attachment] })
        }
    }

    if (interaction.isCommand() && interaction.commandName === "advert") {
        let size = interaction.options.getString("size");
        let sort = interaction.options.getInteger("sort") || 0;
        let amount = interaction.options.getInteger("amount") || 1;
        if (!validSizes.find(a => a.value === size)) return interaction.reply("<:CC_Cross:1180965168440692807> Invalid size provided!")
        let validAds = []
        Object.values(db.all()).forEach(b => {
            let c = findRatio(b.width, b.height)
            if (((c[0]) + "x" + (c[1])) !== size) return;
            if (c[0] !== b.width) b.resized = true;
            validAds.push(b)
        })
        let resized = 0;
        switch (sort) {
            case 0:
                validAds = shuffleArray(validAds)
                validAds = (validAds.length > amount ? validAds.slice(0, amount) : validAds);
                f = []
                validAds.forEach(file => {
                    let attachment = new AttachmentBuilder('../../SSD/Adverts/' + file.file, { name: 'advert' + file.id + '.png' })
                    f.push(attachment)
                    file.uses += 1;
                    file.lastUse = Date.now();
                    db.write("ad" + file.id, file)
                })
                resized = validAds.filter(a => a.resized).length
                interaction.reply({ content: "✅ Found " + validAds.length + " ad" + (validAds.length > 1 ? "s" : "") + (resized > 0 ? " (" + resized + " ad(s) need to be resized.)" : "") + ": \n", files: f })
                break;
            case 1:
                validAds.sort((a, b) => a.uses - b.uses)
                validAds = (validAds.length > amount ? validAds.slice(0, amount) : validAds);
                f = []
                validAds.forEach(file => {
                    let attachment = new AttachmentBuilder('../../SSD/Adverts/' + file.file, { name: 'advert' + file.id + '.png' })
                    f.push(attachment)
                    file.uses += 1;
                    file.lastUse = Date.now();
                    db.write("ad" + file.id, file)
                })
                interaction.reply({ content: "✅ Found " + validAds.length + " ad" + (validAds.length > 1 ? "s" : "") + (resized > 0 ? " (" + resized + " ad(s) need to be resized.)" : "") + ": \n", files: f })
                break;
            case 2:
                validAds.sort((a, b) => a.date - b.date)
                validAds = (validAds.length > amount ? validAds.slice(0, amount) : validAds);
                f = []
                validAds.forEach(file => {
                    let attachment = new AttachmentBuilder('../../SSD/Adverts/' + file.file, { name: 'advert' + file.id + '.png' })
                    f.push(attachment)
                    file.uses += 1;
                    file.lastUse = Date.now();
                    db.write("ad" + file.id, file)
                })
                interaction.reply({ content: "✅ Found " + validAds.length + " ad" + (validAds.length > 1 ? "s" : "") + (resized > 0 ? " (" + resized + " ad(s) need to be resized.)" : "") + ": \n", files: f })
                break;
            case 3:
                validAds.sort((a, b) => a.lastUse - b.lastUse)
                validAds = (validAds.length > amount ? validAds.slice(0, amount) : validAds);
                f = []
                validAds.forEach(file => {
                    let attachment = new AttachmentBuilder('../../SSD/Adverts/' + file.file, { name: 'advert' + file.id + '.png' })
                    f.push(attachment)
                    file.uses += 1;
                    file.lastUse = Date.now();
                    db.write("ad" + file.id, file)
                })
                interaction.reply({ content: "✅ Found " + validAds.length + " ad" + (validAds.length > 1 ? "s" : "") + (resized > 0 ? " (" + resized + " ad(s) need to be resized.)" : "") + ": \n", files: f })
                break;
            case 4:
                validAds.sort((a, b) => b.date - a.date)
                validAds = (validAds.length > amount ? validAds.slice(0, amount) : validAds);
                f = []
                validAds.forEach(file => {
                    let attachment = new AttachmentBuilder('../../SSD/Adverts/' + file.file, { name: 'advert' + file.id + '.png' })
                    f.push(attachment)
                    file.uses += 1;
                    file.lastUse = Date.now();
                    db.write("ad" + file.id, file)
                })
                interaction.reply({ content: "✅ Found " + validAds.length + " ad" + (validAds.length > 1 ? "s" : "") + (resized > 0 ? " (" + resized + " ad(s) need to be resized.)" : "") + ": \n", files: f })
                break;
            case 5:
                validAds.sort((a, b) => b.uses - a.uses)
                validAds = (validAds.length > amount ? validAds.slice(0, amount) : validAds);
                f = []
                validAds.forEach(file => {
                    let attachment = new AttachmentBuilder('../../SSD/Adverts/' + file.file, { name: 'advert' + file.id + '.png' })
                    f.push(attachment)
                    file.uses += 1;
                    file.lastUse = Date.now();
                    db.write("ad" + file.id, file)
                })
                interaction.reply({ content: "✅ Found " + validAds.length + " ad" + (validAds.length > 1 ? "s" : "") + (resized > 0 ? " (" + resized + " ad(s) need to be resized.)" : "") + ": \n", files: f })
                break;
        }
    }

    if (interaction.isAutocomplete() && interaction.commandName === "advert") {
        validSizes = []
        Object.values(db.all()).forEach(b => {
            if (b.width && b.height && !validSizes.find(a => a.value === ((b.width) + "x" + (b.height)))) {
                let c = findRatio(b.width, b.height)
                if (validSizes.find(a => a.value === ((c[0]) + "x" + (c[1])))) return;
                validSizes.push({ name: (c[0]) + " by " + (c[1]) + " blocks", value: (c[0]) + "x" + (c[1]) })
            }
        })
        await interaction.respond(validSizes);
    }
}