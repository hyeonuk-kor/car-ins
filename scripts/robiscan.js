var config = null;
var loggerModule = null;
var logger = {};
logger.debug = function(msg) {};
logger.info = function(msg) {};
logger.warn = function(msg) {};
logger.error = function(msg) {};
logger.result = function(msg) {};
var scannerModule = null;
var constants = null;
var view = null;
var scanner = null;

var ocrResult = null; // 자동 모드 동작 시 OCR 결과를 보관할 변수
var captureImg = null; // 수동 모드 동작 시 프리뷰 캡쳐나 카메라 사진을 보관할 변수

/**
 * 통신 모듈 제공 시 사용하는 변수
 */
var transferModule = null;
var transfer = null;
var availableTransfer = false;
var altToken = null;
var cert = null;

//////////////////////////// 고객사 커스텀 영역 ////////////////////////////
const Callbacks = {
    Module: {
        onLoadSuccess: () => {
            // 모듈 로딩 성공 시 호출됨
            logger.info('successfully loaded the modules');

            // 초기화
            init(config, logger)
                .then(() => {
                    // logger.info('successfully initialized the scanner');
                })
                .catch((msg) => {
                    // logger.error('failed to initialize the scanner: '+msg);
                });
        },
        onLoadFailure: (msg) => {
            // 모듈 로딩 실패 시 호출됨
            // logger.error(msg);

            // 예시: 경고 메시지 출력 및 이전 화면으로 이동
            alert(`모듈 로드 오류: ${msg}\n이전 화면으로 이동합니다.`);
            window.location.href = "./";
        }
    },
    Scanner: {
        onInitSuccess: () => {
            // 스캐너 초기화 성공 시 호출됨
            logger.info('successfully initialized the scanner');
            
            // 서버 전송 UI 표시
            let showBtn = (config && config.scanner && config.scanner.sendResultToServer);
            showServerSendBtn(showBtn);
            console.log(config)
            // 스캐너 동작 시작
            scanner.startScanner()
            .then((availableAutoScanner) => {
                // 예시: 자동 스캔 기능 사용 불가능 시 수동 모드로 전환
                if(!availableAutoScanner) {
                    alert('자동 스캔 기능을 사용할 수 없습니다.\n수동 모드로 전환합니다.');
                    // 스캐너 자동 모드 끄기
                    scanner.setAutoMode(false);

                    // UI 자동 모드 끄기
                    view.showAutoCameraToggle(false);
                }
            });
        },
        onInitFailure: (msg) => {
            // 스캐너 초기화 실패 시 호출됨
            logger.error('failed to initialize the scanner: '+msg);

            alert(`초기화에 실패하였습니다. 이전화면으로 돌아갑니다.\n메시지: ${msg}`);

            // 스캐너 종료
            scanner.release();

            // 이전 화면으로 이동
            window.location.href = "./";
        },
        onUpdateView: (viewWidth, viewHeight, guideRect) => {
            logger.info('updated the view: '+viewWidth+', '+viewHeight+', guiderect: '+JSON.stringify(guideRect));

            // 뷰 크기 및 가이드박스 크기 변경 시 호출됨
            // UI에 변경된 영역 반영 (내부 로직은 고객사에서 커스텀 가능)
            view.update(viewWidth, viewHeight, guideRect);
        },
        onDetected: (detect) => { // bool
            // 카드 박스를 찾는 로직이 호출되고 나서 호출됨
            logger.info('detected: '+detect);
            view.detectCallback(detect);
        },
        onResult: (status, result) => {
            // 스캐너 결과가 나왔을 때 호출됨
            logger.info('status: '+status+', result: '+JSON.stringify(result));
            
            // 뷰 후처리 호출 (내부 로직은 고객사에서 커스텀 가능)
            view.resultCallback(status, result);
            
            /**
             * 결과 코드에 따른 고객사 로직 처리 (고객사에서 각 상태에 맞는 로직 커스텀 가능)
             */
            if(status === constants.ScannerStatus.SCANNER_INIT_FAIL) {
                // 스캐너 초기화 실패
            } else if(status === constants.ScannerStatus.CAMERA_OPENING_FAIL) {
                // 카매라 오픈 실패
            } else if(status === constants.ScannerStatus.UNKNOWN) {
                // 알 수 없는 상태
            } else if(status === constants.ScannerStatus.GET_DEVICE) {
                // 시스템에서 device 정보를 얻어오기 진행
            } else if(status === constants.ScannerStatus.CAMERA_OPENING) {
                // 카메라 오픈 진행
                logger.info('camera opening');
            } else if(status === constants.ScannerStatus.CAMERA_OPENNED) {
                // 카메라 오픈 완료
                logger.info('camera opened');
            } else if(status === constants.ScannerStatus.SCANNER_INIT) {
                // 스캐너 초기화 진행
                logger.info('scanner initialized');

                ocrResult = null;
                captureImg = null;
            } else if(status === constants.ScannerStatus.SCANNER_READY) {
                // 스캐너 로딩 완료
                logger.info('scanner ready');
            } else if(status === constants.ScannerStatus.SCAN_COMPLETE) {
                // 스캔이 완료됨
                if(result && result.scanResult !== null) {
                    if(result.lastRetryType === constants.RetryType.SUCCESS) {
                        // 필요에 따라 결과 객체 후처리하는 로직 구현 필요

                        // 예시: OCR 결과를 서버로 전송하기 위해 변수에 보관
                        ocrResult = result;
                        let sctype = getParameterByName('scanner');
                        const storedStep1Result = localStorage.getItem('step1Result');
                        const storedStep2Result = localStorage.getItem('step2Result');

                        if(sctype==='residence') {
                            localStorage.setItem('step1Result', ocrResult);
                            window.location.href = "./robiscan.html?scanner=residence_back";
                        } else if(sctype==='residence_back') {
                            localStorage.setItem('step2Result', ocrResult);
                            alert(storedStep1Result);
                            alert(storedStep2Result);
                        }
                        // 로컬 저장소에서 결과 가져오기
                    
                        // 예시: OCR 서버로 결과 즉시 전송
                        // sendOcrResult2Server(result);
                    } else if(result.lastRetryType === constants.RetryType.FACE) {
                        // 얼굴 점수 기준치 미달로 인한 재촬영
                        let isConfirm = confirm(`경고: 얼굴 점수가 기준치보다 낮습니다.\n기준치: ${scanner.getFaceThreshold()}, 얼굴점수: ${result.scanResult.faceScore}\n메인화면으로 이동하시겠습니까? 취소하면 재활영을 진행합니다.`);
                        if (isConfirm) {
                            // 이전 화면으로 이동
                            window.location.href = "./";
                        } else {
                            // 재촬영 진행
                            scanner.redetect();
                        }
                    } else if(result.lastRetryType === constants.RetryType.COLOR) {
                        // 색상 점수 기준치 미달로 인한 재촬영
                        let isConfirm = confirm(`경고: 색상 점수가 기준치보다 낮습니다.\n기준치: ${scanner.getColorThreshold()}, 색상점수: ${result.scanResult.colorScore}\n메인화면으로 이동하시겠습니까? 취소하면 재활영을 진행합니다.`);
                        if (isConfirm) {
                            // 이전 화면으로 이동
                            window.location.href = "./";
                        } else {
                            // 재촬영 진행
                            scanner.redetect();
                        }
                    } else if(result.lastRetryType === constants.RetryType.SPECULAR) {
                        // 빛반사 점수 기준치 미달로 인한 재촬영
                        let isConfirm = confirm(`경고: 빛반사 점수가 기준치보다 높습니다.\n기준치: ${scanner.getSpecularThreshold()}, 빛반사점수: ${result.scanResult.specularRatio}\n메인화면으로 이동하시겠습니까? 취소하면 재활영을 진행합니다.`);
                        if (isConfirm) {
                            // 이전 화면으로 이동
                            window.location.href = "./";
                        } else {
                            // 재촬영 진행
                            scanner.redetect();
                        }
                    }
                }
            } else if(status === constants.ScannerStatus.SCAN_TIME_OUT) {
                // Time out으로 인한 스캔 종료
                logger.info('scan timeout, create empty data to Server');

                // 예시: 인식 시간 초과 알림 및 스캐너 종료 및 이전 화면으로 이동
                alert("인식 시간이 초과 되었습니다.\n(recog timeout - capture image send to Server)");
                
                // 스캐너 종료
                scanner.release();

                // 이전 화면으로 이동
                window.location.href = "./";

            } else if(status === constants.ScannerStatus.SCAN_RECOG_TIME_OUT) {
                // recogTimeOut 발생을 noti하는 상태값
                logger.info('recog timeout');

                // 예시: 프리뷰를 캡쳐하고 결과 화면에 출력한다. 그리고 재촬영 여부를 확인한다.
                let captureImg = scanner.captureImage(config.scanner.quality);
                let img = new Image();
                img.src = captureImg;
                img.onload = function () {
                    let resultCanvasEl = document.getElementById("resultCanvas");
                    let resultCtx = resultCanvasEl.getContext("2d");
                    resultCanvasEl.width = img.width;
                    resultCanvasEl.height = img.height;
                    resultCtx.drawImage(
                        img,
                        0,
                        0,
                        img.width,
                        img.height,
                        0,
                        0,
                        img.width,
                        img.height,
                    );

                    // 제한시간 만료 알림 후 재촬영 또는 스캔 취소 선택
                    let isConfirm = confirm("제한시간이 만료 되었습니다. 메인화면으로 이동하시겠습니까? 취소하면 재활영을 진행합니다.");
                    if (isConfirm) {
                        // 이전 화면으로 이동
                        window.location.href = "./";
                    } else {
                        // 재촬영 진행
                        scanner.redetect();
                    }
                };

            } else if(status === constants.ScannerStatus.SCAN_TIMELIMIT_OVER) {
                // detect algorithm 수행시간이 너무 길어 수동 모드로 전환을 권고
                logger.info('scan timelimit over');

                // 예시: 인식 시간 느림 알림 후 스캐너 수동 모드 전환 선택
                let isConfirm = confirm(`경고: 인식 시간이 느립니다. 수동 모드 사용을 권장합니다. 확인을 누르면 수동 모드로 변경됩니다.`);
                if (isConfirm) {
                    // 스캐너 자동 모드 끄기
                    scanner.setAutoMode(false);

                    // UI 자동 모드 끄기
                    view.showAutoCameraToggle(false);
                }
                
            } else if(status === constants.ScannerStatus.SCANNER_INIT_TIMEOUT) {
                // 네트워크 장애 등 여러가지 이유로 스캐너 초기화가 오래 걸릴 경우 타임아웃 발생
                // 이전 페이지로 이동 또는 웹페이지 리프레시 등 처리 필요
                
                // 예시: 초기화 실패 알림 및 스캐너 종료 및 이전 화면으로 이동
                alert("초기화에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.");

                // 스캐너 종료
                scanner.release();

                // 이전 화면으로 이동
                window.location.href = "./";
            }
        }
    }
};

