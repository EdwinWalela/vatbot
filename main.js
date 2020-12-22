require('dotenv').config();
const { Client } = require("discord.js");
const axios = require("axios");
const TOKEN = process.env.DISCORD_TOKEN

const client = new Client({disableEveryone:false})

client.login(TOKEN);

client.on("ready",async()=>{
    console.log("Bot online")
    client.user.setActivity('VHF radio',{type:'LISTENING'})
})

client.on("message",async(message)=>{
    let bot = message.author.bot
    let content = message.content

    if(bot) return

    if(content.startsWith("?")){
        const [CMD,...args] = content.trim()   
            .toLowerCase()
            .substr(1,content.length)
            .split(/\s+/)
        switch(CMD){
            case "info":
                await fetchTraffic(args[0],message.channel)
                break;
            case "track":
                await trackFlight(args[0],message.channel)
                break;
            default:
                console.log("command not found")

        }
    }
})

const getMetar = async (icao) =>{
    const options = {
        headers: {'X-API-Key': 'b47023eb532d490daedf9056dd'}
    }
    let res = await axios.get(`https://api.checkwx.com/metar/${icao}`,options)
    let metar = `${res.data.data[0]}`;
    return metar;
}

const trackFlight = async (callsign,channel) =>{
    let res = await axios.get('http://cluster.data.vatsim.net/vatsim-data.json')
    let clients = res.data.clients;
    let ac = clients.find(client=>client.callsign.toLowerCase() == callsign)
    let embed = trackingEmbed(ac)

    channel.send({embed})
}

const fetchTraffic = async(icao,channel) =>{
    let res = await axios.get('http://cluster.data.vatsim.net/vatsim-data.json')
    let clients = res.data.clients;

    let depList = clients.filter(client=>{
        if(!client.planned_depairport) return false;
        return client.planned_depairport.toLowerCase() == icao
    })

    let arrList = clients.filter(client=>{
        if(!client.planned_destairport) return false;
        return client.planned_destairport.toLowerCase() == icao
    })

    let embed = await tfcEmbed(icao,arrList,depList);

    channel.send({embed})
}

const tfcEmbed = async (icao,arrivals,depatures) =>{
    let title = `**${icao.toUpperCase()} Airport Information**\n\n`
    let metar = await getMetar(icao);
    title += `\`${metar}\`\n\n`
    title += `✈ Depatures (**${depatures.length}**)\n`
    if(depatures.length != 0){
        title += "```\n"
        title += "Callsign     Dest.   Equipment\n"
        depatures.forEach(flight=>{
            let aircraft = "";
            let eq = flight.planned_aircraft.split("/");
            for(let i = 0; i < eq.length; i++){
                if(eq[i].length > 3){
                    aircraft = eq[i]
                    break;
                }
            }
            let callsign = flight.callsign.trim()
            if(callsign.length<10){
                let x = 10 - callsign.length;
                for(let i = x; i > 0; i--){
                    callsign = callsign.concat(" ");
                }
            }

            title += ` ${callsign}  ${flight.planned_destairport}     ${aircraft}\n`
        })
        title += "```\n"
    }

    title += `🛬 Arrivals (**${arrivals.length}**)\n`
    
    if(arrivals.length != 0){
        title += "```\n"
        title += "Callsign    Origin  Equipment\n"
        arrivals.forEach(flight=>{
            let aircraft = "";
            let eq = flight.planned_aircraft.split("/");
            for(let i = 0; i < eq.length; i++){
                if(eq[i].length > 3){
                    aircraft = eq[i]
                    break;
                }
            }
            let callsign = flight.callsign.trim()
            if(callsign.length<10){
                let x = 10 - callsign.length;
                for(let i = x; i > 0; i--){
                    callsign = callsign.concat(" ");
                }
            }
            
            title += ` ${callsign}  ${flight.planned_depairport}     ${aircraft}\n`
        })
        title +="```"
    }
    let msg = `${title}`
    return {
        color:3447003,
        description:msg
    }
}

const trackingEmbed = (ac) =>{
    if(!ac){
        let body = "**Callsign Offline**"
        return {
            color:3447003,
            description:body
        }
    }
    let callsign = ac.callsign;
    let origin = ac.planned_depairport
    let dest = ac.planned_destairport
    let alt = padValue(`${ac.altitude}ft`,6)
    let gs = padValue(`${ac.groundspeed}kts`,6)
    let heading = padValue(ac.heading,3)
    let equipment = ac.planned_aircraft.split("/");
    let aircraft = "";
    for(let i = 0; i < equipment.length; i++){
        if(equipment[i].length > 3){
            aircraft = equipment[i]
            break;
        }
    }
    let body = `\`\`\``
    body+=  ` Origin   Destination   Altitude    G/S    Heading  Equipment\n`;
    body+= `  ${origin}       ${dest}       ${alt}    ${gs}    ${heading}       ${aircraft}\n`
    body+= `\`\`\``
    return {
        color:3447003,
        description:body
    }
}

const padValue = (val,padding) =>{
    val = String(val)
    if(val.length<padding){
        let x = padding - val.length;
        for(let i = x; i > 0; i--){
            val = val.concat(" ");
        }
    }
    return val;
}