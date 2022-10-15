import { packetIDs } from "../../constants/packet_ids";
import { Player } from "../../objects/player";
import { PresenceStats } from "../../objects/packetInterfaces";
import { ReadOnlySerializationBuffer, SlowSerializationBuffer } from "../../objects/serialization";
import * as sessionHandler from "../../handlers/sessions";

export default async function requestUserStats(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let length: number = reader.readShort();
    if (length > 32) {
        return;
    } 
        
    for (let i = 0; i < length; i++) {
        let playerId: number = reader.readShort();
        let player: Player | undefined = sessionHandler.find(s => s.id === playerId);

        if (!player || playerId === session.id) {
            continue;
        }

        session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(player?.stats as PresenceStats));
    }
}