/**
 * 서비스 시작 (예시: 웹페이지 로드 완료 시 시작)
 */
window.onload = function () {
    // load config and initialize
    loadJSON('./config.json').then((c) => {
        config = c;
        Object.freeze(config);
        window.config = config; // 종속 모듈에서 공통적인 config 사용할 수 있도록 window 영역에 할당

        load(config)
            .then(() => {
                Callbacks.Module.onLoadSuccess();
            }).catch((msg) => {
                Callbacks.Module.onLoadFailure(msg);
            });
    }).catch((error) => {
        logger.error(`error: ${error}`);
    });
};

/**
 * URL 쿼리스트링 파라미터
 */
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * 캡처 가능 유무 토글 버튼 클릭 이벤트
 */
let camToggleBtn = document.getElementById("autoCameraToggle");
if(camToggleBtn) {
    camToggleBtn.addEventListener("click", () => {
        // 스캐너 토글 모드 전환
        let isAuto = scanner.toggleAutoMode();
        // UI 토글 모드 전환
        view.showAutoCameraToggle(isAuto);
    });
}

/**
 * "처음으로" 버튼 클릭 시 발생하는 이벤트
 */
let resetBtn = document.getElementById("resetBtn");
if(resetBtn) {
    resetBtn.addEventListener("click", () => {
        window.location.href = "./";
    });
}

