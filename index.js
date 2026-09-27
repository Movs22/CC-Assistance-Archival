const Discord = require("discord.js");
const sheets = require("./Modules/spreadsheet");

let c = new Discord.Client({
    fetchAllMembers: true,
    intents: [Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMembers, Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.DirectMessages, Discord.GatewayIntentBits.GuildVoiceStates], partials: [Discord.Partials.Message, Discord.Partials.Channel, Discord.Partials.fetchAllMembers]
})
const token = require("./config/config.json").token;

const { exec } = require("child_process")

let a = exec("node ./AlCorp/index.js", (error, stdout, stderr) => {
    console.log(`[ALCORP]: ${stdout}`);
    console.error(`[ALCORP]: ${stderr}`);
})

a.on("spawn", () => {
    console.log("Started AlCorp sub-process")
})

process.on("exit", () => {
    a.kill()
})

const Database = require("./Modules/database.js")

const db = new Database("./data/tickets.json")

module.exports.ticketsDB = db;

const fs = require("fs");

let cnrn = require("./Modules/CNRN/checkMetro.js");

sheets.authorize().then(auth => {
    let plots = {};
    cnrn.refreshCache()
    sheets.saveData(auth);

    c.on("ready", async () => {
        plots.ailsbury = await sheets.listPlots(auth, "Ailsbury");
        plots.hemstead = await sheets.listPlots(auth, "Hemstead");
        plots.cashvillage = await sheets.listPlots(auth, "Cashvillage");
        plots["new arbridge"] = await sheets.listPlots(auth, "New Arbridge");
        plots["development zones"] = await sheets.listPlots(auth, "Development Zones");
        plots.harlowfield = await sheets.listPlots(auth, "Harlowfield");
        plots.airport = await sheets.listPlots(auth, "Airport");
        if(c.user !== null) {
            require("./Modules/clientReady")(c, plots)
        }
        //require("./Modules/Adverts/advertsManager.js").fetchAll(auth, c)
        /*setInterval(() => {
            require("./Modules/Adverts/advertsManager.js").fetchAll(auth, c)
        }, 60*1000)*/
    })
    c.on("messageCreate", async (m) => {
        if(c.user !== null) {
            require("./Modules/Plots/messageCreate")(c, plots, m, auth)
            require("./Modules/Points/messageCreate")(c, m)
            require("./Modules/Leveling/messageCreate")(c, m)
            require("./Modules/Reaction Roles/messageCreate")(c, m)
        }
    })

    c.on("interactionCreate", async (m) => {
        if(c.user !== null) {
            if(m.isCommand() && m.commandName === "tasks") {
                require("./Modules/Trello/interactionCreate")(c, plots, m, auth)
                return;
            }
            if((m.isModalSubmit() && (m.customId.startsWith("wikiModal-") || m.customId === "termModal"))|| (m.isButton() && m.customId.startsWith("edit-") ) || ((m.isCommand() || m.isAutocomplete()) && ["about","term","add-term","nuke-term"].includes(m.commandName))) {
                require("./Modules/Misc/interactionCreate")(c, m)
                return
            }
            if((m.isButton() && m.customId.startsWith("ad-")) || (m.isAutocomplete() && m.commandName === "advert") || (m.isCommand() && m.commandName === "advert")) {
                require("./Modules/Adverts/advertsManager.js").interactionCreate(c, m)
                return;
            }
            require("./Modules/Reaction Roles/interactionCreate")(c, m)
            require("./Modules/Plots/interactionCreate")(c, plots, m, auth)
        }
    })

    c.on("messageReactionAdd", async (m, u) => {
        if(c.user !== null) {
            require("./Modules/Plots/reactionCreate")(c, plots, m, u, auth)
        }
    })
    fs.readdirSync(__dirname + "/Modules/Logging").forEach(file => {
        console.log("Linked " + file + " to the logging module.")
        c.on(file.split(".")[0], async (a, b) => {
            if(c.user !== null) {
                require("./Modules/Logging/" + file)(c, a, b)
            }
        })
    })
})

c.login(token);