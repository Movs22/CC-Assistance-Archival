const fetch = require("node-fetch")

const Discord = require("discord.js")

const channelId = "1164965842270826516"
const messageId = "1215082533516218439"
const messageId2 = "1215082538280816683"

const lineIds = {
    "0":"unknown",
    "1":"Yellow",
    "2":"Orange",
    "3":"Pink",
    "4":"Blue",
    "5":"Green",
    "6":"Red",
    "7":"Purple",
    "8":"Cyan",
    "9":"Grey",
    ">":"Airport",
    "<":"!PeopleMover"
}

const shortNames = {
    "High Ipley": "Ipley",
    "South Fernhill Forest": "Fernhill",
    "West Fernhill": "Fernhill",
    "New Oak Plaza": "New Oak",
    "Barton Low Level": "Barton",
    "Donfield Lane": "Donfield",
    "Fernhill Central": "Fernhill",
    "Edwater Expo Hub": "Edwater",
    "Airport Terminal 1": "Terminal 1",
    "Airport Terminal 2": "Terminal 2",
    "Airport Terminal 2-B gate": "Terminal 2B",
}

const URL = "http://play.cashcraftserver.com:25566"

const titles = {
    BLUE: "<:CNRN_blue:1180982227736207451> Blue Line",
    CYAN: "<:CNRN_cyan:1180982231225860106> Cyan Line",
    GREEN: "<:CNRN_green:1180982233025237082> Green Line",
    GREY: "<:CNRN_grey:1180982235835420832> Grey Line",
    ORANGE: "<:CNRN_orange:1180982237567651850> Orange Line",
    PINK: "<:CNRN_pink:1180982240096821351> Pink Line",
    PURPLE: "<:CNRN_purple:1180982241837457439> Purple Line",
    RED: "<:CNRN_red:1180982243141898351> Red Line",
    YELLOW: "<:CNRN_yellow:1180982245931102268> Yellow Line",
    AIRPORT: "<:CC_airportshuttle:1213225582507335710> Airport Shuttle",
    "!PEOPLEMOVER": "<:CC_APM:1213188966753247323> Airport People Mover"
}

let routeCache = {}

let services = []
let servicesInfo = {}

let servicesRunning = []
let sectionsOpen = []

async function refreshCache() {
    Object.values(lineIds).forEach(async line => {
        let l = await fetch(URL + "/lines/" + line).catch(e => { //play.cashcraftserver.com
            return {status: 404};
        })
        if(l.status !== 200) {
            if(line === "unknown") return;
            console.log("FAILED to fetch TC2 api.")
            return;
        }
        l = JSON.parse(await l.text()).routes
        if(l.length === 0) return;
        routeCache[line.toUpperCase()] = {}
        l.forEach(async route => {
            let r = await fetch(URL + "/routes/" + line + "/" + route)
            stops = JSON.parse(await r.text()).stops;
            routeCache[line.toUpperCase()][route] = (stops)
            services.push(line + ":" + route)
            servicesInfo[line + ":" + route] = stops
        })
    })
}

let trainHistory = {}

servicesRunning = []

