import axios from 'axios';
import fs from 'fs';
import { query } from '../handlers/mysql';
import { error, info } from '../handlers/logs';
import * as mirrorHandler from "../handlers/mirrors";
import { BeatmapDecoder } from 'osu-parsers';
import { ScoreInfo } from 'osu-classes';
import { StandardRuleset } from 'osu-standard-stable';
import { TaikoRuleset } from 'osu-taiko-stable';
import { CatchRuleset } from 'osu-catch-stable';
import { ManiaRuleset } from 'osu-mania-stable';

export class Beatmap {
    songName: string;
    beatmapMD5: string;
    fileName: string;
    rankedStatus: number;
    isFrozen: boolean;

    beatmapID: number;
    beatmapSetID: number;
    offset: number;
    rating: number;

    starsSTD: number;
    starsTaiko: number;
    starsCTB: number;
    starsMania: number;

    ar: number;
    od: number;

    maxCombo: number;
    hitLength: number;
    bpm: number;

    playCount: number;
    mode: number;

    performance_95: number;
    performance_98: number;
    performance_100: number;

    constructor(hash: string = "", beatmapID: number = 0) {
        this.beatmapMD5 = hash;
        this.beatmapID = beatmapID;
        this.setData()
    }
    toDatabase() {
        let db_mode
        switch (this.mode) {
            case 0:
                db_mode = "std";
                break;
            case 1:
                db_mode = "taiko";
                break;
            case 2:
                db_mode = "ctb";
                break;
            case 3:
                db_mode = "mania";
                break;
            default:
                db_mode = "std";
        }
        return db_mode;
    }

    async downloadBeatmap() {
        return new Promise(async (resolve) => {
            let writeStream = fs.createWriteStream(this.fileName);
            let file = await axios({
                method: "get",
                url: `https://osu.ppy.sh/osu/${this.beatmapID}`,
                responseType: "stream",
            });
            file.data.pipe(writeStream);
            writeStream.on("finish", resolve);
        });
    }

    // todo: add from kitsu and stuff
    async setFromMirror() {
        let apiData: any;
        if (this.beatmapMD5) {
            apiData = await axios.get(`https://catboy.best/api/search?q=${this.beatmapMD5}`);
        } else if (this.beatmapID) {
            apiData = await axios.get(`https://catboy.best/api/b/${this.beatmapID}?full=1`);
        }

        let resp = apiData.data;
        if (resp.length == 0) {
            error("cant find map in mirror");
            return;
        }
        let beatmapSet = resp[0];
        this.beatmapSetID = beatmapSet.SetID;

        for (let i = 0; i < resp[0].ChildrenBeatmaps.length; i++) {
            let beatmap = resp[0].ChildrenBeatmaps[i];
            if (this.beatmapMD5 && beatmap.FileMD5 != this.beatmapMD5) {
                continue;
            }
            if (this.beatmapID && beatmap.BeatmapID != this.beatmapID) {
                continue;
            }
            this.songName = `${resp[0].Artist} - ${resp[0].Title} [${resp[0].ChildrenBeatmaps[i].DiffName}]`;
            this.fileName = __dirname + "/../.data/osu/" + resp[0].ChildrenBeatmaps[i].BeatmapID + ".osu";
            this.rankedStatus = resp[0].RankedStatus;
            this.ar = resp[0].ChildrenBeatmaps[i].AR;
            this.od = resp[0].ChildrenBeatmaps[i].OD;
            this.maxCombo = resp[0].ChildrenBeatmaps[i].MaxCombo;
            this.hitLength = resp[0].ChildrenBeatmaps[i].HitLength;
            this.bpm = resp[0].ChildrenBeatmaps[i].BPM;
            this.playCount = resp[0].ChildrenBeatmaps[i].PlayCount;
            this.beatmapMD5 = resp[0].ChildrenBeatmaps[i].FileMD5;
            this.beatmapID = resp[0].ChildrenBeatmaps[i].BeatmapID;
            this.isFrozen = false;
            this.mode = resp[0].ChildrenBeatmaps[i].Mode;
        }
    }

    async setPerformance() {
        const decoder = new BeatmapDecoder();
        const parsed = decoder.decodeFromPath(this.fileName);
        let ruleset;
        switch (this.mode) {
            case 0:
                ruleset = new StandardRuleset();
                break;
            case 1:
                ruleset = new TaikoRuleset();
                break;
            case 2:
                ruleset = new CatchRuleset();
                break;
            case 3:
                ruleset = new ManiaRuleset();
                break;
        }

        let beatmap = ruleset.applyToBeatmap(parsed);
        let difficultyCalculator = ruleset.createDifficultyCalculator(beatmap);
        let difficulty = difficultyCalculator.calculate();
        const score_95 = new ScoreInfo({
            maxCombo: this.maxCombo,
            accuracy: 0.95
        });
        const score_98 = new ScoreInfo({
            accuracy: 0.98
        });
        const score_100 = new ScoreInfo({
            accuracy: 1
        });
        let calc_95 = ruleset.createPerformanceCalculator(difficulty, score_95);
        calc_95.calculateAttributes();
        this.performance_95 = calc_95.calculate();

        let calc_98 = ruleset.createPerformanceCalculator(difficulty, score_98);
        calc_98.calculateAttributes();
        this.performance_98 = calc_98.calculate();

        let calc_100 = ruleset.createPerformanceCalculator(difficulty, score_100);
        calc_100.calculateAttributes();
        this.performance_100 = calc_100.calculate();
        return;
    }

