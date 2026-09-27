const Discord = require("discord.js");

module.exports.send = async (channel, content, id) => {
    ans = ["WOAH THERE. WAY TOO SPICY! You're sending messages too quickly!", "You really want that plot...", "Try claiming another plot.", "Nevermind...", "{PLOT} is definitely not available.", "The bot might crash..."]
        z = (id !== null ? id : Math.floor(Math.random() * ans.length))
        if(z > (ans.length - 1) || z < 0) {
            z = Math.floor(Math.random() * ans.length - 1);
        }
        if (z == 0) {
            let row = new Discord.ActionRowBuilder()
            let chill = new Discord.ButtonBuilder()
                .setCustomId('chill')
                .setLabel('Enter the chill zone')
                .setStyle(Discord.ButtonStyle.Primary);
            row.addComponents(chill);
            channel.send({ content: "*" + ans[z].replaceAll("{PLOT}", content) + "*", components: [row] })
        } else {
            channel.send({ content: "*" + ans[z].replaceAll("{PLOT}", content) + "*" })
        }
}