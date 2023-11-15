import { WebCamera } from './webcamera.js';
import { ScannerStatus, ScannerType, CaptureEdgeType, ScanCardType, RetryType, ScanMode, EngineResultCode } from './scanner_constants.js'; 
import * as view from '../view.js';
import * as util from '../../scripts/util.js';

window.Module = typeof Module != "undefined" ? Module : {}; // this variable must be in global scope

class NormGuideRect {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0.;
        this.y = 0.;
        this.w = 0.;
        this.h = 0.;
    }

    clamp(num, min=0.0, max=1.0) {
        return Math.min(Math.max(num, min), max);
    }

    update(x, y, w, h) {
        this.x = this.clamp(x);
        this.y = this.clamp(y);
        this.w = this.clamp(w);
        this.h = this.clamp(h);
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h
        };
    }
};

class ResultData {
    constructor() {
        this.scanResult = null; // ScanInfo
        this.fuzzed = false;
        this.detectRetry = 0;
        this.recogRetry = 0;
        this.faceRetry = 0;
        this.colorRetry = 0;
        this.specRetry = 0;
        this.timeoutRetry = 0;
        this.errorRetry = 0;
        this.lastRetryType = RetryType.SUCCESS;
        this.fullMaskRoi = "[]";
    }

    reset() {
        this.scanResult = null;
        this.fuzzed = false;
        this.detectRetry = 0;
        this.recogRetry = 0;
        this.faceRetry = 0;
        this.colorRetry = 0;
        this.specRetry = 0;
        this.timeoutRetry = 0;
        this.errorRetry = 0;
        this.lastRetryType = RetryType.SUCCESS;
        this.fullMaskRoi = "[]";
    }
};

export class Scanner {
    constructor() {
        this.normGuideRect = new NormGuideRect();

        this.callbacks = {
            initSuccess: null,  // () => {}
            initFailure: null,  // (msg) => {}
            updateView: null,   // (viewWidth, viewHeight, guideRect) => {}
            detect: null,       // (status) => {}
            result: null        // (status, resultData) => {}
        };
        this.config = {};
        
        this.availableAutoMode = false;
        this.webrtc = null;
        this.video = document.getElementById("scanView"); // video element 객체 참조
        this.logger = {};
        this.logger.debug = function(msg) {};
        this.logger.info = function(msg) {};
        this.logger.warn = function(msg) {};
        this.logger.error = function(msg) {};
        this.logger.result = function(msg) {};

        this.simdSupported = false;
        this.autoMode = true;
        
        this.rootElem = document.querySelector(":root");
        this.scanContainer = document.getElementById("scanContainer");
        this.scanBoxMask = document.getElementById("scanBoxMask");      

        this.resultData = new ResultData();

        this.colorThreshold = 0;
        this.faceThreshold = 0;
        this.specThreshold = 0;

        /**
         * 웹페이지 사이즈 변경할 때 발생하는 이벤트
         */
        window.addEventListener("resize", () => {
            this.logger.debug('view size changed');
            this.updateViewSize();
            this.callbacks.updateView instanceof Function && this.callbacks.updateView(this.vw, this.vh, this.normGuideRect.get());
        });

        /**
         * 해당 웹페이지 벗어날 때 발생하는 이벤트
         */
        window.addEventListener("beforeunload", () => {
            // must set this code on beforeunload
            this.release();
        });
    }

    reset() {
        this.normGuideRect.reset();
        this.resultData.reset();
    }

    getNormGuideRect() {
        return this.normGuideRect.get();
    }

    updateViewSize() {
        this.logger.debug('update view size');
        this.vw = Math.floor(this.rootElem.getBoundingClientRect().width);
        this.vh = Math.floor(this.rootElem.getBoundingClientRect().height);

        view.resizeScanBoxGuide(this.vw, this.scanBoxOrientation);

        this.updateGuideRectRatio();

        this.webrtc.setFrame_config(
            0,
            this.normGuideRect.x,
            this.normGuideRect.y,
            this.normGuideRect.w,
            this.normGuideRect.h,
            1.0,
            false,
            this.config.scanner.veriCnt,
            this.config.scanner.distLimit,
            this.config.scanner.minimalScan
        );
    }

