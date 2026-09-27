let Discord = require("discord.js")

module.exports = async (c, message) => {
    if(message.content === "!embed" && message.author.id === "896732255534338078") {
        let embed = new Discord.EmbedBuilder()
        .setTitle("**Reaction Roles**")
        .setDescription("Click on the buttons below to follow/unfollow a specific update role.")
        .setColor("#e91e63")


        let roles = ["Cashvillage Updates", "New Arbridge Updates", "Ailsbury Updates", "Hemstead Updates", "Harlowfield Updates"]
        let roles2 = ["Railway Updates", "Hamlet Updates", "Technical Updates", "Event Ping", "News Ping"]

        let row = new Discord.ActionRowBuilder()
        roles.forEach(role => {
            let revoke = new Discord.ButtonBuilder()
            .setCustomId('rr-' + role)
            .setLabel(role)
            .setStyle(Discord.ButtonStyle.Primary);
            row.addComponents(revoke);
        })
        message.channel.send({content:"Village-specific updates", components:[row]})

        row = new Discord.ActionRowBuilder()
        roles2.forEach(role => {
            let revoke = new Discord.ButtonBuilder()
            .setCustomId('rr-' + role)
            .setLabel(role)
            .setStyle(Discord.ButtonStyle.Primary);
            row.addComponents(revoke);
        })
        message.channel.send({content: "Community-related & Other updates", components:[row]})
    }
}