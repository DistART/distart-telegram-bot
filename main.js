var https = require('https');
var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');

var SECRET_TOKEN = process.env.DISTART_SECRET_TOKEN;

var controller = require('./controller');

var CERT_LOCATION = 'raspilab_certificate_public.pem';
var KEY_LOCATION = 'raspilab_key_private.pem';

var options = {
  key: fs.readFileSync(KEY_LOCATION),
  cert: fs.readFileSync(CERT_LOCATION)
};

var app = express();
var jsonParser = bodyParser.json();

var users = {};

https.createServer(options, app).listen(443);


app.post('/' + SECRET_TOKEN + '/', jsonParser, function (req, res) {
  // console.log('POSTED: ', req.body);
  var m = req.body.message;
  if(m) {
    if (m.from && !users[m.from.username]) {
      controller.auth().then(function(token) {
        users[m.from.username] = {};
        users[m.from.username].token = token;
        users[m.from.username].chatID = m.from.id;
        users[m.from.username].content = 0;
        controller.sendMessage('Hi! Please send your style image', users[m.from.username].chatID);
      });
    } else if (users[m.from.username].content <= 1) { // authed
      var token = users[m.from.username].token;
      console.log(m);
      if (m.document) {
        if (m.document.mime_type == 'image/jpeg' || m.document.mime_type == 'image/png')
          controller.onImageDocReceived (token, m.document, users[m.from.username]);
      } else if (m.photo) {
        controller.onImageReceived (token, m.photo, users[m.from.username]);
      }
    } else {
      // start if the command says to start. ask for start otherwise
      var token = users[m.from.username].token;
      if (m.text && m.text == 'start') {
        controller.onStart(token, users, m.from.username);
      } else if (m.text && m.text == 'delete')
        {
          delete users[m.from.username];
          controller.auth().then(function(token) {
            users[m.from.username] = {};
            users[m.from.username].token = token;
            users[m.from.username].chatID = m.from.id;
            users[m.from.username].content = 0;
            controller.sendMessage('Hi! Please send your style image', users[m.from.username].chatID);
          });
        }
      else
        controller.sendMessage('Please write start to start your job or delete to start again', users[m.from.username].chatID);
    }
  }

  res.send('OK');
});
