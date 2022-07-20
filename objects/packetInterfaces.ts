export interface BanchoMessage {
    sendingClient: string;
    message: string;
    target: string;
    senderId: number;
}

export interface BanchoChannel {
    name: string;
    topic: string;
    userCount: number;
}

export interface BeatmapInfo {
    id: number;
    beatmapId: number;
    beatmapSetId: number
    threadId: number; 
    ranked: number;
    osuRank: number; 
    fruitsRank: number;
    taikoRank: number;
    maniaRank: number; 
    checksum: string;
}

export interface ReplayFrame {
    buttonState: number;
    mouseX: number;
    mouseY: number; 
    time: number;
}

export interface ScoreFrame {
    time: number; 
    id: number; 
    count300: number; 
    count100: number; 
    count50: number;
    countGeki: number; 
    countKatu: number; 
    countMiss: number; 
    totalScore: number;
    maxCombo: number; 
    currentCombo: number; 
    perfect: boolean; 
    currentHp: number; 
    tagByte: number; 
    usingScoreV2: boolean; 
    comboPortion?: number; 
    bonusPortion?: number; 
}

export interface ReplayFrameBundle {
    extra: number;
    frames: ReplayFrame[];
    action: number;
    scoreFrame: ScoreFrame;
}

export interface Match {
    matchId: number; 
    inProgress: boolean; 
    matchType: number; 
    activeMods: number;
    gameName: string; 
    gamePassword: string; 
    beatmapName: string; 
    beatmapId: number;
    beatmapChecksum: string; 
    slotStatus: number[]; 
    slotTeam: number[]; 
    slotId: number[];
    hostId: number; 
    playMode: number; 
    matchScoringType: number;
    matchTeamType: number; 
    freeMod: boolean; 
    slotMods: number[]; 
    seed: number;
}

export interface UserPresence {
    userId: number;
    username: string;
    timezone: number;
    countryCode: number;
    permission: number;
    playMode: number;
    longitude: number; latitude: number;
    rank: number;
}

export interface PresenceStatus {
    status: number;
    statusText: string;
    beatmapChecksum: string;
    mods: number;
    playMode: number;
    beatmapId: number;
}

export interface PresenceStats {
    userId: number; 
    status: PresenceStatus; 
    rankedScore: bigint; 
    accuracy: number;
    playcount: number;
    totalScore: bigint; 
    rank: number; 
    performance: number;
}