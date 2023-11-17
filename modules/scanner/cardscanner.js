import { ScanCardType } from './scanner_constants.js';

/**
 * @Version 1.0.0
 * @copyright Posicube all right reserved
 * @file scanner.js wasm과 연결을 위한 scanner wrapper 및 scaninfo class 파일
 */

//const isWindows = require("cross-env/src/is-windows");

/**
 * 스캔 결과 error enum
 * @readonly
 * @enum {int}
 */
const ScanErrorCode = {
    /** -2 - 카드파입 규정 실패 */
    ERROR_UNKNOWN_CARD_TYPE: -2,
    /** -1 - 알수없는 에러 발생 */
    ERROR_UNKNOWN: -1,
    /** 0 - 스캔에 문제 없음 */
    OK: 0,
};

/**
 * 스캐너에 입력될 정보 클래스
 */
class ScanConfig {
    /**
     * 정보 객체 생성자
     */
    constructor() {
        this.memory = null;
        this.width = 0;
        this.height = 0;
    }

    /**
     * 프래임 정보를 셋팅하기 위한 함수
     * @param {Int8Array} memory video에서 가져온 frame buffer RGB 
     * @param {int} wdt video width
     * @param {int} hgt video height
     */
    setFrame(memory, wdt, hgt) {
        this.memory = memory;
        this.width = wdt;
        this.height = hgt;
    }
}

/**
 * 스캔 결과가 저장된 클래스<br>
 * 스캔 정보에는 WASM native allocation memory가 존재함<br>
 * <span style="font-weight:bold;">사용 후 반드시 release를 호출하여 해당 메모리를 제거해야함</span><br><br>
 * @example
 * ScanInfo에 존재하는 이미지 사용 예시
 * // get image from scanresult
 * let robiImage = scan_result.maskedCardImage;
 * 
 * var encodedstream = robiImage.encodedstream;
 * var encodedLength = robiImage.encodedsize;
 * 
 * // test code for show result image
 *     // base64 encoding
 * var binaryString = [encodedLength];
 * while(encodedLength--) {
 *     binaryString[encodedLength] = String.fromCharCode(encodedstream[encodedLength]);
 * }
 * var encodeddata = binaryString.join('');
 * var base64 = window.btoa(encodeddata);
 *     // locad image form base64 buffer
 * var img = new Image();
 * img.src = "data:image/jpeg;base64," + base64;
 * img.onload = function() {
 *     result_ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
 * }
 * img.onerror = function(stuff) {
 *     logger.error("img load fail : ", stuff);
 * }
 * 
 * // release wasm native allocation memory
 * scan_result.release();
 */
