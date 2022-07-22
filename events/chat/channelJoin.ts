import { packetIDs } from "../../constants/packet_ids";
import * as channelHandler from "../../handlers/channel";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function channelJoin(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let channelName = reader.readString();
    let channelToJoin = channelHandler.find(channelName);
    if (channelJoin == undefined) {
        logHandler.warn(`${session.username} (${session.id}) has just tried to join non-existent channel (${channelToJoin})`);
        return session.buffer.writePacket(packetIDs.BANCHO_CHANNEL_REVOKED, b => b.writeString(channelName));
    }
    channelHandler.join(session.buffer, channelToJoin!, session.id)
    logHandler.success(`${session.username} (${session.id}) has just joined channel ${channelToJoin}`);
}