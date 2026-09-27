const Discord = require("discord.js")
const canvas = require("canvas")
const DO_NOT_LOG = ["928719096961454191","1177967915836899419","991048630360244264","1039623338311561256","1018919230210576394","1081703939956813875","1041758454018232350","1026552777998073856","903232257639194634"]


module.exports = async (c, oldMessage, newMessage) => {
    if(!oldMessage.content || !newMessage.content) return;
    if(/\d{1,3}(?:\.\d{1,3}){3}/.test(newMessage.content.replaceAll(" ","").replaceAll("*","").replaceAll("_","").replaceAll("(dot)","."))) {
        newMessage.channel.send(":warning: | Make sure that you don't send IP addresses in public channels, " + newMessage.author.toString() + ".").then(msg => setTimeout(() => msg.delete(), 5000))
        return newMessage.delete()
    }
    if(newMessage.author.bot || !newMessage.guild || !newMessage.channel.parent || DO_NOT_LOG.includes(newMessage.channel.parent.id) || DO_NOT_LOG.includes(newMessage.channel.id)) return;
    let channel = newMessage.guild.channels.cache.get("1177972632096870450")

    if(!oldMessage.content || !newMessage.content) return

    let embed = new Discord.EmbedBuilder()
    .setTitle("Message edited")
    .setDescription("** **")
    .addFields({
        name: "Old message",
        value: oldMessage.content.replaceAll(/\d{1,3}(?:\.\d{1,3}){3}/gi,"\\*.\\*.\\*.\\*").substring(0, 512),
        inline: true
    }, {
        name: "New message",
        value: newMessage.content.replaceAll(/\d{1,3}(?:\.\d{1,3}){3}/gi,"\\*.\\*.\\*.\\*").substring(0, 512),
        inline: true
    }, {
        name: "Channel",
        value: "<#" + newMessage.channel.id + ">",
        inline: false
    })
    .setFooter({text: "Edited by " + (newMessage.author.globalName || newMessage.author.username), iconURL: newMessage.author.avatarURL({size: 4096, format: 'png'})})
    .setTimestamp()
    .setColor("#cfcf3f")   
    if(!channel) return;
    channel.send({embeds:[embed]})
}
