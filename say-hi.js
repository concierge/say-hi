const parser = require('concierge/arguments');

const greet = (api, config) => {
    for (let thread_id of Object.keys(config)) {
        const thread = config[thread_id];
        if (!thread.enabled)
            continue;
        const greeting = api.random(thread.greetings || ['Hello World']);
        api.sendMessage(greeting, thread_id);
    }
};

const greetEvent = startObj => {
    const integ = startObj.integration;
    if (!startObj.success || !exports.config[integ.__descriptor.name])
        return;
    /* Callback in a short time, such that this is async and so that races can be avoided. If an
     * integration is stopped within 1sec of it starting, then someone has a bigger problem than
     * this module throwing an exception... */
    setTimeout(greet.bind(this, integ.getApi(), exports.config[integ.__descriptor.name]), 1000);
};

exports.load = platform => {
    platform.modulesLoader.on('start', greetEvent);
};

exports.unload = platform => {
    platform.modulesLoader.removeListener('start', greetEvent);
};

const ensureConfigExists = (event_source, thread_id) => {
    if (!exports.config[event_source]) {
        exports.config[event_source] = {};
    }

    if (!exports.config[event_source][thread_id]) {
        exports.config[event_source][thread_id] = {};
    }
};

exports.run = (api, event) => {
    ensureConfigExists(event.event_source, event.thread_id);
    try {
        const args = parser.parseArguments(event.arguments.slice(1), [
            {
                long: 'enable',
                short: 'e',
                run: () => {
                    exports.config[event.event_source][event.thread_id].enabled = true;
                    api.sendMessage('Greetings Enabled!', event.thread_id);
                }
            },
            {
                long: 'disable',
                short: 'd',
                run: () => {
                    exports.config[event.event_source][event.thread_id].enabled = false;
                    api.sendMessage('Greetings Disabled!', event.thread_id);
                }
            },
            {
                long: 'set',
                short: 's',
                expects: ['GREETINGS'],
                run: (out, vals) => {
                    const greetings = vals[0].split(',');
                    exports.config[event.event_source][event.thread_id].greetings = greetings;
                    api.sendMessage('Greetings Set!', event.thread_id);
                }
            }
        ]);

        if (args.unassociated.length > 0 || Object.keys(args.parsed).length === 0) {
            throw new Error('Invalid arguments or no arguments.');
        }
    }
    catch (e) {
        api.sendMessage("That didn't look right....", event.thread_id);
        LOG.debug(e.message);
    }
};
