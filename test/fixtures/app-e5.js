'use strict';

const express = require('express-v5');

const app = express();

const api = express.Router();
api.get('/items', () => {});
api.post('/items', () => {});
api.get('/items/:id', () => {});
api.delete('/items/:id', () => {});

app.use('/api', api);
app.get('/health', () => {});
app.get(['/ping', '/pong'], () => {}); // Express 5.x array paths

module.exports = { app };
