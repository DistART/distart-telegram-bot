var https = require('https');
var request = require('request');
var SECRET_TOKEN = process.env.DISTART_SECRET_TOKEN;

var fs = require('fs');

var file = fs.createWriteStream("file.jpg");




module.exports = {
  auth: function () {
    return new Promise( function(resolve) {
      console.log('la');
      https.get('https://deepartapi.azurewebsites.net/create', function (r) {
        streamToString(r, function(string) {
          resolve(string);
        })
      })
    })
  },
  sendMessage: sendMessage,
  onImageDocReceived: function (token, document, user) {
    var id = document.file_id;
    getPhoto(token, id, user);
  },
  onImageReceived: function (token, photos, user) {
    var id = photos[photos.length-1].file_id;
    getPhoto(token, id, user);
  },
  onStart: function (token, user, params) {
    console.log(token);
    https.get('https://deepartapi.azurewebsites.net/start/' + token, function (r) {
      sendMessage('Thansk! You will receive your image as soon as it is done', user.chatID);
    });
  }
}


function getPhoto (token, id, user) {
  console.log('https://api.telegram.org/bot' + SECRET_TOKEN + '/getFile?file_id=' + id);
  https.get('https://api.telegram.org/bot' + SECRET_TOKEN + '/getFile?file_id=' + id, function (res) {
    res.on('data', function (d) {
      console.log(JSON.parse(d.toString('utf8')));
      var path = JSON.parse(d.toString('utf8')).result.file_path;
      console.log('https://api.telegram.org/file/bot' + SECRET_TOKEN + '/' + path);
      https.get('https://api.telegram.org/file/bot' + SECRET_TOKEN + '/' + path, function (r) {
        r.pipe(request.post('https://deepartapi.azurewebsites.net/' + (user.content? 'content/'  : 'style/') + token));
        user.content++;
        if (user.content == 1) {
          sendMessage('Thanks! Please send the image on which you want to apply the style', user.chatID);
        } else {
          sendMessage('Thansk! Write start to start your job or delete to start again', user.chatID);
        }
        console.log("posted");
      });
    })
  });
  console.log(id);
}

function streamToString(s, cb) {
  var string = ''
  s.on('readable',function(buffer){
    var part = s.read().toString();
    string += part;
  });

  s.on('end',function(){
    cb(string);
  });
}

function sendMessage(text, chatID) {
  console.log('https://api.telegram.org/bot' + SECRET_TOKEN + '/sendMessage');
  request.post('https://api.telegram.org/bot' + SECRET_TOKEN + '/sendMessage', {form :{
    text : text,
    chat_id : chatID
  }});
}
