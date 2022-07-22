import * as channelHandler from "../../handlers/channel";
import * as logHandler from "../../handlers/logs";
import * as sessionHandler from "../../handlers/sessions";
import { packetIDs } from "../../constants/packet_ids";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function sendMessagePublic(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let message = reader.readMessage();
    message.sendingClient = session.username;
    message.senderId = session.id;
    logHandler.info(`${session.username} (${message.target}) => ${message.message}`);
    let channel = channelHandler.find(message.target);
    
    if (session.isSpectating) {
        var spectatedPlayer = sessionHandler.find(p => p.id == session.spectatingID);
        
        if (spectatedPlayer) {
            channel = spectatedPlayer.spectatorChannel;
        }
    }


    if (channel) {
        for (let i = 0; i < channel.joinedPlayers.length; i++) {
            const player = sessionHandler.find(s => s.id == channel?.joinedPlayers[i]);

            if (player && player.id == session.id) {
                continue;
            }

            if (player) {
                player.buffer.writePacket(packetIDs.BANCHO_SEND_MESSAGE, b => b.writeMessage(message));
            }
        }
    }

}