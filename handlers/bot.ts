import commands, { Command } from '../constants/commands';
import packetIDs from "../constants/packet_ids";
import { Player } from "../objects/player";
import { SlowSerializationBuffer } from "../objects/serialization";
import * as sessionHandler from "../handlers/sessions"

export async function createBot(): Promise<void> {
    let bot = new Player(5, "ThetaBot");
    bot.bot = true;
    bot.updatePresence();
    sessionHandler.pushBot(bot);
}

export async function handleCommand(str: string, channel: string, player: Player): Promise<void> {
    let responseBuffer = new SlowSerializationBuffer();

    const args = str.split(" ")
    let cmd = args.shift()
    cmd = cmd?.substring(1, cmd.length)

    let response = {
        sendingClient: "ThetaBot",
        target: player.username,
        message: "",
        senderId: 5
    }

    if (!cmd)
        response.message = "No command provided";
    else {
        const command: Command = commands[cmd]

        response.message = 
            !command 
            ? 
                "This command does not exist" 
            :
                args.length < command.syntax.split(" ").length 
            ? 
                `Invalid syntax (${command.syntax})` 
            : 
                command.permissions && !(player.privileges & command.permissions) 
            ? 
                "Not enough privileges" 
            :
                await command.callback(player, channel, args)
    }

    responseBuffer.writePacket(packetIDs.BANCHO_SEND_MESSAGE, b => b.writeMessage(response));
    player.buffer.writeBuffer(responseBuffer.flush());
}