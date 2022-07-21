import * as channelHandler from "../handlers/channel";
import * as logHandler from "../handlers/logs";
import * as sessionHandler from "../handlers/sessions"
import { ReadOnlySerializationBuffer, SlowSerializationBuffer } from "../objects/serialization";
import { Request, Response, DefaultResponseLocals } from "hyper-express";
import { packetIDs } from "../constants/packet_ids";
import { manageEvents } from "../events/eventManager";
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
        manageEvents(id, reader, session);
    });
    res.end(session.buffer.flush());
}