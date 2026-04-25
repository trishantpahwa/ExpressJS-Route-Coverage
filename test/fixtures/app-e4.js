'use strict';

const express = require('express-v4');

const app = express();

const api = express.Router();
api.get('/users', () => {});
api.post('/users', () => {});
api.get('/users/:id', () => {});
api.put('/users/:id', () => {});
api.delete('/users/:id', () => {});

app.use('/api', api);
app.get('/health', () => {});

module.exports = { app };
