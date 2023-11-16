import { ScannerStatus, ScannerType, CaptureEdgeType, ScanCardType, RetryType } from '../modules/scanner/scanner_constants.js';
import * as util from '../scripts/util.js';

export const ViewElem = {
    root: document.querySelector(":root"), // 최상위 요소
    scanBoxMask: document.getElementById("scanBoxMask"), // 가이드렉트 마스킹
    scanBoxGuide: document.getElementById("scanBoxGuide"),
    scanBoxLoading: document.getElementById("scanBoxLoading"),
    scanContainer: document.getElementById("scanContainer"),
    resultContainer: document.getElementById("resultContainer"),
    resultCanvas: document.getElementById("resultCanvas"),
};

export const ScanBoxOrientaion = {
    PORTRAIT: "portrait",
    LANDSCAPE: "landscape"
}

const ScanBoxOrientaionWidth = {
    [ScanBoxOrientaion.PORTRAIT]: {
        lg: "500px",
        md: "340px",
        sm: "300px",
        xs: "260px",
    },
    [ScanBoxOrientaion.LANDSCAPE]: {
        lg: "400px",
        md: "240px",
        sm: "200px",
        xs: "160px",
    },
};

export function detectCallback(detected) {
    // 해당 기능 필요 시 고객사에서 구현 가능
    if (detected) {
        
    } else {
        
    }
}

export function update(viewWidth, viewHeight, guideRect) {
    // 해당 기능 필요 시 고객사에서 구현 가능

}

export function resultCallback(status, result) {
    /**
     * 결과 코드에 따른 고객사 콜백 UI 처리
     * 고객사에서 원하는 시나리오에 따라 콜백 함수의 내용 구현 필요
     */
    if(status === ScannerStatus.SCANNER_INIT_FAIL) {
        // 스캐너 초기화 실패
    } else if(status === ScannerStatus.CAMERA_OPENING_FAIL) {
        // 카매라 오픈 실패
    } else if(status === ScannerStatus.UNKNOWN) {
        // 알 수 없는 상태
    } else if(status === ScannerStatus.GET_DEVICE) {
        // 시스템에서 device 정보를 얻어오기 진행
    } else if(status === ScannerStatus.CAMERA_OPENING) {
        // 카메라 오픈 진행
    } else if(status === ScannerStatus.CAMERA_OPENNED) {
        // 카메라 오픈 완료
    } else if(status === ScannerStatus.SCANNER_INIT) {
        // 스캐너 초기화 진행
        clearResultDesc();
    } else if(status === ScannerStatus.SCANNER_READY) {
        // 스캐너 로딩 완료
    } else if(status === ScannerStatus.SCAN_DETECT) {
        // Card box를 찾음
    } else if(status === ScannerStatus.SCAN_COMPLETE) {
        // 스캔이 완료됨
        if(result.lastRetryType === RetryType.SUCCESS) {
            printResultText(result);

            if(!result.fuzzed) {
                /*
                if(result.scanResult && result.scanResult.maskedCardImage) {
                    showResultImage(result.scanResult.maskedCardImage.b64(result.fuzzed), 
                        () => {
                            util.sleep(1000).then(() => {
                                let isConfirm = confirm("스캔 결과 이미지입니다.\n확인 버튼을 누르면 이미지가 삭제됩니다.");
                                if(isConfirm) {
                                    clearResultCanvas();
                                }
                            });
                        });
                }*/
                if(result.scanResult)
                    showResultImage(result.scanResult.cardImage.b64(is_fuzzed))
            }
        }
    } else if(status === ScannerStatus.STOP_CAMERA) {
        // 카메라 및 스캐너 종료 진행
    } else if(status === ScannerStatus.SCAN_TO_SERVER) {
        // Detect card 시간 초과로 인식을 서버로 전송
    } else if(status === ScannerStatus.SCAN_TIME_OUT) {
        // Time out으로 인한 스캔 종료
    } else if(status === ScannerStatus.SCAN_RECOG_TIME_OUT) {
        // recogTimeOut 발생을 noti하는 상태값
    } else if(status === ScannerStatus.SCAN_TIMELIMIT_OVER) {
        // detect algorithm 수행시간이 너무 길어 수동 모드로 전환을 권고
    } else if(status === ScannerStatus.SCANNER_INIT_TIMEOUT) {
        // 네트워크 장애 등 여러가지 이유로 스캐너 초기화가 오래 걸릴 경우 타임아웃 발생
    }
}

