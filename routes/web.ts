import * as config from "../config";
import * as mirrorHandler from "../handlers/mirrors";
import * as logHandler from "../handlers/logs";
import { Request, Response, DefaultResponseLocals } from "hyper-express";
import md5 from "md5";
import bcrypt from "bcrypt";
import { query } from "../handlers/mysql";
import { find } from "../handlers/sessions";
import axios, { Axios } from "axios";
import fs from "fs";
import { Beatmap } from "../objects/beatmap";

export async function osuSearch(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  let params: URLSearchParams = new URLSearchParams(req.path_query);
  let apiData = await mirrorHandler.osuDirectSearch(params);

  logHandler.info(`New direct query: ${params.get("q")}`);
  return res.end(apiData);
}

export async function osuSearchSet(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  let params: URLSearchParams = new URLSearchParams(req.path_query);
  let beatmapId: string | null | undefined = params.get("b");
  if (beatmapId == null) beatmapId = undefined;
  let beatmapSetId: string | null | undefined = params.get("s");
  if (beatmapSetId == null) beatmapSetId = undefined;

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

export async function handleDownload(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  let beatmapSetId: number = parseInt(req.path_parameters.id);
  if (!isFinite(beatmapSetId)) {
    return res.status(404).end();
  }

  logHandler.info(`Requested beatmap ${beatmapSetId}`);
  res
    .status(302)
    .header("Location", `${config.server.downloadServer}${beatmapSetId}`);
  return res.end();
}

export async function osuScreenshot(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  let currentTime: number = new Date().getTime();
  let screenshotDir: string = `${__dirname}/../.data/screenshots/${currentTime}.png`;
  await req.multipart(async (fields) => {
    if (fields.file) {
      await fields.write(screenshotDir);
    }
  });
  return res.end(`${currentTime}.png`);
}

export async function osuSeasonal(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  let seasonalImages = []; // get from database once implememted
  res.json(seasonalImages);
  return res.end();
}

export async function osuSubmitModular(req: Request, res: Response) {
  let fields: any = {};
  let unixTime = new Date().getTime();
  await req.multipart(async (field) => {
    if (field.value == undefined) {
      let filePath = `${__dirname}/../.data/replays/${unixTime}.osr`;
      await field.write(filePath);
    } else {
      fields[field.name] = field.value;
    }
  });

  //console.log(fields);
  // handle score shit lmao xd

  // rename file as it is in db
  res.end();
}

export async function osuGetTweets(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  return res.end("Server is restarting."); // database-this too?
}

export async function osuCheckUpdates(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  return res.end(""); // peppy only allows updates on bancho
}
export async function registerAccount(
  req: Request,
  res: Response
): Promise<Response<DefaultResponseLocals>> {
  let fields: any = {};
  let errors = {
    username: "",
    user_email: "",
    password: "",
  };

  await req.multipart(async (field) => {
    fields[field.name] = field.value;
  });

  let username = fields["user[username]"];
  let safe_username = username.toLowerCase().replaceAll(" ", "_");
  let email = fields["user[user_email]"];
  let password = fields["user[password]"];

  if (username.length < 2 || username.length > 32) {
    errors.username += "Username must be between 2 and 32 characters.\n";
  }

  let exists: any = await query(
    "SELECT * FROM users WHERE username_safe = ? OR email = ?",
    safe_username,
    email
  );

  if (exists.length > 0) {
    errors.username += "Username/email in database already.\n";
  }

  if (username.indexOf(" ") > 0 && username.indexOf("_") > 0) {
    errors.username += "Username cannot contain spaces and underscores.\n";
  }

  if (config.server.disallowedUsernames.indexOf(username) > 0) {
    errors.username += "Username is disallowed.\n";
  }

  if (
    errors.username.length > 0 ||
    errors.user_email.length > 0 ||
    errors.password.length > 0
  ) {
    let err = { form_error: { user: errors } };
    //res.status(400);
    return res.end(JSON.stringify(err));
  }

  if (fields[3].value == "0") {
    console.log(password);
    let password_hashed = await bcrypt.hash(md5(password), 10);
    let userid: any = await query(
      "INSERT INTO users(username, username_safe, email, password, country, permissions, account_create, last_online) VALUES(?, ?, ?, ?, 'XX', 'normal', NOW(), NOW())",
      username,
      safe_username,
      email,
      password_hashed
    );
    await query("INSERT INTO users_page(id) VALUES(?)", userid.insertId);
    for (let i: any = 0; i < 8; i++) {
      await query(
        "INSERT INTO user_stats(user_id,mode) VALUES(?,?)",
        userid.insertId,
        i
      );
    }
  }
  return res.end("ok");
}

export async function osuGetScores(
  req,
  res
): Promise<Response<DefaultResponseLocals>> {
  let params: URLSearchParams = new URLSearchParams(req.path_query);
  let md5 = params.get("c");
  let fileName = params.get("f");
  let playMode = params.get("m");
  let username = params.get("us");
  let pass = params.get("ha");
  let scoreType = params.get("v");
  let version = params.get("vv");
  let mods = params.get("mods");
  let player = find((p) => p.username == username);
  if (!player) {
    return res.end("you are not loggred in");
  }
  let beatmap = new Beatmap(md5!);
  let out = beatmap.getData();


  logHandler.info(`${username} has requested scores for ${md5}`);
  // todo change for rxap
  return await res.end(out);
}