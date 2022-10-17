import axios, { AxiosStatic } from 'axios';
import * as config from "../config";
import * as mirrorHandler from "../handlers/mirrors";
import * as logHandler from "../handlers/logs";
import { Request, Response, DefaultResponseLocals } from "hyper-express";
import path from 'path';
import fs from 'fs';

export async function osuSearch(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params: URLSearchParams = new URLSearchParams(req.path_query);
    let apiData = await mirrorHandler.osuDirectSearch(params);

    logHandler.info(`New direct query: ${params.get("q")}`);
    return res.end(apiData);
}

export async function osuSearchSet(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params: URLSearchParams = new URLSearchParams(req.path_query);
    let beatmapId: string | null | undefined = params.get("b");
    if (beatmapId == null)
        beatmapId = undefined;
    let beatmapSetId: string | null | undefined = params.get("s");
    if (beatmapSetId == null)
        beatmapSetId = undefined;

    let apiData;

    if (beatmapId != null) {
        logHandler.info(`New set query: b/${beatmapId}`);
        apiData = await mirrorHandler.osuDirectSearchSet(beatmapId, undefined);
    } else {
        logHandler.info(`New set query: s/${beatmapSetId}`);
        apiData = await mirrorHandler.osuDirectSearchSet(undefined, beatmapSetId);
    }

    return res.end(apiData);
}

export async function handleDownload(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let beatmapSetId: number = parseInt(req.path_parameters.id);
    if (!isFinite(beatmapSetId)) {
        return res.status(404).end();
    }

    logHandler.info(`Requested beatmap ${beatmapSetId}`);
    res.status(302).header("Location", `${config.server.downloadServer}${beatmapSetId}`);
    return res.end();
}

export async function osuScreenshot(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let currentTime: number = new Date().getTime()
    let screenshotDir: string = `${__dirname}/../.data/screenshots/${currentTime}.png`;
    await req.multipart(async (fields) => {
        if (fields.file) {
            await fields.write(screenshotDir);
        }
    });
    return res.end(`${currentTime}.png`);
}


export async function osuSeasonal(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let seasonalImages = []; // get from database once implememted
    res.json(seasonalImages)
    return res.end();
}


export async function osuSubmitModular(req: Request, res: Response) {
    let fields: any = [];
    let unixTime = new Date().getTime();
    await req.multipart(async (field) => {
        let f = {
            name: field.name,
            value: field.value
        }
        if (field.value == undefined) {
            // save file
            console.log(unixTime);
            let filePath = `${__dirname}/../.data/replays/${unixTime}.osr`;
            await field.write(filePath);
        } else {
            fields.push(f);
        }
    });

    console.log(fields)
    // handle score shit lmao xd

    // rename file as it is in db
    res.end()
}

export async function osuGetTweets(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    return res.end("Server is restarting."); // database-this too?
}

export async function osuCheckUpdates(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    return res.end(""); // peppy only allows updates on bancho
}
