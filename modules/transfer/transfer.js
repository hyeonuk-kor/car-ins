import * as util from '../../scripts/util.js';

var loaded = false;
var logger = {};
logger.debug = function(msg) {};
logger.info = function(msg) {};
logger.warn = function(msg) {};
logger.error = function(msg) {};
logger.result = function(msg) {};

/**
 * load transfer modules
 * @returns Promise chain
 */
export function load(_logger) {
    if(loaded) {
        return Promise.resolve();
    }

    if(_logger) {
        logger = _logger;
    }

    return new Promise(async (resolve, reject) => {
        util.loadScripts(dep_modules)
            .then(() => {
                resolve();
            })
            .catch((msg) => {
                reject(msg);
            });
    });
}

// 아래 모듈들 import 구문 사용 불가
const dep_modules = [
    './modules/transfer/vendor/crypto-js-4.1.1.min.js',
    './modules/transfer/vendor/jquery-3.6.1.min.js',
    './modules/transfer/vendor/jsencrypt-3.3.0.min.js',
];

export class Transfer {
    constructor() {
        this.config = null;
        this.destination = null;
        this.urlSecretKey = null;
        this.urlAltToken = null;
        this.urlOcrCert = null;
        this.urlDataUpload = null;
        this.urlDataConfirm = null;
        this.urlWebRtcRecognize = null;
        this.customerCode = null;
        this.timestamp = null;
        this.userId = null;
        this.appId = null;
        this.deviceId = null;
        this.appType = null;
        this.originCode = null;
        // this.savePath = null;
        this.fdFlag = false;
        this.random = null;

        this.lastStatus = null; // 가장 최근의 OCR 서버 통신 결과 상태
        this.lastError = null; // 가장 최근의 OCR 서버 통신 에러 코드

        this.CONSTANT_CTTT = "application/json";
        this.CONSTANT_METHOD = "POST";
        this.CONSTANT_JSON = "json";
        this.CONSTANT_IMAGE_TYPE = "jpg";
    }

    init(config) {
        this.config = config;
        this.destination = this.config.transfer.destinationURL;
        this.urlSecretKey = this.destination + "/ocr/key";
        this.urlAltToken = this.destination + "/ocr/alttoken";
        this.urlOcrCert = this.destination + "/ocr/cert";
        this.urlDataUpload = this.destination + "/ocr/data/upload";
        this.urlDataConfirm = this.destination + "/ocr/data/confirm";
        this.urlWebRtcRecognize = this.destination + "/ocr/webrtc/recognize";
        this.customerCode = this.config.customer;
        this.appId = this.config.transfer.appId;
        this.deviceId = this.config.transfer.deviceId;
        this.appType = this.config.transfer.appType;
        this.originCode = this.config.transfer.originCode;
        this.fdFlag = this.config.transfer.reqFD;
        this.updateRandom();
        this.updateTimestamp();
        this.generateUserId();
    }

