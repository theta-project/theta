import axios from 'axios';
import * as config from "../config";

function getApiDomain(): string | undefined {
    switch (config.server.directServer) {
        case 0:
            return "https://catboy.best/api/";
        case 1:
            return "https://kitsu.moe/api/";
        case 2:
            return "https://api.chimu.moe/v1/";
    }
}


function directToCheesegull(status: string): string {
    let statuses = {
        ["0"]: "1",
        ["7"]: "2",
        ["8"]: "4",
        ["3"]: "3",
        ["2"]: "0",
        ["5"]: "-2",
        ["4"]: ""
    }
    try {
        return statuses[status];
    } catch {
        return "1"
    }
}


export async function osuDirectSearch(params: URLSearchParams): Promise<any | undefined> {
    let mode = params.get("m");
    let rankedStatus = params.get("r");
    let query = params.get("q");
    let page = params.get("p");

    // chimu please change SetId to SetID so i dont need to do yours differently :pray:
    let urlParams = new URLSearchParams;
    if (!["Newest", "Top Rated", "Most Played"].includes(query!)) {
        urlParams.set("query", query!);
    }

    if (mode != "-1") {
        urlParams.set("mode", mode!);
    }

    urlParams.set("status", directToCheesegull(rankedStatus!))
    urlParams.set("amount", "100");
    urlParams.set("offset", String(Number(page) * 100));

    let result = await axios.get(`${getApiDomain()}search?${urlParams.toString()}`);

    let sets = result.data;
    if (config.server.directServer == 2) {
        sets = sets.data; // Chimu likes to be different :P
    }

    if (sets.length < 1) return '0';

    let res = [sets.length];

    for (var i = 0; i < sets.length; i++) {
        const set = sets[i]
        let children = "";
        for (var j = 0; j < set.ChildrenBeatmaps.length; j++) {
            children += `${set.ChildrenBeatmaps[j].DiffName}★${set.ChildrenBeatmaps[j].DifficultyRating}@${set.ChildrenBeatmaps[j].Mode}|`
        }

        let text = ""

        if (config.server.directServer < 2) {
            text = `${set.SetID}.osz|${set.Artist}|${set.Title}|${set.Creator}|${set.RankedStatus}|10.00|${set.LastUpdate}|${set.SetID}|0|${set.HasVideo}|0|0|0|${children}`
        } else {
            text = `${set.SetId}.osz|${set.Artist}|${set.Title}|${set.Creator}|${set.RankedStatus}|10.00|${set.LastUpdate}|${set.SetId}|0|${Number(set.HasVideo)}|0|0|0|${children}`
        }
        res.push(text)
    }
    return res.join('\n');
}

export async function osuDirectSearchSet(b?: string, s?: string): Promise<any | undefined> {
    if (b == undefined && s == undefined)
        return undefined;

    let unparsedData;

    if (b != undefined) {
        if (config.server.directServer < 2) {
            let beatmapInfo = await axios.get(`${getApiDomain()}b/${b}`);
            unparsedData = await axios.get(`${getApiDomain()}s/${beatmapInfo.data.ParentSetID}`);
        } else {
            let beatmapInfo = await axios.get(`${getApiDomain()}map/${b}`);
            unparsedData = await axios.get(`${getApiDomain()}set/${beatmapInfo.data.ParentSetId}`);
        }

    } else if (s != undefined) {
        if (config.server.directServer < 2) {
            unparsedData = await axios.get(`${getApiDomain()}s/${s}`);
        } else {
            unparsedData = await axios.get(`${getApiDomain()}set/${s}`);
        }
    }
    unparsedData = unparsedData.data;

    if (config.server.directServer < 2) {
        return `${unparsedData.SetID}.osz|${unparsedData.Artist}|${unparsedData.Title}|${unparsedData.Creator}|${unparsedData.RankedStatus}|10.00|${unparsedData.LastUpdate}|${unparsedData.SetID}|0|${Number(unparsedData.HasVideo)}|0|0|0`
    } else {
        return `${unparsedData.SetId}.osz|${unparsedData.Artist}|${unparsedData.Title}|${unparsedData.Creator}|${unparsedData.RankedStatus}|10.00|${unparsedData.LastUpdate}|${unparsedData.SetId}|0|${Number(unparsedData.HasVideo)}|0|0|0`
    }
}