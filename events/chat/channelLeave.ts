import * as channelHandler from "../../handlers/channel";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function channelLeave(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let channelName = reader.readString();
    let channelToLeave = channelHandler.find(channelName);
    if (channelLeave != undefined) {
        channelHandler.leave(channelToLeave, session.id);
    }
    
}