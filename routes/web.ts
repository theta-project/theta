import axios, { AxiosStatic } from 'axios';
import * as config from "../config";
import * as mirrorHandler from "../handlers/mirrors";
import * as logHandler from "../handlers/logs";
import { Request, Response, DefaultResponseLocals } from "hyper-express";

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
    return res.end(seasonalImages);
}

export async function osuSubmitModular(req: Request, res: Response) {
    await req.multipart(async (fields) => {
        console.log(fields.name)
    });
}

export async function osuGetTweets(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    return res.end("Server is restarting."); // database-this too?
}

export async function osuCheckUpdates(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params: URLSearchParams = new URLSearchParams(req.path_query);
    let action: string | null | undefined = params.get("action");
    if (action !== null && action !== undefined) {
        action = action.toLowerCase();
        if (action !== 'check' && action !== 'path' && action !== 'latest') return res.end("nice try"); // we don't allow put requests to osu.ppy.sh

        let resp = await axios.get(`https://osu.ppy.sh/web/check-updates.php?${params.toString()}`);
        return res.end(resp.data.toString());
    }

    return res.end("nope");
}