module.exports = async (g) => {
    let c = await g.channels.fetch(channelId)
    m2 = await c.messages.fetch(messageId2)
    c.messages.fetch(messageId).then(async m => {
        if(Object.keys(routeCache).length === 0) refreshCache()
        let t = await fetch(URL + "/trains").catch(e => {
            return {status: 404}
        })
        if(t.status !== 200) {
            console.log("FAILED to fetch TC2 api.")
            title = "# <:CC_newmetro:1061714477252350052> Metro Status <:CC_newmetro:1061714477252350052>"
            desc = ""
            let e = new Discord.EmbedBuilder()
            .setTitle("Metro Status")
            .setColor("#e91e63")
            .setTimestamp(Date.now())
            .setFooter({text: "Last updated"})
            Object.values(lineIds).filter(a => !("UNKNOWN".includes(a.toUpperCase()))).sort().forEach(a => {
                metroStatus = "<a:CC_buffering:1165782264769155083> Server is down! Reconnecting..."
                desc = desc + "\n## " + (titles[a.toUpperCase()] || a) + " \n> " + metroStatus
            })
            e.setDescription(desc)
            m.edit({content: title + "\n" + desc + "\n\n_ _", embeds:[]})
            m2.edit({content: "Last update: <t:" + Math.round(Date.now()/1000) + ":R>"})
            return;
        }
        //t = (await t.text()).replaceAll('"virtualized"',',"virtualized"')
        t = JSON.parse(await t.text()).trains
        let l = {}
        let trains = {}
        let locsStuck = {}
        servicesRunning = []
        sectionsOpen = sectionsOpen.filter(a => (a.lastChecked-5*60*1000) < (Date.now()))
        Object.values(t).forEach(train => {
            if(!servicesRunning.includes(train.route)) {
                stops = servicesInfo[train.route]
                servicesRunning.push(train.route)
                if(!stops) return;
                sectionsOpen.push({start: stops[0], end: stops[stops.length - 1], route: train.route, lastChecked: Date.now()})
            }
            let h = train.headcode[0]
            trains[lineIds[h]] ? trains[lineIds[h]] += 1 : trains[lineIds[h]] = 1;
            vec = train.vec.split("/")
            if((Math.abs(parseFloat(vec[0])) < 0.05 && Math.abs(parseFloat(vec[0])) > 0.0) || (Math.abs(parseFloat(vec[1])) < 0.05 && Math.abs(parseFloat(vec[1])) > 0.0)) {
                if(locsStuck[train.location]) {
                    locsStuck[train.location].amount += 1;
                    if(!locsStuck[train.location].routes.includes(train.route)) locsStuck[train.location].routes.push(train.route)
                } else locsStuck[train.location] = {amount: 1, routes: [train.route], singleBound: true, line: train.route.split(":")[0], nextStop: train.stops[0].replace(" (Platform ","~").replace(")","")}; 
            }
            if(l[lineIds[h]]) {
                return;
            } else {
                l[lineIds[h]] = true;
            }
        })
        let servicesClosed = services.filter(x => !servicesRunning.includes(x))
        let sectionsClosed = []
        servicesClosed.forEach(service => {
            let l = service.split(":")
            let line = l[0].toUpperCase()
            let route = l[1]
            let routeInfo = routeCache[line][route]
            if(!routeInfo || routeInfo.length == 0) return
            let matching = sectionsOpen.filter(a => {
                start = routeInfo.find(z => z.startsWith(a.start.split("~")[0]))
                end = routeInfo.find(z => z.startsWith(a.end.split("~")[0]))
                return routeInfo.indexOf(end) > routeInfo.indexOf(start) && routeInfo.indexOf(start) > -1
            })

            sb = false
            if(matching.length === 0) {
                if(sectionsClosed.find(a => (a.start.split("~")[0] === routeInfo[0].split("~")[0] && a.end.split("~")[0] === routeInfo[routeInfo.length - 1].split("~")[0]) || (a.end.split("~")[0] === routeInfo[0].split("~")[0] && a.start.split("~")[0] === routeInfo[routeInfo.length - 1].split("~")[0]))) return;
                if(sectionsOpen.find(a => (a.start.split("~")[0] === routeInfo[0].split("~")[0] && a.end.split("~")[0] === routeInfo[routeInfo.length - 1].split("~")[0]) || (a.end.split("~")[0] === routeInfo[0].split("~")[0] && a.start.split("~")[0] === routeInfo[routeInfo.length - 1].split("~")[0]))) {
                    sb = true;
                }
                sectionsClosed.push({start: routeInfo[0], end: routeInfo[routeInfo.length - 1], route: route, line: line, singleBound: sb, dest: routeInfo[routeInfo.length - 1]})
            } else {
                stopsOpen = servicesInfo[matching[0].route]
                stopsClosed = routeInfo.filter(x => !stopsOpen.includes(x))
                if(stopsClosed.length < 2) return;
                if(sectionsClosed.find(a => (a.start.split("~")[0] === stopsClosed[0].split("~")[0] && a.end.split("~")[0] === stopsClosed[stopsClosed.length - 1].split("~")[0]) || (a.end.split("~")[0] === stopsClosed[0].split("~")[0] && a.start.split("~")[0] === stopsClosed[stopsClosed.length - 1].split("~")[0]))) return;
                if(sectionsOpen.find(a => (a.start.split("~")[0] === stopsClosed[0].split("~")[0] && a.end.split("~")[0] === stopsClosed[stopsClosed.length - 1].split("~")[0]) || (a.end.split("~")[0] === stopsClosed[0].split("~")[0] && a.start.split("~")[0] === stopsClosed[stopsClosed.length - 1].split("~")[0]))) {
                    sb = true;
                }
                sectionsClosed.push({start: stopsClosed[0], end: stopsClosed[stopsClosed.length - 1], route: route, line: line, singleBound: sb, dest: routeInfo[routeInfo.length - 1]})
            }
        })
        title = "# <:CC_newmetro:1061714477252350052> Metro Status <:CC_newmetro:1061714477252350052>"
        desc = ""
        let e = new Discord.EmbedBuilder()
        .setTitle("Metro Status")
        .setColor("#e91e63")
        .setTimestamp(Date.now())
        .setFooter({text: "Last updated"})
        Object.values(lineIds).filter(a => !("UNKNOWN".includes(a.toUpperCase()))).sort().forEach(a => {
            if(!routeCache || Object.keys(routeCache).indexOf("RED") === -1 || Object.keys(routeCache["RED"]).length === 0) {
                metroStatus = "<a:CC_buffering:1165782264769155083> Loading timetables..."
            } else {
                metroStatus = "**GOOD SERVICE**"
                closedSecs = sectionsClosed.filter(z => z.line === a.toUpperCase())
                delayedSecs = Object.values(locsStuck).filter(z => z.line.toUpperCase() === a.toUpperCase() && z.amount > 1)
                if(closedSecs.length > 0) {
                    metroStatus = ""
                    closedSecsB = closedSecs.filter(a => !a.singleBound)
                    closedSecsS = closedSecs.filter(a => a.singleBound)
                    if(closedSecsB.length > 0) {
                        metroStatus = "**NO SERVICES** between " 
                    }
                    for(let i = closedSecsB.length; i > 0; i--) {
                        sec = closedSecsB[i-1]
                        closedSecsC = closedSecsB.filter(a => ((a.start.startsWith(sec.start.split("~")[0]) || a.end.startsWith(sec.start.split("~")[0])) || (a.start.startsWith(sec.end.split("~")[0]) || a.end.startsWith(sec.end.split("~")[0]))) );
                        if(closedSecsC.length > 1) {
                            result = {};
                            closedSecsC.forEach(secs => {
                                result[secs.start.split("~")[0]] ? result[secs.start.split("~")[0]] ++ : result[secs.start.split("~")[0]] = 1;
                                result[secs.end.split("~")[0]] ? result[secs.end.split("~")[0]] ++ : result[secs.end.split("~")[0]] = 1;
                            })
                            result = Object.entries(result).sort((a, b) => b[1] - a[1])
                            end = "";
                            start = result[0][0];
                            result.shift()
                            result.forEach(b => {
                                end = end + "/" + b[0];
                                i--;
                            })
                            metroStatus = metroStatus + "**" + start + "** and **" + end.replace("/","") + "**";
                            if(sec.singleBound) {
                                metroStatus = metroStatus + " (" + (shortNames[sec.dest.split("~")[0]] ? shortNames[sec.dest.split("~")[0]] : sec.dest.split("~")[0].split(" ")[0]) + " bound only)"
                            }
                            if(i > 2) {
                                metroStatus = metroStatus + "; "
                            }
                            if(i == 2) {
                                metroStatus = metroStatus + "; and "
                            }
                            if(i < 2 && closedSecsS.length > 0) {
                                metroStatus = metroStatus + "\n> "
                            }
                        } else {
                            metroStatus = metroStatus + "**" + sec.start.split("~")[0] + "** and **" + sec.end.split("~")[0] + "**"
                            if(sec.singleBound) {
                                metroStatus = metroStatus + " (" + (shortNames[sec.dest.split("~")[0]] ? shortNames[sec.dest.split("~")[0]] : sec.dest.split("~")[0].split(" ")[0]) + " bound only)"
                            }
                            if(i > 2) {
                                metroStatus = metroStatus + "; "
                            }
                            if(i == 2) {
                                metroStatus = metroStatus + "; and "
                            }
                            if(i == 1 && closedSecsS.length > 0) {
                                metroStatus = metroStatus + "\n> "
                            }
                        }
                    }
                    if(closedSecsS.length > 0) {
                        metroStatus = metroStatus + "**NO SERVICES** between " 
                    }
                    for(let i = closedSecsS.length; i > 0; i--) {
                        sec = closedSecsS[i-1]
                        closedSecsC = closedSecsS.filter(a => ((a.start.startsWith(sec.start.split("~")[0]) || a.end.startsWith(sec.start.split("~")[0])) || (a.start.startsWith(sec.end.split("~")[0]) || a.end.startsWith(sec.end.split("~")[0]))) && a.dest === sec.dest);
                        if(closedSecsC.length > 1) {
                            result = {};
                            closedSecsC.forEach(secs => {
                                result[secs.start.split("~")[0]] ? result[secs.start.split("~")[0]] ++ : result[secs.start.split("~")[0]] = 1;
                                result[secs.end.split("~")[0]] ? result[secs.end.split("~")[0]] ++ : result[secs.end.split("~")[0]] = 1;
                            })
                            result = Object.entries(result).sort((a, b) => b[1] - a[1])
                            end = "";
                            start = result[0][0];
                            result.shift()
                            result.forEach(b => {
                                end = end + "/" + b[0];
                                i--;
                            })
                            metroStatus = metroStatus + "**" + start + "** and **" + end.replace("/","") + "**";
                            if(sec.singleBound) {
                                metroStatus = metroStatus + " (" + (shortNames[sec.dest.split("~")[0]] ? shortNames[sec.dest.split("~")[0]] : sec.dest.split("~")[0].split(" ")[0]) + " bound only)"
                            }
                            i -= (closedSecsC.length - 1);
                            if(i > 2) {
                                metroStatus = metroStatus + "; "
                            }
                            if(i == 2) {
                                metroStatus = metroStatus + "; and "
                            }
                        } else {
                            metroStatus = metroStatus + "**" + sec.start.split("~")[0] + "** and **" + sec.end.split("~")[0] + "**"
                            if(sec.singleBound) {
                                metroStatus = metroStatus + " (" + (shortNames[sec.dest.split("~")[0]] ? shortNames[sec.dest.split("~")[0]] : sec.dest.split("~")[0].split(" ")[0]) + " bound only)"
                            }
                            if(i > 2) {
                                metroStatus = metroStatus + "; "
                            }
                            if(i == 2) {
                                metroStatus = metroStatus + "; and "
                            }
                        }
                    }
                    if(delayedSecs.length > 0) {
                        metroStatus = metroStatus + "\n> **NO SERVICES** between " 
                    }
                    for(let i = delayedSecs.length; i > 0; i--) {
                        sec = delayedSecs[i-1]
                        startDone = [];
                        for(route of sec.routes) {
                            let r = routeCache[sec.line.toUpperCase()][route.split(":")[1]]
                            let z = r.indexOf(sec.nextStop);
                            let prevStop = r[z-1];
                            if(startDone.includes(prevStop)) continue;
                            startDone.push(prevStop)
                            metroStatus = metroStatus + " **" + prevStop.split("~")[0] + "** and **" + sec.nextStop.split("~")[0] + "**"
                            if(i > 2) {
                                metroStatus = metroStatus + "; "
                            }
                            if(i == 2) {
                                metroStatus = metroStatus + "; and "
                            }
                            if(i == 1) metroStatus = metroStatus + " due to a points failure before **" + sec.nextStop.split("~")[0] + "**";
                        }
                    }
                    if(delayedSecs.length > 0) {
                        metroStatus = metroStatus + "\n> **SEVERE DELAYS** between " 
                    }
                    for(let i = delayedSecs.length; i > 0; i--) {
                        sec = delayedSecs[i-1]
                        startDone = [];
                        for(route of sec.routes) {
                            let r = routeCache[sec.line.toUpperCase()][route.split(":")[1]]
                            let z = r.indexOf(sec.nextStop);
                            let prevStop = r[z-1];
                            if(startDone.includes(prevStop)) continue;
                            startDone.push(prevStop)
                            metroStatus = metroStatus + " **" + r[0].split("~")[0] + "** and **" + prevStop.split("~")[0] + "**"
                            if(i > 2) {
                                metroStatus = metroStatus + "; "
                            }
                            if(i == 2) {
                                metroStatus = metroStatus + "; and "
                            }
                        }
                    }
                    metroStatus = metroStatus + "\n> **GOOD SERVICE** on the rest of the line."
                }
                metroStatus = (l[a] ? metroStatus : "<:CC_Cross:1180965168440692807> **NO SERVICES**");
            }
            desc = desc + "\n## " + (titles[a.toUpperCase()] || a) + " (`" + (trains[a] || 0)  + "` trains) \n> " + metroStatus
        })
        if(desc.length > 1800) {
            desc1 = "";
            desc2 = "";
            for(d of desc.split("\n")) {
                if(d === "") d = "_ _"
                if(desc1.length > 1500) {
                    desc2 = desc2 + "\n" + d;
                } else {
                    desc1 = desc1 + "\n" + d;
                }
            }
            m.edit({content: title + "\n" + desc1.replace("\n",""), embeds:[]})
            m2.edit({content: desc2.replace("\n","") + "\n\nLast update: <t:" + Math.round(Date.now()/1000) + ":R>"})
        } else {
            m.edit({content: title + "\n" + desc + "\n\n_ _", embeds:[]})
            m2.edit({content: "Last update: <t:" + Math.round(Date.now()/1000) + ":R>"})
        }
    }).catch(e => {
        console.log(e)
    })
}

module.exports.refreshCache = refreshCache;