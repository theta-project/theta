import * as sessionHandler from "../../handlers/sessions";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer, SlowSerializationBuffer } from "../../objects/serialization";
import { packetIDs } from "../../constants/packet_ids";


export default async function sendSpectatorFrames(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    if (session.spectators.length <= 0) {
        return logHandler.error(`${session.username} (${session.id}) sent frames to nobody..?`);
    }

    reader.mark();
    reader.readPosition = reader.packetEnd!;
    const slice = reader.slice();
    const frameBuffer = new SlowSerializationBuffer(7);
    frameBuffer.writePacket(packetIDs.BANCHO_SPECTATE_FRAMES, b => b.writeBuffer(slice!));

    for (let i = 0; i < session.spectators.length; i++) {
        session.spectators[i].buffer.writeBuffer(frameBuffer.buffer);
    }
}