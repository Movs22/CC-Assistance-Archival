const Discord = require("discord.js")
const canvas = require("canvas")

const DO_NOT_LOG = ["928719096961454191","1177967915836899419","991048630360244264","1039623338311561256","1018919230210576394","1081703939956813875","1041758454018232350","1026552777998073856","903232257639194634"]

module.exports = async (c, message) => {
    if(!message.content) return;
    if(message.author.bot || !message.guild || DO_NOT_LOG.includes(message.channel.parent.id) || DO_NOT_LOG.includes(message.channel.id)) return;
    let channel = message.guild.channels.cache.get("1177972632096870450")


    let embed = new Discord.EmbedBuilder()
    .setTitle("Message deleted")
    .setDescription(((message.content ? message.content.replaceAll(/\d{1,3}(?:\.\d{1,3}){3}/gi,"\\*.\\*.\\*.\\*").substring(0, 512) : "*no content*")))
    .addFields({
        name: "Channel",
        value: message.channel.toString()
    })
    .setFooter({text: "Sent by " + (message.author.globalName || message.author.username), iconURL: message.author.avatarURL({size: 4096, format: 'png'})})
    .setTimestamp()
    .setColor("#cf3f3f")   

    let att = []
    if(message.attachments.first()) {
        let attachment = message.attachments.first()
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
    if(!channel) return;
    channel.send({embeds:[embed], files: att})
}