    isSimdSupported() {
        return this.simdSupported;
    }

    getColorThreshold() {
        return this.colorThreshold;
    }

    getFaceThreshold() {
        return this.faceThreshold;
    }

    getSpecularThreshold() {
        return this.specThreshold;
    }
    
    initScanner(
        config,
        logger,
        initSuccessCallback,
        initFailCallback,
        updateViewCallback,
        detectCallback,
        resultCallback
    ) {
        return new Promise( (resolve, reject) => {
            if(logger) {
                this.logger = logger;
            }
    
            this.logger.debug('scanner initScanner called');
    
            // register callbacks
            this.callbacks.initSuccess = initSuccessCallback;   // () => {}
            this.callbacks.initFailure = initFailCallback;      // (msg) => {}
            this.callbacks.updateView = updateViewCallback;     // (viewWidth, viewHeight, guideRect) => {}
            this.callbacks.detect = detectCallback;             // (status) => {}
            this.callbacks.result = resultCallback;             // (status, result) => {}
    
            // register config values
            this.config = config;

            if(!this.config) {
                this.callbacks.initFailure instanceof Function && this.callbacks.initFailure("empty config");
                reject("empty config");
                return;
            }

            let { scanner = "idcard", capture_edge: captureEdge = "card" } = util.getUrlParams();
            this.scannerType = this.getScannerType(scanner);
            this.captureEdgeType = this.getCaptureEgdeType(captureEdge);
            let sbc = this.getScanBoxConfig(this.scannerType, this.captureEdgeType, this.config.view.guideRectX, this.config.view.guideRectY); // 스캔 가이드 박스 설정값
            this.scanBoxSizeRatio = sbc.sizeRatio;
            this.scanBoxXposNorm = sbc.xposNorm;
            this.scanBoxYposNorm = sbc.yposNorm;
            this.scanBoxOrientation = sbc.orientation;

            this.colorThreshold = this.config.scanner.colorThreshold * this.config.scanner.colorScale;
            this.faceThreshold = this.config.scanner.faceThreshold;
            this.specThreshold = this.config.scanner.specularThreshold;
    
            /**
             * js파일의 위치를 변경하기 위해서 locateFile 수정
             */
            /** change Module.locateFile for custom url */
            Module.locateFile = function (path) {
                var scriptDirectory = "";
    
                if (typeof document != "undefined" && document.currentScript) {
                    scriptDirectory = document.currentScript.src;
                }
                if (scriptDirectory.indexOf("blob:") !== 0) {
                    scriptDirectory = scriptDirectory.substr(
                        0,
                        scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1,
                    );
                } else {
                    scriptDirectory = "";
                }
                const newPath = scriptDirectory + path + "?v=" + (robiversion || new Date().getTime());
                return newPath; // card scanner data/wasm cache 사용 제거 방식(20230602)
            };
            
            view.renderInitUI(
                this.scannerType, this.captureEdgeType,
                this.scanBoxSizeRatio, this.scanBoxXposNorm,
                this.scanBoxYposNorm, this.autoMode
            );
    
            // wasm 로드
            import('./checkvalidation.js')
                .then(() => {
                    wasmFeatureDetect.simd().then((simdSupported) => {
                        this.simdSupported = simdSupported;
                        this.logger.info("SIMD : " + simdSupported);
                        this.logger.info("osSimple : " + osSimple);
                        this.logger.info("browser : " + browser);
                
                        let wasmName = this.getWasmName(this.scannerType);
                        let wasmList = [];
                        const simdSuffix = simdSupported ? '_simd' : '';
                        let wasmJsPath = `./modules/scanner/${wasmName}${simdSuffix}.js?v=${this.config.version}`;
                        wasmList.push(wasmJsPath);

                        return util.loadScripts(wasmList);
                        // return Promise.reject("skip load wasm");
                    })
                    .then(() => {
                        this.availableAutoMode = true;
                    })
                    .catch((msg) => {
                        this.logger.debug(msg);
                    })
                    .finally(() => {
                        // webcamera 객체 생성, 두번째 인자는 timelimit을 통한 수동 모드 권장 값 설정용 파라미터(ms 단위 사용) - 0 : 사용안함
                        this.webrtc = new WebCamera(this.logger, this.config.scanner.autoTimeover, this.config.scanner.fuzz, this.availableAutoMode);

                        // iOS 13.3 버전, 카메라 수동 전환 및 토글 비활성화
                        let iosVersion = util.getIosVersion();
                        let versionNumber = iosVersion && parseFloat(iosVersion);
                        if (versionNumber === 13.3) {
                            this.availableAutoMode = false;
                            this.webrtc.setScanMode(ScanMode.MANUAL);
                        }
                        
                        this.callbacks.initSuccess instanceof Function && this.callbacks.initSuccess();
                        resolve();
                    });
                });
        });
    }
    