/**
 * "재촬영" 버튼 클릭 시 발생하는 이벤트
 */
let redetectBtn = document.getElementById("redetectBtn");
if(redetectBtn) {
    redetectBtn.addEventListener("click", () => {
        // 결과 화면의 텍스트 초기화
        view.clearResultDesc();
        // 결과 화면의 캔버스 초기화
        view.clearResultCanvas();

        scanner.redetect()
            .then(() => {
                logger.info(`redetect start`);
            })
            .catch( (msg) => {
                logger.error(`redetect error: ${msg}`);
            });
    });
}

/**
 * "서버전송" 버튼 클릭 시 발생하는 이벤트
 */
let sendServerBtn = document.getElementById("sendServerBtn");
if(sendServerBtn) {
    sendServerBtn.addEventListener("click", () => {
        logger.info('send data to server');

        const isAuto = scanner.isAutoMode();
        if (isAuto) {
            logger.info("send ocr result to ocr server");

            // 자동 스캔 결과 서버 전송
            if(ocrResult == null) {
                alert("서버에 전송할 데이터가 없습니다.");
            } else {
                sendOcrResult2Server(ocrResult);
            }
        } else {
            logger.info("upload image to ocr server");

            // 수동 스캔 이미지 서버 전송
            if(captureImg == null) {
                alert("서버에 전송할 이미지가 없습니다.");
            } else {
                sendImage2Server(captureImg);
            }
        }    
    });
}

/**
 * 캡처 버튼 클릭 이벤트
 */
let captureBtn = document.getElementById("takeCameraBtn");
if(captureBtn) {
    captureBtn.addEventListener("click", () => {
        view.renderDetectUI(constants.ScannerStatus.SCAN_COMPLETE, scanner.scannerType);

        // 프리뷰 캡쳐
        let base64Image = scanner.captureImage(90); // 0 ~ 100 (90 이상 권장)
        let img = new Image();

        // 결과 화면에 캡쳐한 프리뷰 이미지 출력
        img.src = base64Image;
        img.onload = function () {
            let resultCanvasEl = document.getElementById("resultCanvas");
            let resultCtx = resultCanvasEl.getContext("2d");
            resultCanvasEl.width = img.width;
            resultCanvasEl.height = img.height;
            resultCtx.drawImage(
                img,
                0,
                0,
                img.width,
                img.height,
                0,
                0,
                img.width,
                img.height,
            );
        };

        scanner.release();

        // 예시: 서버 전송 버튼 동작 시 캡쳐한 프리뷰 이미지를 사용하기 위해 보관
        captureImg = base64Image;

        // /** 
        //  * 예시: 고객사에서 프리뷰 이미지를 수동으로 인식하려는 경우,
        //  * 캡쳐된 프리뷰 이미지를 OCR 서버로 즉시 전송
        //  */
        // sendImage2Server(base64Image);
        
        // // 메모리 해제
        // base64Image = null;
    });
}