/**
 * 초기 UI 렌더링
 */
export function renderInitUI(scannerType, captureEdgeType, sbsr, sbx, sby, isAuto) {
    let theme = ViewElem.root; // 가상 클래스 요소 얻기

    if (scannerType === ScannerType.IDCARD_SCANNER) {
        document.title = "ID Card | " + document.title;
        document.getElementById("scanBoxDesc").innerText =
        "신분증을 네모칸 안에 맞추세요.";
    } else if (scannerType === ScannerType.PASSPORT_SCANNER) {
        document.title = "Passport | " + document.title;
        document.getElementById("scanBoxDesc").innerText =
        "여권을 네모칸 안에 맞추세요.";
    } else if (scannerType === ScannerType.RESIDENCE_SCANNER) {
        document.title = "Residence Front | " + document.title;
        document.getElementById("scanBoxDesc").innerText =
        "외국인등록증 앞면을 네모칸 안에 맞추세요.";
    } else if (scannerType === ScannerType.RESIDENCE_BACK_SCANNER) {
        document.title = "Residence Back | " + document.title;
        document.getElementById("scanBoxDesc").innerText =
        "외국인등록증 뒷면을 네모칸 안에 맞추세요.";
    } else if (scannerType === ScannerType.CAPTURE) {
        if (captureEdgeType === CaptureEdgeType.CARD) {
            document.title = "Card Capture | " + document.title;
            document.getElementById("scanBoxDesc").innerText =
                "캡처할 카드를 네모칸 안에 맞추세요.";
        } else if (captureEdgeType === CaptureEdgeType.PASSPORT) {
            document.title = "Passport Capture | " + document.title;
            document.getElementById("scanBoxDesc").innerText =
                "캡처할 여권을 네모칸 안에 맞추세요.";
        } else if (captureEdgeType === CaptureEdgeType.A4) {
            document.title = "Passport Capture | " + document.title;
            document.getElementById("scanBoxDesc").innerText =
                "캡처할 A4를 네모칸 안에 맞추세요.";
        }
    }

    theme.style.setProperty("--scan-box-size-ratio", sbsr);
    theme.style.setProperty("--scan-box-xpos-norm", sbx);
    theme.style.setProperty("--scan-box-ypos-norm", sby);

    showAutoCameraToggle(isAuto);
}

export function showAutoCameraToggle(isAuto) {
    let iosVersion = util.getIosVersion();
    let versionNumber = iosVersion && parseFloat(iosVersion);
    let autoCameraToggle = document.getElementById("autoCameraToggle");
    let takeCameraBtn = document.getElementById("camera-btn_layout");

    // iOS 13.3 버전, 카메라 수동 전환 및 토글 비활성화
    if (versionNumber === 13.3) {
        showToast('iOS 13.3 버전은 자동촬영 모드를 사용할 수 없습니다.', "default");
        // alert("This ios version is not supported AUTO mode.");

        autoCameraToggle.style.backgroundImage = "url('./images/camera_manual_toggle-pressed.png')";
        autoCameraToggle.disabled = true;
        takeCameraBtn.style.display = "flex";
        return;
    }

    if (isAuto) {
        autoCameraToggle.style.backgroundImage = "url('./images/camera_auto_toggle.png')";
        takeCameraBtn.style.display = "none";
    } else {
        autoCameraToggle.style.backgroundImage = "url('./images/camera_manual_toggle.png')";
        takeCameraBtn.style.display = "flex";
    }
}

/**
 * 디텍트 상태에 따른 UI를 렌더링
 */
