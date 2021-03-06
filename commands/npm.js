define(function(require, exports, module) {
    main.consumes = ["Plugin", "installer", "c9"];
    main.provides = ["installer.npm"];
    return main;
    
    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var installer = imports.installer;
        var c9 = imports.c9;
        
        var bashBin = options.bashBin || "bash";
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        
        /**
         * Installs an NPM package
         */
        function execute(task, options, onData, callback, global) {
            var NPM = !global && options.cwd == "~/.c9"
                ? '"$C9_DIR/node/bin/npm"'
                : "npm";
            // node-gyp uses sytem node or fails with command not found if
            // we don't bump this node up in the path
            var script = 'set -e\n'
                + (global
                    ? NPM + " install -g " + task
                    : 'C9_DIR="$HOME/.c9"\n'
                        + 'PATH="$C9_DIR/node/bin/:$C9_DIR/node_modules/.bin:$PATH"\n'
                        + (options.cwd == "~/.c9" ? 'mkdir -p node_modules' : "") + "\n"
                        + NPM + ' install ' + task)
                + "\n";
            
            if (c9.platform == "win32" && !global) {
                script = 'set -e\n'
                    + (options.cwd == "~/.c9" ? 'mkdir -p node_modules' : "") + "\n"
                    + NPM + ' install ' + task
                    + "\n";
            }
                
            installer.ptyExec({
                name: "NPM",
                bash: bashBin,
                code: script,
                cwd: options.cwd,
            }, onData, callback);
        }
        
        function isAvailable(callback){
            callback(true);
        }
        
        plugin.on("load", function() {
            installer.addPackageManager("npm", plugin);
            installer.addPackageManager("npm-g", {
                execute: function(task, options, onData, callback){
                    execute(task, options, onData, callback, true);
                },
                isAvailable: isAvailable
            });
        });
        plugin.on("unload", function() {
            installer.removePackageManager("npm");
            installer.removePackageManager("npm-g");
        });
        
        plugin.freezePublicAPI({ execute: execute, isAvailable: isAvailable });
        
        register(null, {
            "installer.npm": plugin
        });
    }
});