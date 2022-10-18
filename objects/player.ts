'use strict';
import { packetIDs } from "../constants/packet_ids";
import crypto from "crypto";
import { SerializationBuffer, SlowSerializationBuffer } from "./serialization";
import { PresenceStats, UserPresence } from "./packetInterfaces";
import { Channel } from "../handlers/channel";
import { query } from "../handlers/mysql";

function toDatabase(rx, ap, mode): number {
    let m: number = 0;
    if (!rx && !ap) {
        return mode;
    } else if (rx) {
        return mode+4;
    } else if (ap) {
        return 7
    }

    return 0;
}

export class Player {
    id: number;
    username: string;
    token: string;
    bot: boolean;
    tournament: boolean;
    clientVerion: string;
    timeOffset: number;
    allowCity: boolean;
    blockNonFriendPM: boolean;
    privileges: number;
    timeout?: NodeJS.Timeout;
    hasPinged: boolean;
    pinging?: NodeJS.Timer;
    buffer: SerializationBuffer;
    loginTime: number;
    lastSeen: number;
    presence: UserPresence
    stats: PresenceStats;
    spectatingID: number;
    isSpectating: boolean;
    multiplayerLobbyID: number;
    spectators: Player[];
    spectatorChannel: Channel;
    presenceBuffer: Buffer;

    relaxing: boolean;
    aping: boolean;
    announced_relax: boolean;
    announced_ap: boolean;

    constructor(userId: number, username: string) {
        this.id = userId;
        this.username = username;
        this.token = crypto.randomUUID();

        this.bot = false;
        this.tournament = false;

        this.clientVerion = "";
        this.timeOffset = 0;
        this.allowCity = false;
        this.blockNonFriendPM = false;
        this.privileges = 0;

        this.hasPinged = false;

        this.loginTime = Date.now();
        this.lastSeen = this.loginTime;

        this.relaxing = false;
        this.aping = false;
        this.announced_relax = false;
        this.announced_ap = false;

        this.presence = {
            userId: this.id,
            username: this.username,
            timezone: 24,
            countryCode: 0,
            permission: 0,
            playMode: 0,
            longitude: 0,
            latitude: 0,
            rank: 0
        };

        this.stats = {
            userId: this.id,
            status: {
                status: 0,
                statusText: '',
                beatmapChecksum: '',
                mods: 0,
                playMode: 0,
                beatmapId: 0
            },
            rankedScore: 0n,
            accuracy: 0,
            playcount: 0,
            totalScore: 0n,
            rank: 0,
            performance: 0
        };

        this.isSpectating = false;
        this.spectatingID = -1;
        this.multiplayerLobbyID = -1;
        this.spectatorChannel = {
            name: "#spectator",
            topic: `Channel for those spectating ${this.username}`,
            autoJoin: false,
            joinedPlayers: []
        }


        this.spectators = [];
        this.buffer = new SerializationBuffer();
    }

    ping(): void {
        this.lastSeen = Date.now();
        this.timeout?.refresh();
        this.hasPinged = false;
        this.pinging?.refresh();
    }

    updatePresence(presence?: UserPresence): void {
        let tempBuffer = new SlowSerializationBuffer;
        if (presence) {
            this.presence = presence;
        }
        tempBuffer.writePacket(packetIDs.BANCHO_USER_PRESENCE, b => b.writePresence(this.presence));
        this.presenceBuffer = tempBuffer.flush();
    }

    distributeStatus(doUpdate: boolean, who?: Player) {
        if (doUpdate) {

        }
    }

    async updateStatus(): Promise<void> {
        let id: any = this.id;
        let mode: any = toDatabase(this.relaxing, this.aping, this.presence.playMode);
        let mode_stats: any = await query("SELECT * FROM user_stats WHERE user_id = ? AND mode = ?", id, mode);
        
        if (mode_stats[0].total_score != null) {
            mode_stats[0].total_score = BigInt(mode_stats[0].total_score);
        }
        if (mode_stats[0].ranked_score != null) {
            mode_stats[0].ranked_score = BigInt(mode_stats[0].ranked_score);
        }

        this.stats.accuracy = mode_stats[0].avg_accuracy || 0.;
        this.stats.playcount = mode_stats[0].playcount || 0;
        this.stats.rankedScore = mode_stats[0].ranked_score || 0n;
        this.stats.totalScore = mode_stats[0].ranked_score || 0n;
        this.stats.rank =  0; // tbd
        this.stats.performance = mode_stats[0].performance || 0;
    }
}