/*
 * 휴대폰 카메라 촬영 버튼 이벤트
 */
let cameraBtn = document.getElementById("takeDevCameraBtn");
if(cameraBtn) {
    cameraBtn.addEventListener("click", () => {
        let inputElem = document.getElementById("file-capture-manual");
        inputElem.click();
    });
}

/*
 * 휴대폰의 카메라 촬영 버튼 클릭 이벤트 콜백 등록
 */
registerCameraCaptureEvent(
    document.getElementById("file-capture-manual"),
    (data) => {
        /*
        * data: dataURL 형식의 캡쳐된 이미지 데이터
        * (e.g. data:image/jpeg;base64,vSp2j7zUm1wmzxP9W/+y9h+enl5+vHm+6u9zG29u+b...)
        */

        // 동작 완료 UI 호출
        view.renderDetectUI(constants.ScannerStatus.SCAN_COMPLETE, scanner.scannerType);

        /*
        * 서버에 이미지를 전송하기 위해 base64 스트링만 분리하는 전처리
        * 서버에서는 base64 스트링을 디코드해서 사용해야 한다.
        */
        // let imageData = data.slice(data.indexOf(',')+1);
        
        // 캡쳐한 이미지를 화면에 출력          
        let img = new Image();
        img.src = data;
        img.onload = function () {
            let canvas = document.getElementById("resultCanvas");
            let ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(
                img,
                0,
                0,
                img.width,
                img.height,
                0,
                0,
                img.width,
                img.height,
            );
        };

        // 카메라 종료 및 스캐너 해제
        scanner.release();

        // 예시: 서버 전송 버튼 동작 시 캡쳐한 프리뷰 이미지를 사용하기 위해 보관
        captureImg = data;

        // /** 
        //  * 예시: 고객사에서 프리뷰 이미지를 수동으로 인식하려는 경우
        //  * 촬영된 카메라 이미지를 OCR 서버로 즉시 전송
        //  */
        // sendImage2Server(data);
        // // 전송 후 메모리 해제
        // data = null;
        
    },
    // 카메라에서 촬영한 이미지 JPEG 퀄리티 설정 (0~100, 90 이상 권장)
    90
);

function showServerSendBtn(show) {
    if (show) {
        document.getElementById("sendServerBtn").style.display = "inline-block";
    } else {
        document.getElementById("sendServerBtn").style.display = "none";
    }
}

/*
 * 카메라 촬영 버튼 입력 시 촬영 이미지 JPEG 변환 이벤트 등록 함수
 */
function registerCameraCaptureEvent(inputObj, callback, quality=90) {
    if(typeof inputObj !== 'object' || inputObj.getAttribute('type') !== 'file' || typeof callback !== 'function') {
        return;
    }

    if(inputObj.onclick === null) {
        inputObj.onclick = function(event) {
            inputObj.value = '';
            this.logger.debug('camera input button clicked!');
            this.logger.debug('inputObj.value: '+inputObj.value);
        }
    }

    if(inputObj.onchange === null) {
        inputObj.onchange = function(event) {
            if(event.target.files.length > 0) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let image = new Image();
                        image.onload = function() {
                            let canvas = document.createElement("canvas");
                            let ctx = canvas.getContext("2d");
                            canvas.setAttribute("hidden", "hidden");
                            canvas.width = image.width;
                            canvas.height = image.height;
                            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                            let qualityScale = quality / 100.;
                            if(qualityScale < 0.0) {
                                qualityScale = 0.0;
                            } else if(qualityScale > 1.0) {
                                qualityScale = 1.0;
                            }
                            const dataB64 = canvas.toDataURL('image/jpeg', qualityScale);
                            inputObj.value = '';
                            if(typeof dataB64 === 'string' && dataB64.length > 22) {
                                callback(dataB64);
                            }
                            canvas = null;
                        }
                        image.src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            }
        }
    }
}

/**
 * 자동 OCR 결과 업로드 예제
 *   - 시나리오: OCR 자동 스캔 완료 후
 *     1. altToken 발급
 *     2. cert 발급
 *     3. 결과 암호화 및 전송
 * @param {*} scanResult (cropIdImageData, maskedCropIdImageData, fullFrameIdImageData, photoIdImageData, infoJsonData)
 * @returns 
 */