export class ScanInfo {
    /**
     * 정보 객체 생성자
     */
    constructor() {
        /** @member {ScanCardType} cardType 스캔된 카드의 종류 */
        this.cardType = -1;
        /** @member {String} idNumber 주민등록 번호 */
        this.idNumber = "";
        /** @member {String} name 이름 */
        this.name = "";
        /** @member {String} issueDate 발행일자 */
        this.issueDate = "";
        /** @member {String} issuer 발행처 */
        this.issuer = "";

        // for ID only
        /** @member {int} overseas 1 : 재외국민 */
        this.overseas = "";

        // for DriverLicense only
        /** @member {String} driverLicenseNumber 운전면허 번호 */
        this.driverLicenseNumber = "";
        /** @member {String} aptitude 적성검사 기간 */
        this.aptitude = "";
        /** @member {String} driverLicenseType 운전면허 종류 */
        this.driverLicenseType = "";
        /** @member {String} serial 운전면허 시리얼 번호 */
        this.serial = "";
        /** @member {String} driverLicenseKor ??? */
        this.driverLicenseKor = "";

        // for residence
        // for Passport only
        /** @member {String} passportNumber 여권 번호 */
        this.passportNumber = "";
        /** @member {String} surName sur name */
        this.surName = "";
        /** @member {String} givenName given name */
        this.givenName = "";
        /** @member {String} passportType 여권 타입 */
        this.passportType = "";
        /** @member {String} nationality 국적 */
        this.nationality = "";
        /** @member {String} dateOfBirth 생일 */
        this.dateOfBirth = "";
        /** @member {String} gender 성별 */
        this.gender = "";
        /** @member {String} expiryDate 만료일 */
        this.expiryDate = "";
        /** @member {String} personalNumber 여권 개인 번호 */
        this.personalNumber = "";
        /** @member {String} nameEng 영문이름 */
        this.nameEng = "";
        /** @member {String} mrz1 mrz code 첫줄 */
        this.mrz1 = "";
        /** @member {String} mrz2 mrz code 두번째 줄 */
        this.mrz2 = "";
        /** @member {String} residenceVisaType 외국인등록증 비자 타입 */
        this.residenceVisaType = "";
        /** @member {String} residenceVersion 외국인등록증 버전(구형/신형) */
        this.residenceVersion = "";
        /** @member {String} residenceTypeCode 외국인등록증 비자 코드(0: 외국인등록증, 1: 국내거소신고증, 2: 영주증) */
        this.residenceTypeCode = "";
        /** @member {String} residenceNationalityCode 외국인등록증 국가 코드 */
        this.residenceNationalityCode = "";
        /** @member {String} residenceNationalityRaw 외국인등록증 국가명 인식 결과 그대로 */
        this.residenceNationalityRaw = "";
        /** @member {String} residenceTitle 외국인등록증 제목 */
        this.residenceTitle = "";

        // for residence back
        /** @member {String} permission_1 허가일자 */
        this.permission_1 = "";
        /** @member {String} expiry_1 만료일자 */
        this.expiry_1 = "";
        /** @member {String} confirm_1 확인 */
        this.confirm_1 = "";
        /** @member {String} permission_2 허가일자 */
        this.permission_2 = "";
        /** @member {String} expiry_2 만료일자 */
        this.expiry_2 = "";
        /** @member {String} confirm_2 확인 */
        this.confirm_2 = "";
        /** @member {String} permission_3 허가일자 */
        this.permission_3 = "";
        /** @member {String} expiry_3 만료일자 */
        this.expiry_3 = "";
        /** @member {String} confirm_3 확인 */
        this.confirm_3 = "";
        /** @member {String} permission_4 허가일자 */
        this.permission_4 = "";
        /** @member {String} expiry_4 만료일자 */
        this.expiry_4 = "";
        /** @member {String} confirm_4 확인 */
        this.confirm_4 = "";

        // for barcode
        /** @member {String} barcode_type 바코드 종류 */
        this.barcode_type = "";
        /** @member {String} barcode_text 바코드 내용 */
        this.barcode_text = "";

        // for giro
        /** @member {String} giro_type 지로 종류 */
        this.giro_type = "";
        /** @member {String} giro_number 지로 번호 */
        this.giro_number = "";
        /** @member {String} giro_customer_number 지로 고객번호 */
        this.giro_customer_number = "";
        /** @member {String} giro_amount 지로 금액 */
        this.giro_amount = "";
        /** @member {String} giro_amount_code 지로 금액 코드 */
        this.giro_amount_code = "";
        /** @member {String} giro_code 지로 코드 */
        this.giro_code = "";
        /** @member {String} giro_due_date 지로 만료 기한 */
        this.giro_due_date = "";
        /** @member {String} giro_amount2 지로 금액2 */
        this.giro_amount2 = "";
        /** @member {String} giro_amount_code2 지로 금액 코드2 */
        this.giro_amount_code2 = "";
        /** @member {String} giro_mrz1 지로 MRZ1 */
        this.giro_mrz1 = "";
        /** @member {String} giro_mrz2 지로 MRZ2 */
        this.giro_mrz2 = "";
        /** @member {String} giro_payment_number 지로 납부 번호 */
        this.giro_payment_number = "";

        /** @member {int} cardDetected 0 : 카드박스가 찾아짐 <br>others : 카드박스 검출 실패 */
        this.cardDetected = false;
        /** @member {int} completed 0 : 스캔이 완료되지 않음<br>1 : 스캔이 완료됨 */
        this.completed = false;

        /** @member {int} error_code 에러 코드 */
        this.error_code = 0;

        /** @member {int} scanTime 스캔 시간 ms */
        this.scanTime = 0;

        /** @member {int} cameraWidth 카메라 가로 해상도 */
        this.cameraWidth = 0;
        /** @member {int} cameraHeight 카메라 세로 해상도 */
        this.cameraHeight = 0;

        /** @member {float} faceScore 얼굴 점수 */
        this.faceScore = 0.0;
        /** @member {float} colorScore 입력 프레임의 칼라/흑백 정도 점수 */
        this.colorScore = 0.0;
        /** @member {float} specularRatio 빛반사 점수 */
        this.specularRatio = 0.0;

        /** @member {RobiImage} cardImage 카드만 잘라낸 이미지 객체 */
        this.cardImage = null;
        /** @member {RobiImage} cardImage600 카드만 잘라낸 이미지 객체, over 600dpi */
        this.cardImage600 = null;
        /** @member {RobiImage} maskedCardImage 카드만 잘라낸 개인정보 삭제 이미지 객체 */
        this.maskedCardImage = null;
        /** @member {RobiImage} fullImage 전체 프리뷰 이미지 객체 */
        this.fullImage = null;
        /** @member {RobiImage} portraitImage 얼굴만 잘라낸 이미지 객체 */
        this.portraitImage = null;
        /** @member {RobiImage} portraitImage400 400x400(fit center)으로 크기 조정된 얼굴 이미지 객체 */
        this.portraitImage400 = null;

        // for creditcard
        /** @member {String} creditCardNumber 신용카드 번호 */
        this.creditCardNumber = "";
        /** @member {String} expiryDate 만료일 */
        this.expiryDate = "";
        /** @member {String} expiryMonth 만료일 - 월 */
        this.expiryMonth = "";
        /** @member {String} expiryYear 만료일 - 일 */
        this.expiryYear = "";
    }

