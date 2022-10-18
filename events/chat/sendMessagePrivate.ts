import * as botHandler from "../../handlers/bot";
import { packetIDs } from "../../constants/packet_ids";
import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";
import * as sessionHandler from "../../handlers/sessions";

export default async function sendMessagePrivate(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let message = reader.readMessage();
    message.sendingClient = session.username;
    message.senderId = session.id;
    let to = sessionHandler.find(s => s.username == message.target);
    if (to == null) {
        return;
    }
    
    if (to.id === 5) {
        // reimplement goeo's memebot because its awesome
        botHandler.handleCommand(message.message, message.target, session);
        return;
    }

    to.buffer.writePacket(packetIDs.BANCHO_SEND_MESSAGE, b => b.writeMessage(message));
}