function sendOcrResult2Server(result) {
    // 전송 모듈 정상적으로 로드되었는지 확인
    if(!availableTransfer) {
        logger.error('transfer module is not loaded');
        return;
    }

    let scanResult = result.scanResult;

    // 예시: 로딩 시작 UI 출력
    beforeSendFn();

    // 전송하기 전에 필요한 암호화 준비 수행
    let preproc = prepareForSending();

    // 암호화 준비가 완료되면 데이터 암호화 및 OCR 서버 전송 수행
    preproc
        .then((dto) => {
            cert = dto.data.content;

            // 암호화 할 데이터 준비
            const is_fuzzed = result.fuzzed;
            let resultJson = packageAutoResult(result);
            let resultPackage = {
                "cropIdImage": scanResult.cardImage.b64(is_fuzzed),
                "maskedCropIdImage": scanResult.maskedCardImage.b64(is_fuzzed),
                "fullFrameIdImage": scanResult.fullImage.b64(is_fuzzed),
                "photoIdImage": scanResult.portraitImage.b64(is_fuzzed),
                "infoJson": resultJson,
            };

            logger.info(`successfully issued cert: ${cert}`);

            // 데이터 암호화 요청
            if(transfer) {
                return transfer.encryptData(resultPackage, cert);
            } else {
                return Promise.reject(("failed to encrypt data, transfer is not available", "", null));
            }
        })
        .then((encryptedData) => {
            let cardTypeName = scanner.getCardTypeName(scanResult.cardType);

            let autoMode = scanner.isAutoMode();
            if(transfer) {
                return transfer.ocrDataUpload(encryptedData, cardTypeName, altToken, autoMode);
            } else {
                return Promise.reject(("failed to upload encrypted data, transfer is not available", "", null));
            }
        })
        .then((dto) => {
            let result = JSON.stringify(dto);
            // 서버 전송 성공
            logger.info(`successfully sent the data to server, result: ${result}`);

            // 예시: 로딩 UI 제거
            completeFn();

            // OCR 서버로부터 받은 결과 출력
            view.printManualResultText(dto.data);
            
            // 예시: OCR 서버로부터 전달받은 마스킹된 크롭 결과 이미지 출력
            view.showResultImage(
                dto.data.maskedCropIdImage, // 마스킹 된 크롭 이미지 선택
                
                // 예시: 이미지 완료되면 호출되는 콜백 등록
                () => {
                    // 예시: 로딩 완료되면 1초 기다렸다가 이미지 로딩 UI 제거 및 후처리
                    return new Promise(resolve => setTimeout(resolve, 1000))
                        .then(() => {
                            let isConfirm = confirm("확인 버튼을 누르면 이미지가 삭제됩니다.");
                            if(isConfirm) {
                                view.clearResultCanvas();
                            }

                            // 전달받은 결과 이미지들 삭제
                            dto.data.cropIdImage = null;
                            dto.data.maskedCropIdImage = null;
                            dto.data.fullFrameIdImage = null;
                            dto.data.photoIdImage = null;
                        });
                }
            );
        })
        .catch((msg, status, error) => {
            logger.error(`message: ${msg}\nstatus: ${status}\nerror: ${error}`);
            
            // 예시: 실패 메시지 출력
            alert(msg);

            // 예시: 로딩 UI 제거
            completeFn();
        });
}

/**
 * 수동 OCR 이미지 업로드 예제
 *   - 시나리오: 프리뷰 캡쳐 후
 *     1. altToken 발급
 *     2. cert 발급
 *     3. 결과 암호화 및 전송
 * @param {*} base64Image
 * @returns 
 */
function sendImage2Server(base64Image) {
    // 전송 모듈 정상적으로 로드되었는지 확인
    if(!availableTransfer) {
        logger.error('transfer module is not loaded');
        return;
    }

    // prefix 제거
    let prefixIdx = base64Image.indexOf(',');
    if(prefixIdx > 0) {
        base64Image = base64Image.substr(prefixIdx+1);
    }

    // 예시: 로딩 시작 UI 출력
    beforeSendFn();

    // 전송하기 전에 필요한 암호화 준비 수행
    let preproc = prepareForSending();

    let aesIv = transfer.getIv();
    let aesKey = transfer.getAesKey(256);

    // 암호화 준비가 완료되면 데이터 암호화 및 OCR 서버 전송 수행
    preproc
        .then((dto) => {
            cert = dto.data.content;

            // 암호화 할 데이터 준비
            let resultPackage = {
                "content": base64Image,
            };

            logger.info(`successfully issued cert: ${cert}`);

            // 데이터 암호화 요청
            return transfer.encryptData(resultPackage, cert, aesIv, aesKey);
        })
        .then((encryptedData) => {
            let scannerName = scanner.getScannerName();

            // let autoMode = scanner.isAutoMode();
            return transfer.ocrWebrtcRecognize(encryptedData, scannerName, altToken);
        })
        .then((dto) => {
            let result = JSON.stringify(dto);
            // 서버 전송 성공
            logger.info(`successfully recognized, result: ${result}`);

            // 예시: 로딩 UI 제거
            completeFn();

            let data = JSON.parse(dto.data);

            if(data) {
                // 인식 성공하면 data는 null이 아님
                let encAES256Data = data.encData;
                let decryptedData = transfer.aes256Decode(aesKey, aesIv, encAES256Data);

                let decResult = JSON.parse(decryptedData);

                view.printManualResultText(decResult);
                
                // 예시: OCR 서버로부터 전달받은 마스킹된 크롭 결과 이미지 출력
                view.showResultImage(
                    decResult.maskedCropIdImage, // 마스킹 된 크롭 이미지 선택
                    
                    // 예시: 이미지 완료되면 호출되는 콜백 등록
                    () => {
                        // 예시: 로딩 완료되면 1초 기다렸다가 이미지 로딩 UI 제거 및 후처리
                        return new Promise(resolve => setTimeout(resolve, 1000))
                            .then(() => {
                                let isConfirm = confirm("확인 버튼을 누르면 이미지가 삭제됩니다.");
                                if(isConfirm) {
                                    view.clearResultCanvas();
                                }

                                // 복호화 한 결과 정보 삭제
                                decResult.cropIdImage = null;
                                decResult.maskedCropIdImage = null;
                                decResult.fullFrameIdImage = null;
                                decResult.photoIdImage = null;
                                decResult.idData = null;
                                decResult.logData = null;
                                decResult = null;
                            });
                    }
                );
            } else {
                let msg = '이미지가 정확하지 않습니다. 다시 촬영하여 주시기 바랍니다.';
                logger.warn(msg);
                alert(msg);
            }
        })
        .catch((msg, status, error) => {
            logger.error(`message: ${msg}\nstatus: ${status}\nerror: ${error}`);
            
            // 예시: 실패 메시지 출력
            alert(msg);

            // 예시: 로딩 UI 제거
            completeFn();
        });
}