export function renderDetectUI(status, scannerType) {
    if (!status) return;

    if (status === ScannerStatus.SCANNER_INIT) {
        ViewElem.scanBoxMask.className ="scan-box__mask--init";
        ViewElem.scanBoxGuide.className ="scan-box__guide--init";

        ViewElem.scanBoxLoading.style.display = "block";
        ViewElem.scanContainer.style.display = "block";
        ViewElem.resultContainer.style.display = "none";

        if (scannerType === ScannerType.PASSPORT_SCANNER) {
            document.getElementById("scanBoxPassportPhoto").style.display = "none";
            document.getElementById("scanBoxPassportMrz").style.display = "none";
        }
    } else if (status === ScannerStatus.SCANNER_READY) {
        ViewElem.scanBoxMask.className = "scan-box__mask--ready";
        ViewElem.scanBoxGuide.className = "scan-box__guide--ready";

        ViewElem.scanBoxLoading.style.display = "none";
        ViewElem.scanContainer.style.display = "block";
        ViewElem.resultContainer.style.display = "none";

        if (scannerType === ScannerType.PASSPORT_SCANNER) {
            document.getElementById("scanBoxPassportPhoto").style.display = "none";
            document.getElementById("scanBoxPassportMrz").style.display = "none";
        }
    } else if (status === ScannerStatus.SCAN_DETECT) {
        ViewElem.scanBoxMask.className = "scan-box__mask--ready";
        ViewElem.scanBoxGuide.className = "scan-box__guide--detect";

        ViewElem.scanBoxLoading.style.display = "none";
        ViewElem.scanContainer.style.display = "block";
        ViewElem.resultContainer.style.display = "none";

        if (scannerType === ScannerType.PASSPORT_SCANNER) {
            document.getElementById("scanBoxPassportPhoto").style.display = "block";
            document.getElementById("scanBoxPassportMrz").style.display = "block";
        }
    } else if (status === ScannerStatus.SCAN_COMPLETE) {
        ViewElem.scanBoxMask.className = "scan-box__mask--ready";
        ViewElem.scanBoxGuide.className = "scan-box__guide--complete";

        ViewElem.scanBoxLoading.style.display = "none";
        ViewElem.scanContainer.style.display = "none";
        ViewElem.resultContainer.style.display = "block";

        if (scannerType === ScannerType.PASSPORT_SCANNER) {
            document.getElementById("scanBoxPassportPhoto").style.display = "none";
            document.getElementById("scanBoxPassportMrz").style.display = "none";
        }
    }
}

/**
 * Scan Box 가이드라인 재조정
 */
export function resizeScanBoxGuide(vw, orientation) {
    let theme = ViewElem.root;
    let scanBoxWidth = ScanBoxOrientaionWidth[orientation];

    if (vw > 600) {
        theme.style.setProperty("--scan-box-width", scanBoxWidth.lg);
    } else if (vw <= 600 && vw > 360) {
        let isIos = util.isIosDevice();
        if (isIos) {
            theme.style.setProperty("--scan-box-width", scanBoxWidth.sm);
        } else {
            theme.style.setProperty("--scan-box-width", scanBoxWidth.md);
        }
    } else if (vw <= 360 && vw > 320) {
        theme.style.setProperty("--scan-box-width", scanBoxWidth.sm);
    } else if (vw <= 320) {
        theme.style.setProperty("--scan-box-width", scanBoxWidth.xs);
    }
}

export function clearResultDesc() {
    setResultDesc("");
}

export function setResultDesc(msg) {
    document.getElementById("resultBoxDesc").innerHTML = msg;
}

// 화면에 토스트 알림 띄우기
export function showToast(msg, slot="default") {
    let msgTimerId = 0;
    let toast = $("#toast");

    if (slot === "top") {
        toast.css("top", "33px");
        toast.css("bottom", "");
    } else if (slot === "bottom") {
        toast.css("top", "");
        toast.css("bottom", "-13px");
    } else {
        toast.css("top", "15%");
        toast.css("bottom", "");
    }

    toast.children().html(msg);
    setTimeout(function () {
        toast.fadeIn(500, function () {
        msgTimerId = setTimeout(function () {
            toast.fadeOut(1000);
            clearTimeout(msgTimerId);
        }, 1000);
        });
    }, 200);
}

export function showResultImage(base64Image, callback=null) {
    if(!base64Image) {
        if(callback) {
            callback();
        }
        return;
    }
    let img = new Image();
    const b64prefix = "data:image/jpeg;base64,";
    if(!base64Image.startsWith(b64prefix)) {
        base64Image = b64prefix + base64Image;
    }
    img.src = base64Image;
    img.onload = function () {
        let canvas = ViewElem.resultCanvas;
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

        if(callback) {
            callback();
        }
    };
}

