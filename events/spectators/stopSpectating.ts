import * as sessionHandler from "../../handlers/sessions";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";
import { packetIDs } from "../../constants/packet_ids";


export default async function stopSpectating(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    if (session.isSpectating) {
        let currentlySpectating = sessionHandler.find(p => p.id === session.spectatingID);
        if (currentlySpectating != null) {
            let placeInSpectators = currentlySpectating.spectators.findIndex(p => p.id === session.id);
            if (placeInSpectators != -1) {
                currentlySpectating.spectators.splice(placeInSpectators, 1);
            }

            for (let i = 0; i < currentlySpectating.spectators.length; i++) {
                currentlySpectating.spectators[i].buffer.writePacket(packetIDs.BANCHO_FELLOW_SPECTATOR_LEFT, b => b.writeInt(session.id));
            }

            currentlySpectating.buffer.writePacket(packetIDs.BANCHO_SPECTATOR_LEFT, b => b.writeInt(session.id));

            session.spectatingID = -1;
            session.isSpectating = false;  
        }
    }

}