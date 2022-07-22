import { packetIDs } from "../constants/packet_ids";
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
    let announce: Channel = {
        name: "#announcements",
        topic: "Top scores",
        autoJoin: true,
        joinedPlayers: []
    };
    let lobby: Channel = {
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

        let sb = new SlowSerializationBuffer();
        sb.writePacket(packetIDs.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: channel.name, topic: channel.topic, userCount: channel.joinedPlayers.length }));
        sessionHandler.broadcastGlobally(sb.flush());
    }
}

export function leave(channel: Channel, playerId: number): void {
    if (channel) {
        let pos = 0;
        for (let i = 0; i < channel.joinedPlayers.length; i++) {
            if (channel.joinedPlayers[i] == playerId) {
                pos = i;
            }
        }

        channel.joinedPlayers.splice(pos, 1);

        let sb = new SlowSerializationBuffer();
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