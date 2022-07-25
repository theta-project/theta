import * as config from "../config";
import * as minoHandler from "../handlers/mino";
import * as logHandler from "../handlers/logs";
import { Request, Response, DefaultResponseLocals } from "hyper-express";

export async function osuSearch(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params = new URLSearchParams(req.path_query);
    let minoData = await minoHandler.minoDirectSearch(params);
    if (minoData === null) {
        return res.end("");
    }

    logHandler.info(`New direct query: ${params.get("q")}`);

    return res.end(minoData);
}

export async function osuSearchSet(req: Request, res: Response): Promise<Response<DefaultResponseLocals>> {
    let params = new URLSearchParams(req.path_query);
    let beatmapId: string | null | undefined = params.get("b");
    if (beatmapId == null)
        beatmapId = undefined;
    let beatmapSetId: string | null | undefined = params.get("s");
    if (beatmapSetId == null)
        beatmapSetId = undefined;
    let minoData = null;

    if (beatmapId != null) {
        logHandler.success(`New set query: b/${beatmapId}`);
        minoData = await minoHandler.minoDirectSearchSet(beatmapId, undefined);
    } else {
        logHandler.success(`New set query: s/${beatmapSetId}`);
        minoData = await minoHandler.minoDirectSearchSet(undefined, beatmapSetId);
    }

    if (minoData === null) {
        return res.end("");
    }

    return res.end(minoData);
}

export async function handleDownload(req, res) {
    let beatmapSetId = parseInt(req.path_parameters.id);
    if (!isFinite(beatmapSetId)) {
        res.writeHead(404);
        res.end();
        return;
    }

    logHandler.info(`Requested beatmap ${beatmapSetId}`);
    res.status(302).header("Location", `http://catboy.best/d/${beatmapSetId}`);
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