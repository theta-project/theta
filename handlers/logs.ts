// @ts-ignore
import config from "../config";
import fs from "fs";
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

export function log(type: string, color: number, message: string): void {
    const d = new Date();
    const h = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
    const m = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    const s = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();

    console.log(`\x1b[${color}m[${type ? type + " - " : ""}${h + ":" + m + ":" + s}] | ${message}\x1b[0m`);
    let lifespanContent = "";
    let sessionContent = "";

    try {
        lifespanContent = fs.readFileSync(lifespan, 'utf8');
    } 
    catch { }

    try {
        sessionContent = fs.readFileSync(session, 'utf8');
    } 
    catch { }

    fs.writeFileSync(lifespan, lifespanContent + message + "\n");
    fs.writeFileSync(session, sessionContent + message + "\n");
}

export function info(message: string): void {
    log("Info", 94, message);
}

export function error(message: string): void {
    log("Error", 91, message);
}

export function success(message: string): void {
    log("", 92, message);
}

export function warn(message: string): void {
    log("Warn", 93, message);
}

export function debug(message: string): void {
    if (config.server.debug) {
        log("Debug", 96, message);
    }
}

export function printStartup() {
    wipeLog();
    success("Initialising the Theta osu! server");
    success("Report any issues at https://github.com/mayacopeland/theta/issues");
    success("Press Ctrl+C at any time to shut down the server");
}