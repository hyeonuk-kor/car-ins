export function execFuncIfExists(obj, funcName, ...args) {
    if (obj && typeof obj === 'object' && typeof obj[funcName] === 'function') {
        return obj[funcName](...args);
    }
    return null;
}

export function loadScript(document, url) {
    return new Promise((resolve, reject) => {
        if(!(document instanceof Document)) {
            reject("document is not instance of Document");
            return;
        }
    
        let script = document.createElement("script");
        script.type = "text/javascript";

        // checkIfExists(url).then(() => {
        if (script.readyState) { // IE
            script.onreadystatechange = function() {
                if(script.readyState === "loaded" || script.readyState === "complete") {
                    script.onreadystatechange = null;
                    resolve();
                } else {
                    reject("failed to load script, path: " + url);
                }
            };
        } else { // Others
            script.onload = function() {
                resolve();
            };
            script.onerror = function() {
                reject("failed to load script, path: " + url);
            };
        }
    
        script.src = url;
        document.body.appendChild(script);
    });
}

export function loadScripts(urls) {
    let promiseChain = Promise.resolve();

    urls.forEach((url) => {
        promiseChain = promiseChain.then(() => loadScript(document, url));
    });

    return promiseChain;
}

export async function loadJSON(path) {
    try {
        return await fetch(path).then((res) => res.json() );
    } catch(error) {
        throw error;
    }
}

export function getCameraType() {
    let os = "";
    let ua = navigator.userAgent;
    let osSimple = "";
    let browser = "";

    if (ua.match(/Win(dows )?NT 6\.0/)) {
        os = "Windows Vista";
        osSimple = "WIN";
    } else if (ua.match(/Win(dows )?(NT 5\.1|XP)/)) {
        os = "Windows XP";
        osSimple = "WIN";
    } else {
        if (
            ua.indexOf("Windows NT 5.1") !== -1 ||
            ua.indexOf("Windows XP") !== -1
        ) {
            os = "Windows XP";
            osSimple = "WIN";
        } else if (
            ua.indexOf("Windows NT 7.0") !== -1 ||
            ua.indexOf("Windows NT 6.1") !== -1
        ) {
            os = "Windows 7";
            osSimple = "WIN";
        } else if (
            ua.indexOf("Windows NT 8.0") !== -1 ||
            ua.indexOf("Windows NT 6.2") !== -1
        ) {
            os = "Windows 8";
            osSimple = "WIN";
        } else if (
            ua.indexOf("Windows NT 8.1") !== -1 ||
            ua.indexOf("Windows NT 6.3") !== -1
        ) {
            os = "Windows 8.1";
            osSimple = "WIN";
        } else if (
            ua.indexOf("Windows NT 10.0") !== -1 ||
            ua.indexOf("Windows NT 6.4") !== -1
        ) {
            os = "Windows 10";
            osSimple = "WIN";
        } else if (
            ua.indexOf("iPad") !== -1 ||
            ua.indexOf("iPhone") !== -1 ||
            ua.indexOf("iPod") !== -1
        ) {
            os = "Apple iOS";
            osSimple = "IOS";
        } else if (ua.indexOf("Android") !== -1) {
            os = "Android OS";
            osSimple = "ANDROID";
        } else if (ua.match(/Win(dows )?NT( 4\.0)?/)) {
            os = "Windows NT";
            osSimple = "WIN";
        } else if (ua.match(/Mac|PPC/)) {
            os = "Mac OS";
            osSimple = "MAC";
        } else if (ua.match(/Linux/)) {
            os = "Linux";
            osSimple = "LINUX";
        } else if (ua.match(/(Free|Net|Open)BSD/)) {
            os = RegExp.$1 + "BSD";
        } else if (ua.match(/SunOS/)) {
            os = "Solaris";
            osSimple = "SOLARIS";
        }

        let agent = navigator.userAgent.toLowerCase(),
        name = navigator.appName;
        // MS 계열 브라우저를 구분하기 위함.
        if (
            name === "Micr	osoft Internet Explorer" ||
            agent.indexOf("trident") > -1 ||
            agent.indexOf("edge/") > -1
        ) {
            browser = "ie";
            if (name === "Microsoft Internet Explorer") {
                // IE old version (IE 10 or Lower)
                agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec(agent);
                browser += parseInt(agent[1]);
            } else {
                // IE 11+
                if (agent.indexOf("trident") > -1) {
                    // IE 11
                    browser += 11;
                } else if (agent.indexOf("edge/") > -1) {
                    // Edge
                    browser = "edge";
                }
            }
        } else if (agent.indexOf("safari") > -1) {
            // Chrome or Safari
            if (agent.indexOf("opr") > -1) {
                // Opera
                browser = "opera";
            } else if (agent.indexOf("samsungbrowser") > -1) {
                // Chrome
                browser = "Samsung";
            } else if (agent.indexOf("chrome") > -1) {
                // Chrome
                browser = "chrome";
            } else {
                // Safari
                browser = "safari";
            }
        } else if (agent.indexOf("firefox") > -1) {
            // Firefox
            browser = "firefox";
        }
    }

    let cameraType = -1;
    if (osSimple === "IOS" || osSimple === "ANDROID") {
        cameraType = 0;
    }

    // logger.debug("userAgent :: br :" + browser);
    // logger.debug("userAgent :: os :" + os);
    // logger.debug("userAgent :: osSimple :" + osSimple);
    // logger.debug("userAgent :: cameraType :" + cameraType);

    return {
        osSimple,
        browser,
        cameraType,
    };
}