export function clearResultCanvas() {
    let canvas = ViewElem.resultCanvas;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function printResultText(result) {
    if(!result) {
        return;
    }

    let resultDesc = "";

    const scanResult = result.scanResult;
    if(!scanResult) {
        return;
    }
    const cardType = scanResult.cardType;

    if (cardType === ScanCardType.IDCARD) {
        resultDesc += `&bull;Scan Type: ID Card<br/>`;
        resultDesc += `&bull;ID Number: ${scanResult.idNumber}<br/>`;
        resultDesc += `&bull;Name: ${scanResult.name}<br/>`;
        resultDesc += `&bull;IssueDate: ${scanResult.issueDate}<br/>`;
        resultDesc += `&bull;Issuer: ${scanResult.issuer}<br/>`;
        resultDesc += `&bull;Overseas: ${scanResult.overseas == 0 ? false : true}<br/>`;
        resultDesc += `&bull;Face Score: ${scanResult.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${scanResult.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${scanResult.specularRatio}<br/>`;
    } else if (cardType === ScanCardType.DRIVERLICENSE) {
        resultDesc += `&bull;Scan Type: DriverLicense Card<br/>`;
        resultDesc += `&bull;ID Number: ${scanResult.idNumber}<br/>`;
        resultDesc += `&bull;Name: ${scanResult.name}<br/>`;
        resultDesc += `&bull;IssueDate: ${scanResult.issueDate}<br/>`;
        resultDesc += `&bull;Issuer: ${scanResult.issuer}<br/>`;
        resultDesc += `&bull;DL Number: ${scanResult.driverLicenseNumber}<br/>`;
        resultDesc += `&bull;DL Aptitude: ${scanResult.aptitude}<br/>`;
        // resultDesc += `&bull;DL Type: ${scanResult.driverLicenseType}<br/>`;
        resultDesc += `&bull;DL Serial: ${scanResult.serial}<br/>`; // help: 주석 제거
        // resultDesc += `&bull;DL LicenseKor: ${scanResult.driverLicenseKor}<br/>`;
        resultDesc += `&bull;Face Score: ${scanResult.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${scanResult.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${scanResult.specularRatio}<br/>`;
    } else if (cardType === ScanCardType.RESIDENCE) {
        resultDesc += `&bull;Scan Type: Residence<br/>`;
        resultDesc += `&bull;ID Number: ${scanResult.idNumber}<br/>`;
        //resultDesc += `&bull;Name: ${scanResult.name}<br/>`;
        resultDesc += `&bull;IssueDate: ${scanResult.issueDate}<br/>`;
        //resultDesc += `&bull;Issuer: ${scanResult.issuer}<br/>`;
        resultDesc += `&bull;NameEng: ${scanResult.nameEng}<br/>`;
        resultDesc += `&bull;Nationality: ${scanResult.nationality}<br/>`;
        resultDesc += `&bull;VisaType: ${scanResult.residenceVisaType}<br/>`;
        let typeText= "";
        if (scanResult.residenceTypeCode === "0") {
            typeText = "외국인등록증";
        } else if (scanResult.residenceTypeCode === "1") {
            typeText = "국내거소신고증";
        } else if (scanResult.residenceTypeCode === "2") {
            typeText = "영주증";
        }
        resultDesc += `&bull;TypeCode: ${typeText}<br/>`;
        resultDesc += `&bull;Face Score: ${scanResult.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${scanResult.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${scanResult.specularRatio}<br/>`;
        
    } else if (scanResult.cardType === ScanCardType.RESIDENCE_BACK) {
        resultDesc += `&bull;Scan Type: Residence Back<br/>`;
        resultDesc += `&bull;Serial: ${scanResult.serial}<br/>`;                //일련번호  JTAG_ID_SERIAL
        resultDesc += `&bull;Permission_1: ${scanResult.permission_1}<br/>`;    //허가일자1 JTAG_ID_PERMISSION1
        resultDesc += `&bull;Expiry_1: ${scanResult.expiry_1}<br/>`;            //만료일자1 JTAG_ID_EXPIRY1
        resultDesc += `&bull;Confirm_1: ${scanResult.confirm_1}<br/>`;          //확인1    JTAG_ID_CONFIRM1 
        resultDesc += `&bull;Permission_2: ${scanResult.permission_2}<br/>`;    //허가일자2 JTAG_ID_PERMISSION2
        resultDesc += `&bull;Expiry_2: ${scanResult.expiry_2}<br/>`;            //만료일자2 JTAG_ID_EXPIRY2
        resultDesc += `&bull;Confirm_2: ${scanResult.confirm_2}<br/>`;          //확인2    JTAG_ID_CONFIRM2 
        resultDesc += `&bull;Permission_3: ${scanResult.permission_3}<br/>`;    //허가일자3 JTAG_ID_PERMISSION3
        resultDesc += `&bull;Expiry_3: ${scanResult.expiry_3}<br/>`;            //만료일자3 JTAG_ID_EXPIRY3
        resultDesc += `&bull;Confirm_3: ${scanResult.confirm_3}<br/>`;          //확인3    JTAG_ID_CONFIRM3 
        resultDesc += `&bull;Permission_4: ${scanResult.permission_4}<br/>`;    //허가일자4 JTAG_ID_PERMISSION4
        resultDesc += `&bull;Expiry_4: ${scanResult.expiry_4}<br/>`;            //만료일자4 JTAG_ID_EXPIRY4
        resultDesc += `&bull;Confirm_4: ${scanResult.confirm_4}<br/>`;          //확인4    JTAG_ID_CONFIRM4
        
    } else if (scanResult.cardType === ScanCardType.PASSPORT) {
        resultDesc += `&bull;Scan Type: Passport<br/>`;
        resultDesc += `&bull;ID Number: ${scanResult.idNumber}<br/>`;
        resultDesc += `&bull;Name: ${scanResult.name}<br/>`;
        resultDesc += `&bull;IssueDate: ${scanResult.issueDate}<br/>`;
        resultDesc += `&bull;Issuer: ${scanResult.issuer}<br/>`;
        resultDesc += `&bull;PassportType: ${scanResult.passportType}<br/>`;
        resultDesc += `&bull;PassportNumber: ${scanResult.passportNumber}<br/>`;
        resultDesc += `&bull;SurName: ${scanResult.surName}<br/>`;
        resultDesc += `&bull;GivenName: ${scanResult.givenName}<br/>`;
        resultDesc += `&bull;Nationality: ${scanResult.nationality}<br/>`;
        resultDesc += `&bull;Date Of Birth: ${scanResult.dateOfBirth}<br/>`;
        resultDesc += `&bull;Gender: ${scanResult.gender}<br/>`;
        resultDesc += `&bull;Expiry Date: ${scanResult.expiryDate}<br/>`;
        resultDesc += `&bull;PersonalNumber: ${scanResult.personalNumber}<br/>`;
        resultDesc += `&bull;Name ENG: ${scanResult.nameEng}<br/>`;
        resultDesc += `&bull;MRZ 1: ${scanResult.mrz1.replace(/</gi, '&lt;')}<br/>`;
        resultDesc += `&bull;MRZ 2: ${scanResult.mrz2}<br/>`;
        resultDesc += `&bull;Face Score: ${scanResult.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${scanResult.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${scanResult.specularRatio}<br/>`;
    } else if (scanResult.cardType === ScanCardType.CAPTURE) {
        resultDesc += `&bull;Scan Type: Capture<br/>`;
    } else if (scanResult.cardType === ScanCardType.BARCODE) {
        resultDesc += `&bull;Scan Type: Barcode<br/>`;
        resultDesc += `&bull;BarcodeType: ${scanResult.barcode_type}<br/>`;
        resultDesc += `&bull;BarcodeText: ${scanResult.barcode_text}<br/>`;
    } else if (scanResult.cardType == ScanCardType.CREDITCARD) {
        resultDesc += `&bull;Scan Type: CreditCard<br/>`;
        resultDesc += `&bull;CreditCardNumber: ${scanResult.creditCardNumber}<br/>`;
        resultDesc += `&bull;Expiry: ${scanResult.expiryDate}<br/>`;
        resultDesc += `&bull;ExpiryYear: ${scanResult.expiryYear}<br/>`;
        resultDesc += `&bull;ExpiryMonth: ${scanResult.expiryMonth}<br/>`;
    } else if (scanResult.cardType == ScanCardType.GIRO) {
        resultDesc += `&bull;Scan Type: Giro<br/>`;
        resultDesc += `&bull;GiroType: ${scanResult.giro_type}<br/>`;
        resultDesc += `&bull;GiroNum: ${scanResult.giro_number}<br/>`;
        resultDesc += `&bull;GiroCustomerNum: ${scanResult.giro_customer_number}<br/>`;
        resultDesc += `&bull;GiroAmount: ${scanResult.giro_amount}<br/>`;
        resultDesc += `&bull;GiroAmountCode: ${scanResult.giro_amount_code}<br/>`;
        resultDesc += `&bull;GiroCode: ${scanResult.giro_code}<br/>`;
        resultDesc += `&bull;GiroDueDate: ${scanResult.giro_due_date}<br/>`;
        resultDesc += `&bull;GiroAmount2: ${scanResult.giro_amount2}<br/>`;
        resultDesc += `&bull;GiroAmountCode2: ${scanResult.giro_amount_code2}<br/>`;
        resultDesc += `&bull;GiroMRZ1: ${scanResult.giro_mrz1}<br/>`;
        resultDesc += `&bull;GiroMRZ2: ${scanResult.giro_mrz2}<br/>`;
        resultDesc += `&bull;GiroPayNum: ${scanResult.giro_payment_number}<br/>`;
    }
    resultDesc = `촬영 상태가 실제 신분증과 차이가 나면 재촬영해주세요.`
    setResultDesc(resultDesc);
    
    
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function printManualResultText(result) {
    if(!result) {
        return;
    }

    let resultDesc = "";

    let idData = null;
    let logData = null;

    if(result.hasOwnProperty('infoJson')) {
        let infoJson = JSON.parse(result.infoJson);
        idData = infoJson.id;
        logData = infoJson.log;
    } else {
        idData = result.idData;
        logData = result.logData;
    }
    
    if(!idData || !logData) {
        return;
    }
    const cardType = idData.idType;
    
    if (cardType === "korId") {
        resultDesc += `&bull;Scan Type: ID Card<br/>`;
        resultDesc += `&bull;ID Number: ${idData.idNumber}<br/>`;
        resultDesc += `&bull;Name: ${idData.idName}<br/>`;
        resultDesc += `&bull;IssueDate: ${idData.idIssueDate}<br/>`;
        resultDesc += `&bull;Issuer: ${idData.idIssueRegion}<br/>`;
        resultDesc += `&bull;Overseas: ${idData.idOverseas == 0 ? false : true}<br/>`;
        resultDesc += `&bull;Face Score: ${logData.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${logData.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${logData.specularScore}<br/>`;
    } else if (cardType === "drvId") {
        resultDesc += `&bull;Scan Type: DriverLicense Card<br/>`;
        resultDesc += `&bull;ID Number: ${idData.idNumber}<br/>`;
        resultDesc += `&bull;Name: ${idData.idName}<br/>`;
        resultDesc += `&bull;IssueDate: ${idData.idIssueDate}<br/>`;
        resultDesc += `&bull;Issuer: ${idData.idIssueRegion}<br/>`;
        resultDesc += `&bull;DL Number: ${idData.idLicenseNumber}<br/>`;
        // resultDesc += `&bull;DL Aptitude: ${scanResult.aptitude}<br/>`;
        // resultDesc += `&bull;DL Type: ${scanResult.driverLicenseType}<br/>`;
        resultDesc += `&bull;DL Serial: ${idData.idSerialNo}<br/>`; // help: 주석 제거
        // resultDesc += `&bull;DL LicenseKor: ${scanResult.driverLicenseKor}<br/>`;
        resultDesc += `&bull;Face Score: ${logData.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${logData.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${logData.specularScore}<br/>`;
    } else if (cardType === "residence") {
        resultDesc += `&bull;Scan Type: Residence<br/>`;
        resultDesc += `&bull;ID Number: ${idData.idNumber}<br/>`;
        //resultDesc += `&bull;Name: ${scanResult.name}<br/>`;
        resultDesc += `&bull;IssueDate: ${idData.idIssueDate}<br/>`;
        //resultDesc += `&bull;Issuer: ${scanResult.issuer}<br/>`;
        resultDesc += `&bull;NameEng: ${idData.idNameEng}<br/>`;
        resultDesc += `&bull;Nationality: ${idData.idNationality}<br/>`;
        resultDesc += `&bull;VisaType: ${idData.idVisaType}<br/>`;
        let typeText= "";
        if (idData.idResidenceType === "0") {
            typeText = "외국인등록증";
        } else if (idData.idResidenceType === "1") {
            typeText = "국내거소신고증";
        } else if (idData.idResidenceType === "2") {
            typeText = "영주증";
        }
        resultDesc += `&bull;TypeCode: ${typeText}<br/>`;
        resultDesc += `&bull;Face Score: ${logData.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${logData.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${logData.specularScore}<br/>`;
    } else if (cardType === "residenceBack") {
        resultDesc += `&bull;Scan Type: Residence Back<br/>`;
        resultDesc += `&bull;Serial: ${idData.idSerial}<br/>`;                //일련번호  JTAG_ID_SERIAL
        resultDesc += `&bull;Permission_1: ${idData.idPermission_1}<br/>`;    //허가일자1 JTAG_ID_PERMISSION1
        resultDesc += `&bull;Expiry_1: ${idData.idExpiry_1}<br/>`;            //만료일자1 JTAG_ID_EXPIRY1
        resultDesc += `&bull;Confirm_1: ${idData.idConfirm_1}<br/>`;          //확인1    JTAG_ID_CONFIRM1 
        resultDesc += `&bull;Permission_2: ${idData.idPermission_2}<br/>`;    //허가일자2 JTAG_ID_PERMISSION2
        resultDesc += `&bull;Expiry_2: ${idData.idExpiry_2}<br/>`;            //만료일자2 JTAG_ID_EXPIRY2
        resultDesc += `&bull;Confirm_2: ${idData.idConfirm_2}<br/>`;          //확인2    JTAG_ID_CONFIRM2 
        resultDesc += `&bull;Permission_3: ${idData.idPermission_3}<br/>`;    //허가일자3 JTAG_ID_PERMISSION3
        resultDesc += `&bull;Expiry_3: ${idData.idExpiry_3}<br/>`;            //만료일자3 JTAG_ID_EXPIRY3
        resultDesc += `&bull;Confirm_3: ${idData.idConfirm_3}<br/>`;          //확인3    JTAG_ID_CONFIRM3 
        resultDesc += `&bull;Permission_4: ${idData.idPermission_4}<br/>`;    //허가일자4 JTAG_ID_PERMISSION4
        resultDesc += `&bull;Expiry_4: ${idData.idExpiry_4}<br/>`;            //만료일자4 JTAG_ID_EXPIRY4
        resultDesc += `&bull;Confirm_4: ${idData.idConfirm_4}<br/>`;          //확인4    JTAG_ID_CONFIRM4
    } else if (cardType === "passport") {
        resultDesc += `&bull;Scan Type: Passport<br/>`;
        resultDesc += `&bull;ID Number: ${idData.idNumber}<br/>`;
        resultDesc += `&bull;Name: ${idData.idNameKor}<br/>`;
        resultDesc += `&bull;IssueDate: ${idData.idIssueDate}<br/>`;
        resultDesc += `&bull;Issuer: ${idData.idIssueCountry}<br/>`;
        resultDesc += `&bull;PassportType: ${idData.idPassportType}<br/>`;
        resultDesc += `&bull;PassportNumber: ${idData.idPassportNumber}<br/>`;
        resultDesc += `&bull;SurName: ${idData.idSurName}<br/>`;
        resultDesc += `&bull;GivenName: ${idData.idGivenName}<br/>`;
        resultDesc += `&bull;Nationality: ${idData.idNationality}<br/>`;
        resultDesc += `&bull;Date Of Birth: ${idData.idDayOfBirth}<br/>`;
        resultDesc += `&bull;Gender: ${idData.idGender}<br/>`;
        resultDesc += `&bull;Expiry Date: ${idData.idExpiryDate}<br/>`;
        resultDesc += `&bull;PersonalNumber: ${idData.idPersonalNumber}<br/>`;
        resultDesc += `&bull;Name ENG: ${idData.idNameEng}<br/>`;
        resultDesc += `&bull;MRZ 1: ${idData.idMrz1.replace(/</gi, '&lt;')}<br/>`;
        resultDesc += `&bull;MRZ 2: ${idData.idMrz2}<br/>`;
        resultDesc += `&bull;Face Score: ${logData.faceScore}<br/>`;
        resultDesc += `&bull;Color Score: ${logData.colorScore}<br/>`;
        resultDesc += `&bull;Specular Ratio: ${logData.specularScore}<br/>`;
    } else {
        showToast("OCR 서버 연동이 지원되지 않는 타입입니다.\n출력 결과를 갱신하지 않습니다.");
        return;
    }

    setResultDesc(resultDesc);
}