import * as sessionHandler from "../../handlers/sessions";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";
import { packetIDs } from "../../constants/packet_ids";
import stopSpectating from "./stopSpectating";


export default async function beginSpectating(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let requestedID = reader.readInt();
    let specPlayer = sessionHandler.find(p => p.id === requestedID);
    if (!specPlayer) {
        return logHandler.error(`${session.username} (${session.id}) tried to spectate someone who doesn't exist`);
    }


    logHandler.info(`${session.username} (${session.id}) has requested to spectate ${requestedID}`);
    if (session.isSpectating) {
        stopSpectating(reader, session);
    }

    session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(specPlayer!.stats));
    for (let i = 0; i < specPlayer.spectators.length; i++) {
        session.buffer.writePacket(packetIDs.BANCHO_FELLOW_SPECTATOR_JOINED, b => b.writeInt(specPlayer!.spectators[i].id));
        specPlayer.spectators[i].buffer.writePacket(packetIDs.BANCHO_FELLOW_SPECTATOR_JOINED, b => b.writeInt(session.id));
    }

    specPlayer.spectators.push(session);
    specPlayer.buffer.writePacket(packetIDs.BANCHO_SPECTATOR_JOINED, b => b.writeInt(session.id));
    session.spectatingID = specPlayer.id;
    session.isSpectating = true;
    logHandler.info(`${session.username} (${session.id}) has begun spectating ${specPlayer.username}`);
}