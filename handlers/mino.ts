import axios from 'axios';

export async function minoDirectSearch(params: URLSearchParams): Promise<any | undefined> {
    let mode = params.get("m");
    let rankedStatus = params.get("r");
    let query = params.get("q");
    let page = params.get("p");

    try {
        let response = await axios.get(`https://catboy.best/api/search?m=${mode}&r=${rankedStatus}&q=${query}&p=${page}&raw=1`);
        return response.data;
    } catch {
        return undefined;
    }    
}

export async function minoDirectSearchSet(b?: string, s?: string): Promise<any | undefined> {
    if (b == undefined && s == undefined)
        return undefined;

    if (b != undefined) {
        try {
            let beatmapInfo = await axios.get(`https://catboy.best/api/b/${b}`);
            let beatmapData = await axios.get(`https://catboy.best/api/search/set/${beatmapInfo.data.ParentSetID}`);
            
            return beatmapData.data;
        } catch {
            return undefined;
        }
    } else if (s != undefined) {
        try {
            let beatmapSetData = await axios.get(`https://catboy.best/api/search/set/${s}`);
            
            return beatmapSetData.data;
        } catch {
            return undefined;
        }
    } 
}