    /**
     * 웹카메라로 스케너를 실행
     */
    startScanner(isRestart = false) {
        return new Promise( (resolve, reject) => {
            if (!this.webrtc) {
                reject("webrtc is null");
                return;
            }
    
            if (isRestart) {
                this.logger.debug("reset scanner");
                this.webrtc.reset();
            }

            // reset result data
            this.reset();
        
            try {
                // cameraType: 모바일 카메라의 전면(CameraType.FACING_FRONT)/후면(CameraType.FACING_BACK), PC 테스트시에는 FACING_UNKNOWN으로 적용
                this.webrtc.open(
                    cameraType,
                    this.video,
                    this.scannerType,
                    this.resultCallback.bind(this),
                    this.detectCallback.bind(this),
                    this.config.licenseKey,
                    this.captureEdgeType, // captureEdgeType => CARD_TYPE: 0, PASSPORT: 1, A4: 2
                    this.config.scanner.detectTimeout, // timeOut value(seconds), if you don't need timeout then set 0 or negative. default = 0.
                    this.config.scanner.recogTimeout, // timeOut for recog(seconds), if you don't need timeout then set 0 or negative. default = 0.
                    this.config.scanner.loadTimeout // timeout for model initialization(seconds), if you don't need timeout then set 0 or negative. default = 0.
                );

                this.updateViewSize();
                resolve(this.availableAutoMode);
            } catch (err) {
                let msg = 'failed to open camera';
                this.logger.error(msg);
                reject(msg);
            }
        });
    }

    /**
     * 재촬영 로직 메소드
     */
    redetect() {
        return new Promise((resolve, reject) => {
            let iosVersion = util.getIosVersion();

            if (iosVersion) {
                let versionNumber = parseFloat(iosVersion);
                // ! ios 중에 16.3.x 버전은 카메라 버그가 있어서 화면을 다시 리로드 처리
                if (versionNumber === 16.3) {
                    location.reload();
                    resolve();
                    return;
                }
            }
        
            view.renderDetectUI(ScannerStatus.SCANNER_INIT, this.scannerType);
            
            this.startScanner(true)
                .then(() => {
                    resolve();
                })
                .catch((msg) => {
                    reject(msg);
                });
        });
    }
    
    release() {
        this.webrtc.closeCamera();
        this.webrtc.releaseScanner();

        // this.resultCallback(ScannerStatus.STOP_CAMERA, null);
    }
    
    captureImage(quality) {
        return this.webrtc.captureImage(quality);
    }

    setAutoMode(autoMode) {
        if(autoMode && !this.availableAutoMode) {
            this.logger.debug('auto mode is not available');
            return;
        }
        this.autoMode = autoMode;

        if (this.autoMode) {
            this.logger.debug('scan mode: auto');
            this.webrtc.setScanMode(ScanMode.AUTO);
            this.webrtc.resetTimeOutTimer(); // 자동촬영에서 수동촬영으로 넘어갈 경우 timer reset.
        } else {
            this.logger.debug('scan mode: manual');
            this.webrtc.setScanMode(ScanMode.MANUAL);
        }
    }
    