// 예시: OCR 서버로 업로드하기 전 수행할 로직
function beforeSendFn() {
    var width = 0;
    var height = 0;
    var left = 0;
    var top = 0;

    width = 50;
    height = 50;

    top = ( $(window).height() - height ) / 2 + $(window).scrollTop();
    left = ( $(window).width() - width ) / 2 + $(window).scrollLeft();

    if($("#div_ajax_load_image").length != 0) {
        $("#div_ajax_load_image").css({
            "top": top+"px",
            "left": left+"px"
        });
        $("#div_ajax_load_image").show();
    }
    else {
        $('body').append('<div id="div_ajax_load_image" style="position:absolute; top:' + top + 'px; left:' + left + 'px; width:' + width + 'px; height:' + height + 'px; z-index:9999; background:#f0f0f0; filter:alpha(opacity=50); opacity:alpha*0.5; margin:auto; padding:0; "><img src="./images/ajax_loader.gif" style="width:50px; height:50px;"></div>');
    }
}

// 예시: OCR 서버 업로드 완료 후 수행할 로직
function completeFn() {
    $("#div_ajax_load_image").hide();
}

/**
 * get altToken and cert key
 * @returns 
 */
function prepareForSending() {
    // 전송 모듈 정상적으로 로드되었는지 확인
    if(!availableTransfer || !transferModule) {
        let msg = 'transfer module is not loaded';
        logger.error(msg);
        return Promise.reject((msg, "", null));
    }

    // 전송 객체 생성
    if(!transfer) {
        transfer = new transferModule.Transfer();
    }

    // 전송 객체 초기화
    transfer.init(config);

    let altTokenChain = Promise.resolve();
    if(altToken) {
        altTokenChain = Promise.resolve({
            "code": "200",
            "message": "successfully received cert",
            "data": {"altToken": altToken}
        });
    } else {
        altTokenChain = transfer.ocrSecretKey()
            .then((dto) => {
                // OCR 서버로부터 RSA 키가 생성되어 수신됐을 경우
                
                // 수신 결과에서 키 얻기
                let secKey = dto.data.secretKey;

                logger.info(`successfully issued secretKey: ${secKey}`);

                // altToken 발급을 위한 메시지 생성
                let random = transfer.getRandom();
                let tokenMsg = `${transfer.getCurrentTimestamp()}${transfer.getUserId()}${config.transfer.deviceId}${config.transfer.secretId}${random}${secKey}`;
                
                // 메시지로 시그니처 생성
                return transfer.generateSignature(tokenMsg);
            })
            .then(([signature, pubKey]) => {
                logger.info(`successfully generated signature: ${signature}`);
                // 시그니처 정상적으로 생성되었을 경우
                let random = transfer.getRandom();

                // altToken 발급 요청
                return transfer.ocrAltToken(pubKey, signature, random);
            })
            .then((dto) => {
                // altToken 발급 성공 시, OCR 서버로부터 altToken 수신
                altToken = dto.data.altToken;
    
                return Promise.resolve({
                    "code": "200",
                    "message": "successfully received cert",
                    "data": {"altToken": altToken}
                });
            })
            .catch((msg, status, error) => {
                logger.error(`message: ${msg}\nstatus: ${status}\nerror: ${error}`);
                return Promise.reject((msg, status, error));
            });
    }

    return altTokenChain
        .then((dto) => {
            // altToken 발급 성공 시, OCR 서버로부터 altToken 수신
            altToken = dto.data.altToken;

            logger.info(`successfully issued altToken: ${altToken}`);

            if(config.transfer.localCert) {
                // 엔진에서 cert 가져오기
                let cert = scanner.getCertKey();
                return Promise.resolve({
                    "code": "200",
                    "message": "successfully received cert",
                    "data": {"content": cert}
                });
            } else {
                // OCR 서버에 cert 발급 요청
                return transfer.ocrCert(altToken);
            }
        })
        .catch((msg, status, error) => {
            logger.error(`message: ${msg}\nstatus: ${status}\nerror: ${error}`);
            return Promise.reject((msg, status, error));
        });
}

