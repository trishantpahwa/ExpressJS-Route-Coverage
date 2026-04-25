'use strict';

const express = require('express-v4');
const app = express();

app.get('/no-export', () => {});
app.post('/no-export', () => {});