    toggleAutoMode() {
        this.setAutoMode(!this.autoMode);
    
        return this.isAutoMode();
    }

    isAutoMode() {
        return this.autoMode;
    }

    updateGuideRectRatio() {
        if(this.video.videoWidth == 0 || this.video.videoHeight == 0) {
            this.logger.debug('update guiderect, skip update, video size is 0');
            return;
        }

        let viewWidth = this.scanContainer.getBoundingClientRect().width;
        let viewHeight = this.scanContainer.getBoundingClientRect().height;
    
        let gw = this.scanBoxMask.getBoundingClientRect().width;
        let gh = this.scanBoxMask.getBoundingClientRect().height;
    
        let grr = gw / gh;
        let g_left = this.scanBoxMask.getBoundingClientRect().left;
        let g_top = this.scanBoxMask.getBoundingClientRect().top;
        let g_left_ratio = g_left / viewWidth;
        let g_top_ratio = g_top / viewHeight;
        let g_left_center_ratio = 0.5 - g_left_ratio;
        let g_top_center_ratio = 0.5 - g_top_ratio;
        let gw_ratio = gw / viewWidth;
        let gh_ratio = gh / viewHeight;
    
        let frame_gx =
            this.video.videoWidth / 2 -
            (Math.abs(g_left - viewWidth / 2) / viewWidth) * this.video.videoWidth;
        let frame_gy =
            this.video.videoHeight / 2 -
            (Math.abs(g_top - viewHeight / 2) / viewHeight) * this.video.videoHeight;
        let frame_gw = 0;
        let frame_gh = 0;
    
        let viewRatio = viewWidth / viewHeight;
        let videoRatio = this.video.videoWidth / this.video.videoHeight;
        let frame_gcw = 0;
        let frame_gch = 0;
        if (viewRatio > videoRatio) {
            // fit width
            let fh = (this.video.videoWidth * viewHeight) / viewWidth;
            frame_gcw = g_left_center_ratio * this.video.videoWidth;
            frame_gch = g_top_center_ratio * fh;
            frame_gx = this.video.videoWidth / 2 - frame_gcw;
            frame_gy = this.video.videoHeight / 2 - frame_gch;
            frame_gw = gw_ratio * this.video.videoWidth;
            frame_gh = frame_gw / grr;
        } else {
            // fit height
            let fw = (this.video.videoHeight * viewWidth) / viewHeight;
            frame_gcw = g_left_center_ratio * fw;
            frame_gch = g_top_center_ratio * this.video.videoHeight;
            frame_gx = this.video.videoWidth / 2 - frame_gcw;
            frame_gy = this.video.videoHeight / 2 - frame_gch;
            frame_gh = gh_ratio * this.video.videoHeight;
            frame_gw = frame_gh * grr;
        }
    
        let gx_norm = (frame_gx + frame_gw / 2) / this.video.videoWidth;
        let gy_norm = (frame_gy + frame_gh / 2) / this.video.videoHeight;
        let gw_norm = frame_gw / this.video.videoWidth;
        let gh_norm = frame_gh / this.video.videoHeight;
    
        this.normGuideRect.update(gx_norm, gy_norm, gw_norm, gh_norm);
        this.logger.debug('update guiderect, gx_norm: '+gx_norm+", gy_norm: "+gy_norm+", gw_norm: "+gw_norm+", gh_norm: "+gh_norm);
    }
    
    /**
     * 카드 박스 검출 callback
     */
    detectCallback(detection) {
        const logTag = "detection";
        const detected = detection === 0;
        
        if (detected) {
            // 카드 박스 검출 있음
            this.resultData.detectRetry++;
            this.resultData.lastRetryType = RetryType.DETECT;
            view.renderDetectUI(ScannerStatus.SCAN_DETECT, this.scannerType);
        } else {
            view.renderDetectUI(ScannerStatus.SCANNER_READY, this.scannerType);
        }
        this.logger.debug(`[${logTag}] card detected: ${detected}, detectRetry: ${this.resultData.detectRetry}`);

        this.callbacks.detect instanceof Function && this.callbacks.detect(detected);
    }
    
