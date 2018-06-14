var express = require('express');
var app = express();
var  bodyParser=require('body-parser')
var multer = require('multer');
var fs = require('fs');
var upload = multer({ dest: 'uploads/' })
app.use(express.static('www'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/upload', upload.single('img'),function (req, res) {
    let imgData=req.body.img

    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    fs.writeFile("image.png", dataBuffer, function(err) {
        if(err){
            res.send(err);
        }else{
            res.send("保存成功！");
        }
    });
    // console.log(req.files);
    // var patharray = req.files.file.path.split("\\");
    // res.send(patharray[patharray.length-1]);
});
app.get('/nes',function (req, res) {


    fs.readFile("./mar.nes", function(err,data) {
        if(err){
            res.send(err);
        }else{
            console.log(data)
            res.send(data);
        }
    });
    // console.log(req.files);
    // var patharray = req.files.file.path.split("\\");
    // res.send(patharray[patharray.length-1]);
});
var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
