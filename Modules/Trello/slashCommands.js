const Discord = require("discord.js");
const { SlashCommandBuilder } = require("discord.js")

module.exports.loadCommands = (a, c) => {
    let tasks = new SlashCommandBuilder()
        .setName("tasks")
        .setDescription("Lists all metro tasks that need to be completed.")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addUserOption(o =>
            o.setName("user")
                .setDescription('A specific user (OP only).')
                .setRequired(false)
        )

    let commands = []
    if(a === "*") {
        a = ["tasks"]
    }
    a.forEach(b => {
        eval("commands.push(" + b + ")")
        c.commands.set(b, eval(b))
    })
    return {cmd: commands, col: c.commands};
}