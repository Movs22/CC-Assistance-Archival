const Discord = require("discord.js")

let tasks = require("./index")
module.exports = async (c, plots, interaction, auth) => {
    if (interaction.isCommand()) {
        interaction.deferReply().then(async a => {
            if (interaction.commandName === "tasks" && interaction.member.roles.cache.has("1059846505546137661")) {
                let u = interaction.member
                if(interaction.options.getUser("user")) {
                    u = await interaction.guild.members.fetch(interaction.options.getUser("user").id)
                }
                let t2 = tasks.tasks[(u.nickname || u.user.globalname || u.user.username)]
                if(!t2) {
                    return interaction.editReply("<:CC_Cross:1180965168440692807> This user has no tasks assigned!")
                }
                let t = t2;
                t = t.filter(t => t.priority > 0)
                t = t.filter(t => (t.done == false))
                t = t.sort((a, b) => a.priority - b.priority)
                t = t.sort((a, b) => (a.due === 0 ? b.due : (b.due === 0 ? a.due : (a.due - b.due))))
                desc = (u.nickname || u.user.globalname || u.user.username) + " has `" + (t.length) + "` tasks assigned. Of these, `" + (t.filter(a => a.priority === 100 || a.priority > 200).length) + "` are high priority.";
                let embed = new Discord.EmbedBuilder()
                .setTitle("Tasks of " + (u.nickname || u.user.globalname || u.user.username))
                .setTimestamp()
                .setColor("#e91e63")
                .setFooter({text: "Requested by " + (interaction.member.nickname || interaction.user.globalname || interaction.user.username), iconURL: (interaction.member.displayAvatarURL({ size: 4096, format: 'png' }) || interaction.user.avatarURL({ size: 4096, format: 'png' })).replaceAll(".webp", ".png")})

                if(t.length == 0) {
                    desc = desc + "\n *No tasks*"
                }
                for(let i = 0; (i < 10 && i < (t.length)); i++) {
                    desc = desc + "\n\n### " + ("[" + t[i].title + "](" + t[i].url + ") \n> 👥 Assigned to `" + t[i].users.length + "` users.") + "\n> **📆 Due date:** " + ((t[i].due === 0 ? "*No due date*" : "Due <t:" + t[i].due + ":R>") + "\n> **Priority:** " + (t[i].priority === 100 ? ":warning: HIGH PRIORITY" : (t[i].priority === 200 ? "*Awaiting Opening*" : (t[i].priority === 1000 ? "❗ HIGHEST PRIORITY" : t[i].priorityLabel)))) + "\n\n"
                }
                embed.setDescription(desc)

                interaction.editReply({embeds:[embed]})
            }
        }).catch(e => {
            console.log(e)
            interaction.editReply("<:CC_Cross:1180965168440692807> An unknown error has occured.")
        })
    }
}