    /**
     * 카드 인식 과정 및 결과를 전달하는 callback
     */
    resultCallback(status, scanResult) {
        const logTag = "result";
        this.logger.debug(`[${logTag}] status : ${status}`);
        
        if(!!scanResult) {
            if(scanResult.colorScore && typeof(scanResult.colorScore) === 'number') {
                scanResult.colorScore = scanResult.colorScore * this.config.scanner.colorScale;
            }
        }
        this.resultData.scanResult = util.deepCopy(scanResult);
        
        if(status === ScannerStatus.SCANNER_INIT_FAIL) {
            this.logger.debug(`[${logTag}] scanner init fail, reason: ${scanResult}`);
            let engineCode = util.getKeyByValue(EngineResultCode, scanResult);
            this.release();
            this.callbacks.initFailure instanceof Function && this.callbacks.initFailure(`reason: ${engineCode}`);
            return;
        } else if (status === ScannerStatus.GET_DEVICE) {
            this.logger.debug(`[${logTag}] get device`);
            // 시스템에서 device 정보를 얻어오기 진행
        } else if (status === ScannerStatus.CAMERA_OPENING) {
            this.logger.debug(`[${logTag}] camera opening`);
            // 카메라 오픈 진행
        } else if (status === ScannerStatus.CAMERA_OPENNED) {
            this.logger.debug(`[${logTag}] camera openned`);
            // 카메라 오픈 완료
            let width = scanResult.cameraWidth;
            let height = scanResult.cameraHeight;
    
            this.logger.debug(`[${logTag}] window orientation : ${window.orientation}`);
    
            if (window.orientation === 0 || window.orientation === 180) {
                let temp = width;
                width = height;
                height = temp;
            }
    
            this.video.width = this.vw;
            this.video.height = (this.vw * height) / width;
    
            this.logger.debug(
                `[${logTag}] resolution info :\n
                - camera : ${width} x ${height}\n
                - view : ${this.vw} x ${this.vh}\n
                - video : ${this.video.width} x ${this.video.height}\n`);
        } else if (status === ScannerStatus.SCANNER_INIT) {
            this.logger.debug(`[${logTag}] scanner init`);
            // 스캐너 초기화 진행
            view.renderDetectUI(ScannerStatus.SCANNER_INIT, this.scannerType);
        } else if (status === ScannerStatus.SCANNER_READY) {
            // 스캐너 로딩 완료
            this.logger.debug(`[${logTag}] scanner ready`);
    
            view.renderDetectUI(ScannerStatus.SCANNER_READY, this.scannerType);
    
            this.updateGuideRectRatio();
    
            // setFrame_config(orientation, x, y, gw, gh, scale, flip, verification_cnt = -1)
            // verification_cnt는 option임 (0: 검증 스킵, 1이상: 검증 횟수)
            /*
            * setFrame_config는 renderDetectUI 함수와 updateGuideRectRatio 함수가 순차적으로 불린 이후에 호출되어야 함
            */
            this.webrtc.setFrame_config(
                0,
                this.normGuideRect.x,
                this.normGuideRect.y,
                this.normGuideRect.w,
                this.normGuideRect.h,
                1.0,
                false,
                this.config.scanner.veriCnt,
                this.config.scanner.distLimit,
                this.config.scanner.minimalScan
            );
        } else if (status === ScannerStatus.SCAN_DETECT) {
            // detectCallback 메소드에서 대신 동작함
            
        } else if (status === ScannerStatus.SCAN_COMPLETE) {
            // 스캔이 완료됨
            this.logger.debug(`[${logTag}] scan complete`);
    
            view.renderDetectUI(ScannerStatus.SCAN_COMPLETE, this.scannerType);
    
            let warnStatus = 0;
    
            if (scanResult !== null) {
                this.resultData.recogRetry++;
                this.resultData.lastRetryType = RetryType.RECOG;
                this.logger.debug(`[${logTag}] scan complete, recogRetry : ${this.resultData.recogRetry}`);
    
                /* Threshold check & Retry Scan */
                let skipRetry = true;
                let retriableType = (scanResult.cardType === ScanCardType.IDCARD || scanResult.cardType === ScanCardType.DRIVERLICENSE ||
                    scanResult.cardType === ScanCardType.PASSPORT || scanResult.cardType === ScanCardType.RESIDENCE);
                if(this.config.scanner.doRetry && retriableType) {
                    if (scanResult.faceScore < this.getFaceThreshold()) {
                        warnStatus = 1;
                        this.resultData.faceRetry++;
                        this.resultData.lastRetryType = RetryType.FACE;
                        skipRetry = false;
                        this.logger.debug(`[${logTag}] scan complete, check retry condition, faceRetry : ${this.resultData.faceRetry}`);
                    } else if (scanResult.colorScore < this.getColorThreshold()) {
                        warnStatus = 2;
                        this.resultData.colorRetry++;
                        this.resultData.lastRetryType = RetryType.COLOR;
                        skipRetry = false;
                        this.logger.debug(`[${logTag}] scan complete, check retry condition, colorRetry : ${this.resultData.colorRetry}`);
                    } else if (scanResult.specularRatio > this.getSpecularThreshold()) {
                        warnStatus = 3;
                        this.resultData.specRetry++;
                        this.resultData.lastRetryType = RetryType.SPECULAR;
                        skipRetry = false;
                        this.logger.debug(`[${logTag}] scan complete, check retry condition, specRetry : ${this.resultData.specRetry}`);
                    }
                }
                
                if(skipRetry) {
                    this.logger.debug(`[${logTag}] scan complete, card type: ${scanResult.cardType}`);

                    let maskRoi = this.webrtc.getFullImageMaskedRoiList() || "";
                    this.resultData.fullMaskRoi = `[${maskRoi}]`;
                    this.resultData.lastRetryType = RetryType.SUCCESS;
                    this.resultData.fuzzed = this.webrtc.isFuzzed();

                    // set images
                    // if (
                    //     // this.scannerType != ScannerType.RESIDENCE_BACK_SCANNER &&
                    //     this.scannerType != ScannerType.BARCODE
                    // ) {
                    const quality = this.config.scanner.quality;

                    // set crop card image
                    this.resultData.scanResult.cardImage = this.webrtc.getCropCardImageJPEG(quality);

                    // set masked crop card image
                    this.resultData.scanResult.maskedCardImage = this.webrtc.getMaskedCropCardImageJPEG(quality);

                    // set full image
                    this.resultData.scanResult.fullImage = this.webrtc.getFullImageJPEG(quality);

                    // set face image
                    this.resultData.scanResult.portraitImage = this.webrtc.getFaceImageJPEG(quality);

                    // set face 400 image
                    this.resultData.scanResult.portraitImage400 = this.webrtc.getFace400ImageJPEG(quality);
                    // }
                }
            }
    
            this.release();

            // if (warnStatus > 0) {
            //     this.logger.debug(`[${logTag}] warning status: ${warnStatus}, start redetection`);
            //     this.redetect();
            // }
        } else if (status === ScannerStatus.SCAN_TO_SERVER) {
            this.logger.debug(`[${logTag}] scan to server`);
            // 전송
        } else if (status === ScannerStatus.SCAN_TIME_OUT) {
            this.resultData.timeoutRetry++;
            this.resultData.lastRetryType = RetryType.TIMEOUT;
            this.logger.debug(`[${logTag}] scan timeout, the number of retries: ${this.resultData.timeoutRetry}`);
            this.release();
        } else if (status == ScannerStatus.SCAN_RECOG_TIME_OUT) {
            this.logger.debug(`[${logTag}] scan recog timeout`);
            view.renderDetectUI(ScannerStatus.SCAN_COMPLETE, this.scannerType);
    
            this.release();
            
            this.resultData.timeoutRetry++;
            this.resultData.lastRetryType = RetryType.TIMEOUT;

            this.logger.debug(
                `[${logTag}] scan recog timeout, 
                detect retry: ${this.resultData.detectRetry}, 
                recog retry: ${this.resultData.recogRetry}, 
                face retry: ${this.resultData.faceRetry}, 
                color retry: ${this.resultData.colorRetry}, 
                specular retry: ${this.resultData.specRetry}, 
                timeout retry: ${this.resultData.timeoutRetry}, 
                error retry: ${this.resultData.errorRetry}`);
        } else if (status == ScannerStatus.SCAN_TIMELIMIT_OVER) {
            // 수동 모드 전환
            this.logger.debug(`[${logTag}] scan timelimit over`);
        } else if(status === ScannerStatus.SCANNER_INIT_TIMEOUT) {
            this.logger.debug(`[${logTag}] scanner initialize timeout`);
            // 초기화 실패 타임아웃 경고, 네트워크가 불안정하거나 이외의 상황등으로 스캐너 초기화가 실패.
            // 재시도를 권고해야 함
        }
        // else {
        //     this.logger.debug(`[${logTag}] other cases, status: ${status}`);
        // }

        // call result callback passed from robiscan
        this.callbacks.result instanceof Function && this.callbacks.result(status, this.resultData);

        // // 메모리해제
        // if (this.resultData && this.resultData.scanResult !== null) {
        //     this.resultData.scanResult.release();
        //     this.resultData.scanResult = null;
        // }
    }

