import { packetIDs } from "../../constants/packet_ids";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function requestStatusUpdate(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(session.stats));
}