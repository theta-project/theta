import * as bancho from "./routes/bancho"
import * as web from "./routes/web"
import * as bots from "./handlers/bot";
import * as channels from './handlers/channel';
import hyperExpress from "hyper-express";
import * as log from "./handlers/logs";
// @ts-ignore
import * as config from './config';

const app = new hyperExpress.Server();

(async () => {
    await Promise.all([
        bots.createBot(),
        channels.initialize()
    ]);
    app.any("/", bancho.banchoIndex);
    app.get("/web/osu-search.php", web.osuSearch);
    app.get("/web/osu-search-set.php", web.osuSearchSet);
    app.post("/web/osu-screenshot.php", web.osuScreenshot);
    app.get("/d/:id", web.handleDownload);
    app.listen(config.server.port).then((listen) => log.printStartup()).catch(err => log.error(err));
})();