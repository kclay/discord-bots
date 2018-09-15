const {AkairoClient} = require('discord-akairo');
require('dotenv').config()

const client = new AkairoClient({
    ownerID: (process.env.DISCORD_OWNER_ID || '').split(','), // or ['123992700587343872', '86890631690977280']
    prefix: (process.env.DISCORD_PREFIX || '!').split(','), // or ['?', '!']
    commandDirectory: './commands/',
    commandUtil: true,
    handleEdits: true,
    listenerDirectory: './listeners/'
});

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log('up!')
});