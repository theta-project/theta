import { packetIDs } from "../constants/packet_ids";
import { SerializationBuffer, SlowSerializationBuffer } from "../objects/serialization";
import { query } from "./mysql";
import * as sessionHandler from "../handlers/sessions"

export interface Channel {
    name: string;
    topic: string;
    autoJoin: boolean;
    joinedPlayers: number[]
}

let channelList: Channel[] = [];

export async function initialize() {
    let channels: any = await query("SELECT * FROM channels");
    for (let channel in channels) {
        let chan: Channel = {
            name: channels[channel].name,
            topic: channels[channel].topic,
            autoJoin: channels[channel].autojoin == 1,
            joinedPlayers: []
        }
        channelList.push(chan);

    }
}

export function list(writer: SerializationBuffer, playerId: number, isAdmin: boolean = false): void {
    channelList.forEach(channel => {
        if (!channel.autoJoin) {
            writer.writePacket(packetIDs.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
        } else {
            writer.writePacket(packetIDs.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
            join(writer, channel, playerId);
        }
    })
}

export function join(writer: SerializationBuffer, channel: Channel, playerId: number): void {
    if (channel) {
        writer.writePacket(packetIDs.BANCHO_CHANNEL_JOIN_SUCCESS, b => b.writeString(channel.name));
        channel.joinedPlayers.push(playerId);

        let sb: SlowSerializationBuffer = new SlowSerializationBuffer();
        sb.writePacket(packetIDs.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
        sessionHandler.broadcastGlobally(sb.flush());
    }
}

export function leave(channel: Channel, playerId: number): void {
    if (channel) {
        let pos: number = 0;
        for (let i = 0; i < channel.joinedPlayers.length; i++) {
            if (channel.joinedPlayers[i] == playerId) {
                pos = i;
            }
        }

        channel.joinedPlayers.splice(pos, 1);

        let sb: SlowSerializationBuffer = new SlowSerializationBuffer();
        sb.writePacket(packetIDs.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
        sessionHandler.broadcastGlobally(sb.flush());
    }
}

export function find(channelName: string): Channel | undefined {
    for (let i = 0; i < channelList.length; i++) {
        if (channelList[i].name == channelName) {
            return channelList[i];
        }
    }
    return undefined;
}