    /**
     * ScanInfo 내에 존재하는 WASM native alloc 메모리를 해제한다.
     */
    release() {
        if (this.cardImage != null) {
            this.cardImage.release();
            this.cardImage = null;
        }
        if (this.maskedCardImage != null) {
            this.maskedCardImage.release();
            this.maskedCardImage = null;
        }
        if (this.fullImage != null) {
            this.fullImage.release();
            this.fullImage = null;
        }
        if (this.portraitImage != null) {
            this.portraitImage.release();
            this.portraitImage = null;
        }
        if (this.portraitImage400 != null) {
            this.portraitImage400.release();
            this.portraitImage400 = null;
        }

        this.idNumber = "";
        this.name = "";
        this.issueDate = "";
        this.issuer = "";

        // for ID only
        this.overseas = "";

        // for DriverLicense only
        this.driverLicenseNumber = "";
        this.aptitude = "";
        this.driverLicenseType = "";
        this.serial = "";
        this.driverLicenseKor = "";

        // for residence
        // for Passport only
        this.passportNumber = "";
        this.surName = "";
        this.givenName = "";
        this.passportType = "";
        this.nationality = "";
        this.dateOfBirth = "";
        this.gender = "";
        this.expiryDate = "";
        this.personalNumber = "";
        this.nameEng = "";
        this.mrz1 = "";
        this.mrz2 = "";
        // for residence only
        this.residenceVisaType = "";
        this.residenceVersion = "";
        this.residenceTypeCode = "";
        this.residenceNationalityCode = "";
        this.residenceNationalityRaw = "";
        this.residenceTitle = "";

        // for residence back
        this.permission_1 = "";
        this.expiry_1 = "";
        this.confirm_1 = "";
        this.permission_2 = "";
        this.expiry_2 = "";
        this.confirm_2 = "";
        this.permission_3 = "";
        this.expiry_3 = "";
        this.confirm_3 = "";
        this.permission_4 = "";
        this.expiry_4 = "";
        this.confirm_4 = "";

        // for barcode
        this.barcode_type = "";
        this.barcode_text = "";


        this.cardDetected = false;
        this.completed = false;

        this.error_code = 0;

        this.scanTime = 0;

        this.cameraWidth = 0;
        this.cameraHeight = 0;

        this.faceScore = 0.0;
        this.colorScore = 0.0;
        this.specularRatio = 0.0;

        // for creditcard
        this.creditCardNumber = "";
        this.expiryDate = "";
        this.expiryMonth = "";
        this.expiryYear = "";
    }

    /**
     * 주민등록증 정보를 저장하는 함수
     * @param {String} idnumber 주민등록번호
     * @param {String} name 이름
     * @param {String} issueDate 발행일 
     * @param {String} issuer 발행처
     * @param {boolean} overseas 재외국민 유무
     */
    setIDCardScanInfo(idnumber, name, issueDate, issuer, overseas) {
        this.cardType = ScanCardType.IDCARD;
        this.idNumber = idnumber;
        this.name = name;
        this.issueDate = issueDate;
        this.issuer = issuer;

        this.overseas = overseas;
    }

    /**
     * 운전면허증 정보를 저장하는 함수
     * @param {String} idnumber 주민등록번호
     * @param {String} name 이름
     * @param {String} issueDate 발행일 
     * @param {String} issuer 발행처
     * @param {String} licenseNumber 운전면허번호 
     * @param {String} aptitude 적성검사 기간
     * @param {String} licenseType 운전면허 종류
     * @param {String} serial 운전면허 시리얼 번호
     * @param {String} licenseKor ??
     */
    setDriverLicenseScanInfo(idnumber, name, issueDate, issuer, licenseNumber, aptitude, licenseType, serial, licenseKor) {
        this.cardType = ScanCardType.DRIVERLICENSE;
        this.idNumber = idnumber;
        this.name = name;
        this.issueDate = issueDate;
        this.issuer = issuer;

        this.driverLicenseNumber = licenseNumber;
        this.aptitude = aptitude;
        this.driverLicenseType = licenseType;
        this.serial = serial;
        this.licenseKor = licenseKor;
    }

    /**
     * 외국인 등록증/거소증 정보를 저장하는 함수
     * @param {String} nameKor 한글이름
     * @param {String} idNumber 등록 번호
     * @param {String} issueDate 발행일 
     * @param {String} issuer 발행처
     * @param {String} nameEng 영문이름
     * @param {String} nationality 국적
     * @param {String} visaType 비자타입
     * @param {String} version 버전(구형/신형)
     * @param {String} typeCode 비자타입 코드
     * @param {String} nationalityCode 국가코드
     * @param {String} nationalityRaw 국가명
     * @param {String} title 제목
     */
    setResidenceScanInfo(nameKor, idNumber, issueDate, issuer, nameEng, nationality,
        visaType, version, typeCode, nationalityCode, nationalityRaw, title) {
        this.cardType = ScanCardType.RESIDENCE;
        this.name = nameKor;
        this.idNumber = idNumber;
        this.issueDate = issueDate;
        this.issuer = issuer;
        this.nameEng = nameEng;
        this.nationality = nationality;
        this.residenceVisaType = visaType;
        this.residenceVersion = version;
        this.residenceTypeCode = typeCode;
        this.residenceNationalityCode = nationalityCode;
        this.residenceNationalityRaw = nationalityRaw;
        this.residenceTitle = title;
    }