export function getUrlParams() {
    let params = {};
    window.location.search.replace(
        /[?&]+([^=&]+)=([^&]*)/gi,
        (str, key, value) => {
            params[key] = value;
        }
    );
  
    return params;
}

/**
 * 디바이스가 iOS인 경우, iOS의 버전을 반환
 */
export function getIosVersion() {
    let userAgent = navigator.userAgent;
    let match = userAgent.match(/(iPhone|iPod|iPad).*OS\s([\d_]+)/);
    
    if (!match) return;
    
    let version = match[2].replace(/_/g, ".");
    return version;
}

/**
 * 디바이스가 iOS인지 체크
 */
export function isIosDevice() {
    let userAgent = navigator.userAgent;
    let isIOS = /iPad|iPhone|iPod/.test(userAgent);
    return isIOS;
}
    
/**
 * 디바이스가 Android인지 체크
 */
export function isAndroidDevice() {
    let userAgent = navigator.userAgent;
    let isAndroid = /Android/.test(userAgent);
    return isAndroid;
}

export function convStream2String(buffer, length, b64=false) {
    if(!buffer) {
        return "";
    }
    if(length <= 0) {
        return "";
    }

    let binaryString = [length];
    while (length--) {
        binaryString[length] = String.fromCharCode(
            buffer[length],
        );
    }

    // return binaryString.join("");
    binaryString = binaryString.join("");

    if(b64) {
        binaryString = window.btoa(binaryString);
    }
    
    return binaryString;
}

export function deepCopy(obj, hash = new WeakMap()) {
    if(Object(obj) !== obj) {
        return obj;
    }
    if(hash.has(obj)) {
        return hash.get(obj);
    }
    
    const result = Array.isArray(obj) ? [] : obj.constructor ? new obj.constructor() : Object.create(null);
    hash.set(obj, result);
    return Object.assign(
        result,
        ...Object.keys(obj).map(key => ({ [key]: deepCopy(obj[key], hash) }))
    );
}

export function base64ToBlob(base64, contentType='application/octet-stream', sliceSize=512) {
    let byteCharacters = atob(base64);
    let byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        let slice = byteCharacters.slice(offset, offset + sliceSize);

        let byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        let byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    let blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function checkIfExists(url) {
    return new Promise(async (resolve, reject) => {
        let exists = false;
        try {
            const response = await fetch(url, {
              method: 'HEAD',
              cache: 'no-store'
            });
        
            if(response.ok) {
                exists = true;
            }
        } catch (error) {
        }

        if(exists) {
            resolve();
        } else {
            reject(`error fetching the file. url: ${url}`);
        }
    });
}

export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

export function getDisplaySize() {
    let ratio = window.devicePixelRatio;
    let w = Math.round(window.screen.width * ratio / 10) * 10;
    let h = Math.round(window.screen.height * ratio / 10) * 10;
    return {
        width: w,
        height: h
    }
}