'use strict';
import { packetIDs } from "../constants/packet_ids";
import crypto from "crypto";
import { SerializationBuffer, SlowSerializationBuffer } from "./serialization";
import { PresenceStats, UserPresence } from "./packetInterfaces";
import { Channel } from "../handlers/channel";

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

    updateStatus(): void {

    }
}