    /**
     * 외국인 등록증/거소증 후면 정보를 저장하는 함수
     * @param {String} serial 일련번호
     * @param {String} permission_1 허가일자
     * @param {String} expiry_1 만료일자 
     * @param {String} confirm_1 확인
     * @param {String} permission_2 허가일자
     * @param {String} expiry_2 만료일자 
     * @param {String} confirm_2 확인
     * @param {String} permission_3 허가일자
     * @param {String} expiry_3 만료일자 
     * @param {String} confirm_3 확인
     * @param {String} permission_4 허가일자
     * @param {String} expiry_4 만료일자 
     * @param {String} confirm_4 확인
     */
    setResidenceBackScanInfo(serial,
        permission_1, expiry_1, confirm_1,
        permission_2, expiry_2, confirm_2,
        permission_3, expiry_3, confirm_3,
        permission_4, expiry_4, confirm_4) {
        this.cardType = ScanCardType.RESIDENCE_BACK;
        this.serial = serial;
        this.permission_1 = permission_1;
        this.expiry_1 = expiry_1;
        this.confirm_1 = confirm_1;
        this.permission_2 = permission_2;
        this.expiry_2 = expiry_2;
        this.confirm_2 = confirm_2;
        this.permission_3 = permission_3;
        this.expiry_3 = expiry_3;
        this.confirm_3 = confirm_3;
        this.permission_4 = permission_4;
        this.expiry_4 = expiry_4;
        this.confirm_4 = confirm_4;
    }

    /**
     * 여권 정보를 저장하는 함수
     * @param {String} idNumber 등록 번호
     * @param {String} name 한글이름
     * @param {String} issueDate 발행일 
     * @param {String} issuer 발행처
     * @param {String} nameEng 영문이름
     * @param {String} passportType 여권 종류
     * @param {String} passportNumber 여권 번호
     * @param {String} surName Sur name
     * @param {String} givenName Given name
     * @param {String} nationality 국적
     * @param {String} dateOfBirth 생일
     * @param {String} gender 성별
     * @param {String} expiryDate 만료일
     * @param {String} personalNumber 개인 번호
     * @param {String} nameEng 영문 이름
     * @param {String} mrz1 mrz1
     * @param {String} mrz1 mrz2
     */
    setPassportScanInfo(
        idnumber, name, nameEng, issueDate, issuer,
        passportType, passportNumber, surName, givenName, nationality,
        dateOfBirth, gender, expiryDate, personalNumber, mrz1, mrz2) {

        this.cardType = ScanCardType.PASSPORT;
        this.idNumber = idnumber;
        this.name = name;
        this.nameEng = nameEng;
        this.issueDate = issueDate;
        this.issuer = issuer;

        this.passportType = passportType;
        this.passportNumber = passportNumber;
        this.surName = surName;
        this.givenName = givenName;
        this.nationality = nationality;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.expiryDate = expiryDate;
        this.personalNumber = personalNumber;
        
        this.mrz1 = mrz1;
        this.mrz2 = mrz2;
    }

    /**
     * 바코드 정보를 저장하는 함수
     * @param {String} type 일련번호
     * @param {String} text 허가일자
     */
    setBarcodeScanInfo(type, text) {
        this.cardType = ScanCardType.BARCODE;
        this.barcode_type = type;
        this.barcode_text = text;
    }

    /**
     * 신용카드 정보를 저장하는 함수
     * @param {String} creditcard_number 신용카드 번호
     * @param {String} expiry 만료일(전체)
     * @param {String} expiry_year 만료일-년
     * @param {String} expiry_month 만료일-월
     */
    setCreditCardInfo(creditcard_number, expiry, expiry_year, expiry_month) {
        this.cardType = ScanCardType.CREDITCARD;
        this.creditCardNumber = creditcard_number;
        this.expiryDate = expiry;
        this.expiryYear = expiry_year;
        this.expiryMonth = expiry_month;
    }

