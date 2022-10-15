import * as sessionHandler from "../../handlers/sessions";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";
import { packetIDs } from "../../constants/packet_ids";


export default async function cantSpectate(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    if (session.isSpectating) {
        let currentlySpectating = sessionHandler.find(p => p.id === session.spectatingID);
        if (currentlySpectating != null) {
            currentlySpectating.buffer.writePacket(packetIDs.BANCHO_SPECTATOR_CANT_SPECTATE, b => b.writeInt(session.id));
        }
    }
}