    /**
     * 스캐너 타입 반환
     */
    getScannerType(scanner) {
        let type = "";

        if (scanner === "idcard") {
            type = ScannerType.IDCARD_SCANNER;
        } else if (scanner === "passport") {
            type = ScannerType.PASSPORT_SCANNER;
        } else if (scanner === "residence") {
            type = ScannerType.RESIDENCE_SCANNER;
        } else if (scanner === "capture") {
            type = ScannerType.CAPTURE;
        } else if (scanner === "residence_back") {
            type = ScannerType.RESIDENCE_BACK_SCANNER;
        } else if (scanner === "barcode") {
            type = ScannerType.BARCODE;
        } else if (scanner === "creditcard") {
            type = ScannerType.CREDITCARD;
        } else if (scanner === "giro") {
            type = ScannerType.GIRO;
        }

        return type;
    }

    getScannerName() {
        let type = this.scannerType;
        let name = "";
        if (type == ScannerType.IDCARD_SCANNER) {
            name = "id";
        } else if (type == ScannerType.PASSPORT_SCANNER) {
            name = "passport";
        } else if (type == ScannerType.RESIDENCE_SCANNER) {
            name = "residence";
        } else if (type == ScannerType.CAPTURE) {
            name = "capture";
        } else if (type == ScannerType.RESIDENCE_BACK_SCANNER) {
            name = "residenceBack";
        } else if (type == ScannerType.BARCODE) {
            name = "barcode";
        } else if (type == ScannerType.CREDITCARD) {
            name = "creditcard";
        } else if (type == ScannerType.GIRO) {
            name = "giro";
        } else {
            name = "unknown";
        }

        return name;
    }

