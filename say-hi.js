let command = 'say-hi',
        enableCommand = command + ' enable',
        disableCommand = command + ' disable',
        setCommand = command + ' set ',
        validCommands = [
            enableCommand,
            disableCommand,
            setCommand
        ];

exports.load = function () {
    let search = Object.keys(exports.config);

    let callback = () => {
        let apis = exports.platform.getIntegrationApis(),
            keys = Object.keys(apis);

        for (let i = 0; i < search.length; i++) {
            let integ = search[i];
            if (apis[integ] && apis[integ] !== null) {
                greet(integ, apis[integ])
                search.splice(i, 1);
                i--;
            }
        }

        if (search.length !== 0) {
            setTimeout(callback, 200);
        }
    }
    callback();
};

exports.match = function(event, commandPrefix){
    //Check if it matches one of our predefined commands
    for (var i = 0; i < validCommands.length; ++i) {
        if (event.body.startsWith(commandPrefix + validCommands[i])) {
            return true;
        }
    }

    //If it didn't, we can't handle it
    return false;
};

let greet = function(integ, api) {
        let config = exports.config[integ],
            threads = Object.keys(config);

        for (var i = 0; i < threads.length; ++i){
            let thread_id = threads[i],
                threadConfig = config[thread_id],
                greetings = threadConfig.greetings || ['Hello World'],
                greeting = api.random(greetings);

            if (!threadConfig.enabled) {
                continue;
            }
            api.sendMessage(greeting, thread_id);
        }
    },

    ensureConfigExists = function(event_source, thread_id) {
        if (!exports.config[event_source]) {
            exports.config[event_source] = {};
        }

        if (!exports.config[event_source][thread_id]) {
            exports.config[event_source][thread_id] = {};
        }
    },

    enable = function(api, event) {
        exports.config[event.event_source][event.thread_id].enabled = true;
        api.sendMessage('Greetings Enabled!', event.thread_id);
    },

    disable = function(api, event){
        exports.config[event.event_source][event.thread_id].enabled = false;
        api.sendMessage('Greetings Disabled!', event.thread_id);
    },

    set_greetings = function(api, event){
        let greetings = event.body.substring(setCommand.length).split(',');

        exports.config[event.event_source][event.thread_id].greetings = greetings;
        api.sendMessage('Greetings Set!', event.thread_id);
    },

    fail = function(api, event){
        api.sendMessage('That didn\'t look right....', event.thread_id);
    };

exports.run = function(api, event){
    let body = event.body;

    ensureConfigExists(event.event_source, event.thread_id);

    if (body.includes(enableCommand)) {
        enable(api, event);
    }
    else if (event.body.includes(disableCommand)) {
        disable(api, event);
    }
    else if (event.body.includes(setCommand)) {
        set_greetings(api, event);
    }
    else {
        fail(api, event);
    }
}
