import { packetIDs } from "../../constants/packet_ids";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer, SlowSerializationBuffer } from "../../objects/serialization";
import * as sessionHandler from "../../handlers/sessions";

export default async function changeStatus(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    reader.readStatus(session.stats.status);
    // todo update pp and stuff in player class
    let statusBuffer: SlowSerializationBuffer = new SlowSerializationBuffer();
    statusBuffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(session.stats))
    sessionHandler.broadcastGlobally(statusBuffer.flush());
}