module.exports = (p) => {
    if(p === "" || p === null) {
        return "";
    }
    p = p.split("-").join("").replace(/<@[0-9]*>/, "").split(" ").join("").split("\n").join("")
    if (p.split("Plot:").length > 1) p = p.split("Plot:")[1]
    p2 = p.toUpperCase()
    return p2
}