/**
 * 자동 OCR 인식 결과를 OCR 서버에 전송하기 위해 결과 데이터 패키징하는 함수
 * @param {*} result
 * @returns string (json)
 */
function packageAutoResult(result) {
    // 자동 모드 신분증 인식 후 서버 upload 용 info.json
    let idObj = new Object();
    let logObj = new Object();

    let scanResult = result.scanResult;
    logObj.result = `${result.lastRetryType}(auto)`;

    idObj.idType = scanner.getCardTypeName(scanResult.cardType);
    if (scanResult.cardType === constants.ScanCardType.IDCARD) {
        idObj.idNumber = scanResult.idNumber;
        idObj.idName = scanResult.name;
        idObj.idIssueDate = scanResult.issueDate;
        idObj.idIssueRegion = scanResult.issuer;
        idObj.idOverSeas = scanResult.overseas;
    } else if (scanResult.cardType === constants.ScanCardType.DRIVERLICENSE) {
        idObj.idNumber = scanResult.idNumber;
        idObj.idName = scanResult.name;
        idObj.idIssueDate = scanResult.issueDate;
        idObj.idIssueRegion = scanResult.issuer;
        idObj.idLicenseNumber = scanResult.driverLicenseNumber;
        idObj.idSerialNo = scanResult.serial;
    } else if (scanResult.cardType === constants.ScanCardType.RESIDENCE) {
        idObj.idNumber = scanResult.idNumber;
        idObj.idIssueDate = scanResult.issueDate;
        idObj.idName = scanResult.nameEng;
        idObj.idNationality = scanResult.nationality;
        idObj.idVisaType = scanResult.residenceVisaType;
        idObj.idResidenceType = scanResult.residenceTypeCode;
    } else if (scanResult.cardType === constants.ScanCardType.RESIDENCE_BACK) {
        idObj.idSerial = scanResult.serial;
        idObj.idPermission_1 = scanResult.permission_1;
        idObj.idExpiry_1 = scanResult.expiry_1;
        idObj.idConfirm_1 = scanResult.confirm_1;
        idObj.idPermission_2 = scanResult.permission_2;
        idObj.idExpiry_2 = scanResult.expiry_2;
        idObj.idConfirm_2 = scanResult.confirm_2;
        idObj.idPermission_3 = scanResult.permission_3;
        idObj.idExpiry_3 = scanResult.expiry_3;
        idObj.idConfirm_3 = scanResult.confirm_3;
        idObj.idPermission_4 = scanResult.permission_4;
        idObj.idExpiry_4 = scanResult.expiry_4;
        idObj.idConfirm_4 = scanResult.confirm_4;
    } else if (scanResult.cardType === constants.ScanCardType.PASSPORT) {
        idObj.idNumber = scanResult.idNumber;
        idObj.idIssueDate = scanResult.issueDate;
        idObj.idPassportNumber = scanResult.passportNumber;
        idObj.idExpiryDate = scanResult.expiryDate;
        idObj.idDayOfBirth = scanResult.dateOfBirth;
        idObj.idPersonalNumber = scanResult.personalNumber;
        idObj.idGender = scanResult.gender;
        idObj.idPassportType = scanResult.passportType;
        idObj.idNameKor = scanResult.name;
        idObj.idNameEng = scanResult.nameEng;
        idObj.idNationality = scanResult.nationality;
        idObj.idIssueCountry = scanResult.issuer;
        idObj.idGivenName = scanResult.givenName;
        idObj.idSurName = scanResult.surName;
        idObj.idMrz1 = scanResult.mrz1.replace(/</gi, "&lt;",);
        idObj.idMrz2 = scanResult.mrz2;
    }

    logObj.faceScore = scanResult.faceScore;
    logObj.colorScore = scanResult.colorScore;
    logObj.specularScore = scanResult.specularRatio;
    logObj.operationTime = scanResult.scanTime;

    logObj.detectRetry = result.detectRetry;
    logObj.recogRetry = result.recogRetry;
    logObj.faceRetry = result.faceRetry;
    logObj.colorRetry = result.colorRetry;
    logObj.specRetry = result.specRetry;
    logObj.timeoutRetry = 0;
    logObj.errorRetry = 0;
    logObj.lastRetry = result.lastRetryType;
    logObj.fullMaskRoi = result.fullMaskRoi;
    logObj.fuzzed = result.fuzzed;

    let uploadObj = new Object();
    uploadObj.id = idObj;
    uploadObj.log = logObj;

    let infoJsonData = JSON.stringify(uploadObj);
    // 메모리 해제
    idObj = null;
    logObj = null;
    uploadObj = null;
    
    logger.debug(`packaged result json: ${infoJsonData}`);
    return infoJsonData;
}
////////////////////////////////////////////////////////////////////////////////////////

