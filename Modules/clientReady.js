const Discord = require("discord.js");

module.exports = async (c, plots) => {
    if (c.user !== null) {
        const token = require("../config/config.json").token;
        const rest = new Discord.REST({ version: '10' }).setToken(token);
        c.user.setPresence({ status: 'dnd', activities: [{ name: "bot's startup", type: "WATCHING" }] })
        c.commands = new Discord.Collection()
        let commands = await require("./Plots/slashCommands.js").loadCommands("*", c);
        c.commands = commands.col
        let commands2 = await require("./Trello/slashCommands.js").loadCommands("*", c)
        c.commands = commands2.col
        let commands3 = await require("./Misc/slashCommands.js").loadCommands("*", c)
        c.commands = commands3.col
        commands = commands.cmd.concat(commands2.cmd)
        commands = commands.concat(commands3.cmd)
        try {
            await rest.put(
                Discord.Routes.applicationGuildCommands(c.user.id, "903230722603614279"), {
                body: commands
            });
            console.log('Successfully registered application commands for guild');
        } catch (error) {
            if (error) console.error(error);
        }
        pr = (plots.ailsbury.rows - 7) + (plots.hemstead.rows - 7) + (plots.cashvillage.rows - 7) + (plots["new arbridge"].rows - 7) + (plots["development zones"].rows - 7) + (plots.airport.rows - 7)  + (plots.harlowfield.rows - 7)
        console.log("Loaded " + pr + " plots.")
        let g = (await c.guilds.fetch("903230722603614279"))
        c.user.setPresence({ status: 'online', activities: [{ name: "CashCraft's 3rd anniversary", type: "WATCHING" }] })
        c.user.setActivity("CashCraft | 2021-2024", {type: Discord.ActivityType.Playing})
        channels = g.channels.cache.filter(a => a.parent !== null && a.parent.id === "1001819329622450236" && a.type === Discord.ChannelType.GuildForum)
        channels.forEach(async cha => {
            channels2 = cha.guild.channels.cache.filter(c => c.parent === cha)
            channels2.forEach(channel2 => {
                channel2.messages.fetch({ limit: 100 }).then(m => {
                    m.forEach(msg => {
                        if (msg.author.id === "1075469164413735014" && channel2.name !== "Full list of available plots") {
                            msg.delete()
                        }
                    })
                })
            })
        })
        console.log("Found " + channels.size + " different forum channels.")
        require("./Plots/check_plots.js")(g, plots);
        require("./Trello/index.js").reminders(c, g);
        require("./CNRN/checkMetro.js")(g);
        setInterval(async () => {
            require("./Plots/check_plots.js")(g, plots);
            require("./CNRN/checkMetro.js")(g);
        }, 60 * 1000)

        setInterval(async () => {
            require("./Trello/index.js").reminders(c, g);
        }, 60*60*1000)
    }
}