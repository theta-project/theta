import { packetIDs } from "../../constants/packet_ids";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer, SlowSerializationBuffer } from "../../objects/serialization";
import * as sessionHandler from "../../handlers/sessions";

export default async function changeStatus(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    reader.readStatus(session.stats.status);
    if (session.stats.status.mods & 128) {
        session.relaxing = true;
        session.announced_ap = false;
        session.aping = false;
        if (!session.announced_relax) {
            session.announced_relax = true;
            session.buffer.writePacket(packetIDs.BANCHO_ANNOUNCE, b => b.writeString(`You have switched to the relax leaderboards.`));
        }
    } else if (session.stats.status.mods & 8192) {
        session.relaxing = false;
        session.announced_relax = false;
        session.aping = true;
        if (!session.announced_ap) {
            session.announced_ap = true;
            session.buffer.writePacket(packetIDs.BANCHO_ANNOUNCE, b => b.writeString(`You have switched to the autopilot leaderboards.`));
        }
    } else {
        session.relaxing = false;
        session.announced_relax = false;
        session.announced_ap = false;
        session.aping = false; 
    }

    let statusBuffer: SlowSerializationBuffer = new SlowSerializationBuffer();
    statusBuffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(session.stats))
    sessionHandler.broadcastGlobally(statusBuffer.flush());
}