    async calculateStars() {
        const decoder = new BeatmapDecoder();
        const parsed = decoder.decodeFromPath(this.fileName);
        for (let i = 0; i < 4; i++) {
            let ruleset;
            switch (i) {
                case 0:
                    ruleset = new StandardRuleset();
                    break;
                case 1:
                    ruleset = new TaikoRuleset();
                    break;
                case 2:
                    ruleset = new CatchRuleset();
                    break;
                case 3:
                    ruleset = new ManiaRuleset();
                    break;
            }
            let beatmap = ruleset.applyToBeatmap(parsed);
            let difficultyCalculator = ruleset.createDifficultyCalculator(beatmap);
            let difficulty = difficultyCalculator.calculate();

            switch (i) {
                case 0:
                    this.starsSTD = difficulty.starRating;
                    break;
                case 1:
                    this.starsTaiko = difficulty.starRating;
                    break;
                case 2:
                    this.starsCTB = difficulty.starRating;
                    break;
                case 3:
                    this.starsMania = difficulty.starRating;
                    break;
            }
        }
    }

    async saveToDatabase() {
        await query(
            `INSERT INTO beatmaps(beatmap_id, beatmapset_id, beatmap_md5, name, AR, OD, difficulty_std, difficulty_taiko, difficulty_ctb, difficulty_mania, max_combo, hit_length, playcount,passcount, ranked_status_vn,ranked_status_rx,ranked_status_ap, pp_95,pp_98,pp_ss,frozen) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0,0, ?,?,?, ?,?,?,0)`,
            this.beatmapID,
            this.beatmapSetID,
            this.beatmapMD5,
            this.songName,
            this.ar,
            this.od,
            this.starsSTD,
            this.starsTaiko,
            this.starsCTB,
            this.starsMania,
            this.maxCombo,
            this.hitLength,
            this.rankedStatus,
            this.rankedStatus,
            this.rankedStatus,
            this.performance_95,
            this.performance_98,
            this.performance_100
        );
    }

    setFromDatabase(database: any) {
        this.beatmapSetID = database[0].beatmapset_id;
        this.beatmapID = database[0].beatmap_id;
        this.beatmapMD5 = database[0].beatmap_md5;
        this.songName = database[0].name;
        this.ar = database[0].AR;
        this.od = database[0].OD;
        this.starsSTD = database[0].difficulty_std;
        this.starsTaiko = database[0].difficulty_taiko;
        this.starsCTB = database[0].difficulty_ctb;
        this.starsMania = database[0].difficulty_mania;
        this.maxCombo = database[0].max_combo;
        this.hitLength = database[0].hit_length;
        this.playCount = database[0].playcount;
        this.rankedStatus = database[0].ranked_status_vn;
        this.performance_95 = database[0].pp_95;
        this.performance_98 = database[0].pp_98;
        this.performance_100 = database[0].pp_ss;
        this.isFrozen = database[0].frozen;
    }
    // todo check ranked status upon setting data and if it's ranked, set frozen to true... maybe also add something to re-check if it is qualified/unranked/etc.
    async setData() {
        if (this.beatmapMD5) {
            let database: any = await query("SELECT * FROM beatmaps WHERE beatmap_md5 = ?", this.beatmapMD5);
            if (database.length == 0) {
                info("Beatmap not found in database, downloading...");
                await this.setFromMirror();
                await this.downloadBeatmap();
                await this.setPerformance();
                await this.calculateStars();
                await this.saveToDatabase();
            } else {
                this.setFromDatabase(database);
            }
        } else if (this.beatmapID) {
            let database: any = await query("SELECT * FROM beatmaps WHERE beatmap_id = ?", this.beatmapID);
            if (database.length == 0) {
                info("Beatmap not found in database, downloading...");
                await this.setFromMirror();
                await this.downloadBeatmap();
                await this.setPerformance();
                await this.calculateStars();
                await this.saveToDatabase();
            } else {
                this.setFromDatabase(database);
            }
        }
    }

    getData() {
        return `${mirrorHandler.cheesegullToStable(String(this.rankedStatus))}|false|${this.beatmapID}|${this.beatmapSetID}|0\n${this.offset}|${this.songName}|-1\n`
    }
}