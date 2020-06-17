# Usage
1. Install frida-server and frida-tools (a good guide can be found here: https://omespino.com/tutorial-universal-android-ssl-pinning-in-10-minutes-with-frida/)

2. modify the func_hook.js to monitor the functions you need under the `methods_too_hook` array.

3. load func_hook.js:

    `frida -U com.package -l func_hook.js` 
    
**OR** if you want to spawn app to catch earlier methods `frida -U com.package -l -f func_hook.js`    

**OR** to catch other foreground stuff `frida -FU com.package -l func_hook.js`
