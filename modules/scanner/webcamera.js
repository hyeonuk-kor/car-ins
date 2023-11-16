import { ScanCardType, ScannerType, ScannerStatus, ScanMode, CameraType, BrowserType, OsType } from './scanner_constants.js';
import { RobiScanner, ScanInfo, RobiImage } from './cardscanner.js';
export { RobiImage };

/**
 * @Version 1.0.0
 * @copyright Posicube all right reserved
 * @file WebRTC 카메라를 적용하기위한 WebCamera class 파일
 */

/**
 * 카메라를 열기위해 사용되는 변수 FHD -> HD -> VGA 순으로 카메라를 오픈할 때 사용
 * @readonly
 */
const recommanded_resolution_low = [
  // { width: 3840, height: 2160 }, // 4K
  // { width: 1920, height: 1080 }, // FHD
  { width: 1080, height: 720 }, // FHD
  { width: 1280, height: 720 }, // HD
  { width: 640, height: 480 }, // VGA
];

const recommanded_resolution_high = [
  // { width: 3840, height: 2160 }, // 4K
  // { width: 1920, height: 1080 }, // FHD
  // { width: 1440, height: 1080 }, // FHD
  { width: 1920, height: 1080 }, // FHD
  { width: 1280, height: 720 }, // HD
  { width: 640, height: 480 }, // VGA
];

const exceptional_resolution = {
  "SM-J737S": { width: 1280, height: 720 }
};

// WebRTC 카메라를 오픈하고 플래이하는 클래스
// 내부에서 scanner를 호출 및 인식 수행, doRecog의 scanInterval 참조

/**
 * WebRTC 카메라를 오픈하고 플래이하는 클래스<br>
 * 내부에서 scanner를 호출 및 인식 수행<br>
 * doRecog의 scanInterval 참조
 */
export class WebCamera {
  /**
   * 생성자
   * @param {RobiLogger} logger - 개발 및 에러 정보 출력을 위한 로깅 클래스
   * @param {long} detectiontimelimit - 카드 검출의 시간이 오래 걸릴 경우 인식 파트를 서버에서 수행하기위해 "detect card"에 시간 제한을 설정하는 파라미터<br> 0 으로 설정하면 사용하지 않음
   */
  constructor(logger, detectiontimelimit, fuzz=false, loadEngine=true) {
    this.camera_type = CameraType.FACING_FRONT;
    this.resolution_selector = 0;
    this.video = null;
    this.selectedCamera = null;
    this.loadEngine = loadEngine;

    this.scanner = null;
    this.scanResult = null;

    this.scanInterval = null;

    this.status = ScannerStatus.UNKNOWN;
    this.scanDuration = 100;

    this.result_callback = null;
    this.detect_callback = null;

    this.logger = logger;
    if(!this.logger) {
      this.logger = {};
      this.logger.debug = function(msg) {};
      this.logger.info = function(msg) {};
      this.logger.warn = function(msg) {};
      this.logger.error = function(msg) {};
      this.logger.result = function(msg) {};
    }

    this.processing = false;

    this.scanner_type = 0;

    this.detectionTimeLimit = detectiontimelimit;
    this.detectionTimeSum = 0;
    this.detectionTimeLimit_Count = 0;
    this.checkDetectionTimeLimit = this.detectionTimeLimit !== 0;

    this.fuzz = fuzz;

    this.jpegEncodedPreview = null;

    this.intervalStatus = 0;

    this.cid = 0;
    this.videoDevices = [];

    this.licenseKey = "";

    this.recommanded_resolution = [];

    this.scanMode = 0;

    this.edge_type = 0;

    this.browserInfo = {};

    this.timeOutSec = 0;
    this.recogTimeOutSec = 0;
    this.loadTimeoutSec = 0;
    this.scanStartTime = 0;
    this.recogStartTime = 0;
    this.loadingTime = 0;
    this.loadTimer = null;

    this.detectedCardOnce = false;

    this.gx_norm=0.0;
    this.gy_norm=0.0;
    this.gw_norm=0.0;
    this.gh_norm=0.0;
  }

  /**
   * 스캔 결과 및 에러 또는 현재 스캐너의 상태를 돌려받는 callback
   * @callback scanResultCallback
   * @param {ScannerStatus} statusCode - 스캐너의 상태 enum값
   * @param {ScanInfo} scanInfo - 스캔 결과 정보 오브젝트, 일부 상태에서는 null값이 들어옮
   */

