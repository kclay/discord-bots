const {Listener, Constants} = require('discord-akairo');


class MessageListener extends Listener {
    constructor() {
        super('commandListener', {
            emitter: 'commandHandler',
            eventName: Constants.CommandHandlerEvents.ERROR
        });
    }

    exec() {
        console.log(arguments);
    }
}

module.exports = MessageListener;