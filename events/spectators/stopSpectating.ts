import * as sessionHandler from "../../handlers/sessions";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";
import { packetIDs } from "../../constants/packet_ids";
import { leave } from "../../handlers/channel";


export default async function stopSpectating(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    if (session.isSpectating) {
        let currentlySpectating = sessionHandler.find(p => p.id === session.spectatingID);
        if (currentlySpectating != null) {
            let placeInSpectators = currentlySpectating.spectators.findIndex(p => p.id === session.id);
            if (placeInSpectators != -1) {
                currentlySpectating.spectators.splice(placeInSpectators, 1);
            }


            let pos = 0;
            for (let i = 0; i < currentlySpectating.spectatorChannel.joinedPlayers.length; i++) {
                if (currentlySpectating.spectatorChannel.joinedPlayers[i] == session.id) {
                    pos = i;
                }
            }
            currentlySpectating.spectatorChannel.joinedPlayers.splice(pos, 1);


            for (let i = 0; i < currentlySpectating.spectators.length; i++) {
                currentlySpectating.spectators[i].buffer.writePacket(packetIDs.BANCHO_CHANNEL_AVAILABLE, b => b.writeChannel({ name: currentlySpectating!.spectatorChannel.name, topic: currentlySpectating!.spectatorChannel.topic, userCount: currentlySpectating!.spectatorChannel.joinedPlayers.length }))
                currentlySpectating.spectators[i].buffer.writePacket(packetIDs.BANCHO_FELLOW_SPECTATOR_LEFT, b => b.writeInt(session.id));
            }

            currentlySpectating.buffer.writePacket(packetIDs.BANCHO_SPECTATOR_LEFT, b => b.writeInt(session.id));

            if (currentlySpectating.spectators.length == 0) {
                currentlySpectating.buffer.writePacket(packetIDs.BANCHO_CHANNEL_REVOKED, b => b.writeString(currentlySpectating!.spectatorChannel.name))
                currentlySpectating.spectatorChannel.joinedPlayers = [];
            }

            session.spectatingID = -1;
            session.isSpectating = false;
        }
    }

}