    /**
     * 지로 정보를 저장하는 함수
     * @param {String} giro_type 지로 종류
     * @param {String} giro_number 지로 번호
     * @param {String} giro_customer_number 지로 고객번호
     * @param {String} giro_amount 지로 금액
     * @param {String} giro_amount_code 지로 금액 코드
     * @param {String} giro_code 지로 코드
     * @param {String} giro_due_date 지로 만료 기한
     * @param {String} giro_amount2 지로 금액2
     * @param {String} giro_amount_code2 지로 금액 코드2
     * @param {String} giro_mrz1 지로 MRZ1
     * @param {String} giro_mrz2 지로 MRZ2
     * @param {String} giro_payment_number 지로 납부 번호
     */
    setGiroScanInfo(giro_type, giro_number, giro_customer_number, giro_amount, giro_amount_code, giro_code, giro_due_date, giro_amount2, giro_amount_code2, giro_mrz1, giro_mrz2, giro_payment_number) {
        this.cardType = ScanCardType.GIRO;
        this.giro_type = giro_type;
        this.giro_number = giro_number;
        this.giro_customer_number = giro_customer_number;
        this.giro_amount = giro_amount;
        this.giro_amount_code = giro_amount_code;
        this.giro_code = giro_code;
        this.giro_due_date = giro_due_date;
        this.giro_amount2 = giro_amount2;
        this.giro_amount_code2 = giro_amount_code2;
        this.giro_mrz1 = giro_mrz1;
        this.giro_mrz2 = giro_mrz2;
        this.giro_payment_number = giro_payment_number;
    }

    /**
     * 이미지 정보를 저장하는 함수
     * @param {RobiImage} cardimage 카드만 잘라낸 이미지 객체
     * @param {RobiImage} maskedcardimage 카드만 잘라낸 개인정보 삭제 이미지 객체
     * @param {RobiImage} fullimage 전체 프리뷰 이미지 객체
     * @param {RobiImage} portraitimage 얼굴만 잘라낸 이미지 객체
     * @param {RobiImage} portraitimage400 400x400(fit center)으로 크기 조정된 얼굴 이미지 객체
     * @param {RobiImage} cardimage600 카드만 잘라낸 이미지 객체, over 600dpi
     */
    setImages(cardimage, maskedcardimage, fullimage, portraitimage, portraitimage400, cardimage600 = null) {
        this.cardImage = cardimage;
        this.maskedCardImage = maskedcardimage;
        this.fullImage = fullimage;
        this.portraitImage = portraitimage;
        this.portraitImage400 = portraitimage400;
        this.cardImage600 = cardimage600;
    }
}

/**
 * JPEG으로 인코딩된 이미지를 전달하기 위한 클래스
 */
export class RobiImage {
    /**
     * 생성자
     */
    constructor() {
        /** @member {Object} image wasm image object  */
        this.image = null;
        /** @member {typed_memory_view} encodedstream encoded jpeg stream*/
        this.encodedstream = null;
        /** @member {int} encodedsize encoded jpeg size */
        this.encodedsize = 0;
        /** @member {int} width jpeg width */
        this.width = 0;
        /** @member {int} height jpeg height */
        this.height = 0;
    }

    /**
     * wasm에서 생성된 메모리를 해제하기 위한 함수
     * 이미지 객체 사용 후, 반드시 release()를 호출해야 함
     * @example 
     * //
     * // RobiImage 사용 예시
     * //
     * let image = scanner.getCropCardImageJPEG(90);
     * // get encoded image info
     * var encodedstream = robiImage.encodedstream;
     * var encodedLength = robiImage.encodedsize;
     * 
     * // test code for show result image
     *     // base64 encoding
     * var binaryString = [encodedLength];
     * while(encodedLength--) {
     *     binaryString[encodedLength] = String.fromCharCode(encodedstream[encodedLength]);
     * }
     * var encodeddata = binaryString.join('');
     * var base64 = window.btoa(encodeddata);
     *     // locad image form base64 buffer
     * var img = new Image();
     * img.src = "data:image/jpeg;base64," + base64;
     * img.onload = function() {
     *     ctxout.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
     * }
     * img.onerror = function(stuff) {
     *     logger.error("img load fail : ", stuff);
     * }
     * 
     * // delete(free) encode image info
     * robiImage.release();
     */
    release() {
        if (this.image != null) {
            this.image.delete();
        }
        this.encodedstream = null;
        this.encodedsize = 0;
        this.width = 0;
        this.height = 0;
    }

    b64(is_fuzzed=false) {
        let binaryString = '';
        const len = this.encodedstream.length;
        for (let i = 0; i < len; i++) {
            binaryString += String.fromCharCode(this.encodedstream[i]);
        }

      //  return is_fuzzed ? binaryString : window.btoa(binaryString);
        return window.btoa(binaryString);
    }
}

/**
 * scanner/scanner_simd.js의 wasm 코드를 warpping하는 스캐너 클래스
 */
export class RobiScanner {
    /**
     * 생성자
     * @param {RobiLogger} logger - 개발 및 에러 정보 출력을 위한 로깅 클래스
     */
    constructor(logger) {
        this.scanner = null;
        this.recog_process = null;

        this.logger = logger;
        if(!this.logger) {
            this.logger = {};
            this.logger.debug = function(msg) {};
            this.logger.info = function(msg) {};
            this.logger.warn = function(msg) {};
            this.logger.error = function(msg) {};
            this.logger.result = function(msg) {};
        }
    }

