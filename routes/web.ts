import * as config from "../config";
import * as mirrorHandler from "../handlers/mirrors";
import * as logHandler from "../handlers/logs";
import { Request, Response, DefaultResponseLocals } from "hyper-express";

export async function osuSearch(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params = new URLSearchParams(req.path_query);
    let apiData = await mirrorHandler.osuDirectSearch(params);

    logHandler.info(`New direct query: ${params.get("q")}`);
    return res.end(apiData);
}

export async function osuSearchSet(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params = new URLSearchParams(req.path_query);
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

export async function handleDownload(req, res) {
    let beatmapSetId = parseInt(req.path_parameters.id);
    if (!isFinite(beatmapSetId)) {
        res.writeHead(404);
        res.end();
        return;
    }

    logHandler.info(`Requested beatmap ${beatmapSetId}`);

    res.status(302).header("Location", `${config.server.downloadServer}${beatmapSetId}`);
    res.end();
}

export async function osuScreenshot(req, res) {
    let currentTime = new Date().getTime()
    let screenshotDir = `${__dirname}/../.data/screenshots/${currentTime}.png`;
    await req.multipart(async (fields) => {
        if (fields.file) {
            await fields.write(screenshotDir);
        }
    });
    res.end(`${currentTime}.png`);
} 