// @ts-ignore
import config from "../config";
import fs from "fs";
import Logger from "cutesy.js"

const lifespan = `${__dirname}/../logs/theta.log`;
const session = `${__dirname}/../logs/session.log`;

function wipeLog(): void {
    fs.writeFileSync(session, "");
}

export function timer(time: number): string {
    const result = Date.now() - time;
    if (result > 1000) 
        return (result / 1000).toFixed(2) + "s";
    return result + "ms";
}

export function log(type: string, color: string, message: string): void {
    const logger = new Logger()

    logger.reset()
    if (type != "startup") {
        logger.changeName(type);
        logger.addTimestamp("hh:mm:ss")
    }

    logger[color]()
    logger.send(message)
    logger.save(lifespan, message)
    logger.save(session, message)
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
    let output = `Initialising the Theta osu! server
Report any issues at https://github.com/theta-project/theta/issues
Press Ctrl+C at any time to shut down the server`
    log("startup", "green", output);
    if (config.server.directServer > 0) {
        warn("Theta is recomended to be run using mino, please proceed with caution when using chimu/kitsu as integration may not be entirely complete");
        
    }
}