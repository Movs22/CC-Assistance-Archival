const fetch = require("node-fetch")
const config = require("../../config/config.json")

const url = "https://api.trello.com/1/boards/{ID}/cards?key={KEY}&token={TOKEN}"

let tasksDB = {
    "cameforthecash":[],
    "Movies22":[],
    "SquadFam9000":[],
    "Boowan":[],
    "DwellerUK":[],
    "JackG_UK":[],
    "Supa101":[],
    "GenericRB":[]
}

module.exports.tasks = tasksDB

module.exports.reminders = (c, g) => {
    let i = 0;
    fetch(url.replaceAll("{ID}", config.trelloId).replaceAll("{KEY}", config.trelloKey).replaceAll("{TOKEN}", config.trelloToken)).then(async r => {
        Object.keys(tasksDB).forEach(k => {
            tasksDB[k] = []
        })
        if(r.status !== 200) {
            console.log("FAILED to fetch metro trello. Got error " + r.status)
            return;
        }
        r = await r.json()
        r.forEach(task => {
            if(task.cover.color) return;
            if(task.idList === config.trelloLists.noStart) return;
            if(task.idMembers.length < 1 || task.idMembers[0] === undefined) return;
            let users = [];
            let l = []
            task.labels.forEach(label => {
                l.push(label.name)
            })
            let prio = 0
            let prio2
            Object.keys(config.trelloLists).forEach(trello => {
                if(config.trelloLists[trello] === task.idList) {
                    if(trello === "noStart") prio = -100;
                    if(trello === "lowPriority") prio = 0;
                    if(trello === "highPriority") prio = 100;
                    if(trello === "awaiting") prio = 200;
                    if(trello === "greyLine") prio = 1000;
                    prio2 = trello;
                }
            })
            task.idMembers.forEach(u => {
                users.push(config.trelloIds[u])
            })
            let info = {url: task.shortUrl, title: task.name, labels: l, due: Math.round((new Date(task.due)).getTime()/1000), lastUpdate: Math.round((new Date(task.dateLastActivity)).getTime()/1000), priority: prio, priorityLabel: prio2, users: users, done: (task.dueComplete ? true : false)}
            info.users.forEach(u => {
                tasksDB[u].push(info)
            })  
            i++
        })
    })
}