  /**
   * Card box가 검출되었는지 유무를 돌려받을 callback
   * @callback detectCardCallback
   * @param {boolean} detect  -
   *      1 : card detected<br>
   *      0 : not found card
   */

  /**
   * 스캔을 시작하는 함수<br>
   * 해당함수를 call하면 자동으로 카메라를 셋팅하고 스캐너를 초기화 진행 하며<br>
   * 스캔을 자동으로 시작하는 함수<br>
   * 해당함수 call 후에 결과 처리를 위해 scanResultCallback과 detectCardCallback에서 결과를 처리
   * @param {CameraType} cameraType 카메라 방향을 적용하는 파라미터
   * @param {obj} video html의 video tag의 객체 입력
   * @param {ScannerType} scanner_type  스캐너의 종류를 적용하는 파라미터
   * @param {scanResultCallback} result_callback 스캔 결과 및 에러나 현재 스캐너의 상태를 돌려받을 callback
   * @param {detectCardCallback} detect_callback Card box가 검출되었는지 유무를 돌려받을 callback
   * @param {string} licensekey Robiscanner licensekey string을 입력하는 파라미터
   * @param {int} edge_type 스캔하는 타입이 어떤 종류인지 결정하는 값 -
   *      0 : 신분증
   *      1 : 여권(not support)
   *      2 : A4
   */
  open(cameraType, video, scanner_type, result_callback, detect_callback, licensekey, edge_type, timeoutSec=0, recogTimeoutSec=0, loadTimeoutSec=0) {
    this.camera_type = cameraType;
    this.video = video;

    this.scanner_type = scanner_type;
    if(this.scanner_type == ScannerType.GIRO || this.scanner_type == ScannerType.CAPTURE ||
      this.scanner_type == ScannerType.BARCODE || this.scanner_type == ScannerType.CREDITCARD) {
      this.fuzz = false;
      this.logger.info(`fuzz is disabled for scanner type: ${this.scanner_type}`);
    }
    this.edge_type = edge_type;

    this.result_callback = result_callback;
    this.detect_callback = detect_callback;

    this.licenseKey = licensekey;

    this.timeOutSec = timeoutSec;
    this.recogTimeOutSec = recogTimeoutSec;
    this.loadTimeoutSec = loadTimeoutSec;
    this.scanStartTime = 0;
    this.recogStartTime = 0;

    let facingMode = "environment";
    this.logger.debug("camera_type = " + this.camera_type);
    if (this.camera_type == CameraType.FACING_FRONT) {
      facingMode = "user";
    }

    var videoSettings = {
      video: {
          optional: [
              {
                  facingMode: facingMode
              },
              {
                  focusMode: 'continuous'
              },
              {
                  width: { min: 0 }
              },
              {
                  height: { min: 0 }
              }
          ]
      }
    }

    navigator.mediaDevices
      .enumerateDevices(videoSettings)
      .then(this.getDevices.bind(this))
      .catch(this.handleError_getDevice.bind(this));
  }

  get_cert_key() {
    return this.scanner.get_cert_key();
  }

  /**
   * 브라우저로 부터 카메라 및 오디오 정보를 취득한 후 불리는 callback 함수
   * device 중 카메라를 획득하여 openCamera를 진행
   * @param {list} deviceInfos - navigator.mediaDevices.enumerateDevices()로 부터 입력되는 정보
   */
  getDevices(deviceInfos) {
    this.status = ScannerStatus.GET_DEVICE;
    this.result_callback(this.status, null);

    this.getBrowserValidataion()
      .then( () => {
        if (deviceInfos.length <= 0) {
          this.logger.error("Camera Device not found error");
          this.status = ScannerStatus.CAMERA_OPENING_FAIL;
          this.result_callback(this.status, null);
        }

        this.videoDevices = [];
        var videoDeviceIndex = 0;

        var i;
        if(this.browserInfo.osName === OsType.IOS) {
          for(i=0 ; i<deviceInfos.length ; i++ ) {
            var device = deviceInfos[i];
            if (device.kind === "videoinput" && (device.label === "후면 카메라" || device.label === "Back Camera")) {
            //if (device.kind === "videoinput" && (device.label === "데스크뷰 카메라")) {
              this.videoDevices.push(device.deviceId);
              videoDeviceIndex++
            }
          }

          if(this.videoDevices.length <= 0) {
            this.videoDevices.push("");
          }

          this.cid = 0;
        } else {  // AOS
          for(i=0 ; i<deviceInfos.length ; i++ ) {
            var device = deviceInfos[i];
            if (device.kind == "videoinput") {
              this.videoDevices.push(device.deviceId);
              videoDeviceIndex++
            }
          }

          if( videoDeviceIndex > 0 ) {
            this.cid = videoDeviceIndex -= 1;
          }
          else {
            this.cid = 0;
          }
        }
        this.logger.debug("selected camera : " + this.cid);
        this.openCamera();

        // scanner 초기화 타이머 동작
        if(this.loadTimeoutSec > 0) {
          this.startLoadTimer();
        }
      });
  }

