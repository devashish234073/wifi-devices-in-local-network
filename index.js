var mdns = require('mdns-js');
const http = require("http");
const fs = require("fs");
let obj = {};
//if you have another mdns daemon running, like avahi or bonjour, uncomment following line
//mdns.excludeInterface('0.0.0.0');

//var browser = mdns.createBrowser(mdns.tcp('googlecast'));
function scan() {
    var browser = mdns.createBrowser(mdns.tcp('googlecast'));

    browser.on('ready', function () {
        console.log("READY");
        browser.discover();
    });

    browser.on('update', function (data) {
        obj[data.type[0]["name"]] = data;
        console.log(`${data.addresses} ${data.fullname} ${data.type[0]["name"]}`);
    });
}

scan();

function serverFunc(req,res) {
    if(req.url=="/api") {
        res.end(JSON.stringify(obj));
    } else {
        let html = fs.readFileSync("index.html");
        res.end(html);
    }
}

let server = http.createServer(serverFunc);
const PORT = 9999;
server.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
});