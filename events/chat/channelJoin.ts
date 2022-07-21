import * as channelHandler from "../../handlers/channel";
import * as logHandler from "../../handlers/logs";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function channelJoin(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let channelToJoin = reader.readString();
    if (channelHandler.join(session.buffer, channelToJoin, session.id)) {
        logHandler.success(`${session.username} (${session.id}) has just joined channel ${channelToJoin}`);
    } else {
        logHandler.warn(`${session.username} (${session.id}) has just tried to join non-existent channel (${channelToJoin})`);
    }
}