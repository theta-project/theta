// @ts-ignore
import config from "../config";
import fs from "fs";
import Logger from "cutesy.js"

const lifespan = `${__dirname}/../logs/theta.log`;
const session = `${__dirname}/../logs/session.log`;
const logger: Logger = new Logger();

function wipeLog(): void {
    fs.writeFileSync(session, "");
}
export function log(type: string, color: string, message: string): void {
    logger[color]()
        .changeTag(type)
        .send(`${message}`);
        
    logger.save(lifespan, `${message}`);
    logger.save(session, `${message}`);
}

export function info(message: string): void {
    log("Info", "blue", message);
}

export function error(message: string): void {
    log("Error", "red", message);
}

export function success(message: string): void {
    log("", "green", message);
}

export function warn(message: string): void {
    log("Warn", "yellow", message);
}

export function debug(message: string): void {
    if (config.server.debug) {
        log("Debug", "lightBlue", message);
    }
}

export function printStartup() {
    wipeLog();
    let output: string = `Initialising the Theta osu! server
Report any issues at https://github.com/theta-project/theta/issues
Press Ctrl+C at any time to shut down the server`
    logger["green"]()
        .send(`${output}`)
        .addTimestamp("hh:mm:ss");
    
   
    if (config.server.directServer > 0) {
         warn("Theta is recomended to be run using mino, please proceed with caution when using chimu/kitsu as integration may not be entirely complete");
    }
}
