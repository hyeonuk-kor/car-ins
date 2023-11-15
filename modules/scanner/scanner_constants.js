/**
 * 스캔된 카드의 종류를 나타내는 enum
 * @readonly
 * @enum {int}
 */
export const ScanCardType = {
    /** 0 - 변수 초기화를 위한 값 */
    UNKNOWN: 0,
    /** 1 - 주민등록증 */
    IDCARD: 1,
    /** 2 - 운전면허증 */
    DRIVERLICENSE: 2,
    /** 3 - 외국인등록증 */
    RESIDENCE: 3,
    /** 4 - 외국인등록증 */
    RESIDENCE_BACK: 4,
    /** 5 - 여권 */
    PASSPORT: 5,
    /** 6 -  */
    GIRO: 6,
    /** 7 -  */
    CAPTURE: 7,
    /** 8 -  */
    BARCODE: 8,
    /** 10 - 신용카드 */
    CREDITCARD: 10,
};

/**
 * Scanner 타입을 선택하기 위한 enum
 * @readonly
 * @enum {int}
 */
export const ScannerType = {
    /** 주민등록증 및 운전면허증용 스캐너 */
    IDCARD_SCANNER: 0,
    /** 여권 스캐너 */
    PASSPORT_SCANNER: 1,
    /** 외국인 등록증 전면 스캐너 */
    RESIDENCE_SCANNER: 2,
    /** 외국인 등록증 후면 스캐너 */
    RESIDENCE_BACK_SCANNER: 3,
    /** Fake detector */
    FAKE_DETECTION: 4,
    /** GIRO */
    GIRO: 5,
    /** CAPTURE */
    CAPTURE: 6,
    /** BARCODE */
    BARCODE: 7,
    /** CREDITCARD */
    CREDITCARD: 9,
};
  
/**
 * Scanner 상태를 정의하기 위한 enum
 * @readonly
 * @enum {int}
 */
export const ScannerStatus = {
    /** 스캐너 로딩 실패 */
    SCANNER_READY_FAIL: -5,
    /** 스캐너 초기화 실패 */
    SCANNER_INIT_FAIL: -4,
    /** 카매라 오픈 실패 */
    CAMERA_OPENING_FAIL: -3,
    /** 시스템으로 부터 device 정보를 얻어오기 실패 */
    GET_DEVICE_FAIL: -2,
    /** 알수 없는 상태 */
    UNKNOWN: -1,
    /** 시스템에서 device 정보를 얻어오기 진행 */
    GET_DEVICE: 0,
    /** 카메라 오픈 진행 */
    CAMERA_OPENING: 1,
    /** 카메라 오픈 완료 */
    CAMERA_OPENNED: 2,
    /** 스캐너 초기화 진행 */
    SCANNER_INIT: 3,
    /** 스캐너 로딩 완료 */
    SCANNER_READY: 4,
    /** Card box를 찾음 */
    SCAN_DETECT: 5,
    /** 스캔이 완료됨 */
    SCAN_COMPLETE: 6,
    /** 카메라 및 스캐너 종료 진행 */
    STOP_CAMERA: 7,
    /** Detect card 시간 초과로 인식을 서버로 전송 */
    SCAN_TO_SERVER: 8,
    /** Time out으로 인한 스캔 종료 */
    SCAN_TIME_OUT: 9,
    /** recogTimeOut 발생을 noti하는 상태값 */
    SCAN_RECOG_TIME_OUT: 10,
    /** detect algorithm 수행시간이 너무 길어 수동 모드로 전환을 권고하는 상태값 */
    SCAN_TIMELIMIT_OVER: 11,
    /** 네트워크 장애 등 여러가지 이유로 스캐너 초기화가 오래 걸릴 경우 타임아웃 발생 상태값 */
    SCANNER_INIT_TIMEOUT: 12,
};


export const ScanMode = {
    /** auto scan mode */
    AUTO: 0,
    /** manual server recog mode */
    MANUAL: 1,
};

/**
 * Camera 방향을 정하기위한 enum
 * @readonly
 * @enum {int}
 */
export const CameraType = {
    /** 단말의 후면 카메라 선택 */
    FACING_BACK: 0,
    /** 단말의 셀피 카메라 선택 */
    FACING_FRONT: 1,
    /** PC와 같이 전/후 선택이 불가능한 장비에서 사용 */
    FACING_UNKNOWN: -1,
};

export const RetryType = {
    SUCCESS: "success",
    FACE: "faceRetry",
    COLOR: "colorRetry",
    SPECULAR: "specRetry",
    DETECT: "detectRetry",
    RECOG: "recogRetry",
    TIMEOUT: "timeoutRetry",
};

export const CaptureEdgeType = {
    CARD: 0,
    PASSPORT: 1,
    A4: 2,
};

export const EngineResultCode = {
    ERR_UNKNOWN: -1,
    OK: 0,
    ERR_LICENSE_EXPIRED: 1,
    ERR_NO_MODEL_FILES: 2,
    ERR_FAILED_TO_LOAD_MODEL: 3,
    ERR_NO_IMAGE: 4,
    ERR_FAILED_TO_DETECT_CARD: 5,
    ERR_FAILED_TO_SCAN: 6,
    ERR_LICENSED: 7,
    ERR_LICENSE_COVERAGE: 8,
    ERR_FAILED_TO_CHECK_FOCUS: 9,
    ERR_FAILED_TO_DETECT_MRZ: 10,
};

export const BrowserType = {
    CHROME: 'chrome',
    SAMSUNG_BROWSER: 'samsung',
    EDGE: 'edge',
    SAFARI: 'safari',
    UNKNOWN: 'unknown'
}

export const OsType = {
    ANDROID: 'Android',
    IOS: 'iOS',
    UNKNOWN: 'unknown'
}