async function loadJSON(path) {
    try {
        return await fetch(path).then((res) => res.json() );
    } catch(error) {
        throw error;
    }
}

// robiscan 초기화 함수, load 정상적으로 처리된 이후에 호출되어야 함
function init(config, logger) {
    return new Promise( (resolve, reject) => {
        scanner = new scannerModule.Scanner(); //new Modules.SCANNER.m.Scanner();

        // init scanner
        scanner.initScanner(
            config, logger,
            Callbacks.Scanner.onInitSuccess,
            Callbacks.Scanner.onInitFailure,
            Callbacks.Scanner.onUpdateView,
            Callbacks.Scanner.onDetected,
            Callbacks.Scanner.onResult
        ).then(() => {
            if( ! scanner.isSimdSupported() ) {
                logger.info("Browser not support SIMD");
                alert('브라우저에서 가속 기능이 지원되지 않습니다.');
            }

            resolve();
        }).catch( (msg) => {
            reject("failed to init scanner: " + msg);
        });
    });
}

// robiscan 로드 함수
function load(config) {
    return new Promise( async (resolve, reject) => {
        let modules = {
            SCANNER: {
                name: "scanner",
                mandatory: true,
                path: `../modules/scanner/scanner.js`,
                m: null
            },
            CONSTANTS: {
                name: "constants",
                mandatory: true,
                path: '../modules/scanner/scanner_constants.js',
                m: null
            },
            LOGGER: {
                name: "logger",
                mandatory: false,
                path: `./robi_logger.js`,
                m: null
            },
            VIEW: {
                name: "view",
                mandatory: true,
                path: `../modules/view.js`,
                m: null
            },
            TRANSFER: {
                name: "transfer",
                mandatory: false,
                path: `../modules/transfer/transfer.js`,
                m: null
            }
        };

        window.robiversion = config.version;

        var util = await import('./util.js');

        // let ds = util.getDisplaySize();
        // alert(`display size: ${ds.width}x${ds.height}`);

        // load meta info
        let { osSimple, browser, cameraType } = util.getCameraType();
        window.osSimple = osSimple;
        window.browser = browser;
        window.cameraType = cameraType;
        
        // load modules
        loadModules(modules)
            .then( () => {
                Object.freeze(modules);

                loggerModule = modules.LOGGER.m;
                if(loggerModule) {
                    /**
                     * 로거 생성 및 글로벌 변수에 할당
                     */
                    logger = new loggerModule.RobiLogger(loggerModule.RobiLoggerLevel[config.logger.level], config.logger.logUI, config.logger.logConsole);
                }
                window.logger = logger;
                logger.debug(`module load result: ${JSON.stringify(modules)}`);

                scannerModule = modules.SCANNER.m;

                /**
                 * 스캐너 상태 등 dictionary
                 */
                constants = modules.CONSTANTS.m;

                /**
                 * 뷰 모듈 로드
                 */
                view = modules.VIEW.m;

                /**
                 * 전송 모듈 로드
                 */
                transferModule = modules.TRANSFER.m;
                let tfDepStart = new Date();
                // 전송 모듈이 성공적으로 로드되었을 때 종속 모듈 로드할 수 있도록 load 함수 호출
                if(transferModule) {
                    transferModule.load(logger)
                    .then(() => {
                        let end = new Date();
                        logger.info(`transfer modules loaded, loading time: ${end - tfDepStart}(ms)`); // 종속 모듈 로드 시간 확인용
                        availableTransfer = true;
                    })
                    .catch((msg) => {
                        logger.warn(`failed to load transfer modules : ${msg}`);
                    });
                }

                resolve();
            })
            .catch((msg) => {
                reject(msg);
            });
    });
}

// 모듈 로드 함수
function loadModule(module, version) {
    return new Promise(async (resolve, reject) => {
        try {
            let modulePath = module.path;
            if(version) {
                modulePath = `${modulePath}?v=${version}`;
            }
            module.m = await import(modulePath) || null;
            if(Object.prototype.hasOwnProperty.call(module.m, "load")) {
                let depModStart = new Date();
                module.m.load()
                    .then(() => {
                        let depModEnd = new Date();
                        logger.info(`${module.name} module loaded, loading time: ${depModEnd - depModStart}(ms)`); // 종속 모듈 로드 시간 확인용
                        resolve(module);
                    })
                    .catch((msg) => {
                        reject(msg);
                    });
            } else {
                resolve(module);
            }
        } catch (error) {
            if(module.mandatory) {
                let msg = `failed to load mandatory module: ${module.name}`;
                if(logger) {
                    logger.error(msg);
                }
                reject(msg);
            } else {
                resolve(module);
            }
        }
    });
}

function loadModules(modules, version="") {
    let keys = Object.keys(modules);
    let promiseChain = Promise.resolve();

    keys.forEach((m) => {
        promiseChain = promiseChain.then(
            () => loadModule(modules[m], version),
            (error) => {
                return Promise.reject(error);
            });
    });

    return promiseChain;
}