    /**
     * 캡처 엣지 타입 반환(CARD_TYPE: 0, PASSPORT: 1, A4: 2)
     */
    getCaptureEgdeType(captureEdge) {
        let type = CaptureEdgeType.CARD;
        if (captureEdge === "card") {
            type = CaptureEdgeType.CARD;
        } else if (captureEdge === "passport") {
            type = CaptureEdgeType.PASSPORT;
        } else if (captureEdge === "a4") {
            type = CaptureEdgeType.A4;
        }

        return type;
    }

    /**
     * 스캔 박스 설정값 반환
     */
    getScanBoxConfig(scannerType, captureEdgeType, xposNorm=0.5, yposNorm=0.5) {
        let sizeRatio = 0.6292;
        let orientation = view.ScanBoxOrientaion.PORTRAIT;

        if (scannerType === ScannerType.IDCARD_SCANNER) {
            sizeRatio = 0.6292;
            // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
            // xposNorm = 0.5;
            // yposNorm = 0.5;
        } else if (scannerType === ScannerType.PASSPORT_SCANNER) {
            sizeRatio = 0.704;
            // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
            // xposNorm = 0.5;
            // yposNorm = 0.5;
        } else if (scannerType === ScannerType.RESIDENCE_SCANNER) {
            sizeRatio = 0.6292;
            // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
            // xposNorm = 0.5;
            // yposNorm = 0.5;
        } else if (scannerType === ScannerType.RESIDENCE_BACK_SCANNER) {
            sizeRatio = 1.57;
            // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
            // xposNorm = 0.5;
            // yposNorm = 0.5;
            orientation = view.ScanBoxOrientaion.LANDSCAPE;
        } else if (scannerType === ScannerType.CAPTURE) {
            if (captureEdgeType === CaptureEdgeType.CARD) {
                sizeRatio = 0.6292;
                // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
                // xposNorm = 0.5;
                // yposNorm = 0.5;
            } else if (captureEdgeType === CaptureEdgeType.PASSPORT) {
                sizeRatio = 0.704;
                // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
                // xposNorm = 0.5;
                // yposNorm = 0.5;
            } else if (captureEdgeType === CaptureEdgeType.A4) {
                sizeRatio = 1.4143;
                // 위치를 커스텀 할 경우 아래 주석을 풀고 값 수정
                // xposNorm = 0.5;
                // yposNorm = 0.5;
                orientation = view.ScanBoxOrientaion.LANDSCAPE;
            }
        }

        return {
            sizeRatio,
            xposNorm,
            yposNorm,
            orientation
        };
    }