  /**
   * navigator.mediaDevices.enumerateDevices() 실패시 호출되는 error callback
   * @param {*} error - navigator.mediaDevices.enumerateDevices() 실패 메세지
   */
  handleError_getDevice(error) {
    this.logger.error("getDevices error: " + error.message + error.name);
    this.status = ScannerStatus.CAMERA_OPENING_FAIL;
    this.result_callback(this.status, null);
  }

  /**
   * OS version을 확인하여 카메라를 해상도를 결정하는 함수,
   * iOS < 15 또는 Android < 9 인경우 FHD 대신 1080x720 해상도를 사용함
   */
  getBrowserValidataion() {
    return new Promise((resolve, reject) => {
      // var ua = navigator.userAgent;
      // var version = 20;

      // alert(`ua: ${JSON.stringify(ua)}`);

      this.parseBrowserInfo()
      .then(browserInfo => {
        this.browserInfo = browserInfo;

        //alert(`parsed browser info: ${JSON.stringify(browserInfo)}`);

        // apple과 android 만 확인하여 일정 버전 이하인 경우 low 해상도 profile을 사용
        if(this.browserInfo.osName === OsType.IOS) {
          if( browserInfo.osVersion < 15 ) {
            this.logger.debug("iOS : set resolution_low");
            this.recommanded_resolution = recommanded_resolution_low;
          } else {
            this.logger.debug("iOS : set resolution_high");
            this.recommanded_resolution = recommanded_resolution_high;
          }
        } else if(this.browserInfo.osName === OsType.ANDROID) {
          if( this.browserInfo.osVersion < 9 ) {
            this.logger.debug("Android : set resolution_low");
            this.recommanded_resolution = recommanded_resolution_low;
          } else {
            this.logger.debug("Android : set resolution_high");
            this.recommanded_resolution = recommanded_resolution_high;
          }
        } else {
          this.logger.debug("unknown OS : set resolution_high");
          this.recommanded_resolution = recommanded_resolution_high;
        }
        this.logger.debug("OS Version : " + this.browserInfo.osName + " " + this.browserInfo.osVersion);

        // 단말 정보가 검출될 경우 특정 단말에 대한 예외 처리
        if(this.browserInfo.deviceId) {
          let resolution = exceptional_resolution[this.browserInfo.deviceId.toUpperCase()];
          if(resolution) {
            alert(`일부 단말은 고정된 해상도로 카메라가 열립니다.\n모델명: ${this.browserInfo.deviceId}\n해상도: ${resolution.width}x${resolution.height}`);
            this.recommanded_resolution = [resolution];
          }
        }
        
        resolve();
      })
      .catch((error) => { reject(error) });
    });
  }

