import { Player } from "../../objects/player";
import { ReadOnlySerializationBuffer } from "../../objects/serialization";

export default async function clientPing(reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    session.ping()
}