    makeId() {
        let result = "";
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let charactersLength = characters.length;
        for (let i = 0; i < 16; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength),
            );
        }
        logger.debug("generated user ID for transmission: " + result);
        return result;
    }

    getCurrentTimestamp() {
        return new Date().getTime();
    }

    updateTimestamp() {
        this.timestamp = this.getCurrentTimestamp();
    }

    generateUserId() {
        this.userId = `${this.customerCode}_${osSimple}_${this.random}_${this.getCurrentTimestamp()}`;
    }

    getUserId() {
        return this.userId;
    }

    updateRandom() {
        this.random = this.makeId();
    }

    getRandom() {
        return this.random;
    }

    reset() {
        this.updateTimestamp();
        this.updateRandom();
        this.generateUserId();
        this.lastStatus = null;
        this.lastError = null;
    }

    /**
     * get secret key from OCR server
     * 
     * @returns Promise
     * @resolve {responseDto (code, message, data(href, secretKey, rsaPubKey, rsaPrivKey, timeStamp))}
     * @reject {msg, status, error}
     */
    ocrSecretKey() {
        return new Promise((resolve, reject) => {
            this.updateTimestamp();
            let secKeyST = this.getCurrentTimestamp();
    
            let params = {
                "userId": this.userId,
                "timeStamp": this.timestamp
                //timeStamp: 0 // test InvalidInputException
            };
        
            let jsonInfo = JSON.stringify(params);
            const url = this.urlSecretKey;
            const method = this.CONSTANT_METHOD;
            const dataType = this.CONSTANT_JSON;
            const contentType = this.CONSTANT_CTTT;
        
            $.ajax({
                url:      url,
                type:     method,
                datatype: dataType,
                data:     jsonInfo,
                headers: {
                    "Content-type": contentType
                },
                success: function (responseDto) {
                    logger.debug(`successfully obtained the secret key. secret key: " ${responseDto.data.secretKey}`);
                    resolve(responseDto);
                },
                error: function (XMLHttpRequest, status, error) {
                    this.lastStatus = status;
                    this.lastError = error;
                    let msg = `failed to get secret key, status: ${status}`;
                    logger.debug(msg);
                    reject(msg, status, error);
                },
                complete: function() {
                    let secKeyET = new Date().getTime();
                    logger.debug(`profile, secret key done time: ${secKeyET - secKeyST}ms`);
                }
            });
        });
    }
    /**
     * generate signature
     * @param {*} sigstr message of signature (provided from customer)
     * @returns Promise
     * @resolve {signature, pubKey}
     */
    generateSignature(sigstr) {
        return new Promise((resolve, reject) => {
            let genSigST = this.getCurrentTimestamp();
            let CRYPT = new JSEncrypt({ default_key_size: 2048 });
            CRYPT.getKey();

            let privateKey = CRYPT.getPrivateKey();
            let publicKey = CRYPT.getPublicKey();

            let SIGN = new JSEncrypt();
            SIGN.setPrivateKey(privateKey);
            let signature = SIGN.sign(sigstr, CryptoJS.SHA256, "sha256");
            
            let VERIFY = new JSEncrypt();
            VERIFY.setPublicKey(publicKey);
            
            if(VERIFY.verify(sigstr, signature, CryptoJS.SHA256)) {
                let genSigET = this.getCurrentTimestamp();
                logger.debug(`profile, generate signature done time: ${genSigET - genSigST}ms`);
                resolve([signature, publicKey]);
            } else {
                let msg = 'failed to generate signature';
                logger.debug(msg);
                reject(msg);
            }
        });
    }
    
    /**
     * get alt token from OCR server
     * @param {*} pubKey 
     * @param {*} signature 
     * @param {*} random 
     * @returns Promise
     * @resolve {responseDto (code, message, data(href, altToken, timestamp))}
     * @reject {msg, status, error}
     */
    ocrAltToken(pubKey, signature, random) {
        return new Promise((resolve, reject) => {
            let altTokenST = this.getCurrentTimestamp();
            if(!pubKey) {
                reject('failed to get alttoken, public key is empty');
                return;
            }
            if(!signature) {
                reject('failed to get alttoken, signature is empty');
                return;
            }
            if(!random) {
                reject('failed to get alttoken, random is empty');
                return;
            }

            pubKey = pubKey.replace("-----BEGIN PUBLIC KEY-----\n", "");
            pubKey = pubKey.replace("\n-----END PUBLIC KEY-----", "");
            
            let params = {
                "appId": this.appId,
                "userId": this.userId,
                "deviceId": this.deviceId,
                "timeStamp": this.timestamp,
                "random": random,
                "content": pubKey,
                "signature": signature,
            };
            
            let jsonInfo = JSON.stringify(params);
            
            $.ajax({
                url:      this.urlAltToken,
                type:     this.CONSTANT_METHOD,
                datatype: this.CONSTANT_JSON,
                data:     jsonInfo,
                headers: {
                    "Content-type":   this.CONSTANT_CTTT,
                    "Authorization":  signature
                },
                success: function (responseDto) {
                    logger.debug(`successfully obtained the alt token. alt token: ${responseDto.data.altToken}`);
                    resolve(responseDto);
                },
                error: function (XMLHttpRequest, status, error) {
                    let msg = `failed to get alt token, status: ${status}`;
                    logger.debug(msg);
                    reject(msg, status, error);
                },
                complete: function() {
                    let altTokenET = new Date().getTime();
                    logger.debug(`profile, alt token done time: ${altTokenET - altTokenST}ms`);
                }
            });
        });
    }

    /**
     * get certificate from OCR server
     * @param {*} altToken 
     * @returns Promise
     * @resolve {responseDto (code, message, data(href, cert, timestamp))}
     * @reject {msg, status, error}
     */
    ocrCert(altToken) {
        return new Promise((resolve, reject) => {
            let certST = this.getCurrentTimestamp();
            if(!altToken) {
                reject('failed to get certificate, altToken is empty');
                return;
            }

            let params = {
                "appId": this.appId,
                "userId": this.userId,
                "deviceId": this.deviceId,
            };
            
            let jsonInfo = JSON.stringify(params);
            
            $.ajax({
                url:      this.urlOcrCert,
                type:     this.CONSTANT_METHOD,
                datatype: this.CONSTANT_JSON,
                data:     jsonInfo,
                headers: {
                    "Content-type":   this.CONSTANT_CTTT,
                    "Authorization":  altToken
                },
                success: function (responseDto) {
                    logger.debug(`successfully obtained the certificate. certificate: ${responseDto.data.content}`);
                    resolve(responseDto);
                },
                error: function (XMLHttpRequest, status, error) {
                    let msg = `failed to get certificate, status: ${status}`;
                    reject(msg, status, error);
                },
                complete: function() {
                    let certET = new Date().getTime();
                    logger.debug(`profile, cert done time: ${certET - certST}ms`);
                }
            });
        });
    }

    s4() {
        return (((1 + Math.random()) * 0x10000) | 0)
            .toString(16)
            .substring(1);
    }

    getIv(radix=16) {
        return (this.s4() + this.s4() + this.s4() + this.s4()).toString(radix);
    }

    getAesKey(keyLength=256, radix=16) {
        if(keyLength != 128 && keyLength != 192 && keyLength != 256) {
            logger.error("failed to generate AES key, invalid key length (key_length is only allowed to be 128, 192, or 256 bits)");
            return null;
        }

        let loop = keyLength / 32;
        let key = "";
        for(var i=0; i<loop; i++) {
            key += this.s4();
        }
        return key.toString(radix);
    }

    /**
     * encrypt data of ocr result
     * @param {*} resultData (cropIdImageData, maskedCropIdImageData, fullFrameIdImageData, photoIdImageData, infoJsonData)
     * @param {*} cert 
     * @param {*} aesIv 
     * @param {*} aesKey 
     * @returns Promise
     * @resolve {iv, key, cropIdImage, maskedCropIdImage, fullFrameIdImage, photoIdImage, infoJson}
     * @reject {msg, status, error}
     */
    encryptData(resultData, cert, aesIv=null, aesKey=null, aesKeyLen=256) {
        return new Promise((resolve, reject) => {
            let encST = this.getCurrentTimestamp();
            if(!resultData) {
                let msg = "failed to encrypt data, resultData is empty";
                logger.debug(msg);
                reject(msg, "", null);
                return;
            }
            if(!cert) {
                let msg = "failed to encrypt data, cert is empty";
                logger.debug(msg);
                reject(msg, "", null);
                return;
            }
            if(!aesIv) {
                aesIv = this.getIv();
            }
            if(!aesKey) {
                aesKey = this.getAesKey(aesKeyLen);
                if(!aesKey) {
                    let msg = "failed to encrypt data, failed to generate AES key";
                    logger.debug(msg);
                    reject(msg, "", null);
                    return;
                }
            }

            let RSAEncrypt = new JSEncrypt();
            RSAEncrypt.setKey(cert);
            let encIv = RSAEncrypt.encrypt(aesIv);
            let encKey = RSAEncrypt.encrypt(aesKey);

            let encResultPackage = {};
            Object.entries(resultData).forEach(([key, value]) => {
                let encVal = this.aes256Encode(aesKey, aesIv, value);
                encResultPackage[key] = encVal;
                
                // release memory
                resultData[key] = null;
            });
    
            logger.debug('successfully encrypted data');
            Object.assign(encResultPackage, {
                "iv": encIv,
                "key": encKey
            });

            let encET = this.getCurrentTimestamp();
            logger.debug(`profile, encrypt data done time: ${encET - encST}ms`);

            resolve(encResultPackage);
        });
    }

    /**
     * upload encrypted data to OCR server
     * @param {*} data (iv, key, encCropIdImage, encMaskedCropIdImage, encFullFrameIdImage, encPhotoIdImage, encInfoJson)
     * @param {*} scannerType 
     * @param {*} altToken 
     * @param {*} autoMode 
     * @param {*} beforeSendCallback 
     * @param {*} completeCallback 
     * @returns Promise
     * @resolve {responseDto(code, message, data(href, userId, infoJson, cropIdImage, maskedCropIdImage,
     *           fullFrameIdImage, photoIdImage, fdResult, fdConfidence, cryptoIdx))}
     * @reject {msg, status, error}
     */
    ocrDataUpload(data, scannerType, altToken, autoMode, beforeSendCallback=null, completeCallback=null) {
        return new Promise((resolve, reject) => {
            let uploadST = this.getCurrentTimestamp();
            if(!data) {
                reject('failed to upload data, data is empty');
                return;
            }
            const props = ["iv", "key", "cropIdImage", "maskedCropIdImage", "fullFrameIdImage", "photoIdImage", "infoJson"];
            if(!props.every(prop => prop in data)) {
                reject('failed to upload data, invalid properties of data');
                return;
            }
            if(!scannerType) {
                reject('failed to upload data, scanner type is empty');
                return;
            }
            if(!altToken) {
                reject('failed to upload data, altToken is empty');
                return;
            }
            
            let blobIv = new Blob([data["iv"]], { type: 'text/plain' });
            let blobKey = new Blob([data["key"]], { type: 'text/plain' });
            let blobCropIdImage = new Blob([data["cropIdImage"]], { type: 'image/jpg' });
            let blobMaskedCropIdImage = new Blob([data["maskedCropIdImage"]], { type: 'image/jpg' });
            let blobFullFrameIdImage = new Blob([data["fullFrameIdImage"]], { type: 'image/jpg' });
            let blobPhotoIdImage = new Blob([data["photoIdImage"]], { type: 'image/jpg' });
            let blobInfo = new Blob([data["infoJson"]], { type: 'text/plain' });
            
            let formData = new FormData();
            formData.append('data', blobIv, 'data.iv');  //iv
            formData.append('data', blobKey, 'data.key');  //key
            formData.append('data', blobCropIdImage, 'cropIdImage.jpg');  //data cropIdImage
            formData.append('data', blobMaskedCropIdImage, 'maskedCropIdImage.jpg');  //data maskedCropIdImage
            formData.append('data', blobFullFrameIdImage, 'fullFrameIdImage.jpg');  //data fullFrameIdImage
            formData.append('data', blobPhotoIdImage, 'photoIdImage.jpg');  //data photoIdImage
            formData.append('data', blobInfo, 'info.json');  //info 
            
            let isWebManFlag = autoMode ? false : true;
            
            $.ajax({
                url:          this.urlDataUpload,
                enctype:      'multipart/form-data',
                type:         this.CONSTANT_METHOD,
                datatype:     this.CONSTANT_JSON,
                data:         formData,
                processData:  false,
                contentType:  false,
                cache:        false,
                headers: {
                    "Authorization":    altToken,
                    "userId":           this.userId,
                    "deviceId":         this.deviceId,
                    "idType":           scannerType,
                    "appType":          this.appType,
                    "originCode":       this.originCode,
                    "savePath":         '', //this.savePath,
                    "dataKey":          `${this.userId}_${this.timestamp}`,
                    "timestamp":        this.timestamp,
                    "fdFlag":           this.fdFlag,
                    "encFlag":          false,
                    "webManFlag":       isWebManFlag
                },
                success: function (responseDto) {
                    logger.debug(`successfully uploaded data. response: ${responseDto.code}`);
                    resolve(responseDto);
                },
                error: function (XMLHttpRequest, status, error) {
                    let msg = `failed to upload data, status: ${status}`;
                    logger.debug(msg);
                    reject(msg, status, error);
                },
                beforeSend: beforeSendCallback,
                complete: function() {
                    let uploadET = new Date().getTime();
                    logger.debug(`profile, upload done time: ${uploadET - uploadST}ms`);
                    completeCallback instanceof Function && completeCallback();
                }
            });
        });
    }
    
    /**
     * confirm data of ocr result
     * @param {*} editedInfoJson 
     * @param {*} aesIv 
     * @param {*} aesKey 
     * @param {*} scannerType 
     * @param {*} altToken 
     * @param {*} cert 
     * @returns Promise
     * @resolve {responseDto(code, message, data(href, userId))}
     * @reject {msg, status, error}
     */
    ocrDataConfirm(editedInfoJson, aesIv, aesKey, scannerType, altToken, cert) {
        return new Promise((resolve, reject) => {
            let confirmST = this.getCurrentTimestamp();
            if(!editedInfoJson) {
                reject('failed to confirm data, editedInfoJson is empty');
                return;
            }
            if(!aesIv) {
                reject('failed to confirm data, aesIv is empty');
                return;
            }
            if(!aesKey) {
                reject('failed to confirm data, aesKey is empty');
                return;
            }
            if(!altToken) {
                reject('failed to confirm data, altToken is empty');
                return;
            }
            if(!cert) {
                reject('failed to confirm data, cert is empty');
                return;
            }

            // let aesIv = getIv(); //"0123456789abcdef";
            // let aesKey = getAesKey(); //"0123456789abcdef0123456789abcdef"; //
            
            let RSAEncrypt = new JSEncrypt(); 
            RSAEncrypt.setKey(cert);
            
            let encryptedIv = RSAEncrypt.encrypt(aesIv);
            let encryptedKey = RSAEncrypt.encrypt(aesKey);
            // let editInfoJsonData = infoJsonData;  // 인식결과 웹 화면에서 수정 완료 Data를 server로 전송(/ocr/data/confirm) : 개발 단계에서는 인식결과와 동일한 데이터 전송
            let encInfoJson = this.aes256Encode(aesKey, aesIv, editedInfoJson);
            
            // console.log("encryptedIv : " + encryptedIv);
            // console.log("encryptedKey : " + encryptedKey);
            // console.log("encInfoJson : " + encInfoJson);
            
            let params = {
                encX:       encryptedIv,
                encY:       encryptedKey,
                content:    encInfoJson,
                timeStamp:  this.timestamp,
                confirm:    '',
            };
            
            let jsonInfo = JSON.stringify(params);
            
            $.ajax({
                url:          this.urlDataConfirm,
                type:         this.CONSTANT_METHOD,
                datatype:     this.CONSTANT_JSON,
                data:         jsonInfo, 
                headers: {
                    "Content-type":     this.CONSTANT_CTTT,
                    "Authorization":    altToken,
                    "userId":           this.userId,
                    "deviceId":         this.deviceId,
                    "idType":           scannerType,
                    "appType":          this.appType,
                    "originCode":       this.originCode,
                    "savePath":         '', //this.savePath,
                    "dataKey":          `${this.userId}_${this.timestamp}`,
                    "timestamp":        this.timestamp
                },
                success: function (responseDto) {
                    logger.debug(`successfully confirmed data. response: ${responseDto.code}`);
                    resolve(responseDto);
                },
                error: function (XMLHttpRequest, status, error) {
                    logger.debug(`failed to confirm data, status: ${status}`);
                    reject(msg, status, error);
                },
                complete: function() {
                    let confirmET = new Date().getTime();
                    logger.debug(`profile, confirm done time: ${confirmET - confirmST}ms`);
                }
            });
        });
    }
    
    /**
     * OCR recognize of given image
     * @param {*} image 
     * @param {*} aesIv 
     * @param {*} aesKey 
     * @param {*} scannerType 
     * @param {*} altToken 
     * @param {*} cert 
     * @param {*} beforeSendCallback 
     * @param {*} completeCallback 
     * @returns Promise
     * @resolve {responseDto(code, message, data(userId, idData, logData, cropIdImageData, maskedCropIdImageData, fullFrameIdImageData, photoIdImageData, totalTime))}
     * @reject {msg, status, error}
     */
    ocrWebrtcRecognize(data, scannerType, altToken, beforeSendCallback=null, completeCallback=null) {
        return new Promise((resolve, reject) => {
            let recognizeST = this.getCurrentTimestamp();
            if(!data) {
                reject('failed to ocr recognize, data is empty');
                return;
            }
            const props = ["iv", "key", "content"];
            if(!props.every(prop => prop in data)) {
                reject('failed to ocr recognize, invalid properties of data');
                return;
            }
            if(!altToken) {
                reject('failed to ocr recognize, altToken is empty');
                return;
            }
            
            let params = {
                appId:      this.appId,
                encX:       data["iv"],
                encY:       data["key"],
                content:    data["content"],
                timeStamp:  this.timestamp,
            };

            // clear encrypted data
            data["iv"] = null;
            data["key"] = null;
            
            let jsonInfo = JSON.stringify(params);
            params = null;
            
            $.ajax({
                url:      this.urlWebRtcRecognize,
                type:     this.CONSTANT_METHOD,
                datatype: this.CONSTANT_JSON,
                data:     jsonInfo,
                headers: {
                "Content-type":   this.CONSTANT_CTTT,
                "Authorization":  altToken,
                "userId":         this.userId,
                "deviceId":       this.deviceId,
                "idType":         scannerType,
                "appType":        this.appType,
                "originCode":     this.originCode,
                "savePath":       '', //this.savePath,
                "dataKey":        `${this.userId}_${this.timestamp}`,
                "timestamp":      this.timestamp,
                "imgType":        this.CONSTANT_IMAGE_TYPE
                },
            
                success: function (responseDto) {
                    logger.debug(`successfully recognized data. response: ${responseDto.code}`);
                    resolve(responseDto);
                },
                error: function (XMLHttpRequest, status, error) {
                    let msg = `failed to recognize data, status: ${status}`;
                    logger.debug(msg);
                    reject(msg, status, error);
                },
                beforeSend: beforeSendCallback,
                complete: function() {
                    let recognizeET = new Date().getTime();
                    logger.debug(`profile, recognition done time: ${recognizeET - recognizeST}ms`);
                    completeCallback instanceof Function && completeCallback();
                },
            });
        });
    }

    aes256Encode(secretKey, Iv, data) {
        let cipher = CryptoJS.AES.encrypt(
            data,
            CryptoJS.enc.Utf8.parse(secretKey),
            {
                iv: CryptoJS.enc.Utf8.parse(Iv),
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC,
            },
        );
        let aes256EncodeData = cipher.toString();
        return aes256EncodeData;
    }
    
    aes256Decode(secretKey, Iv, data) {
        let cipher = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(secretKey), {
            iv: CryptoJS.enc.Utf8.parse(Iv),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        let aes256DecodeData = cipher.toString(CryptoJS.enc.Utf8);
        return aes256DecodeData;
    }
};
