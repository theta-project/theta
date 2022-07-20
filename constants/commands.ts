import packetIds from "../constants/packet_ids";
import privileges from '../constants/privileges';
import { Player } from "../objects/player";
import { SlowSerializationBuffer } from "../objects/serialization";

export interface Command {
    syntax: string;
    callback: (player: Player, channel: string, args: string[]) => Promise<string>;
    permissions?: number;
}

async function announce(player: Player, channel: string, args: string[]): Promise<string> {
    let cmdBuffer = new SlowSerializationBuffer();
    cmdBuffer.writePacket(packetIds.BANCHO_ANNOUNCE, b => b.writeString(args.join(" ")));

    for (let i = 0; i < global.sessionList.length; i++) {
        if (global.sessionList[i].bot) 
            continue;
        global.sessionList[i].buffer.writeBuffer(cmdBuffer.buffer);
    }

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