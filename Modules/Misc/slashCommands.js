const Discord = require("discord.js");
const { SlashCommandBuilder } = require("discord.js")

module.exports.loadCommands = (a, c) => {
    let term = new SlashCommandBuilder()
        .setName("term")
        .setDescription("See info about a specified term.")
        .addStringOption(o =>
            o.setName("term")
                .setDescription('Term to search')
                .setRequired(true)
                .setAutocomplete(true)
        )
    
    let addterm = new SlashCommandBuilder()
        .setName("add-term")
        .setDescription("Adds a term to the bot's database.")
    
    let nuketerm = new SlashCommandBuilder()
        .setName("nuke-term")
        .setDescription("Removes a term from the bot's database.")
        .addStringOption(o =>
            o.setName("term")
                .setDescription('Term to remove')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(o =>
            o.setName("reason")
                .setDescription('Reason of removal')
                .setRequired(true)
        )
    
    let about = new SlashCommandBuilder()
        .setName("about")
        .setDescription("Gets info about a village, hamlet, station (...)")
        .addSubcommand(subcmd => 
            subcmd
                .setName('village')
                .setDescription('Info about a village')
                .addStringOption(o => 
                    o.setName("village")
                        .setDescription("Village to get the info from")
                        .addChoices(
                            {name: "Ailsbury", value: "Ailsbury"},
                            {name: "Cashvillage", value: "Cashvillage"},
                            {name: "Elderville", value: "Elderville"},
                            {name: "Fernhill", value: "Fernhill"},
                            {name: "Harlowfield", value: "Harlowfield"},
                            {name: "Hemstead", value: "Hemstead"},
                            {name: "New Arbridge", value: "New Arbridge"},
                            {name: "Perrache", value: "Perrache"}
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('user')
                .setDescription('Info about a user')
                .addStringOption(o => 
                    o.setName("user")
                        .setDescription("The user to get the information")
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('bot')
                .setDescription('Info about the bot')
        )

    let commands = []
    if(a === "*") {
        a = ["term","addterm", "about","nuketerm"]
    }
    a.forEach(b => {
        eval("commands.push(" + b + ")")
        c.commands.set(b, eval(b))
    })
    return {cmd: commands, col: c.commands};
}