    /**
     * scanner에 따른 wasm을 호출하기 위한 설정
     */
    getWasmName(scannerType) {
        let wasmName = "robi_id_scanner";
        if (scannerType == ScannerType.PASSPORT_SCANNER) {
            wasmName = "robi_passport_scanner";
        } else if (scannerType == ScannerType.RESIDENCE_SCANNER) {
            wasmName = "robi_residence_scanner";
        } else if (scannerType == ScannerType.RESIDENCE_BACK_SCANNER) {
            wasmName = "robi_residence_back_scanner";
        } else if (scannerType == ScannerType.BARCODE) {
            wasmName = "robi_barcode_scanner";
        } else if (scannerType == ScannerType.CAPTURE) {
            wasmName = "robi_capture_scanner";
        } else if (scannerType == ScannerType.CREDITCARD) {
            wasmName = "robi_creditcard_scanner";
        } else if (scannerType == ScannerType.GIRO) {
            wasmName = "robi_giro_scanner";
        }

        return wasmName;
    }

    /**
     * get certificate key from engine
     * @returns cert key
     */
    getCertKey() {
        if(this.webrtc) {
            return this.webrtc.get_cert_key();
        } else {
            return null;
        }
    }

    getCardTypeName(type) {
        if(type == ScanCardType.IDCARD) {
            return "korId";
        } else if(type == ScanCardType.DRIVERLICENSE) {
            return "drvId";
        } else if(type == ScanCardType.RESIDENCE) {
            return "residence";
        } else if(type == ScanCardType.RESIDENCE_BACK) {
            return "residenceBack";
        } else if(type == ScanCardType.PASSPORT) {
            return "passport";
        } else if(type == ScanCardType.GIRO) {
            return "giro";
        } else if(type == ScanCardType.CAPTURE) {
            return "capture";
        } else if(type == ScanCardType.BARCODE) {
            return "barcode";
        } else if(type == ScanCardType.CREDITCARD) {
            return "creditcard";
        } else if(type == ScanCardType.GIRO) {
            return "giro";
        } else {
            return "unknown";
        }
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 조건에 따라 특정 스크립트 로드
 */
function loadJS(file) {
    let jsElm = document.createElement("script");
    jsElm.type = "application/javascript";
    jsElm.src = file;
    jsElm.body = ''; //"console.log('load script~~~~~~~~~~~~~~~');";
    document.body.appendChild(jsElm);
    // logger.debug("SIMD file : " + file);
}
