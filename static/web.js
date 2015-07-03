'use strict';

var express = require('express');
// var request = require('request');
var app = express(); // create our app w/ express


// configuration =================
// var environment = process.env.ENV_NAME || ('http://localhost:' + process.env.PORT);

// console.log('Environment: ' + environment);
// console.log('Port: ' + process.env.PORT);

// var base = process.env.API_BASE;

// if (base === undefined){
// 	base = 'http://localhost:5000'
// }
// console.log('API_BASE' + base);


// app.use('/api', apiForward);

// function apiForward(req, res) {
//    console.log('Request for ' + req.url)
//    var bits = req.url.split('/');
//    if(bits[3] === 'api'){
//      bits.splice(0,3);
//      req.url = '/' + bits.join('/');
//    }
//    req.pipe(request(base + req.url)).pipe(res);
// }

app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/app'));


app.listen(process.env.PORT || 9000);

