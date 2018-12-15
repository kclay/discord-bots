require('dotenv').config();
const Bungie = require('common/bungie');
const Manifest = require('common/manifest');
const Gunsmith = require('commands/gunsmith');
const bungie = new Bungie(process.env.BUNGIE_API_KEY, new Manifest('./db/manifest.sqlite'));
const {BungieMembershipType} = require('bungie-api-ts/destiny2');


const gunsmith = new Gunsmith();
gunsmith.exec()
