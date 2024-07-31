'use strict'

var express = require('express');

var app = express()

app.get('/', function (req, res) {
    res.json('Hello World');
});

app.get('/a', function (req, res) {
    res.json('Hello World get a');
});

app.post('/a', function (req, res) {
    res.json('Hello World post a');
});

app.get('/a/1/2', function (req, res) {
    res.json('Hello World');
});

app.get('/b', function (req, res) {
    res.json('Hello World');
});

app.get('/c', function (req, res) {
    res.json('Hello World');
});

module.exports = { app };