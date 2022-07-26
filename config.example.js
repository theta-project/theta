module.exports = {
    server: {
        port: 8080, // port to listen to
        debug: false, // enable debug logging
        directServer: 0, // 0 = mino (default, recommended), 1 = kitsu, 2 = chimu
        downloadServer: "https://catboy.best/d/" // download server, can be any beatmap mirror
    }
}