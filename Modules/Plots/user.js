const DB = require("../database")
const usersDB = new DB("../users.json")

function firstPlot(user) {
    if(!usersDB.users[user]) {
        return false;
    } else {
        return usersDB.users[user].claimed_plot
    }
}

module.exports.firstPlot = firstPlot;