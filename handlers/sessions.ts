import { packetIDs } from "../constants/packet_ids";
import { Player } from "../objects/player";
import stopSpectating from "../events/spectators/stopSpectating";
import { ReadOnlySerializationBuffer, SerializationBuffer } from "../objects/serialization";
import * as log from "./logs";
import { query } from "./mysql";
import bcrypt from "bcrypt";


const BANCHO_PROTOCOL: number = 19;
const PING_TIMEOUT_OSU: number = 80000;
const PING_INTERVAL_OSU: number = 24000;
const sessions: Player[] = [];

export async function add(sessionData: string[]): Promise<Player> {
    const [username, password]: any[] = sessionData;
    const hwidStuff: any[] = sessionData[3].split(":");
    let player_database: any = await query("SELECT * FROM users WHERE username_safe = ?", username.toLowerCase().replace(" ", "_"));

    if (player_database.length == 0) {
        return new Player(0,"");
    }

    if (!await bcrypt.compare(password, player_database[0].password)) {
        return new Player(0,"");
    }

    let session: Player = new Player(player_database[0].id, player_database[0].username);
    session.presence.userId = session.id;
    session.stats.userId = session.id;

    session.username = sessionData[0];
    session.presence.username = session.username;
    session.presence.permission = 1 << 2

    session.timeout = setTimeout(() => remove(session.id, "timeout"), PING_TIMEOUT_OSU);
    session.pinging = setInterval(() => {
        if (!session.hasPinged) {
            session.hasPinged = true;
            session.buffer.writePacket(packetIDs.BANCHO_PING);
        }
    }, PING_INTERVAL_OSU);

    sessions.push(session);

    session.buffer.writePacket(packetIDs.BANCHO_LOGIN_REPLY, b => b.writeInt(session.id));
    //  friends go here
    session.buffer.writePacket(packetIDs.BANCHO_PROTOCOL_NEGOTIATION, b => b.writeInt(BANCHO_PROTOCOL));
    session.buffer.writePacket(packetIDs.BANCHO_ANNOUNCE, b => b.writeString("Logged in Successfully"));
    session.buffer.writePacket(packetIDs.BANCHO_LOGIN_PERMISSIONS, b => b.writeInt(session.presence.permission));
    session.buffer.writePacket(packetIDs.BANCHO_BAN_INFO, b => b.writeInt(0));

    session.updatePresence();
    session.buffer.writeBuffer(session.presenceBuffer);
    await session.updateStatus();
    session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(session.stats));

    for (let i = 0; i < sessions.length; i++) {
        let player = sessions[i];
        if (player.id != session.id && !player.bot) {
            player.buffer.writeBuffer(session.presenceBuffer);
        }
        session.buffer.writeBuffer(player.presenceBuffer);
        session.buffer.writePacket(packetIDs.BANCHO_HANDLE_OSU_UPDATE, b => b.writeStats(player.stats));
    }

    await query("UPDATE users SET last_online =  NOW() WHERE id = ?", player_database[0].id);
    await query("INSERT INTO logins (user_id, ip, hwid) VALUES (?, '', '')", player_database[0].id, );
    return session;
}

export function pushBot(bot: Player): void {
    sessions.push(bot);
}

export function remove(id: number, reason: string): void {
    let positionOfSession = -1;
    for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].id === id) {
            positionOfSession = i;
            break;
        }
    }

    if (positionOfSession < 0) {
        return;
    }

    log.info(`Cleaning up ${sessions[positionOfSession].username} for ${reason}`);

    clearInterval(sessions[positionOfSession].pinging);
    clearTimeout(sessions[positionOfSession].timeout);

    if (sessions[positionOfSession].isSpectating) {
        stopSpectating(new ReadOnlySerializationBuffer(), sessions[positionOfSession]);
    }

    if (sessions[positionOfSession].spectators.length > 0) {
        for (let i = 0; i < sessions[positionOfSession].spectators.length; i++) {
            stopSpectating(new ReadOnlySerializationBuffer(), sessions[positionOfSession].spectators[i]);
        }
    }

    sessions.splice(positionOfSession, 1);

    for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].bot) {
            continue;
        }
        sessions[i].buffer.writePacket(packetIDs.BANCHO_HANDLE_USER_QUIT, b => {
            b.writeInt(id, false);
            b.writeBoolean(false, false);
        });
    }
}

export function find(filter: (p: Player) => boolean): Player | undefined {
    for (let i = 0; i < sessions.length; i++) {
        const p = sessions[i];
        if (filter(p)) {
            return p;
        }
    }
}

export function broadcastGlobally(buf: SerializationBuffer | Buffer): void {
    for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].bot) {
            continue;
        }
        sessions[i].buffer.writeBuffer(buf);
    }
}

export function broadcastToSession(buf: SerializationBuffer | Buffer, toId: number): void {
    for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].bot || sessions[i].id != toId) {
            continue;
        }
        return sessions[i].buffer.writeBuffer(buf);
    }
}

export function playerCount(): number {
    return sessions.length;
}

