import { packetIDs } from "../constants/packet_ids";
import privileges from '../constants/privileges';
import { Player } from "../objects/player";
import { SlowSerializationBuffer } from "../objects/serialization";
import { broadcastGlobally, playerCount } from "../handlers/sessions";
import os from "os";
export interface Command {
    syntax: string;
    callback: (player: Player, channel: string, args: string[]) => Promise<string>;
    permissions?: number;
}

async function help(player: Player, channel: string, args: string[]) {
    return "(Find all runnable commands on Theta here)[https://github.com/theta-project/theta/blob/master/docs/COMMANDS.md]";
}

async function serverStatus(player: Player, channel: string, args: string[]) {
    const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
    let output = ""
    output += `Node.JS version: ${process.version}\n`;
    let load = os.loadavg();
    output += `Load Average (last minute): ${load[0]}\n`
    output += `RAM Usage: ${formatMemoryUsage(process.memoryUsage().rss)} \n`;
    output += `Online Players: ${playerCount()}\n`;
    output += `Theta Version: ${process.env.npm_package_version}\n`
    return output
}

async function announce(player: Player, channel: string, args: string[]): Promise<string> {
    let cmdBuffer = new SlowSerializationBuffer();
    cmdBuffer.writePacket(packetIDs.BANCHO_ANNOUNCE, b => b.writeString(args.join(" ")));

    broadcastGlobally(cmdBuffer);

    return "Sent alert";
}

async function rankMap(player: Player, channel: string, args: string[]): Promise<string> {
    const [ status, type, rx, id ] = args;

    //MYSQL REQUEST

    /*const beatmap = database.request(`SELECT * FROM beatmaps WHERE id = ${id}`)

    if(beatmap[`status_${rx}`] == status) return "This map is already {} for {}!"*/

    // if(type == "set")
    
    return "";
}

// TODO: idk if there's a better way besides using `as Command` to every object
export default {
    "help": {
        syntax: "",
        callback: help,
        permissions: 0,
    } as Command,
    "status": {
        syntax: "",
        callback: serverStatus,
        permissions: 0,
    },
    "announce": {
        syntax: "<message>",
        callback: announce,
        permissions: 0
    } as Command,
    "map": {
        syntax: "<rank/love> <map/set> <submode> <beatmapid>",
        callback: rankMap
    } as Command
}