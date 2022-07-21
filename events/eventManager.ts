import changeStatus from "./presence/changeStatus"
import * as logHandler from "../handlers/logs";
import { packetIDs } from "../constants/packet_ids";
import { Player } from "../objects/player";
import { ReadOnlySerializationBuffer } from "../objects/serialization";
import sendMessagePublic from "./chat/sendMessageChannel";
import sendMessagePrivate from "./chat/sendMessagePrivate";
import clientLogout from "./sessions/clientLogout";
import requestStatusUpdate from "./presence/requestStatsUpdate";
import channelJoin from "./chat/channelJoin";
import channelLeave from "./chat/channelLeave";
import requestUserStats from "./presence/requestUserStats";
import beginSpectating from "./spectators/startSpectating";
import stopSpectating from "./spectators/stopSpectating";
import cantSpectate from "./spectators/cantSpectate";
import sendSpectatorFrames from "./spectators/sendSpecFrames";


export async function manageEvents(packetID: number, reader: ReadOnlySerializationBuffer, session: Player): Promise<void> {
    let events = {
        [packetIDs.CLIENT_SEND_USER_STATUS]: changeStatus,
        [packetIDs.CLIENT_SEND_IRC_MESSAGE]: sendMessagePublic,
        [packetIDs.CLIENT_EXIT]: clientLogout,
        [packetIDs.CLIENT_REQUEST_STATUS_UPDATE]: requestStatusUpdate,

        [packetIDs.CLIENT_START_SPECTATING]: beginSpectating,
        [packetIDs.CLIENT_STOP_SPECTATING]: stopSpectating,
        [packetIDs.CLIENT_CANT_SPECTATE]: cantSpectate,
        [packetIDs.CLIENT_SPECTATE_FRAMES]: sendSpectatorFrames,

        [packetIDs.CLIENT_SEND_IRC_MESSAGE_PRIVATE]: sendMessagePrivate,        
        [packetIDs.CLIENT_CHANNEL_JOIN]: channelJoin,
        [packetIDs.CLIENT_CHANNEL_LEAVE]: channelLeave,
        [packetIDs.CLIENT_USER_STATS_REQUEST]: requestUserStats
    };

    try {
        events[packetID](reader, session);
    } catch {
        if (packetID != 4) {
            logHandler.info(`${session.username} (${session.id}) unhandled packet -> ${packetID}`);
        }
    }
    session.ping();
    return;
}