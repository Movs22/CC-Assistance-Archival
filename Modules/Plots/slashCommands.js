const Discord = require("discord.js");
const { SlashCommandBuilder } = require("discord.js")

module.exports.loadCommands = (a, c) => {
    let hamletChoices = []
    let hamlets = require("../../config/hamlets.json")
    Object.values(hamlets).forEach(hamlet => {
        hamletChoices.push({ name: hamlet.name, value: hamlet.code })
    })
    let createplot = new SlashCommandBuilder()
        .setName("create-plot")
        .setDescription("Creates a plot in a specified village.")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addStringOption(o =>
            o.setName("village")
                .setDescription('The village where this plots should be created.')
                .setRequired(true)
                .addChoices(
                    { name: 'Ailsbury', value: 'Ailsbury' },
                    { name: 'Cashvillage', value: 'Cashvillage' },
                    { name: 'Hemstead', value: 'Hemstead' },
                    { name: 'New Arbridge', value: 'New Arbridge' },
                    { name: 'Development Zones', value: 'Development Zones' },
                    { name: 'Harlowfield', value: 'Harlowfield' },
                    { name: 'Airport', value: 'Airport' },
                )
        )
        .addStringOption(o => o.setName("plot-code").setDescription("Plot code to use.").setRequired(true))
        .addIntegerOption(o => o.setName("amount").setDescription("Amount of plots to create.").setMinValue(1).setMaxValue(50).setRequired(false))
        .addIntegerOption(o => o.setName("offset").setDescription("ID of the first plot").setMinValue(1).setMaxValue(100).setRequired(false))

    let points = new SlashCommandBuilder()
        .setName("points")
        .setDescription("Checks the points of a specified user.")
        .addUserOption(o =>
            o.setName("user")
                .setDescription('A specific user (OP only).')
                .setRequired(false)
        )


    let advert = new SlashCommandBuilder()
        .setName("advert")
        .setDescription("Get a random in-game advertisement to place in your Development Zone, Village or Station!")
        .addStringOption(o =>
            o.setName("size")
                .setDescription('Ad size (in blocks)')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(o =>
            o.setName("amount")
                .setDescription('Amount of ads')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(5)
        )


    let message = new SlashCommandBuilder()
        .setName("message")
        .setDescription("Messages a specific user")
        .addUserOption(o =>
            o.setName("user")
                .setDescription('A specific user.')
                .setRequired(true)
        )
        .addStringOption(o => o.setName("message").setDescription("Message to be sent").setRequired(true))


    let createhplot = new SlashCommandBuilder()
        .setName("create-hplot")
        .setDescription("Creates a plot in a specified hamlet.")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addStringOption(o =>
            o.setName("hamlet")
                .setDescription('The hamlet where this plots should be created.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(o => o.setName("plot-type").setDescription("Plot type to use.").setRequired(true))
        .addIntegerOption(o => o.setName("amount").setDescription("Amount of plots to create.").setMinValue(1).setMaxValue(50).setRequired(false))
        .addIntegerOption(o => o.setName("offset").setDescription("ID of the first plot").setMinValue(1).setMaxValue(1000).setRequired(false))

    let plots = new SlashCommandBuilder()
        .setName("plots")
        .setDescription("Use this command to check how many plots you've got.")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addStringOption(o => o.setName("user").setDescription("Minecraft username").setRequired(false).setAutocomplete(true))

    let evalcmd = new SlashCommandBuilder()
        .setName("eval")
        .setDescription(":)")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addStringOption(o =>
            o.setName("code")
                .setDescription('Code to run')
                .setRequired(true)
        )

    let extend = new SlashCommandBuilder()
        .setName("extend")
        .setDescription("Extends someone's plot/plots deadline")
        .addStringOption(o =>
            o.setName("user")
                .setDescription('Username whose plot will be reset (* to apply to everyone)')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(o =>
            o.setName("reason")
                .setDescription('Reason for the plot/plots\' deadline extension.')
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("code")
                .setDescription('Plot code/codes to be extended')
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addStringOption(o =>
            o.setName("date")
                .setDescription('Filters plots by the date/dates (as MM/DD/YYYY) they\'ll expire on.')
                .setRequired(false)
                .setAutocomplete(false)
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)

    let plotsMenu = new Discord.ContextMenuCommandBuilder()
        .setName('List plots')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .setType(Discord.ApplicationCommandType.User);

    let pointsMenu = new Discord.ContextMenuCommandBuilder()
        .setName('Check points')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .setType(Discord.ApplicationCommandType.User);

    let givepointsMenu = new Discord.ContextMenuCommandBuilder()
        .setName('Give points')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .setType(Discord.ApplicationCommandType.Message);

    let userinfoMenu = new Discord.ContextMenuCommandBuilder()
        .setName('Userinfo')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.SendMessages)
        .setType(Discord.ApplicationCommandType.User);

    let listplots = new SlashCommandBuilder()
        .setName("list-plots")
        .setDescription("Lists plots on a specified village.")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages)
        .addStringOption(o =>
            o.setName("village")
                .setDescription('The village where this plots should be checked.')
                .setRequired(true)
                .addChoices(
                    { name: 'Ailsbury', value: 'ailsbury' },
                    { name: 'Cashvillage', value: 'cashvillage' },
                    { name: 'Hemstead', value: 'hemstead' },
                    { name: 'New Arbridge', value: 'new arbridge' },
                    { name: 'Harlowfield', value: 'harlowfield' },
                    { name: 'Airport', value: 'airport' },
                    { name: 'Development Zones', value: 'development zones' },
                    { name: 'GLOBAL', value: 'global' },
                )
        )
        .addStringOption(o =>
            o.setName("code")
                .setDescription('Specific plot code to filter.')
                .setRequired(false)
        )

    let poll = new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Creates a poll.")

    let reload = new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reloads the bot.")

    let commands = []
    if (a === "*") {
        a = ["reload", "listplots", "extend", "evalcmd", "plots", "createhplot", "createplot", "points", "message", "plotsMenu", "pointsMenu", "givepointsMenu", "poll", "userinfoMenu", "advert"]
    }
    a.forEach(b => {
        eval("commands.push(" + b + ")")
        c.commands.set(b, eval(b))
    })
    return { cmd: commands, col: c.commands };
}