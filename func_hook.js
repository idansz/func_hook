// adb push <<frida-server>> /data/local/tmp/
// adb shell "chmod 777 /data/local/tmp/<<frida-server>>"
// adb shell "am start -n com.package/com.YourMainActivity"
// adb shell "su -c /data/local/tmp/<<frida-server>>"

var methods_too_hook = [
    {
        class: 'java.net.URL',
        func: 'openConnection',
        name: 'Network'
    },
    {
        class: 'android.util.Base64',
        func: 'decode',
        name: 'Base64'
    },
    {
        class: 'android.util.Base64',
        func: 'encode',
        name: 'Base64'
    },
    {
        class: 'android.util.Base64',
        func: 'encodeToString',
        name: 'Base64'
    },
    {
        class: 'com.android.okhttp.internal.huc.HttpURLConnectionImpl',
        func: 'getInputStream',
        name: 'Network'
    },
    {
        class: 'okhttp3.HttpUrl',
        func: 'encodedPathSegments',
        name: 'Okhttp'
    },
    {
        class: 'okhttp3.OkHttpClient',
        func: 'newCall',
        name: 'Okhttp'
    },
    {
        class: 'com.example.myapplication.MainActivity',
        func: 'mymain',
        name: 'frida example'
    }
];

//TODO: function to mess with [object Object] or char codes
function extract_object(obj) {
    // var stringified_obj = JSON.stringify(obj)
    // console.log("[stringify]", stringified_obj)
    // var charCodesArr = stringified_obj.replace(/\[/, '').replace(/\]/, '').split(",");
    // var chr_code_str = ""
    // for (var i = 0; i < charCodesArr.length; i++) {
    //     chr_code_str += String.fromCharCode(charCodesArr[i]);
    // }
    // console.log(("[chr-code]", chr_code_str))
}

// Get All func Implementations
function get_implementations(toHook) {
    var imp_args = []
    toHook.overloads.forEach(function (impl, _) {
        if (impl.argumentTypes) {
            var args = [];
            var argTypes = impl.argumentTypes
            argTypes.forEach(function (arg_type, __) {
                args.push(arg_type.className)
            });
            imp_args.push(args);
        }
    });
    return imp_args;
}

// Dynamic Hooks
function hook(api, callback) {
    var Exception = Java.use('java.lang.Exception');
    var toHook;
    try {
        var hooked_class = api.class;
        var func = api.func;
        var name = api.name;
        try {
            if (api.target && parseInt(Java.androidVersion, 10) < api.target) {
                // send('[-] Not Hooking unavailable class/func - ' + hooked_class + '.' + func)
                return
            }
            // Check if class and func is available
            toHook = Java.use(hooked_class)[func];
            if (!toHook) {
                send('[-] Cannot find ' + hooked_class + '.' + func);
                return
            }
        } catch (err) {
            send('[-] Cannot find ' + hooked_class + '.' + func);
            return
        }
        var overloadCount = toHook.overloads.length;
        console.log("[+] Hooking", overloadCount, "overloads")
        for (var i = 0; i < overloadCount; i++) {
            toHook.overloads[i].implementation = function () {
                var mod_args = [].slice.call(arguments);
                
                // PoC - modifying args on the fly
                if (typeof mod_args[0] == 'string')
                    if (mod_args[0].match(/XYZ/))
                        mod_args[0] = mod_args[0].replace(/XYZ/, '!MODIFIED!')
                        console.log(mod_args[0])

                var retval = this[func].apply(this, mod_args);
                              
                if (typeof mod_args === 'object') {
                    extract_object(mod_args)
                }
                if (typeof retval === 'object') {
                    extract_object(retval)
                }

                if (callback) {
                    var calledFrom = Exception.$new().getStackTrace().toString().split(',')[1];
                    var message = {
                        name: name,
                        class: hooked_class,
                        func: func,
                        arguments: mod_args,
                        result: retval ? retval.toString() : null,
                        calledFrom: calledFrom
                    };
                    retval = callback(retval, message);
                }
                return retval;
            }
        }
    } catch (err) {
        send('[-] ERROR: ' + hooked_class + "." + func + " [\"Error\"] => " + err);
    }
}

Java.performNow(function () {
    methods_too_hook.forEach(function (api, _) {
        hook(api, function (originalResult, message) {
            message.returnValue = originalResult
            if (originalResult && typeof originalResult === 'object') {
                var s = [];
                for (var k = 0, l = originalResult.length; k < l; k++) {
                    s.push(originalResult[k]);
                }
                message.returnValue = '' + s.join('');
            }
            if (!message.result)
                message.result = undefined
            if (!message.returnValue)
                message.returnValue = undefined

            if (message.calledFrom)
                var msg = "\x1b[32m[+]\x1b[34m " + message.calledFrom + "\x1b[33m -> \x1b[32m\n     " + message.class + "." + message.func + "(" + JSON.stringify(message.arguments) + ")" + "\n     \x1b[33mretVal:\x1b[0m " + message.result + "\n"

            console.log(msg)
            return originalResult;
        });
    });
});
