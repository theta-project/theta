import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";
import * as sessionHandler from "../../handlers/sessions";

export default async function clientLogout(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    sessionHandler.remove(session.id, "quit");
}