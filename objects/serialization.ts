import * as log from "../handlers/logs";
import { BeatmapInfo, BanchoChannel, Match, BanchoMessage, UserPresence, ReplayFrame, ReplayFrameBundle, ScoreFrame, PresenceStatus, PresenceStats } from "./packetInterfaces";

const ALLOC_SHIFT: number = 8; //increases/decreases the size of the buffer by 1 << ALLOC_SHIFT until it hits MIN_ALLOC
const MIN_ALLOC: number = 1 << ALLOC_SHIFT;

function alloc(size: number): number {
	return size <= MIN_ALLOC ? MIN_ALLOC : (size - 1 >>> ALLOC_SHIFT | 0) + 1 << ALLOC_SHIFT;
}
//DO NOT FUCKIGN TOUCH THIS, IT'S PERFECT
export class ReadOnlySerializationBuffer {
	readPosition: number;
	buffer: Buffer;
	packetStart?: number;
	packetEnd?: number;
	debugName: string;
	markPosition?: number;

	constructor(input?: Buffer | number) {
		this.init(input);
		this.readPosition = 0;
	}

	init(input?: Buffer | number) {
		this.buffer = input as Buffer; //do it directly for faster performance
	}
	withDebugName(name: string) {
		this.debugName = name;
		return this;
	}
	get length(): number {
		return this.buffer.length;
	}
	toString(type: BufferEncoding = 'binary'): string {
		if (this.packetStart && this.packetStart > 0)
			return this.buffer.toString(type, this.packetStart, this.packetEnd || 0);
		return this.buffer.toString(type);
	}
	static from(): ReadOnlySerializationBuffer {
		if (arguments[0] instanceof ReadOnlySerializationBuffer)
			arguments[0] = arguments[0].buffer;
		return new ReadOnlySerializationBuffer(Buffer.from.apply(Buffer, arguments));
	}
	canRead(length: number): boolean {
		if (this.packetStart && this.packetStart > 0)
			return length + this.readPosition <= (this.packetEnd || 0);
		return length + this.readPosition <= this.buffer.length;
	}
	canPeek(position: number, length: number): boolean {
		return length + position <= this.buffer.length;
	}
	available(): number {
		return this.buffer.length - this.readPosition;
	}
	peekable(position: number): number {
		return this.buffer.length - position;
	}
	reset(): void {
		this.readPosition = 0;
	}
	EOF(): boolean {
		return this.readPosition >= this.buffer.length;
	}
	mark(): void {
		this.markPosition = this.readPosition;
	}
	slice(): Buffer | undefined {
		if (this.markPosition) {
			const sliced = this.buffer.subarray(this.markPosition, this.readPosition);
			this.markPosition = undefined;
			return sliced;
		}

		return undefined;
	}
	seekRead(position: number): void {
		this.readPosition = position + (this.packetStart || 0);
	}
	skipRead(increment: number): void {
		this.readPosition += increment;
	}
	//reads a int8
	readByte(): number {
		const v = this.buffer[this.readPosition++];
		return v | (v & 128) * 0x1fffffe;
	}
	skipByte(): void {
		this.readPosition++;
	}
	//reads an array of int8s
	readBytes(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readByte();
		return array;
	}
	//reads a boolean
	readBoolean(): boolean {
		return this.buffer[this.readPosition++] !== 0;
	}
	//reads a uint8
	readUByte(): number {
		return this.buffer[this.readPosition++];
	}
	//reads an array of uint8s
	readUBytes(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readUByte();
		return array;
	}
	//reads a int16
	readShort(): number {
		const v = this.buffer[this.readPosition++] | this.buffer[this.readPosition++] << 8;
		return v | (v & 32768) * 0x1fffe;
	}
	skipShort(): void {
		this.readPosition += 2;
	}
	//reads an array of int16s
	readShorts(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readShort();
		return array;
	}
	skipShorts(length: number): void {
		this.readPosition += length * 2;
	}
	//reads a uint16
	readUShort(): number {
		return this.buffer[this.readPosition++] | this.buffer[this.readPosition++] << 8;
	}
	//reads an array of uint16s
	readUShorts(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readUShort();
		return array;
	}
	//reads a int32
	readInt(): number {
		return this.buffer[this.readPosition++]
			| this.buffer[this.readPosition++] << 8
			| this.buffer[this.readPosition++] << 16
			| this.buffer[this.readPosition++] << 24;
	}
	skipInt(): void {
		this.readPosition += 4;
	}
	//reads an array of int32s
	readInts(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readInt();
		return array;
	}
	skipInts(length: number): void {
		this.readPosition += length * 4;
	}
	//reads a uint32
	readUInt(): number {
		return this.buffer[this.readPosition++]
			| this.buffer[this.readPosition++] << 8
			| this.buffer[this.readPosition++] << 16
			| this.buffer[this.readPosition++] * 0x1000000;
	}
	//reads an array of uint32s
	readUInts(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readUInt();
		return array;
	}
	//reads a int64
	readLong(): bigint {
		return BigInt((this.buffer[this.readPosition++] |
			this.buffer[this.readPosition++] << 8 |
			this.buffer[this.readPosition++] << 16) +
			this.buffer[this.readPosition++] * 0x1000000) | BigInt(this.buffer[this.readPosition++] |
				this.buffer[this.readPosition++] << 8 |
				this.buffer[this.readPosition++] << 16 |
				this.buffer[this.readPosition++] << 24) << 32n;
	}
	skipLong(): void {
		this.readPosition += 8;
	}
	//reads an array of int64s
	readLongs(length: number): bigint[] {
		const array: bigint[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readLong();
		return array;
	}
	skipLongs(length: number): void {
		this.readPosition += length * 8;
	}
	//reads a uint64
	readULong(): bigint {
		return BigInt((this.buffer[this.readPosition++] |
			this.buffer[this.readPosition++] << 8 |
			this.buffer[this.readPosition++] << 16) +
			this.buffer[this.readPosition++] * 0x1000000) +
			(BigInt((this.buffer[this.readPosition++] |
				this.buffer[this.readPosition++] << 8 |
				this.buffer[this.readPosition++] << 16) +
				this.buffer[this.readPosition++] * 0x1000000) << 32n);
	}
	//reads an array of uint64s
	readULongs(length: number): bigint[] {
		const array: bigint[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readULong();
		return array;
	}
	//reads a float
	readFloat(): number {
		const val = this.buffer.readFloatLE(this.readPosition);
		this.readPosition += 4;
		return val;
	}
	//reads an array of floats
	readFloats(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readFloat();
		return array;
	}
	//reads a double
	readDouble(): number {
		const val = this.buffer.readDoubleLE(this.readPosition);
		this.readPosition += 8;
		return val;
	}
	//reads an array of doubles
	readDoubles(length: number): number[] {
		const array: number[] = new Array(length);
		for (let i = 0; i < length; i++)
			array[i] = this.readDouble();
		return array;
	}
	readULEB128(): number {
		let result = 0;
		let shift = 0;
		let b: number;
		do {
			b = this.readUByte();
			result |= (b & 0x7F) << shift;
			shift += 7;
		} while ((b & 0x80) === 0x80 && shift <= 32 /* c# string is max 32-bit long chief */ && this.canRead(1));
		return result;
	}
	//Notes:
	//Don't EVER let a string be null cuz some strings in the osu client being null could potentially break it
	readString(): string {
		const type = this.readUByte();
		if (type !== 11)
			return '';
		let len = this.readULEB128();
		if (len <= 0)
			return '';
		if (!this.canRead(len)) {
			len = this.available();
			if (len <= 0)
				return '';
		}
		this.readPosition += len;
		return this.buffer.toString('utf8', this.readPosition - len, this.readPosition);
	}
	skipString(): void {
		const type = this.readByte();
		if (type !== 11) return;
		let len = this.readULEB128();
		if (len <= 0) return;
		if (!this.canRead(len)) len = this.available();
		this.readPosition += len;
	}
	skipStrings(count: number): void {
		while (count--)
			this.skipString();
	}
	readPackets(handler: (reader: ReadOnlySerializationBuffer, id: number, size: number) => void) {
		do {
			this.readPacket(handler);
		} while (this.canRead(7));
	}
	readPacket(handler: (reader: ReadOnlySerializationBuffer, id: number, size: number) => void) {
		const id = this.readShort();//packet id
		this.skipRead(1);//skip useless compression boolean
		const size = Math.min(this.readInt(), this.buffer.length - this.readPosition);//packet size
		this.packetStart = this.readPosition;
		this.packetEnd = (this.packetStart || 0) + size;
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Read Packet: (ID: ${id}, Data: ${this.buffer.toString('hex', (this.packetStart || 0) - 7, this.packetEnd || 0)})`);
		handler(this, id, size);
		this.packetStart = undefined;
		this.readPosition = this.packetEnd || 0;
		this.packetEnd = undefined;
	}
	readMessage(object?: BanchoMessage): BanchoMessage {
		if (!object) {
			const SendingClient = this.readString();
			const Message = this.readString();
			const Target = this.readString();
			const SenderId = this.readInt();
			return { sendingClient: SendingClient, message: Message, target: Target, senderId: SenderId };
		}
		object.sendingClient = this.readString();
		object.message = this.readString();
		object.target = this.readString();
		object.senderId = this.readInt();

		return object;
	}
	skipMessage(): void {
		this.skipStrings(3);
		this.skipInt();
	}
	readChannel(object?: BanchoChannel): BanchoChannel {
		if (!object) {
			const Name = this.readString();
			const Topic = this.readString();
			const UserCount = this.readShort();
			return { name: Name, topic: Topic, userCount: UserCount };
		}
		object.name = this.readString();
		object.topic = this.readString();
		object.userCount = this.readShort();
		return object;
	}
	skipChannel(): void {
		this.skipStrings(2);
		this.skipShort();
	}
	readBeatmapInfo(object?: BeatmapInfo): BeatmapInfo {
		if (!object) {
			const Id = this.readShort();
			const BeatmapId = this.readInt();
			const BeatmapSetId = this.readInt();
			const ThreadId = this.readInt();
			const Ranked = this.readByte();
			const OsuRank = this.readByte();
			const FruitsRank = this.readByte();
			const TaikoRank = this.readByte();
			const ManiaRank = this.readByte();
			const Checksum = this.readString();
			return { id: Id, beatmapId: BeatmapId, beatmapSetId: BeatmapSetId, threadId: ThreadId, ranked: Ranked, osuRank: OsuRank, fruitsRank: FruitsRank, taikoRank: TaikoRank, maniaRank: ManiaRank, checksum: Checksum };
		}
		object.id = this.readShort();
		object.beatmapId = this.readInt();
		object.beatmapSetId = this.readInt();
		object.threadId = this.readInt();
		object.ranked = this.readByte();
		object.osuRank = this.readByte();
		object.fruitsRank = this.readByte();
		object.taikoRank = this.readByte();
		object.maniaRank = this.readByte();
		object.checksum = this.readString();
		return object;
	}
	SkipBeatmapInfo(): void {
		this.skipRead(19);
		this.skipString();
	}
	readSpectatorFrame(object?: ReplayFrame): ReplayFrame {
		if (!object) {
			let ButtonState = this.readByte();
			if (this.readByte() > 0)
				ButtonState = 2;
			const MouseX = this.readFloat();
			const MouseY = this.readFloat();
			const Time = this.readInt();
			return { buttonState: ButtonState, mouseX: MouseX, mouseY: MouseY, time: Time };
		}
		let buttonState = this.readByte();
		if (this.readByte() > 0)
			buttonState = 2;
		object.buttonState = buttonState;
		object.mouseX = this.readFloat();
		object.mouseY = this.readFloat();
		object.time = this.readInt();
		return object;
	}
	skipSpectatorFrame(): void {
		this.skipRead(14);
	}
	readScoreFrame(object?: ScoreFrame): ScoreFrame {
		if (!object) {
			const Time = this.readInt();
			const Id = this.readByte();
			const Count300 = this.readUShort();
			const Count100 = this.readUShort();
			const Count50 = this.readUShort();
			const CountGeki = this.readUShort();
			const CountKatu = this.readUShort();
			const CountMiss = this.readUShort();
			const TotalScore = this.readInt();
			const MaxCombo = this.readUShort();
			const CurrentCombo = this.readUShort();
			const Perfect = this.readBoolean();
			const CurrentHp = this.readByte();
			const TagByte = this.readByte();
			const UsingScoreV2 = this.readBoolean();
			if (UsingScoreV2) {
				const ComboPortion = this.readDouble();
				const BonusPortion = this.readDouble();
				return {
					time: Time, id: Id, count300: Count300, count100: Count100, count50: Count50,
					countGeki: CountGeki, countKatu: CountKatu, countMiss: CountMiss, totalScore: TotalScore,
					maxCombo: MaxCombo, currentCombo: CurrentCombo, perfect: Perfect, currentHp: CurrentHp,
					tagByte: TagByte, usingScoreV2: true, comboPortion: ComboPortion,
					bonusPortion: BonusPortion
				};
			}
			return {
				time: Time, id: Id, count300: Count300, count100: Count100, count50: Count50,
				countGeki: CountGeki, countKatu: CountKatu, countMiss: CountMiss, totalScore: TotalScore,
				maxCombo: MaxCombo, currentCombo: CurrentCombo, perfect: Perfect, currentHp: CurrentHp,
				tagByte: TagByte, usingScoreV2: false
			};
		}
		object.time = this.readInt();
		object.id = this.readByte();
		object.count300 = this.readUShort();
		object.count100 = this.readUShort();
		object.count50 = this.readUShort();
		object.countGeki = this.readUShort();
		object.countKatu = this.readUShort();
		object.countMiss = this.readUShort();
		object.totalScore = this.readInt();
		object.maxCombo = this.readUShort();
		object.currentCombo = this.readUShort();
		object.perfect = this.readBoolean();
		object.currentHp = this.readByte();
		object.tagByte = this.readByte();
		object.usingScoreV2 = this.readBoolean();
		if (object.usingScoreV2) {
			object.comboPortion = this.readDouble();
			object.bonusPortion = this.readDouble();
		}
		return object;
	}
	skipScoreFrame(): void {
		this.skipRead(28);
		if (this.readBoolean())
			this.skipRead(16);
	}
	readSpectatorFrames(object?: ReplayFrameBundle): ReplayFrameBundle {
		if (!object) {
			const Extra = this.readInt();
			const framesLen = this.readUShort();
			const Frames = new Array(framesLen);
			for (let i = 0; i < framesLen; i++)
				Frames[i] = this.readSpectatorFrame();
			const Action = this.readByte();
			const ScoreFrame = this.readScoreFrame();
			return { extra: Extra, frames: Frames, action: Action, scoreFrame: ScoreFrame };
		}
		object.extra = this.readInt();
		const framesLen = this.readUShort();
		const Frames = new Array(framesLen);
		for (let j = 0; j < framesLen; j++)
			Frames[j] = this.readSpectatorFrame();
		object.frames = Frames;
		object.action = this.readByte();
		object.scoreFrame = this.readScoreFrame();
		return object;
	}
	skipSpectatorFrames(): void {
		this.skipInt();
		let frames = this.readUShort();
		this.skipRead(1 + 14 * frames);
		this.skipScoreFrame();
	}
	readMatch(object?: Match): Match {
		if (!object) {
			const MatchId = this.readUShort();
			const InProgress = this.readBoolean();
			const MatchType = this.readByte();
			const ActiveMods = this.readUInt();
			let GameName = this.readString();
			if (GameName.length > 50)
				GameName = GameName.substring(0, 50);
			const GamePassword = this.readString();
			const BeatmapName = this.readString();
			const BeatmapId = this.readInt();
			const BeatmapChecksum = this.readString();
			const SlotStatus = this.readBytes(16);
			const SlotTeam = this.readBytes(16);
			const SlotId = new Array(16);
			for (let k = 0; k < 16; k++)
				SlotId[k] = (SlotStatus[k] & 124) > 0 ? this.readInt() : -1;
			const HostId = this.readInt();
			const PlayMode = this.readByte();
			const MatchScoringType = this.readByte();
			const MatchTeamType = this.readByte();
			const FreeMod = this.readBoolean();
			let SlotMods = new Array(16);
			if (FreeMod)
				SlotMods = this.readInts(16);
			const Seed = this.readInt();
			return {
				matchId: MatchId, inProgress: InProgress, matchType: MatchType, activeMods: ActiveMods,
				gameName: GameName, gamePassword: GamePassword, beatmapName: BeatmapName, beatmapId: BeatmapId,
				beatmapChecksum: BeatmapChecksum, slotStatus: SlotStatus, slotTeam: SlotTeam, slotId: SlotId,
				hostId: HostId, playMode: PlayMode, matchScoringType: MatchScoringType,
				matchTeamType: MatchTeamType, freeMod: FreeMod, slotMods: SlotMods, seed: Seed
			};
		}
		object.matchId = this.readUShort();
		object.inProgress = this.readBoolean();
		object.matchType = this.readByte();
		object.activeMods = this.readUInt();
		let gameName = this.readString();
		if (gameName.length > 50)
			gameName = gameName.substring(0, 50);
		object.gameName = gameName;
		object.gamePassword = this.readString();
		object.beatmapName = this.readString();
		object.beatmapId = this.readInt();
		object.beatmapChecksum = this.readString();
		object.slotStatus = this.readBytes(16);
		object.slotTeam = this.readBytes(16);
		const SlotId = new Array(16);
		for (let o = 0; o < 16; o++)
			SlotId[o] = (object.slotStatus[o] & 124) > 0 ? this.readInt() : -1;
		object.slotId = SlotId;
		object.hostId = this.readInt();
		object.playMode = this.readByte();
		object.matchScoringType = this.readByte();
		object.matchTeamType = this.readByte();
		const FreeMod = this.readBoolean();
		object.freeMod = FreeMod;
		object.slotMods = new Array(16);
		if (FreeMod)
			object.slotMods = this.readInts(16);
		object.seed = this.readInt();
		return object;
	}
	skipMatch(): void {
		this.skipRead(8);
		this.skipStrings(3);
		this.skipInt();
		this.skipString();
		let skip = 0;
		for (let i = 0; i < 16; i++)
			if (this.readByte() & 124)
				skip += 4;
		this.skipRead(23 + skip);
		if (this.readBoolean())
			this.skipRead(64);
	}
	readPresence(object?: UserPresence): UserPresence {
		if (!object) {
			const UserId = this.readInt();
			const Username = this.readString();
			const Timezone = this.readByte() - 24;
			const CountryCode = this.readByte();
			const b = this.readByte();
			const Permission = b & ~0xe0;
			const PlayMode = Math.max(0, Math.min(3, (b & 0xe0) >> 5));
			const Longitude = this.readFloat();
			const Latitude = this.readFloat();
			const Rank = this.readInt();
			return {
				userId: UserId, username: Username, timezone: Timezone, countryCode: CountryCode,
				permission: Permission, playMode: PlayMode, longitude: Longitude, latitude: Latitude,
				rank: Rank
			};
		}
		object.userId = this.readInt();
		object.username = this.readString();
		object.timezone = this.readByte() - 24;
		object.countryCode = this.readByte();
		const b = this.readByte();
		object.permission = b & ~0xe0;
		object.playMode = Math.max(0, Math.min(3, (b & 0xe0) >> 5));
		object.longitude = this.readFloat();
		object.latitude = this.readFloat();
		object.rank = this.readInt();
		return object;
	}
	skipPresence(): void {
		this.skipInt();
		this.skipString();
		this.skipRead(15);
	}
	readStatus(object?: PresenceStatus): PresenceStatus {
		if (!object) {
			const Status = this.readByte();
			const StatusText = this.readString();
			const BeatmapChecksum = this.readString();
			const Mods = this.readUInt();
			const PlayMode = this.readByte();
			const BeatmapId = this.readInt();
			return {
				status: Status, statusText: StatusText, beatmapChecksum: BeatmapChecksum, mods: Mods,
				playMode: PlayMode, beatmapId: BeatmapId
			};
		}
		object.status = this.readByte();
		object.statusText = this.readString();
		object.beatmapChecksum = this.readString();
		object.mods = this.readUInt();
		object.playMode = this.readByte();
		object.beatmapId = this.readInt();
		return object;
	}
	skipStatus() {
		this.skipByte();
		this.skipStrings(2);
		this.skipRead(9);
	}
	readStats(object?: PresenceStats): PresenceStats {
		if (!object) {
			const UserId = this.readInt();
			const Status = this.readStatus();
			const RankedScore = this.readLong();
			const Accuracy = this.readFloat();
			const Playcount = this.readInt();
			const TotalScore = this.readLong();
			const Rank = this.readInt();
			const Performance = this.readShort();
			return {
				userId: UserId, status: Status, rankedScore: RankedScore, accuracy: Accuracy,
				playcount: Playcount, totalScore: TotalScore, rank: Rank, performance: Performance
			};
		}
		object.userId = this.readInt();
		object.status = this.readStatus();
		object.rankedScore = this.readLong();
		object.accuracy = this.readFloat();
		object.playcount = this.readInt();
		object.totalScore = this.readLong();
		object.rank = this.readInt();
		object.performance = this.readShort();
		return object;
	}
	skipStats(): void {
		this.skipRead(5);
		this.skipStrings(2);
		this.skipRead(39);
	}
}
export class SerializationBuffer extends ReadOnlySerializationBuffer {
	writePosition: number;
	sliceBuffer: Buffer;

	constructor(input?: Buffer | number) {
		super(input);
		this.writePosition = 0;
	}
	init(input: Buffer | ReadOnlySerializationBuffer | number | undefined): void {
		if (input instanceof Buffer)
			this.buffer = input;
		else if (input instanceof ReadOnlySerializationBuffer) {
			this.buffer = input.buffer;
			this.readPosition = input.readPosition;
			this.packetStart = input.packetStart;
			this.packetEnd = input.packetEnd;
			this.debugName = input.debugName;
			if (input instanceof SerializationBuffer)
				this.writePosition = input.writePosition;
		}
		else if (typeof input === 'number')
			this.buffer = Buffer.allocUnsafe(alloc(input));
		else
			this.buffer = Buffer.allocUnsafe(MIN_ALLOC);

		this.sliceBuffer = Buffer.allocUnsafe(0);
	}
	//yes this can be unsafe because we trim the buffer if it's too big
	allocate(amount: number, safe: boolean = false): void {
		const size = alloc(amount + this.buffer.length) - this.buffer.length;
		this.buffer = Buffer.concat([this.buffer, safe ? Buffer.alloc(size) : Buffer.allocUnsafe(size)]);
	}
	allocateIfNeeded(amount: number, safe: boolean = false): void {
		const size = this.writePosition + amount - this.buffer.length;
		if (size > 0)
			this.allocate(size, safe);
	}
	writeBuffer(buffer: Buffer | SerializationBuffer, checked: boolean = true): void {
		let end = buffer.length;
		if (buffer instanceof SerializationBuffer) {
			end = buffer.writePosition;
			buffer = buffer.buffer;
		}
		const len = buffer.length;
		if (checked)
			this.allocateIfNeeded(len);
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Writing buffer: ${buffer.toString('hex')}`);
		buffer.copy(this.buffer, this.writePosition, 0, end);
		this.writePosition += len;
	}
	reset(): void {
		super.reset();
		this.writePosition = 0;
	}
	flush(): Buffer {
		this.trimToSize();
		if (this.writePosition === this.sliceBuffer.length) {
			log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}flushed previous slice ${this.sliceBuffer.toString('hex')}`);
			this.reset();
			return this.sliceBuffer;
		}
		const slice = this.buffer.subarray(0, this.writePosition);
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}flushed ${slice.toString('hex')}`);
		this.reset();
		this.sliceBuffer = slice;
		return slice;
	}
	trimToSize(checked: boolean = true): void {
		if (checked) {
			if (this.writePosition === this.buffer.length)
				return;
			if (this.writePosition > this.buffer.length) {
				this.writePosition = this.buffer.length;
				return;
			}
		}
		const size = alloc(this.writePosition);
		if (checked && size >= this.buffer.length)
			return; //don't expand it WeirdChamp
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Trimming to size (${this.buffer.length} -> ${size})`);
		this.buffer = Buffer.concat([this.buffer], size);
	}
	seekWrite(position: number): number {
		const current = this.writePosition;
		this.writePosition = position;
		return current;
	}
	fill(value: number, start: number, end: number) {
		this.buffer.fill(value, start, end);
	}
	//writes a int8
	writeByte(byte: number, checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(1);
		this.buffer[this.writePosition++] = byte;
	}
	//writes an array of int8s
	writeBytes(...array: number[]): void {
		array.flat(Infinity);
		let l = array.length;
		const bool = typeof array[l - 1] === 'boolean', checked = !bool || array[l - 1];
		if (bool)
			l--;
		if (checked)
			this.allocateIfNeeded(l);
		for (let i = 0; i < l; i++)
			this.writeByte(array[i], false);
	}
	//writes a boolean
	writeBoolean(boolean: boolean, checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(1);
		this.buffer[this.writePosition++] = boolean ? 1 : 0;
	}
	//writes a int16
	writeShort(short: number, checked: boolean = true): void {
		if (checked) this.allocateIfNeeded(2);
		this.buffer[this.writePosition++] = short;
		this.buffer[this.writePosition++] = short >>> 8;
	}
	//writes an array of int16s
	writeShorts(...array: number[]): void {
		array.flat(Infinity);
		let l = array.length;
		const bool = typeof array[l - 1] === 'boolean', checked = !bool || array[l - 1];
		if (bool) l--;
		if (checked) this.allocateIfNeeded(l * 2);
		for (let i = 0; i < l; i++)
			this.writeShort(array[i], false);
	}
	//writes a int32
	writeInt(int: number, checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(4);
		this.buffer[this.writePosition++] = int;
		this.buffer[this.writePosition++] = int >>> 8;
		this.buffer[this.writePosition++] = int >>> 16;
		this.buffer[this.writePosition++] = int >>> 24;
	}
	//writes an array of int32s
	writeInts(...array: number[]): void {
		array.flat(Infinity);
		let l = array.length;
		const bool = typeof array[l - 1] === 'boolean', checked = !bool || array[l - 1];
		if (bool)
			l--;
		if (checked)
			this.allocateIfNeeded(l * 4);
		for (let i = 0; i < l; i++)
			this.writeInt(array[i], false);
	}
	//writes a int64
	writeLong(long: bigint, checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(8);
		this.writeInt(Number(long & 0xFFFFFFFFn), false);
		this.writeInt(Number(long >> 32n & 0xFFFFFFFFn), false);
	}
	//writes an array of int64s
	writeLongs(...array: bigint[]): void {
		array.flat(Infinity);
		let l = array.length;
		const bool = typeof array[l - 1] === 'boolean', checked = !bool || array[l - 1];
		if (bool)
			l--;
		if (checked)
			this.allocateIfNeeded(l * 8);
		for (let i = 0; i < l; i++)
			this.writeLong(array[i], false);
	}
	//writes a float
	writeFloat(int: number, checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(4);
		this.buffer.writeFloatLE(int, this.writePosition);
		this.writePosition += 4;
	}
	//writes an array of floats
	writeFloats(...array: number[]): void {
		array.flat(Infinity);
		let l = array.length;
		const bool = typeof array[l - 1] === 'boolean', checked = !bool || array[l - 1];
		if (bool)
			l--;
		if (checked)
			this.allocateIfNeeded(l * 4);
		for (let i = 0; i < l; i++)
			this.writeFloat(array[i], false);
	}
	//writes a double
	writeDouble(long: number, checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(8);
		this.buffer.writeDoubleLE(long, this.writePosition);
		this.writePosition += 8;
	}
	//writes an array of doubles
	writeDoubles(...array: number[]): void {
		array.flat(Infinity);
		let l = array.length;
		const bool = typeof array[l - 1] === 'boolean', checked = !bool || array[l - 1];
		if (bool) l--;
		if (checked) this.allocateIfNeeded(l * 8);
		for (let i = 0; i < l; i++)
			this.writeDouble(array[i], false);
	}
	writeULEB128(value: number, checked: boolean = true): void {
		if (checked) this.allocateIfNeeded(this.sizeULEB128(value));
		do {
			let val = value & 0x7F;
			if ((value >>= 7) !== 0) val |= 0x80;
			this.buffer[this.writePosition++] = val;
		} while (value > 0x80);
	}
	sizeULEB128(value: number): number {
		let size = 0;
		do {
			size++;
			value >>>= 7;
		} while (value > 0x80);
		return size;
	}
	static stringSize(value: number): number {
		let size = 0;
		do {
			size++;
			value >>>= 7;
		} while (value > 0x80);
		return size;
	}
	//Notes:
	//Don't EVER let a string be null cuz some strings in the osu client being null could potentially break it
	writeString(value: string, length?: number, checked: boolean = true): void {
		if (!value || (value.length || 0) === 0) {
			if (checked)
				this.allocateIfNeeded(2);
			this.buffer[this.writePosition++] = 11;
			this.buffer[this.writePosition++] = 0;
			return;
		}
		if (!checked && typeof length === 'boolean') {
			checked = length;
			length = undefined;
		}
		else
			checked = true;
		const len = length || Buffer.byteLength(value, 'utf8');
		if (checked)
			this.allocateIfNeeded(this.sizeULEB128(len) + len + 1);
		this.buffer[this.writePosition++] = 11;
		this.writeULEB128(len, false);
		this.buffer.write(value, this.writePosition, 'utf8');
		this.writePosition += len;
	}
	writeEmptyString(checked: boolean = true): void {
		if (checked)
			this.allocateIfNeeded(2);
		this.buffer[this.writePosition++] = 11;
		this.buffer[this.writePosition++] = 0;
	}
	byteLengthString(value: string): number {
		if (!value || (value.length || 0) === 0)
			return 0;
		return Buffer.byteLength(value, 'utf8');
	}
	byteSizeString(...len: number[]): number {
		let size = 0;
		for (let i = 0, l = len.length; i < l; i++) {
			const ln = len[i];
			size += ln === 0 ? 2 : this.sizeULEB128(ln) + ln + 1;
		}
		return size;
	}
	lengthString(value: string, length: number): number {
		if (!value || (value.length || 0) === 0)
			return 2;
		const len = length || Buffer.byteLength(value, 'utf8');
		return this.sizeULEB128(len) + len + 1;
	}
	writePacket(id: number, write?: (reader: SerializationBuffer) => void, length?: number | boolean): void {
		const hasLength = length;
		const check = hasLength && typeof length === 'boolean';
		if (!write) {
			log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Wrote Empty Packet (ID: ${id})`);
			if (!check || length)
				this.allocateIfNeeded(7);
			this.writeShort(id, false);
			this.writeBoolean(false, false);
			this.writeInt(0, false);
			return;
		}
		if (!check || length)
			this.allocateIfNeeded(hasLength && !check ? 7 + length : 7);
		this.writeShort(id, false);
		this.writeBoolean(false, false);
		const offset = this.seekWrite(this.writePosition + 4);
		write(this);
		this.buffer.writeInt32LE(this.writePosition - offset - 4, offset);
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Wrote Packet (ID: ${id}, Data: ${this.buffer.toString('hex', offset - 3, this.writePosition)})`);
	}
	writeMessage(message: BanchoMessage, checked: boolean = true): void {
		//sendingClient
		const sendingClientLen = this.byteLengthString(message.sendingClient);
		//message
		const messageLen = this.byteLengthString(message.message);
		//target
		const targetLen = this.byteLengthString(message.target);
		if (checked) this.allocateIfNeeded(4 + this.byteSizeString(sendingClientLen, messageLen, targetLen));
		//serialize
		if (sendingClientLen === 0)
			this.writeEmptyString(false);
		else this.writeString(message.sendingClient, sendingClientLen, false);
		if (messageLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(message.message, messageLen, false);
		if (targetLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(message.target, targetLen, false);
		this.writeInt(message.senderId || 0, false);
	}
	writeChannel(channel: BanchoChannel, checked: boolean = true): void {
		//name
		const nameLen = this.byteLengthString(channel.name);
		//topic
		const topicLen = this.byteLengthString(channel.topic);
		if (checked)
			this.allocateIfNeeded(2 + this.byteSizeString(nameLen, topicLen));
		//serialize
		if (nameLen === 0)
			this.writeEmptyString(false);
		else this.writeString(channel.name, nameLen, false);
		if (topicLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(channel.topic, topicLen, false);
		this.writeShort(channel.userCount || 0, false);
	}
	writeBeatmapInfo(beatmapInfo: BeatmapInfo, checked: boolean = true): void {
		//get lengths
		//checksum
		const checksumLen = this.byteLengthString(beatmapInfo.checksum);
		if (checked)
			this.allocateIfNeeded(19 + this.byteSizeString(checksumLen));
		//serialize
		this.writeShort(beatmapInfo.id || 0, false);
		this.writeInt(beatmapInfo.beatmapId || 0, false);
		this.writeInt(beatmapInfo.beatmapSetId || 0, false);
		this.writeInt(beatmapInfo.threadId || 0, false);
		this.writeByte(beatmapInfo.ranked || 0, false);
		this.writeByte(beatmapInfo.osuRank || 0, false);
		this.writeByte(beatmapInfo.fruitsRank || 0, false);
		this.writeByte(beatmapInfo.taikoRank || 0, false);
		this.writeByte(beatmapInfo.maniaRank || 0, false);
		if (checksumLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(beatmapInfo.checksum, checksumLen, false);
	}
	writeSpectatorFrame(spectatorFrame: ReplayFrame, checked: boolean = true): void {
		//allocate size
		if (checked)
			this.allocateIfNeeded(14);
		//serialize
		this.writeByte(spectatorFrame.buttonState || 0, false);
		this.writeByte(0, false);
		this.writeFloat(spectatorFrame.mouseX || 0, false);
		this.writeFloat(spectatorFrame.mouseY || 0, false);
		this.writeInt(spectatorFrame.time || 0, false);
	}
	writeScoreFrame(scoreFrame: ScoreFrame, checked: boolean = true): void {
		const usingScoreV2 = scoreFrame.usingScoreV2 || false;
		//allocate size
		if (checked)
			this.allocateIfNeeded(usingScoreV2 ? 45 : 29);
		//serialize
		this.writeInt(scoreFrame.time || 0, false);
		this.writeByte(scoreFrame.id || 0, false);
		this.writeShort(scoreFrame.count300 || 0, false);
		this.writeShort(scoreFrame.count100 || 0, false);
		this.writeShort(scoreFrame.count50 || 0, false);
		this.writeShort(scoreFrame.countGeki || 0, false);
		this.writeShort(scoreFrame.countKatu || 0, false);
		this.writeShort(scoreFrame.countMiss || 0, false);
		this.writeInt(scoreFrame.totalScore || 0, false);
		this.writeShort(scoreFrame.maxCombo || 0, false);
		this.writeShort(scoreFrame.currentCombo || 0, false);
		this.writeBoolean(scoreFrame.perfect || false, false);
		this.writeByte(scoreFrame.currentHp || 0, false);
		this.writeByte(scoreFrame.tagByte || 0, false);
		this.writeBoolean(usingScoreV2, false);
		if (usingScoreV2) {
			this.writeDouble(scoreFrame.comboPortion || 0, false);
			this.writeDouble(scoreFrame.bonusPortion || 0, false);
		}
	}
	writeEmptyScoreFrame(checked: boolean = true): void {
		//allocate size
		if (checked)
			this.allocateIfNeeded(29);
		//serialize
		this.writePosition += 29;
		this.fill(0, this.writePosition - 29, this.writePosition);
	}
	writeSpectatorFrames(spectatorFrames: ReplayFrameBundle, checked: boolean = true): void {
		const framesLen = !spectatorFrames.frames ? 0 : spectatorFrames.frames.length || 0;
		const noScoreFrame = !spectatorFrames.scoreFrame;
		//allocate size
		if (checked)
			this.allocateIfNeeded((!noScoreFrame && (spectatorFrames.scoreFrame.usingScoreV2 || false) ? 36 : 52) + framesLen * 14);
		//serialize
		this.writeInt(spectatorFrames.extra || 0, false);
		this.writeShort(framesLen, false);
		if (framesLen > 0)
			for (let i = 0, l = framesLen; i < l; i++)
				this.writeSpectatorFrame(spectatorFrames.frames[i], false);
		this.writeByte(spectatorFrames.action || 0, false);
		if (noScoreFrame)
			this.writeEmptyScoreFrame(false);
		else
			this.writeScoreFrame(spectatorFrames.scoreFrame, false);
	}
	writeMatch(match: Match, checked: boolean = true): void {
		//get lengths
		//gameName (limited to 50 characters on read so why bother sending over 50 5Head)
		let gameNameLen = this.byteLengthString(match.gameName);
		if (match.gameName && match.gameName.length > 50) {
			match.gameName = match.gameName.substring(0, 50);
			gameNameLen = Buffer.byteLength(match.gameName, 'utf8');
		}
		//gamePassword
		const gamePasswordLen = this.byteLengthString(match.gamePassword);
		//beatmapName
		const beatmapNameLen = this.byteLengthString(match.beatmapName);
		//beatmapChecksum
		const beatmapChecksumLen = this.byteLengthString(match.beatmapChecksum);
		const freeMod = match.freeMod || false;
		if (checked) {
			let len = 0;
			for (let x = 0; x < 16; x++)
				if ((match.slotStatus[x] & 124) > 0)
					len += 4;
			if (freeMod)
				len += 64;
			//allocate size
			this.allocateIfNeeded(52 + len + this.byteSizeString(gameNameLen, gamePasswordLen, beatmapNameLen, beatmapChecksumLen));
		}
		//serialize
		this.writeShort(match.matchId || 0, false);
		this.writeBoolean(match.inProgress || false, false);
		this.writeByte(match.matchType || 0, false);
		this.writeInt(match.activeMods || 0, false);
		if (gameNameLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(match.gameName, gameNameLen, false);
		if (gamePasswordLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(match.gamePassword, gamePasswordLen, false);
		if (beatmapNameLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(match.beatmapName, beatmapNameLen, false);
		this.writeInt(match.beatmapId || 0, false);
		if (beatmapChecksumLen === 0) this.writeEmptyString(false);
		else this.writeString(match.beatmapChecksum, beatmapChecksumLen, false);
		this.writeBytes(...match.slotStatus);
		this.writeBytes(...match.slotTeam);
		for (let k = 0; k < 16; k++)
			if ((match.slotStatus[k] & 124) > 0)
				this.writeInt(match.slotId[k], false);
		this.writeInt(match.hostId || 0, false);
		this.writeByte(match.playMode || 0, false);
		this.writeByte(match.matchScoringType || 0, false);
		this.writeByte(match.matchTeamType || 0, false);
		this.writeBoolean(freeMod, false);
		if (freeMod)
			for (let l = 0; l < 16; l++)
				this.writeInt(match.slotMods[l], false);
		this.writeInt(match.seed || 0, false);
	}
	writePresence(presence: UserPresence, checked: boolean = true): void {
		//get lengths
		//username
		const usernameLen = this.byteLengthString(presence.username);
		if (checked)
			this.allocateIfNeeded(19 + this.byteSizeString(usernameLen));
		//serialize
		this.writeInt(presence.userId || 0, false);
		if (usernameLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(presence.username, usernameLen, false);
		this.writeByte(presence.timezone + 24 || 24, false);
		this.writeByte(presence.countryCode || 0, false);
		//jshint -W126
		this.writeByte(((presence.permission & 0x1f || 0) | ((presence.playMode & 0x7) << 5) || 0), false);
		//jshint +W126
		this.writeFloat(presence.longitude || 0, false);
		this.writeFloat(presence.latitude || 0, false);
		this.writeInt(presence.rank || 0, false);
	}
	writeStatus(status: PresenceStatus, checked: boolean = true): void {
		//get lengths
		//statusText
		const statusTextLen = this.byteLengthString(status.statusText);
		//beatmapChecksum
		const beatmapChecksumLen = this.byteLengthString(status.beatmapChecksum);
		if (checked)
			this.allocateIfNeeded(10 + this.byteSizeString(statusTextLen, beatmapChecksumLen));
		//serialize
		this.writeByte(status.status || 0, false);
		if (statusTextLen === 0)
			this.writeEmptyString(false);
		else
			this.writeString(status.statusText, statusTextLen, false);
		if (beatmapChecksumLen === 0)
			this.writeEmptyString(false);
		else this.writeString(status.beatmapChecksum, beatmapChecksumLen, false);
		this.writeInt(status.mods || 0, false);
		this.writeByte(status.playMode || 0, false);
		this.writeInt(status.beatmapId || 0, false);
	}
	writeStats(p: PresenceStats, checked: boolean = true): void {
		//get lengths
		if (checked) {
			const statusTextLen = !p.status ? 0 : this.byteLengthString(p.status.statusText), beatmapChecksumLen = !p.status ? 0 : this.byteLengthString(p.status.beatmapChecksum);
			this.allocateIfNeeded(44 + this.byteSizeString(statusTextLen, beatmapChecksumLen));
		}
		//serialize
		this.writeInt(p.userId || 0, false);
		this.writeStatus(p.status || {}, false);
		this.writeLong(p.rankedScore || 0n, false);
		this.writeFloat(p.accuracy || 0, false);
		this.writeInt(p.playcount || 0, false);
		this.writeLong(p.totalScore || 0n, false);
		this.writeInt(p.rank || 0, false);
		this.writeShort(p.performance || 0, false);
	}
}
export class SlowSerializationBuffer extends SerializationBuffer {
	constructor(input?: Buffer | number) {
		super(input);
	}
	init(input: Buffer | number | undefined) {
		if (input instanceof Buffer)
			this.buffer = input;//do it directly for faster performance
		else if (typeof input === 'number')
			this.buffer = Buffer.allocUnsafe(input);
		else
			this.buffer = Buffer.allocUnsafe(0);
	}
	//yes this can be unsafe because we trim the buffer if it's too big
	allocate(amount: number, safe: boolean = false): void {
		this.buffer = Buffer.concat([this.buffer, safe ? Buffer.alloc(amount) : Buffer.allocUnsafe(amount)]);
	}
	writeBuffer(buffer: Buffer, checked: boolean = true): void {
		if (buffer instanceof SerializationBuffer)
			buffer = buffer.buffer;
		if (checked)
			this.trimToSize();
		const len = buffer.length;
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Writing buffer: ${buffer.toString('hex')}`);
		this.buffer = Buffer.concat([this.buffer, buffer]);
		this.writePosition += len;
	}
	flush(): Buffer {
		this.trimToSize();
		this.reset();
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}flushed ${this.toString('hex')}`);
		return this.buffer;
	}
	trimToSize(checked: boolean = true): void {
		if (checked) {
			if (this.writePosition === this.buffer.length) return;
			if (this.writePosition > this.buffer.length) {
				this.writePosition = this.buffer.length;
				return;
			}
		}
		log.debug(`${this.debugName ? `[${this.debugName}] ` : ''}Trimming to size (${this.buffer.length} -> ${this.writePosition})`);
		this.buffer = Buffer.concat([this.buffer], this.writePosition);
	}
}