    /**
     * 스캐너를 생성하고 초기화 하는 함수
     * @param {string} licenseKey 스캐너 라이선스 키
     * @param {int} scannerType 스캐너 종류 선택
     * @param {int} edgeType CAPUTRE 스캐너 EDGE_TYPE 선택
     * @returns {ScanErrorCode} 스캔 실패 유무
     */
    init(licenseKey, scannerType, edgeType, fuzz) {
        let start = performance.now();
        this.scanner = new Module.RobiCardScanner();
        let result_code = this.scanner.initEngine(licenseKey, scannerType, edgeType, fuzz);
        let end = performance.now();
        this.logger.debug("scanner init time : " + (end - start) + " ms");
        this.logger.debug("scanner info = " + this.scanner.getEngine_Info());
        return result_code;
    }

    /**
     * 서버전송에 필요한 키를 받아온다.
     * @returns server cert key
     */
    get_cert_key() {
        if( this.scanner != null ) {
            return this.scanner.get_cert_key();
        }
        else {
            return ""
        }
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
    set_frame_config(orientation, x, y, gw, gh, scale, flip, verification_cnt, dist_limit=0.2, minimal_scan=false) {
        if( this.scanner == null ) {
            this.logger.error("scanner is null");
            return;
        }
        this.scanner.setFrameConfig(orientation, x, y, gw, gh, scale, flip, verification_cnt, dist_limit, minimal_scan);
        //this.scanner.setFrameConfig(orientation, x, y, gw, gh, scale, flip);
        return;
    }

    /**
     * 프래임에서 카드 박스를 검출하는 함수
     * @param {Int8Array} memory video에서 가져온 frame buffer RGB 
     * @param {int} width video.videoWidth
     * @param {int} height video.videoHeight
     * @returns {ScanErrorCode} 스캔 실패 유무
     */
    detect_frame(memory, width, height) {
        let result_code = -1;
        if (this.scanner != null) {
            result_code = this.scanner.detect(memory, width, height);
        }
        else {
            this.logger.error("error : runtime error, RobiCardScanner not created!");
        }
        return result_code;
    }

    /**
     * 프레임에서 신분증 정보를 인식하는 함수
     * @returns {ScanErrorCode} 스캔 실패 유무
     */
    recog_frame() {
        let result_code = -1;
        if (this.scanner != null) {
            result_code = this.scanner.recog();
        }
        else {
            this.logger.error("error : runtime error, RobiCardScanner not created!");
        }
        return result_code;
    }

    /**
     * 스캔이 완료되었는지 확인하는 함수
     * @returns {bool} 스캔 완료 유무
     */
    isScanComplete() {
        return this.scanner.getScanInfo_Completed();
    }

    /**
     * 스캔된 정보를 ScanInfo에 저장하는 함수
     * @returns {ScanInfo} 스캔 결과
     */
    getResultInfo(withImages = false, quality=90) {
        let scanInfo = new ScanInfo();

        let cardType = this.scanner.getScanInfo_CardType();

        scanInfo.completed = this.scanner.getScanInfo_Completed();

        if (cardType == ScanCardType.IDCARD) {
            scanInfo.setIDCardScanInfo(
                this.scanner.getIdInfo_IDnum(),
                this.scanner.getIdInfo_Name(),
                this.scanner.getIdInfo_IssueDate(),
                this.scanner.getIdInfo_Issuer(),
                this.scanner.getIdInfo_Overseas()
            );

            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    this.getMaskedCropCardImageJPEG(quality),
                    this.getFullImageJPEG(quality),
                    this.getFaceImageJPEG(quality),
                    this.getFace400ImageJPEG(quality),
                    //this.getCropCardImageJPEG_600(quality)
                );
            }
        }
        else if (cardType == ScanCardType.DRIVERLICENSE) {
            scanInfo.setDriverLicenseScanInfo(
                this.scanner.getDlInfo_IDnum(),
                this.scanner.getDlInfo_Name(),
                this.scanner.getDlInfo_IssueDate(),
                this.scanner.getDlInfo_Issuer(),
                this.scanner.getDlInfo_LicenseNumber(),
                this.scanner.getDlInfo_Aptitude(),
                this.scanner.getDlInfo_LicenseType(),
                this.scanner.getDlInfo_Serial(),
                this.scanner.getDlInfo_LicneseKor()
            );

            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    this.getMaskedCropCardImageJPEG(quality),
                    this.getFullImageJPEG(quality),
                    this.getFaceImageJPEG(quality),
                    this.getFace400ImageJPEG(quality),
                    //this.getCropCardImageJPEG_600(quality)
                );
            }
        }
        else if (cardType == ScanCardType.RESIDENCE) {
            scanInfo.setResidenceScanInfo(
                this.scanner.getResidenceInfo_NameKor(),
                this.scanner.getResidenceInfo_idNumber(),
                this.scanner.getResidenceInfo_IssueDate(),
                this.scanner.getResidenceInfo_Issuer(),
                this.scanner.getResidenceInfo_NameEng(),
                this.scanner.getResidenceInfo_Nationality(),
                this.scanner.getResidenceInfo_VisaType(),
                this.scanner.getResidenceInfo_Version(),
                this.scanner.getResidenceInfo_TypeCode(),
                this.scanner.getResidenceInfo_NationalityCode(),
                this.scanner.getResidenceInfo_NationalityRaw(),
                this.scanner.getResidenceInfo_Title()
            );

            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    this.getMaskedCropCardImageJPEG(quality),
                    this.getFullImageJPEG(quality),
                    this.getFaceImageJPEG(quality),
                    this.getFace400ImageJPEG(quality),
                    //this.getCropCardImageJPEG_600(quality)
                );
            }
        }
        else if (cardType == ScanCardType.RESIDENCE_BACK) {
            scanInfo.setResidenceBackScanInfo(
                this.scanner.getResidenceBackInfo_Serial(),
                this.scanner.getResidenceBackInfo_Permission_1(),
                this.scanner.getResidenceBackInfo_Expiry_1(),
                this.scanner.getResidenceBackInfo_Confirm_1(),
                this.scanner.getResidenceBackInfo_Permission_2(),
                this.scanner.getResidenceBackInfo_Expiry_2(),
                this.scanner.getResidenceBackInfo_Confirm_2(),
                this.scanner.getResidenceBackInfo_Permission_3(),
                this.scanner.getResidenceBackInfo_Expiry_3(),
                this.scanner.getResidenceBackInfo_Confirm_3(),
                this.scanner.getResidenceBackInfo_Permission_4(),
                this.scanner.getResidenceBackInfo_Expiry_4(),
                this.scanner.getResidenceBackInfo_Confirm_4(),
            );

            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    this.getMaskedCropCardImageJPEG(quality),
                    this.getErrorImageJPEG(),
                    this.getErrorImageJPEG(),
                    this.getErrorImageJPEG()
                );
            }
        }
        else if (cardType == ScanCardType.PASSPORT) {
            scanInfo.setPassportScanInfo(
                this.scanner.getPassportInfo_idNumber(),
                this.scanner.getPassportInfo_NameKor(),
                this.scanner.getPassportInfo_NameEng(),
                this.scanner.getPassportInfo_IssueDate(),
                this.scanner.getPassportInfo_Issuer(),
                this.scanner.getPassportInfo_PassportType(),
                this.scanner.getPassportInfo_PassportNumber(),
                this.scanner.getPassportInfo_SurName(),
                this.scanner.getPassportInfo_GivenName(),
                this.scanner.getPassportInfo_Nationality(),
                this.scanner.getPassportInfo_DateOfBirth(),
                this.scanner.getPassportInfo_Gender(),
                this.scanner.getPassportInfo_ExpiryDate(),
                this.scanner.getPassportInfo_PersonalNumber(),
                this.scanner.getPassportInfo_MRZ1(),
                this.scanner.getPassportInfo_MRZ2()
            );

            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    this.getMaskedCropCardImageJPEG(quality),
                    this.getFullImageJPEG(quality),
                    this.getFaceImageJPEG(quality),
                    this.getFace400ImageJPEG(quality),
                    //this.getCropCardImageJPEG_600(quality)
                );
            }
        }
        else if (cardType == ScanCardType.CAPTURE) {
            scanInfo.cardType = ScanCardType.CAPTURE;
            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    null,
                    null,
                    null,
                    null,
                    null
                );
            }
        }
        else if (cardType == ScanCardType.BARCODE) {
            scanInfo.setBarcodeScanInfo(
                this.scanner.getBarcodeInfo_Type(),
                this.scanner.getBarcodeInfo_Text()
            )
        }
        else if (cardType == ScanCardType.CREDITCARD) {
            scanInfo.setCreditCardInfo(
                this.scanner.getCreditCardNumber(),
                this.scanner.getExpiry(),
                this.scanner.getExpiryYear(),
                this.scanner.getExpiryMonth()
            )
        }
        else if (cardType == ScanCardType.GIRO) {
            scanInfo.setGiroScanInfo(
                this.scanner.getGiroType(),
                this.scanner.getGiroNumber(),
                this.scanner.getGiroCustomerNumber(),
                this.scanner.getGiroAmount(),
                this.scanner.getGiroAmountCode(),
                this.scanner.getGiroCode(),
                this.scanner.getGiroDueDate(),
                this.scanner.getGiroAmount2(),
                this.scanner.getGiroAmountCode2(),
                this.scanner.getGiroMrz1(),
                this.scanner.getGiroMrz2(),
                this.scanner.getGiroPaymentNumber()
            );
            if (withImages) {
                scanInfo.setImages(
                    this.getCropCardImageJPEG(quality),
                    null,
                    this.getFullImageJPEG(quality),
                    null,
                    null,
                    null
                );
            }
        }
        else {
            scanInfo.error_code = ScanErrorCode.ERROR_UNKNOWN_CARD_TYPE;
        }

        scanInfo.scanTime = this.scanner.getTotalScanTime();

        // set evaluation points
        scanInfo.faceScore = this.scanner.getFaceScore();
        scanInfo.colorScore = this.scanner.getColorScore();
        scanInfo.specularRatio = this.scanner.getSpecularRatio();
        return scanInfo;
    }

    /**
     * 스캔된 카드의 이미지만 크롭된 결과물을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getCropCardImageJPEG(quality) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getCropCardImageJPEG(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();
        return ret_image;
    }

    /**
     * 스캔된 카드의 이미지만 크롭된 결과물을 600dpi jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getCropCardImageJPEG_600(quality) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getCropCardImageJPEG_600(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();
        return ret_image;
    }

    /**
     * 스캔된 카드의 이미지만 크롭된 결과물을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 입력된 width/height의 크기로 출력되며, extend_ratio(0.0~1.0)의 값 만큼 외부 여백을 포함합니다.
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @param {int} width 출력될 이미지의 가로 크기
     * @param {int} height jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @param {float} extend_ratio jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getCropCardImageWithMarginJPEG(quality, width, height, extend_ratio) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getCropCardImageWithMarginJPEG(quality, width, height, extend_ratio);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();
        return ret_image;
    }

    /**
     * 스캔된 카드의 이미지만 크롭한구 개인정보를 마스킹처리한 결과물을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getMaskedCropCardImageJPEG(quality) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getMaskedCropCardImageJPEG(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();

        return ret_image;
    }

    /**
     * 스캔된 카메라 프리뷰 영상을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getFullImageJPEG(quality) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getFullImageJPEG(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();

        return ret_image;
    }

    /**
     * Base64 인코딩된 에러 이미지를 얻어오는 함수
     */
    getErrorImageJPEG() {
        if( this.scanner != null ) {
            return this.scanner.getErrorImage();
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
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getMaskedFullImageJPEG(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();

        return ret_image;
    }
    */

    /**
     * 스캔된 신분증의 사진을 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getFaceImageJPEG(quality) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getFaceImageJPEG(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();

        return ret_image;
    }

    /**
     * 스캔된 신분증의 사진을 400x400에 fillcenter 크기의 jpeg으로 인코딩된 상태로 받아오는 함수<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @param {int} quality jpeg 인코딩시 적용할 화질 레벨(0~100)
     * @returns {RobiImage} 결과 이미지 객체
     */
    getFace400ImageJPEG(quality) {
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getFace400ImageJPEG(quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();

        return ret_image;
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
        let ret_image = new RobiImage();
        ret_image.image = this.scanner.getFrameImageJPEG(buffer, width, height, quality);
        ret_image.encodedstream = ret_image.image.getBuffer();
        ret_image.width = ret_image.image.getWidth();
        ret_image.height = ret_image.image.getHeight();
        ret_image.encodedsize = ret_image.image.getCompressedSize();

        return ret_image;
    }

    /**
     * fullImage의 주민등록번호 및 운전면호 번호에 마스킹된 이미지를 출력한다<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @returns {Int32Array} 결과 이미지 객체
     */
    getFullImageMaskedRoiList() {
        let result = this.scanner.getFullFrameMaskedRoiList();
        let elements = result.split(',');
        let elements_size = elements.length - 1;
        var ret = new Int32Array(elements_size);
        for (var i = 0; i < elements_size; i++) {
            ret[i] = Number(elements[i]);
        }
        ret = this.chunk(ret, 4);
        return ret;
    }

    /**
     * cropImage의 주민등록번호 및 운전면호 번호에 마스킹된 이미지를 출력한다<br>
     * 사용이 완료된 후, 반드시 객체의 release()를 호출해야 함 @see {@link RobiImage#release}
     * @returns {Int32Array} 결과 이미지 객체
     */
    getCropMaskedRoiList() {
        let result = this.scanner.getCropMaskedRoiList();
        let elements = result.split(',');
        let elements_size = elements.length - 1;
        var ret = new Int32Array(elements_size);
        for (var i = 0; i < elements_size; i++) {
            ret[i] = Number(elements[i]);
        }
        ret = this.chunk(ret, 4);
        return ret;
    }

    chunk(data = [], size = 1) {
        const arr = [];

        for (let i = 0; i < data.length; i += size) {
            arr.push('(' + data.slice(i, i + size) + ')');
        }

        return arr;
    }

    /**
     * 스캐너를 초기화 하는 함수
     */
    reset() {
        if (this.scanner != null) {
            this.scanner.destroyEngine();
        }
    }

    /** 
     * 스캐너를 메모리에서 해제하는 함수 
     */
    release() {
        if (this.scanner != null) {
            this.scanner.delete();
        }
    }

    /**
     * fuzz 되었는지 확인하는 함수
     */
    isFuzzed() {
        if(this.scanner) {
            return this.scanner.isFuzzed();
        }
        return false;
    }

    getErrorMessage() {
        if(this.scanner) {
            return this.scanner.getErrorMessage();
        }
        return "";
    }
}