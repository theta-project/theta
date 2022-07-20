import fs from "fs";
import { Request, Response, DefaultResponseLocals } from "hyper-express";

export function getAvatar(req: Request, res: Response): Response<DefaultResponseLocals> | undefined {
    let playerId = parseInt(req.path_parameters.id);
    let fileLocation = `${__dirname}/../.data/avatars/${playerId}.png`;

    if (!isNaN(playerId)) {
        let avatarData: Buffer;
        try {
            avatarData = fs.readFileSync(fileLocation);
        } catch {
            fileLocation = `${__dirname}/../.data/avatars/0.png`;
            avatarData = fs.readFileSync(fileLocation);
        }
        res.setHeader("Content-Type", "image/png");
        return res.end(avatarData);
    }

    return undefined;
}