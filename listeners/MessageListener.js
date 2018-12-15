const {Listener, Constants} = require('discord-akairo');


class MessageListener extends Listener {
    constructor() {
        super('commandListener', {
            emitter: 'commandHandler',
            eventName: Constants.CommandHandlerEvents.ERROR
        });
    }

    exec(error) {
        console.log(error);
    }
}

module.exports = MessageListener;