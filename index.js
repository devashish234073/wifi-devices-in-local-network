var mdns = require('mdns-js');
const http = require("http");
const fs = require("fs");
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var Client = require('castv2-client').Client;
const formidable = require("formidable");
const path = require("path");
const os = require('os');
const { exec } = require('child_process');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();
const uploadDir = path.join(__dirname, 'uploads');

// Ensure that the 'uploads' directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
let obj = {};
//if you have another mdns daemon running, like avahi or bonjour, uncomment following line
//mdns.excludeInterface('0.0.0.0');

//var browser = mdns.createBrowser(mdns.tcp('googlecast'));
let notConnected = true;
let tvIp = null;
function scan() {
    var browser = mdns.createBrowser(mdns.tcp('googlecast'));

    browser.on('ready', function () {
        console.log("READY");
        browser.discover();
    });

    browser.on('update', function (data) {
        obj[data.type[0]["name"]] = data;
        console.log(`${data.addresses} ${data.fullname} ${data.type[0]["name"]}`);
        tvIp = data.addresses[0];
    });
}

scan();
let CMND_MAP = {"up":19,"down":20,"left":21,"right":22,"ok":23,"back":4,"home":3,"vol +":24,"vol -":25};

function serverFunc(req, res) {
    if (req.url == "/api") {
        res.end(JSON.stringify(obj));
    } else if(req.method.toLowerCase() === 'post' && req.url === '/upload') {
        const form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;
        form.keepExtensions = true;
    
        form.parse(req, (err, fields, files) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error uploading the file.');
            return;
          }
          const uploadedFile = files.video;
          const fileName = path.basename(uploadedFile[0].filepath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(`{"link":"http://${localIP}:${PORT}/stream/${fileName}"}`);
        });
    }  else if (req.method.toLowerCase() === 'get' && req.url.startsWith('/stream/')) {
        const videoFile = req.url.split('/stream/')[1];
        const videoPath = path.join(uploadDir, videoFile);
        if (fs.existsSync(videoPath)) {
          const stat = fs.statSync(videoPath);
          const fileSize = stat.size;
          const range = req.headers.range;
    
          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize,
              'Content-Type': 'video/mp4',
            };
    
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4',
            };
    
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
          }
        }
    } else if (req.url.indexOf('/castToTv/')>-1) {
        let urlSplit = req.url.split('/castToTv/');
        if(urlSplit.length==2) {
            let videolink =`http://${localIP}:${PORT}/stream/${urlSplit[1]}`;
            console.log("sending video to tv",videolink);
            var client = new Client();

            client.connect(tvIp, function () {
                console.log("connected..");
                client.launch(DefaultMediaReceiver, function (err, player) {
                    if (err) {
                        console.log("Unable to get player", err);
                    } else {
                        //console.log(player);
                        var media = {
                            contentId: videolink,
                            contentType: 'video/mp4',
                            streamType: 'BUFFERED',
                            metadata: {
                                type: 0,
                                metadataType: 0,
                                title: "Video From Laptop",
                                images: [
                                    { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' }
                                ]
                            }
                        };
                        setTimeout(()=>{
                          player.load(media, { autoplay: true }, function(err, status) {
                            if(err) {
                                console.log("Unable to load player",err);
                            } else {
                                console.log("Player loaded successfully",status);
                                console.log(player);
                            }
                          });
                        },1500);
                    }
                });
            });
            res.end(`{"linkSentToTv":"${videolink}"}`);
        } else {
            res.end(`{"error":"Video Not Found "}`);
        }
    } else if(req.url.indexOf("/runAdb/")>-1) {
      let cmnd = req.url.replace("/runAdb/","").split("%20").join(" ");
      if(CMND_MAP[cmnd]) {
        cmnd = `adb shell input keyevent ${CMND_MAP[cmnd]}`;
      }
      exec(`${cmnd}`, (error, stdout, stderr) => {
        if (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error executing Python script', error: error.message }));
            console.error('Python script execution error:', error);
            return;
        }

        if (stderr) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Python script error', error: stderr }));
            console.error('Python script error output:', stderr);
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Python script output', output: stdout }));
        console.log('Python script output:', stdout);
      });
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