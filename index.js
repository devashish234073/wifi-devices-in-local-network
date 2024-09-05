var mdns = require('mdns-js');
const http = require("http");
const fs = require("fs");
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var Client = require('castv2-client').Client;
let obj = {};
//if you have another mdns daemon running, like avahi or bonjour, uncomment following line
//mdns.excludeInterface('0.0.0.0');

//var browser = mdns.createBrowser(mdns.tcp('googlecast'));
let notConnected = true;
function scan() {
    var browser = mdns.createBrowser(mdns.tcp('googlecast'));

    browser.on('ready', function () {
        console.log("READY");
        browser.discover();
    });

    browser.on('update', function (data) {
        obj[data.type[0]["name"]] = data;
        console.log(`${data.addresses} ${data.fullname} ${data.type[0]["name"]}`);
        if (notConnected && data.type[0]["name"] == "googlecast") {
            notConnected = false;
            var client = new Client();

            client.connect(data.addresses[0], function () {
                console.log("connected..");
                client.launch(DefaultMediaReceiver, function (err, player) {
                    if (err) {
                        console.log("Unable to get player", err);
                    } else {
                        //console.log(player);
                        var media = {
                            contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
                            contentType: 'video/mp4',
                            streamType: 'BUFFERED',
                            metadata: {
                                type: 0,
                                metadataType: 0,
                                title: "Big Buck Bunny",
                                images: [
                                    { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' }
                                ]
                            }
                        };
                        player.load(media, { autoplay: true }, function(err, status) {
                            if(err) {
                                console.log("Unable to load player",err);
                            } else {
                                console.log("Player loaded successfully",status);
                            }
                        });
                    }
                });
            });
        }
    });
}

scan();

function serverFunc(req, res) {
    if (req.url == "/api") {
        res.end(JSON.stringify(obj));
    } else {
        let html = fs.readFileSync("index.html");
        res.end(html);
    }
}

let server = http.createServer(serverFunc);
const PORT = 9999;
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});