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
    if(bot) return;

    if(content.startsWith(".")){
        const [CMD,...args] = content.trim()   
            .toLowerCase()
            .substr(1,content.length)
            .split(/\s+/)
        switch(CMD){
            case "tfc":
                await fetchTraffic(args[0],message.channel)
                break;
            default:
                console.log("command not found")
        }
    }
})


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

    let embed = tfcEmbed(icao,arrList,depList);

    channel.send({embed})
}

const tfcEmbed = (icao,arrivals,depatures) =>{
    let title = `**${icao.toUpperCase()}** Traffic Information\n\n`
    title += `✈ Depatures (**${depatures.length}**)\n\n`
    depatures.forEach(flight=>{
        title += `🔹${flight.callsign} (*${flight.planned_aircraft}*) -> ${flight.planned_destairport}\n`
    })
    title += `\n\n🛬 Arrivals (**${arrivals.length}**)\n\n`
    arrivals.forEach(flight=>{
        title += `🔹${flight.callsign} (*${flight.planned_aircraft}*) <- ${flight.planned_destairport}\n`
    })
    let msg = `${title}`
    return {
        color:3447003,
        description:msg
    }
}
