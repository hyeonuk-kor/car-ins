/**
 * @Version 1.0.0
 * @copyright Posicube all right reserved
 * @file html상에서 log를 관리하기 위한 class 파일
 */

/**
 * 로거가 출력할 레벨 enum
 * @readonly
 * @enum {int}
 */
export const RobiLoggerLevel = {
  /** 모든 로그 출력 */
  DEBUG: 0,
  /** ERROR, WARNING, INFO 로그 출력  */
  INFO: 1,
  /** WARNING, ERROR 로그 출력 */
  WARNING: 2,
  /** ERROR 로그 출력 */
  ERROR: 3,
};

const RobiDebug = "Debug : ";
const RobiInfo = "Info : ";
const RobiWarning = "Warning : ";
const RobiError = "Error : ";
const RobiResult = "Result : ";

/**
 * 로깅을 위한 class<br>
 * showInDocument를 적용시, html의 맨 아래에 로그를 출력할 창을 생성하여 출력함<br>
 * 해당 기능의 이유는 console.log를 사용할 경우 브라우저의 디버깅 창을 이용해야 하는데<br>
 * 해당 기능 사용시 수행 속도가 현저하게 느려져, 속도 벤치마크가 어려워 showInDocument기능을 적용함
 */
export class RobiLogger {
  /**
   * 생성자
   * @param {RobiLoggerLevel} level 로그 레벨
   * @param {boolean} showInDocument html 페이지내 출력을 적용할지 유무
   * @param {boolean} showInConsole 디버그 콘솔창에 로그를 출력을 적용할지 유무
   */
  constructor(level, showInDocument, showInConsole) {
    this.loglevel = level;
    this.setConsoleLog(showInConsole);
    this.setDocumentLog(showInDocument);
  }

  /**
   * HTML페이지내에 출력을 설정하는 함수<br>
   * 생성자에서 호출됨
   * @param {boolean} log html 페이지내 출력을 적용할지 유무
   */
  setDocumentLog(log) {
    if (log) {
      var element = document.createElement("div");
      element.id = "logview";
      element.style =
        "background-color:black;font-size:20px;position:relative;z-index:3;overflow-y:scroll;height:400px;";
      document.querySelector("body").appendChild(element);
      this.logview = document.getElementById("logview");
      // this.logview = null;
      this.info("create log");
    } else {
      this.logView = null;
    }
  }

  /**
   * 디버그 콘솔에 출력을 설정하는 함수<br>
   * 생성자에서 호출됨
   * @param {boolean} log 디버그 콘솔에 로그를 출력을 적용할지 유무
   */
  setConsoleLog(log) {
    this.consoleLog = log;
  }

  /**
   * 디버그 메세지 출력용 함수
   * @param {String} message 출력할 메세지
   */
  debug(message) {
    if (this.loglevel > RobiLoggerLevel.DEBUG) return;

    if (this.logview != null) {
      this.logview.innerHTML +=
        '<span style="color:green">' + RobiDebug + message + "</span><br>";
    }
    if (this.consoleLog) {
      console.log(RobiDebug + message);
    }
  }

  /**
   * info 메세지 출력용 함수
   * @param {String} message 출력할 메세지
   */
  info(message) {
    if (this.loglevel > RobiLoggerLevel.INFO) return;

    if (this.logview != null) {
      this.logview.innerHTML +=
        '<span style="color:white">' + RobiInfo + message + "</span><br>";
    }
    if (this.consoleLog) {
      console.log(RobiInfo + message);
    }
  }

  /**
   * 경고 메세지 출력용 함수
   * @param {String} message 출력할 메세지
   */
  warn(message) {
    if (this.loglevel > RobiLoggerLevel.WARNING) return;

    if (this.logview != null) {
      this.logview.innerHTML +=
        '<span style="color:orange">' + RobiWarning + message + "</span><br>";
    }
    if (this.consoleLog) {
      console.log(RobiWarning + message);
    }
  }

  /**
   * 에러 메세지 출력용 함수
   * @param {String} message 출력할 메세지
   */
  error(message) {
    if (this.logview != null) {
      this.logview.innerHTML +=
        '<span style="color:red">' + RobiError + message + "</span><br>";
    }
    if (this.consoleLog) {
      console.log(RobiError + message);
    }
  }

  /**
   * 결과용 메세지 출력용 함수
   * @param {String} message 출력할 메세지
   */
  result(message) {
    if (this.loglevel > RobiLoggerLevel.WARNING) return;
    
    if (this.logview != null) {
      this.logview.innerHTML +=
        '<span style="color:yellow">' + RobiResult + message + "</span><br>";
    }
    if (this.consoleLog) {
      console.log(RobiResult + message);
    }
  }
}
