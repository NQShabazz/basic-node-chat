'use strict';

const localhost = 1
const bnc = require('./basic-node-chat')

bnc(process.env.PORT || localhost ? 9001 : 'some remote url idk')