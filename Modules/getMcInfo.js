const fetch = require("node-fetch")

const { Buffer }  = require('buffer');

module.exports = async (user) => {
    let a = await fetch("https://api.mojang.com/users/profiles/minecraft/" + user)
    if(a.status !== 200) {
        return {}
    }
    a = await a.json()
    let b = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + a.id)
    if(b.status !== 200) {
        return {}
    }
    
    b = await b.json()
    let c = Buffer.from(b.properties[0].value, 'base64');
    let d = c.toString('utf-8')
    let e = JSON.parse(d)
    b.textures = e.textures
    return b
}

module.exports.uuid = async (user) => {
    let b = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + user)
    if(b.status !== 200) {
        return {}
    }
    
    b = await b.json()
    let c = Buffer.from(b.properties[0].value, 'base64');
    let d = c.toString('utf-8')
    let e = JSON.parse(d)
    b.textures = e.textures
    return b
}

module.exports.bedrock = async (user) => {
    let b = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + user)
    if(b.status !== 200) {
        return {}
    }
    
    b = await b.json()
    let c = Buffer.from(b.properties[0].value, 'base64');
    let d = c.toString('utf-8')
    let e = JSON.parse(d)
    b.textures = e.textures
    return b
}