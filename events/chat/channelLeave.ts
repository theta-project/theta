import * as channelHandler from "../../handlers/channel";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function channelLeave(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let channelToLeave = reader.readString();
    channelHandler.leave(channelToLeave, session.id);
}