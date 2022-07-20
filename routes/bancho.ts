import * as botHandler from "../handlers/bot";
import * as channelHandler from "../handlers/channel";
import * as logHandler from "../handlers/logs";
import packetIDs from "../constants/packet_ids";
import * as sessionHandler from "../handlers/sessions"
import { ReadOnlySerializationBuffer, SlowSerializationBuffer } from "../objects/serialization";
import { Request, Response, DefaultResponseLocals } from "hyper-express";
import { PresenceStats } from "../objects/packetInterfaces";
import { Player } from "../objects/player";

const RESTART_BUFFER = new SlowSerializationBuffer(11);

RESTART_BUFFER.writePacket(packetIDs.BANCHO_RESTART, b => b.writeInt(0, false), false);

export async function banchoIndex(req: Request, res: Response): Promise<Response<DefaultResponseLocals> | void> {
    if (req.method === "GET") {
        if (req)
            return res.end(`Theta Bancho Emulator v${process.env.npm_package_version} \nUsing Node.JS ${process.version} on ${process.platform}`);
    }

    const agent = req.headers["user-agent"], token = req.headers["osu-token"];

    if (agent === "osu!" && req.method == "POST") {
        if (!token) {
            return await banchoLogin(req, res);
        }
        let session = sessionHandler.find(p => p.token == token);

        if (session) {
            return await banchoSession(session, req, res);
        } else {
            return res.end(RESTART_BUFFER.buffer);
        }

    }
    return res.end("There was an error handling your request");
}

async function banchoLogin(req: Request, res: Response): Promise<void> {
    let bodyBuffer = await req.buffer();
    let bodyData = bodyBuffer.toString("utf-8").split("\n");
    let session = sessionHandler.add(bodyData);

    session.buffer.writePacket(packetIDs.BANCHO_CHANNEL_LISTING_COMPLETE, b => b.writeInt(0, false), false);
    channelHandler.list(session.buffer, session.id, false);

    res.setHeader("cho-token", session.token);
    logHandler.success(`${session.username} (${session.id}) has just logged in`);
    res.end(session.buffer.flush())
}

async function banchoSession(session: Player, req: Request, res: Response): Promise<void> {
    let bodyBuffer = await req.buffer();
    new ReadOnlySerializationBuffer(bodyBuffer).readPackets((reader, id, size) => {
        switch (id) {
            case packetIDs.CLIENT_SEND_USER_STATUS:
                reader.readStatus(session.stats.status);
                // todo update pp and stuff in player class
                let statusBuffer = new SlowSerializationBuffer();
                statusBuffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(session.stats))
                sessionHandler.broadcastGlobally(statusBuffer.flush());
                break;
            case packetIDs.CLIENT_SEND_IRC_MESSAGE:
            case packetIDs.CLIENT_SEND_IRC_MESSAGE_PRIVATE:
                let message = reader.readMessage();
                message.sendingClient = session.username;
                message.senderId = session.id;

                if (message.target.includes("#")) {
                    // todo spectator stuff
                    logHandler.info(`${session.username} (${message.target}) => ${message.message}`);
                    let channel = channelHandler.find(message.target);
                    if (channel) {
                        for (let i = 0; i < channel.joinedPlayers.length; i++) {
                            const player = sessionHandler.find(s => s.id == channel?.joinedPlayers[i]);

                            if (player && player.id == session.id) {
                                continue;
                            }
    
                            if (player)
                                player.buffer.writePacket(packetIDs.BANCHO_SEND_MESSAGE, b => b.writeMessage(message));
                        }
                    }
                } else {
                    // add lazer compat here
                    let to = sessionHandler.find(s => s.username == message.target);
                    if (to == null) break;

                    if (to.id === 5) {
                        botHandler.handleCommand(message.message, message.target, session);
                        break;
                    }

                    to.buffer.writePacket(packetIDs.BANCHO_SEND_MESSAGE, b => b.writeMessage(message));
                }

                break;
            case packetIDs.CLIENT_EXIT:
                sessionHandler.remove(session.id, "quit");
                break;
            case packetIDs.CLIENT_REQUEST_STATUS_UPDATE:
                // check if rank and things have changed? also do it in sending status.. maybe something that should be done in player class?
                session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(session.stats));
                break;
            case packetIDs.CLIENT_PONG:
                session.ping();
                break;
            case packetIDs.CLIENT_CHANNEL_JOIN:
                let channelToJoin = reader.readString();
                if (channelHandler.join(session.buffer, channelToJoin, session.id)) {
                    logHandler.success(`${session.username} (${session.id}) has just joined channel ${channelToJoin}`);
                } else {
                    logHandler.warn(`${session.username} (${session.id}) has just tried to join non-existent channel (${channelToJoin})`);
                }
                break;
            case packetIDs.CLIENT_CHANNEL_LEAVE:
                let channelToLeave = reader.readString();
                channelHandler.leave(channelToLeave, session.id);
                break;
            case packetIDs.CLIENT_USER_STATS_REQUEST:
                let length = reader.readShort();
                if (length > 32) 
                    break;
                for (let i = 0; i < length; i++) {
                    let playerId = reader.readShort();
                    let player = sessionHandler.find(s => s.id === playerId);

                    if (!player || playerId === session.id) 
                        continue;

                    session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(player?.stats as PresenceStats));
                }

                break;
            default:
                logHandler.info(`${session.username} (${session.id}) unhandled packet -> ${id}`)
        }
    });
    res.end(session.buffer.flush());
}