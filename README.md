# func_hook
Perform dynamic function hooking to currently running Android applications. Can be used to:
* print interesting function calls being made real time by an android app and the arguments passed in each call
* modify arguments values on the fly

# Usage
1. Install frida-server and frida-tools (a good guide can be found here: https://omespino.com/tutorial-universal-android-ssl-pinning-in-10-minutes-with-frida/)

2. modify the func_hook.js to monitor the functions you need under the `methods_to_hook` array.

3. load func_hook.js:

    `frida -U -l func_hook.js com.package.myapp` 
    
**OR** if you want to spawn the app with frida to catch earlier methods `frida -U -l func_hook.js -f com.package.myapp`    

**OR** to catch all background stuff `frida -FU -l func_hook.js`