  parseBrowserInfo() {
    let ua = navigator.userAgent;
    const UNKNOWN = 'unknown';
    let info = {
      browserType: OsType.UNKNOWN,
      browserVersion: BrowserType.UNKNOWN,
      osName: UNKNOWN,
      osVersion: UNKNOWN,
      deviceId: UNKNOWN
    };

    let detailParseChain = Promise.resolve(info);

    if( /(iphone|ipad)+/i.test(ua) ) {
      // check iOS safari
      info.osName = OsType.IOS;
      info.browserType = BrowserType.SAFARI;
      var apple_version = ua.match(/version\/(\d+)/i);
      if( apple_version != null ) {
          info.osVersion = apple_version[1];
      } else {
        var M1= ua.match(/(iphone os|iphoneos|cpu os|cpuso|(?=\s))\/?\s*(\d+)/i) || [];
        // apple device 는 cpu정보로 확인한다.
        if( M1 != null ) {
          info.osVersion = M1[2];
        }
      }
    } else if( /android+/i.test(ua) ) {
      if(navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        detailParseChain = navigator.userAgentData.getHighEntropyValues([
          "model",
          "fullVersionList"
        ]).then(detail => {
          info.deviceId = detail.model;
          info.osName = detail.platform;
          info.osVersion = detail.platformVersion;
  
          let brandName = '';
          if(/edga?/i.test(ua)) {
            // check edge
            brandName = 'Edge';
            info.browserType = BrowserType.EDGE;
          } else if(/samsung/i.test(ua)) {
            brandName = 'Samsung';
            info.browserType = BrowserType.SAMSUNG_BROWSER;
          }else if(/chrome/i.test(ua)) {
            brandName = 'Chrome';
            info.browserType = BrowserType.CHROME;
          }
  
          let brandFullVer = detail.fullVersionList.find((element) => element.brand.includes(brandName));
          if(brandFullVer) {
            info.browserVersion = brandFullVer.version;
          }
          return info;
        }).catch((error) => {
          this.logger.error(`failed to parse browser information using userAgentData: ${error}`);
          return info;
        });
      } else {
        info.osName = OsType.ANDROID;
        let regex = /Android\s+([\d.]+).*?;\s*([^;)]+).*\)/i;
        let match = ua.match(regex);
        if(match) {
          info.osVersion = match[1];
          info.deviceId = match[2];
        }

        if(/edga?/i.test(ua)) { // check edge browser
          info.browserType = BrowserType.EDGE;
          let browserMatch = ua.match(/EdgA?\/(\b\d+(?:\.\d+)*\b)/i) || [];
          if(browserMatch != null) {
            info.browserVersion = browserMatch[1];
          }
        } else if(/samsung/i.test(ua)) { // check samsung browser
          info.browserType = BrowserType.SAMSUNG_BROWSER;
          let browserMatch = ua.match(/SamsungBrowser\/(\b\d+(?:\.\d+)*\b)/i) || [];
          if(browserMatch != null) {
            info.browserVersion = browserMatch[1];
          }
        } else if(/chrome?/i.test(ua)) {
          info.browserType = BrowserType.CHROME;
          let browserMatch = ua.match(/Chrome\/(\b\d+(?:\.\d+)*\b)/i) || [];
          if(browserMatch != null) {
            info.browserVersion = browserMatch[1];
          }
        }
      }
    }
    
    return detailParseChain;
  }


  /**
   * 카메라를 오픈하는 함수<br>
   * recommanded_resolution을 하나씩 constraints로 적용하여 성공시 까지 open을 진행
   */
  openCamera() {
    //this.getBrowserValidataion();

    let facingMode = "environment";
    this.logger.debug("camera_type = " + this.camera_type);
    if (this.camera_type == CameraType.FACING_FRONT) {
      facingMode = "user";
    }

    let constraints = {};
    if (this.camera_type == CameraType.FACING_UNKNOWN) {
      constraints = {
        audio: false,
        video: {
          width: {
            exact: this.recommanded_resolution[this.resolution_selector].width,
          },
          height: {
            exact: this.recommanded_resolution[this.resolution_selector].height,
          },
          deviceId: this.videoDevices[this.cid],
          focusMode: 'continuous',
          frameRate: {
            min: '15', max: '30'
          },
        },
      };
    } else {
      constraints = {
        audio: false,
        video: {
          facingMode: { exact: facingMode },
          width: {
            exact: this.recommanded_resolution[this.resolution_selector].width,
          },
          height: {
            exact: this.recommanded_resolution[this.resolution_selector].height,
          },
          deviceId: this.videoDevices[this.cid],
          focusMode: 'continuous',
          frameRate: {
            min: '15', max: '30'
          },
        },
      };
    }

    this.status = ScannerStatus.CAMERA_OPENING;
    this.result_callback(this.status, null);

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(this.handleSuccess.bind(this))
      .catch(this.cameraOpenError.bind(this));
  }

  /**
   * navigator.mediaDevices.getUserMedia(constraints) 실패시 호출되는 error callback<br>
   * recommanded_resolution이 남아있는 경우, 다음 resolution으로 재진행<br>
   * 모든 해상도 실패시 scanResultCallback을 ScannerStatus.CAMERA_OPENING_FAI로 호출
   * @param {*} error - navigator.mediaDevices.getUserMedia(constraints) 실패 정보
   */
  cameraOpenError(error) {
    this.logger.error("cameraOpenError : " + error);
    this.logger.error(
      "camera open fail with " +
      this.recommanded_resolution[this.resolution_selector].width +
      " x " +
      this.recommanded_resolution[this.resolution_selector].height +
      ", try other resolution"
    );

    this.resolution_selector++;
    if (this.resolution_selector < this.recommanded_resolution.length) {
      this.openCamera();
    } else {
      this.status = ScannerStatus.CAMERA_OPENING_FAIL;
      this.logger.error("Can't open camera with all predefined resolution");
      this.result_callback(this.status, null);

      alert(
        "카메라 권한이 거부되어 있습니다. 브라우저 설정에서 카메라 권한을 허용하고 새로고침 해주세요.\n\n설정 방법: 주소창 좌측에 잠금 아이콘을 클릭하고 권한 탭에 있는 카메라 아이콘 토글을 클릭.",
      );
    }
  }

  /**
   * navigator.mediaDevices.getUserMedia(constraints) 성공시 호출되는 callback<br>
   * video tag에 프리뷰를 적용하고, doRecog를 호출하여 스캔을 시작하는 함수
   * @param {*} stream - video stream
   */
  handleSuccess(stream) {
    this.logger.debug("handleSuccess called");
    window.stream = stream; // make stream available to browser console
    this.video.srcObject = stream;
    this.video.muted = false;
    this.video.play();
    this.video.addEventListener('loadedmetadata', () => {
      this.logger.debug(
        "camera open with : " +
          this.video.videoWidth +
          " x " +
          this.video.videoHeight
      );

      this.status = ScannerStatus.CAMERA_OPENNED;
      let scanResult = new ScanInfo();
      scanResult.cameraWidth =
        this.recommanded_resolution[this.resolution_selector].width;
      scanResult.cameraHeight =
        this.recommanded_resolution[this.resolution_selector].height;
      this.result_callback(this.status, scanResult);
  
      if(this.loadEngine) {
        // ! scanner 라이블러리가 정상적으로 초기화(로드) 될때까지 polling 방식으로 체크 후 실행
        this.recogInterval = setInterval(() => {
          if (this.scanner && this.scanner.scanner) {
            clearInterval(this.recogInterval);
          } else {
            this.doRecog();
          }
        }, 500);
      } else {
        // 로딩 타이머 취소
        if(this.loadTimer != null) {
          clearInterval(this.loadTimer);
        }
        this.status = ScannerStatus.SCANNER_READY;
        this.result_callback(this.status, null);
      }
    }, { once: true });
  }

  resetTimeOutTimer() {
    this.scanStartTime = performance.now() / 1000.0;
    this.detectedCardOnce = false;
    this.recogStartTime = 0;
  }

  /**
   * 스캔을 진행하는 함수<br>
   * - 스캐너 초기화<br>
   * - hidden canvas 생성<br>
   * - setInterval을 통하여 스캔이 완료될 때 까지 반복 진행하며 hidden canvas에 프리뷰 스틸샷 입력 및 scanner에 전달
   */
  doRecog() {
    this.scanner = new RobiScanner(this.logger);

    this.status = ScannerStatus.SCANNER_INIT;
    this.logger.debug("init scanner");
    let result = -1;
    try {
      result = this.scanner.init(this.licenseKey, this.scanner_type, this.edge_type, this.fuzz); // ! 네트워크 속도에 따라 scanner 라이블러리 실행에 필요한 .data, .wawm 파일 로드 타이밍 문제로 에러 발생 가능

      console.log(`scanner init error: ${this.scanner.getErrorMessage()}`);
      this.result_callback(this.status, null);
    } catch (e) {
      this.logger.debug("scanner init failed: maybe not loaded yet");
      return;
    }
    
    this.logger.debug("init scanner end");
    if (result != 0) {
      this.status = ScannerStatus.SCANNER_INIT_FAIL;
      this.result_callback(this.status, result);
      this.logger.error("error : scanner not init : " + result);
      clearInterval(this.recogInterval);
      return;
    }

    clearInterval(this.recogInterval);

    let canvas = document.createElement("canvas");
    canvas.setAttribute("hidden", "hidden");

    let ctx = canvas.getContext("2d");

    if (this.memory != null) {
      Module._free(this.memory);
      this.memory = null;
    }

    // 로딩 타이머 취소
    if(this.loadTimer != null) {
      clearInterval(this.loadTimer);
    }

    this.status = ScannerStatus.SCANNER_READY;
    this.result_callback(this.status, null);

    this.intervalStatus = 0;
    //this.timeOutSec = 0;
    //this.scanStartTime = performance.now() / 1000.0;
    this.resetTimeOutTimer();

    this.scanInterval = setInterval(() => {
      if (!this.processing) {
        this.processing = true;

        if( this.scanMode == ScanMode.AUTO ) {
          if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
            let width = this.video.videoWidth;
            let height = this.video.videoHeight;
            //this.logger.debug("this.intervalStatue = " + this.intervalStatus);
            if (this.intervalStatus == 0) {
              if (this.memory == null) {
                this.memory = Module._malloc(width * height * 4);
              }

              canvas.width = this.video.videoWidth;
              canvas.height = this.video.videoHeight;

              ctx.drawImage(this.video, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              Module.HEAP8.set(imageData.data, this.memory);

              let start_detect = performance.now();
              let scan_result = this.scanner.detect_frame(
                this.memory,
                width,
                height
              );
              this.status = ScannerStatus.SCAN_DETECT;

              let detect_time = performance.now() - start_detect;
              this.logger.debug("scanner detect time : " + parseInt(detect_time) + " ms");

              // check detectionTimeLimit
              if( this.checkDetectionTimeLimit ) {
                this.logger.debug("check limit time!")
                this.detectionTimeSum += detect_time;
                this.detectionTimeLimit_Count += 1;
                this.logger.debug("check param : sum and count = " + this.detectionTimeSum + ", " + this.detectionTimeLimit_Count);
                let avgTime = this.detectionTimeSum / this.detectionTimeLimit_Count;

                let exceed_case_skip = (avgTime > this.detectionTimeLimit);
                let exceed_case_A = (avgTime > this.detectionTimeLimit * 1.2);
                let exceed_case_B = ((avgTime > this.detectionTimeLimit) & (this.detectionTimeLimit_Count > 3));
                this.logger.debug("avgTime / detectionTimeLimit : " + avgTime + " / " + this.detectionTimeLimit);
                if( (exceed_case_A || exceed_case_B) && this.detectionTimeLimit_Count < 5 ) {
                  // 수동 모드 권고
                  this.status = ScannerStatus.SCAN_TIMELIMIT_OVER;

                  // 한번 경고 하면 더 경고 안하게 우선 정의
                  this.checkDetectionTimeLimit = false;
                  this.result_callback(this.status, null);
                }

                if( this.detectionTimeLimit_Count > 10 ) {
                  this.checkDetectionTimeLimit = false;
                  this.logger.debug("disable checkDetectionTimeLimit");
                }

                // if( exceed_case_skip ) {
                //   this.logger.warn("timeLimit over!! recog skip !!!");
                //   return;
                // }
              }

              if (scan_result == 0) {
                // disable timeOut
                //this.timeOutSec = 0;
                this.detectedCardOnce = true;
                
                if( this.scanner_type == ScannerType.CAPTURE || this.scanner_type == ScannerType.BARCODE ) {
                    if( this.scanner.isScanComplete() ) {
                      this.scanResult = this.scanner.getResultInfo();
                      //this.closeCamera();
                      this.status = ScannerStatus.SCAN_COMPLETE;
                      this.result_callback(ScannerStatus.SCAN_COMPLETE, this.scanResult);
                      this.processing = false;
                      return;
                    }
                }
                else {
                  this.intervalStatus = 1;
                }
              }
              this.detect_callback(scan_result);
            } else if (this.intervalStatus == 1) {
              let start = performance.now();
              // check recog timeout
              if( this.recogTimeOutSec > 0 && this.recogStartTime == 0 ) {
                this.recogStartTime = start / 1000.0;
              }
              let scan_result = this.scanner.recog_frame();
              let end = performance.now();
              let recogTime = end - start; // send Log 서버 전송을 위한 recog_time set
              this.logger.debug("scanner recog time : " + parseInt(recogTime) + " ms");
              //this.scanResult = this.scanner.getResultInfo();
              if (scan_result == 0) {
                if( this.scanner.isScanComplete() ) {
                  this.scanResult = this.scanner.getResultInfo();
                  //this.closeCamera();
                  // reset recogTimeOutSec
                  this.recogTimeOutSec = 0;
                  this.status = ScannerStatus.SCAN_COMPLETE;
                  this.result_callback(ScannerStatus.SCAN_COMPLETE, this.scanResult);
                  this.processing = false;
                  return;
                }
              }
              else {
                this.logger.error("recog Result : " + scan_result);
              }
              this.intervalStatus = 0;
            } else {
              this.intervalStatus = 0;
            }

            /** check time out */
            let endTime = performance.now() / 1000;

            if( this.recogStartTime > 0 && this.recogTimeOutSec > 0 ) {
              let periodRecogSec = endTime - this.recogStartTime;
              if( periodRecogSec > this.recogTimeOutSec ) {
                this.status = ScannerStatus.SCAN_RECOG_TIME_OUT;
                this.result_callback(this.status, null);
              }
            }
            if( this.timeOutSec > 0 && !this.detectedCardOnce ) {
              let periodSec = endTime - this.scanStartTime;
              if( periodSec > this.timeOutSec ) {
                this.status = ScannerStatus.SCAN_TIME_OUT;
                this.result_callback(this.status, null);
              }
            }
          }
        }
        else if(this.scanMode == ScanMode.MANUAL) {
          /*
          canvas.width = this.video.videoWidth;
          canvas.height = this.video.videoHeight;

          ctx.drawImage(this.video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          Module.HEAP8.set(imageData.data, this.memory);
          */
        }
        this.processing = false;
      }
    }, this.scanDuration);
  }

  /**
   * 스캐너 초기화 함수<br>
   * 스캔이 완료된 후, 정보처리가 완료되면 반드시 호출해야 함
   */
  reset() {
    if (this.scanner != null) {
      this.scanner.reset();
      this.scanner.release();
      this.scanner = null;
      this.processing = false;
    }
  }

  /**
   * 스캐너 및 카메라를 종료하고 메모리 해제를 진행하는 함수<br>
   * 스캔 완료시에는 자동으로 호출되나, 그전에 종료시에 반드시 호출해야 함<br>
   * 다음 상태에 호출하도록 권장
   * @example
   * window.addEventListener('beforeunload', ()=>{
   *          webcamera.closeCamera();
   *      });
   */
  closeCamera() {
    clearInterval(this.scanInterval);
    this.scanInterval = null;

    if (this.memory != null) {
      Module._free(this.memory);
      this.memory = null;
    }

    const stream = this.video.srcObject;
    if (stream != null) {
      const tracks = stream.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });

      this.video.srcObject = null;
    }
  }

  releaseScanner() {
    if (this.scanner != null) {
      this.scanner.reset();
      this.scanner.release();
      this.scanner = null;
    }
    // 메모리초기화
    if (this.scanResult != null){
      this.scanResult.release();
      this.scanResult = null;
    }
  }

  /**
   * 스캔 모드를 설정한다.
   * @param {ScanMode} mode 
   */
  setScanMode(mode) {
    this.scanMode = mode;
  }

  /**
   * 이미지를 캡쳐 및 인코딩하여 전달 한다.
   * @param {int} quality Encoded JPEG quality (0~100)
   * @returns encoded JPEG Stream
   */
  captureImage(quality) {
    quality = Math.min(Math.max(quality, 0), 100); // clamp
    let canvas = document.createElement("canvas");
    canvas.setAttribute("hidden", "hidden");
    let ctx = canvas.getContext("2d");

    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;

    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    let qualityScale = quality / 100.0;
    const imageData = canvas.toDataURL('image/jpeg', qualityScale);
    this.closeCamera();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    
    return imageData;
  }

  /**
   * 스캐너의 가이드렉트를 설정한다
   * @param {*} orientation 카메라 회전 값
   * @param {*} x 가이드렉트의 가로 중앙 값 (0.0~1.0, 작을수록 좌측으로 이동)
   * @param {*} y 가이드렉트의 세로 중앙 값 (0,0~1.0, 작을수록 상단으로 이동)
   * @param {*} gw not support yet
   * @param {*} gh not support yet
   * @param {*} scale 1.0값 고정
   * @param {*} flip false값 고정, no need to web
   * @param {int} verification_cnt 주민등록 번호의 check_sum이 실패할 때, 재시도를 할 count값 지정, default = 100000
   * @returns 
   */
  setFrame_config(orientation, x, y, gw, gh, scale, flip, verification_cnt = -1, dist_limit = 0.2, minimal_scan=false) {
    if( this.scanner != null ) {
      this.gx_norm=x;
      this.gy_norm=y;
      this.gw_norm=gw;
      this.gh_norm=gh;
      this.logger.debug("frame config, x: "+x+", y: "+y+", w: "+gw+", h: "+gh)
      this.scanner.set_frame_config(orientation, x, y, gw, gh, scale, flip, verification_cnt, dist_limit, minimal_scan);
    }
    else {
      this.logger.error("webcamera scanner is null");
    }
  }

  /**
   * 스캔된 카드의 이미지만 크롭된 결과물을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
   * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
   * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
   * @returns {RobiImage} 결과 이미지 객체
   */
    getCropCardImageJPEG(quality) {
      if( this.scanner != null ) {
        return this.scanner.getCropCardImageJPEG(quality);
      }
      return null;
    }

    /**
     * 스캔된 카드의 이미지만 크롭된 결과물을 600dpi jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getCropCardImageJPEG_600(quality) {
      if( this.scanner != null ) {
        return this.scanner.getCropCardImageJPEG_600(quality);
      }
      return null;
    }

    /**
     * 스캔된 카드의 이미지만 크롭된 결과물을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 입력된 width/height의 크기로 출력되며, extend_ratio(0.0~1.0)의 값 만큼 외부 여백을 포함합니다.
     * 권장 크기는 1152x724 입니다.
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @param {int} width 출력될 이미지의 가로 크기
     * @param {int} height jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @param {float} extend_ratio jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getCropCardImageWithMarginJPEG(quality, width, height, extend_ratio) {
      if( this.scanner != null ) {
        return this.scanner.getCropCardImageWithMarginJPEG(quality, width, height, extend_ratio);
      }
      return null;
  }

    /**
     * 스캔된 카드의 이미지만 크롭한구 개인정보를 마스킹처리한 결과물을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
     getMaskedCropCardImageJPEG(quality) {
      if( this.scanner != null ) {
        return this.scanner.getMaskedCropCardImageJPEG(quality);
      }
      return null;
    }

    /**
     * 스캔된 카메라 프리뷰 영상을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getFullImageJPEG(quality) {
      if( this.scanner != null ) {
        return this.scanner.getFullImageJPEG(quality);
      }
      return null;
    }

    getErrorImageJPEG() {
      if( this.scanner != null ) {
        return this.scanner.getErrorImageJPEG();
      }
      else {
        return "";
      }
    }

    /**
     * 스캔된 카메라 프리뷰 영상을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 주민등록번호 및 운전면호 번호에 마스킹된 이미지를 출력한다<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    /*
    getMaskedFullImageJPEG(quality) {
      if( this.scanner != null ) {
        return this.scanner.getMaskedFullImageJPEG(quality);
      }
      return null;
    }
    */

    /**
     * 스캔된 신분증의 사진을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getFaceImageJPEG(quality) {
      if( this.scanner != null ) {
        return this.scanner.getFaceImageJPEG(quality);
      }
      return null;
    }

    /**
     * 스캔된 신분증의 사진을 400x400에 fillcenter 크기의 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
     getFace400ImageJPEG(quality) {
      if( this.scanner != null ) {
        return this.scanner.getFace400ImageJPEG(quality);
      }
      return null;
    }

    /**
     * 
     * @param {intptr_t*} buffer 프레임 버퍼
     * @param {int} width 입력 프레임의 가로 값(pixels)
     * @param {int} height 입력 프레임의 세로 값(pixels)
     * @param {int} quality jpeg 인코딩시 적용할 회질 레벨(0-100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getFrameImageJPEG(buffer, width, height, quality) {
      if( this.scanner != null ) {
        return this.scanner.getFrameImageJPEG(quality);
      }
      return null;
    }

    /**
     * fullImage의 주민등록번호 및 운전면호 번호에 마스킹된 이미지를 출력한다<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @returns {Int32Array} 결과 이미지 객체
     */
    getFullImageMaskedRoiList() {
      if( this.scanner != null ) {
        return this.scanner.getFullImageMaskedRoiList();
      }
      return null;
  }

  getCropMaskedRoiList() {
    if( this.scanner != null ) {
      return this.scanner.getCropMaskedRoiList();
    }
    return null;
  }

  startLoadTimer() {
    if(this.loadTimer != null) {
      clearInterval(this.loadTimer);
    }
    this.loadingTime = 0;
    this.loadTimer = setInterval(
      () => {
        if(this.loadingTime > this.loadTimeoutSec) {
          clearInterval(this.loadTimer);
          this.status = ScannerStatus.SCANNER_INIT_TIMEOUT;
          this.result_callback(ScannerStatus.SCANNER_INIT_TIMEOUT, null);
        }
        this.loadingTime++;
        // console.log("[loading timer] time: "+this.loadingTime+"(s), limit: "+this.loadTimeoutSec+"(s)")
      }, 1000
    );
  }

  isFuzzed() {
    if(this.scanner && this.scanner.isFuzzed instanceof Function) {
      return this.scanner.isFuzzed();
    }
    return false;
  }
}
