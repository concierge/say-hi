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
    let callback = () => {
        let apis = exports.platform.getIntegrationApis(),
            keys = Object.keys(apis);

        if (keys.length > 0 && apis[keys[0]] !== null) {
            greet(apis);

        } else {
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

let greet = function(apis) {
        let config = exports.config,
            threads = Object.keys(config),
            apiKeys = Object.keys(apis);

        for (var i = 0; i < threads.length; ++i){
            let thread_id = threads[i],
                threadConfig = config[thread_id],
                greetings = threadConfig.greetings || ['Hello World'],
                greeting = greetings[Math.floor(Math.random() * greetings.length)];

            if (!threadConfig.enabled) {
                continue;
            }

            for (var j = 0; j < apiKeys.length; ++j) {
                let api = apis[apiKeys[j]];


                api.sendMessage(greeting, thread_id);
            }
        }
    },

    ensureConfigExists = function(thread_id, api) {
        if (api) {            
            api.sendMessage("I should've done something...", thread_id);
        }
        if (!exports.config[thread_id]) {
            exports.config[thread_id] = {};
        }
        exports.config[thread_id] = exports.config[thread_id] || {};
    },

    enable = function(api, event) {     
        exports.config[event.thread_id].enabled = true;
        api.sendMessage('Greetings Enabled!', event.thread_id);
    },

    disable = function(api, event){
        exports.config[event.thread_id].enabled = false;
        api.sendMessage('Greetings Disabled!', event.thread_id);
    },

    set_greetings = function(api, event){
        let greetings = event.body.substring(setCommand.length).split(',');

        exports.config[event.thread_id].greetings = greetings;
        api.sendMessage('Greetings Set!', event.thread_id);
    },

    fail = function(api, event){
        api.sendMessage('That didn\'t look right....', event.thread_id);
    };

exports.run = function(api, event){
    let body = event.body;

    ensureConfigExists(event.thread_id);

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