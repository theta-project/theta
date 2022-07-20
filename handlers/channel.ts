import packetIds from "../constants/packet_ids";
import { SerializationBuffer, SlowSerializationBuffer } from "../objects/serialization";
import * as sessionHandler from "../handlers/sessions"

export interface Channel {
    name: string;
    topic: string;
    autoJoin: boolean;
    joinedPlayers: number[]
}

let channelList: Channel[] = [];

export async function initialize() {
    let osu: Channel = {
        name: "#osu",
        topic: "The main chat channel",
        autoJoin: true,
        joinedPlayers: []
    };
    let announce: Channel  = {
        name: "#announcements",
        topic: "Top scores",
        autoJoin: true,
        joinedPlayers: []
    };
    let lobby: Channel  = {
        name: "#lobby",
        topic: "Multiplayer lobby chat",
        autoJoin: false,
        joinedPlayers: []
    };

    channelList.push(osu, announce, lobby);
}

export function list(writer: SerializationBuffer, playerId: number, isAdmin: boolean = false): void {
    channelList.forEach(channel => {
        if (!channel.autoJoin) {
            writer.writePacket(packetIds.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
        } else {
            writer.writePacket(packetIds.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
            join(writer, channel.name, playerId);
        }
    })
}

export function join(writer: SerializationBuffer, channelName: string, playerId: number): boolean {
    let joined = false;
    channelList.forEach(channel => {
        if (channel.name === channelName) {
            writer.writePacket(packetIds.BANCHO_CHANNEL_JOIN_SUCCESS, b => b.writeString(channel.name));
            channel.joinedPlayers.push(playerId);

            let sb = new SlowSerializationBuffer();
            sb.writePacket(packetIds.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
            sessionHandler.broadcastGlobally(sb.flush());
            joined = true;
        }
    });

    if (!joined)
        writer.writePacket(packetIds.BANCHO_CHANNEL_REVOKED, b => b.writeString(channelName));

    return joined;
}

export function leave(channelName: string, playerId: number): void {
    channelList.forEach(channel => {
        if (channel.name === channelName) {
            let pos = 0;
            for (let i = 0; i < channel.joinedPlayers.length; i++) {
                if (channel.joinedPlayers[i] == playerId) {
                    pos = i;
                }
            }

            channel.joinedPlayers.splice(pos, 1);

            let sb = new SlowSerializationBuffer();
            sb.writePacket(packetIds.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
            sessionHandler.broadcastGlobally(sb.flush());
        }
    });
}

export function find(channelName: string): Channel | undefined {
    for (let i = 0; i < channelList.length; i++) {
        if (channelList[i].name == channelName) {
            return channelList[i];
        }
    }
    return undefined;
}