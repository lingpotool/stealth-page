const VERSION = 'stealth-page';

function get_txt_class(lang?: string | null): typeof Texts {
  const languages: Record<string, typeof Texts> = {
    'zh_cn': Texts,
    'cn': Texts,
    'en': English,
  };
  if (lang === null || lang === undefined) {
    lang = 'zh_cn';
  }
  lang = lang.toLowerCase();
  const cls = languages[lang];
  if (!cls) {
    throw new ValueError(`lang must be one of ${Object.keys(languages).join(', ')}`);
  }
  return cls;
}

class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
  }
}

class Texts {
  static VERSION = '版本';
  static INFO = '详情';
  static METHOD = '方法';
  static ARGS = '参数';
  static ARG = '参数';
  static BROWSER_VER = '浏览器版本';
  static PATH = '路径';
  static VALUE = '值';
  static ALLOW_VAL = '允许值';
  static CURR_VAL = '当前值';
  static ALLOW_TYPE = '允许类型';
  static CURR_TYPE = '当前类型';
  static TIP = '提示';
  static ADDRESS = '地址';
  static LOCATOR = '定位符';
  static ALL_TABS = '所有标签页';

  static ELEMENTNOTFOUNDERROR = '没有找到元素。';
  static ALERTEXISTSERROR = '存在未处理的提示框。';
  static CONTEXTLOSTERROR = '页面被刷新，请操作前尝试等待页面刷新或加载完成。';
  static ELEMENTLOSTERROR = '元素对象已失效。可能是页面整体刷新，或js局部刷新把元素替换或去除了。';
  static CDPERROR = '方法调用错误。';
  static PAGEDISCONNECTEDERROR = '与页面的连接已断开。';
  static JAVASCRIPTERROR = 'JavaScript运行错误。';
  static NORECTERROR = '该元素没有位置及大小。';
  static BROWSERCONNECTERROR = '浏览器连接失败。';
  static NORESOURCEERROR = '该元素无可保存的内容或保存失败。';
  static CANNOTCLICKERROR = '该元素无法滚动到视口或被遮挡，无法点击。';
  static GETDOCUMENTERROR = '获取文档失败。';
  static WAITTIMEOUTERROR = '等待失败。';
  static INCORRECTURLERROR = '无效的url。';
  static LOCATORERROR = '定位符格式不正确。';
  static STORAGEERROR = '无法操作当前存储数据。';
  static COOKIEFORMATERROR = 'cookie格式不正确。';
  static TARGETNOTFOUNDERROR = '找不到指定页面。';
  static UNKNOWNERROR = '出现未知错误。';

  static NO_AVAILABLE_PORT_FOUND = '未找到可用端口。';
  static WIN_SYS_ONLY = '该方法只能在Windows系统使用。';
  static NEED_LIB_ = '请先安装{}。';
  static INVALID_URL = '无效的url，也许要加上"http://"？';
  static INVALID_HEADER_NAME = '无效的header项名。';
  static NOT_A_FUNCTION = '传入的js无法解析成函数。';
  static METHOD_NOT_FOUND = '没有找到对应功能，方法错误或你的浏览器太旧。';
  static NO_RESPONSE = '超时，可能是浏览器卡了。';
  static UNKNOWN_ERR = '出现未知错误。';
  static FEEDBACK = '出现这个错误可能意味着程序有bug，请把错误信息和重现方法告知作者，谢谢。\n报告网站: https://gitee.com/g1879/DrissionPage/issues';
  static INI_NOT_FOUND = 'ini文件不存在。';
  static EXT_NOT_FOUND = '插件路径不存在。';
  static WAITING_FAILED_ = '等待{}失败（等待{}秒）。';
  static GET_OBJ_FAILED = '获取对象失败。';
  static INCORRECT_VAL_ = '{}参数值错误。';
  static INCORRECT_TYPE_ = '{}参数类型错误。';
  static CONNECT_ERR = '连接异常。';
  static BROWSER_CONNECT_ERR1_ = '浏览器连接失败，请检查{}端口是否浏览器，且已添加"--remote-debugging-port={}"启动项。';
  static BROWSER_CONNECT_ERR2 = '浏览器连接失败，请确认浏览器已启动。';
  static BROWSER_EXE_NOT_FOUND = '无法找到浏览器可执行文件路径，请手动配置。';
  static BROWSER_NOT_FOUND = '未找到浏览器。';
  static BROWSER_NOT_EXIST = '浏览器未开启或已关闭。';
  static BROWSER_DISCONNECTED = '浏览器已关闭或链接已断开。';
  static BROWSER_NOT_FOR_CONTROL = '浏览器版本太旧或此浏览器不支持接管。';
  static UNSUPPORTED_CSS_SYNTAX = '此css selector语法不受支持，请换成xpath。';
  static UNSUPPORTED_ARG_TYPE_ = '不支持参数{}的类型: {}。';
  static UPGRADE_WS = '请升级websocket-client库。';
  static INI_NOT_SET = 'ini_path未设置。';
  static INVALID_XPATH_ = '无效的xpath语句: {}';
  static INVALID_CSS_ = '无效的css selector语句: {}';
  static INDEX_FORMAT = '序号必须是数字或切片。';
  static LOC_NOT_FOR_FRAME = '该定位符不是指向frame元素。';
  static NEED_DOWNLOAD_PATH = '此功能需显式设置下载路径。';
  static GET_WINDOW_SIZE_FAILED = '获取窗口信息失败。';
  static SET_FAILED_ = '{}设置失败。';
  static NOT_LISTENING = '监听未启动或已停止。';
  static NOT_BLOB = '该链接非blob类型。';
  static CANNOT_INPUT_FILE = '该输入框无法接管，请改用对<input>元素输入路径的方法设置。';
  static NO_SUCH_KEY_ = '没有这个按键: {}';
  static NO_NEW_TAB = '没有等到新标签页。';
  static NO_SUCH_TAB = '没有找到指定标签页。';
  static NEED_DOMAIN = '需设置domain或url值。如设置url值，需以http开头。';
  static NEED_DOMAIN2 = 'cookie必须带有"domain"或"url"字段。';
  static NEED_ARG_ = '{}必须设置。';
  static SAVE_PATH_MUST_BE_FOLDER = 'save_path必须为文件夹。';
  static GET_PDF_FAILED = '保存失败，可能浏览器版本不支持。';
  static GET_BLOB_FAILED = '无法获取该资源。';
  static NO_SRC_ATTR = '元素没有src值或该值为空。';
  static D_MODE_ONLY = 'url、domain、path参数只有d模式下有效。';
  static S_MODE_ONLY = '以下参数在s模式下才会生效:';
  static STATUS_CODE_ = '状态码: {}';
  static TAB_OBJ_EXISTS = '该标签页已有非MixTab版本，如需多对象共用标签页请设置Settings.set_singleton_tab_obj(False)。';
  static ONLY_ENGLISH = '转换成视频仅支持英文路径和文件名。';
  static SELECT_ONLY = 'select方法只能在<select>元素使用。';
  static MULTI_SELECT_ONLY = '只能在多选菜单执行此操作。';
  static OPTION_NOT_FOUND = '没有找到指定选项。';
  static STR_FOR_SINGLE_SELECT = '单选列表只能传入str格式。';
  static JS_RUNTIME_ERR = 'js运行环境出错。';
  static TIMEOUT_ = '{}超时（等待{}秒）';
  static JS_RESULT_ERR = 'js结果解析错误。';
  static S_MODE_GET_FAILED = 's模式访问失败，请设置go=False，自行构造连接参数进行访问。';
  static ZERO_PAGE_SIZE = '页面大小为0，请尝试等待页面加载完成。';
  static CONTENT_IS_EMPTY = '返回内容为空。';
  static FIND_ELE_ERR = '查找元素异常。';
  static SYMBOL_CONFLICT = '@@和@|不能同时出现在一个定位语句中。';
  static INVALID_LOC = '无法识别的定位符。';
  static LOC_LEN = '定位符长度必须为2。';
  static INCORRECT_SIGN_ = '符号不正确: {}';
  static DOMAIN_NOT_SET = '未设置域名，请设置cookie的domain参数或先访问一个网站。';
  static PLUGIN_NEED_FOLDER = '插件需解压为文件夹：{}';
  static NEED_FILES_OR_TEXT_ARG = 'files参数和text参数必须至少输入一个。';

  static ELE_DISPLAYED = '元素显示';
  static ELE_LOADED = '元素加载';
  static PAGE_LOADED = '页面加载';
  static NEW_TAB = '新标签页';
  static DATA_PACKET = '数据包';
  static ELE_HIDDEN_DEL = '元素隐藏或被删除';
  static ELE_DEL = '元素被删除';
  static ELE_HAS_RECT = '元素拥有大小及位置';
  static ELE_HIDDEN = '元素隐藏';
  static ELE_CLICKABLE = '元素可点击';
  static ELE_COVERED = '元素被覆盖';
  static ELE_NOT_COVERED = '元素不被覆盖';
  static ELE_AVAILABLE = '元素可用';
  static ELE_NOT_AVAILABLE = '元素不可用';
  static ELE_STOP_MOVING = '元素停止运动';
  static ELE_STATE_CHANGED_ = '等待元素状态改变失败（等待{}秒）。';
  static RUN_BY_ADMIN = '尝试用管理员权限运行。';
  static BROWSER_CONNECT_ERR_INFO = '\n1、用户文件夹没有和已打开的浏览器冲突\n2、如为无界面系统，请添加\'--headless=new\'启动参数\n3、如果是Linux系统，尝试添加\'--no-sandbox\'启动参数\n可使用ChromiumOptions设置端口和用户文件夹路径。';

  static LOC_OR_IND = '定位符（str或长度为2的tuple）或序号';
  static STR_ONLY = 'str格式且不支持xpath和css形式';
  static LOC_FORMAT = 'str或长度为2的tuple';
  static ELE_OR_LOC = '定位符（str或长度为2的tuple）或元素';
  static FRAME_LOC_FORMAT = '定位符、iframe序号、id、name、ChromiumFrame对象';
  static SET_DOWNLOAD_PATH = '使用set.download_path()方法、配置对象或ini文件均可。';
  static SET_WINDOW_NORMAL = '浏览器全屏或最小化状态时请先调用set.window.normal()恢复正常状态。';
  static HTML_ELE_TYPE = '元素、页面对象或html文本';
  static ELE_LOC_FORMAT = '(x, y)格式坐标，或ChromiumElement对象';
  static IP_OR_OPTIONS = 'ip:port格式字符串或ChromiumOptions类型';

  static TAB_OR_ID = '标签页对象或id';
  static RUN_JS = '执行js';
  static PAGE_CONNECT = '页面连接';
  static NEW_ELE_INFO = 'str格式的html文本，或tuple格式(tag, {name: value})。';
  static DICT_TO_NEW_ELE = '此网页不支持html格式新建元素，请用dict传入html_or_info参数。';

  static RETRY = '重试';
  static OPTIONS_HAVE_SAVED = '配置已保存到文件';
  static AUTO_LOAD_TIP = '以后程序可自动从文件加载配置';
  static STOP_RECORDING = '停止录制';
  static START_RECORD = '开始录制';
  static CHOOSE_RECORD_TARGET = '请手动选择要录制的目标。';
  static UNSUPPORTED_USER_PROXY = '你似乎在设置使用账号密码的代理，暂时不支持这种代理，可自行用插件实现需求。';
  static UNSUPPORTED_SOCKS_PROXY = '你似乎在设置使用socks代理，暂时不支持这种代理，可自行用插件实现需求。';
  static NOT_SUPPORT_DOWNLOAD = '浏览器版本太低无法使用下载管理功能。';
  static FILE_NAME = '文件名';
  static FOLDER_PATH = '目录路径';
  static UNKNOWN = '未知';
  static DOWNLOAD_COMPLETED = '下载完成';
  static COMPLETED_AND_RENAME = '完成并重命名';
  static OVERWROTE = '已覆盖';
  static DOWNLOAD_CANCELED = '下载取消';
  static SKIPPED = '已跳过';

  static get(item: string): string {
    if (typeof item === 'string' && item === item.toUpperCase() && item in this) {
      return (this as any)[item];
    }
    return item;
  }

  static join(...args: string[]): string {
    const kwargs: Record<string, any> = args[args.length - 1] as any;
    const mainParts = args.slice(0, -1);
    let main = '';
    if (mainParts.length > 0 && mainParts[0]) {
      main = '\n' + mainParts[0];
    }
    const kwParts: string[] = [];
    if (kwargs && typeof kwargs === 'object') {
      for (const [k, v] of Object.entries(kwargs)) {
        kwParts.push(`${this.get(k)}: ${v}`);
      }
    }
    const msg = kwParts.length > 0 ? '\n' + kwParts.join('\n') : '';
    return `${main}${msg}`;
  }
}

class English extends Texts {
  static VERSION = 'Version';
  static INFO = 'Information';
  static METHOD = 'Method';
  static ARGS = 'Arguments';
  static ARG = 'Argument';
  static BROWSER_VER = 'Browser Version';
  static PATH = 'Path';
  static VALUE = 'Value';
  static ALLOW_VAL = 'Allow Value';
  static CURR_VAL = 'Current Value';
  static ALLOW_TYPE = 'Allow Type';
  static CURR_TYPE = 'Current Type';
  static TIP = 'Tip';
  static ADDRESS = 'Address';
  static LOCATOR = 'Locator';
  static ALL_TABS = 'All Tabs';

  static ELEMENTNOTFOUNDERROR = 'No element found.';
  static ALERTEXISTSERROR = 'An unprocessed dialog box exists.';
  static CONTEXTLOSTERROR = 'The page is refreshed. Please wait until the page is refreshed or loaded.';
  static ELEMENTLOSTERROR = 'The element object is invalid. This may be an overall refresh of the page, or a partial js refresh to replace or remove elements.';
  static CDPERROR = 'Method call error.';
  static PAGEDISCONNECTEDERROR = 'The connection to the page has been disconnected.';
  static JAVASCRIPTERROR = 'JavaScript running error.';
  static NORECTERROR = 'This element has no location or size.';
  static BROWSERCONNECTERROR = 'The browser connection fails.';
  static NORESOURCEERROR = 'The element has no saved content or failed to save.';
  static CANNOTCLICKERROR = 'The element does not scroll to the viewport or is blocked and cannot be clicked.';
  static GETDOCUMENTERROR = 'Failed to obtain the document.';
  static WAITTIMEOUTERROR = 'Wait for failure.';
  static INCORRECTURLERROR = 'Invalid url.';
  static LOCATORERROR = 'Invalid locator format.';
  static STORAGEERROR = 'Cannot manipulate the currently stored data.';
  static COOKIEFORMATERROR = 'The cookie format is incorrect.';
  static TARGETNOTFOUNDERROR = 'The specified page cannot be found.';
  static UNKNOWNERROR = 'An unknown error occurred.';

  static NO_AVAILABLE_PORT_FOUND = 'No available port found.';
  static WIN_SYS_ONLY = 'This method can be used only on Windows.';
  static NEED_LIB_ = 'Please install {} first.';
  static INVALID_URL = 'Invalid url, maybe add "http://"?';
  static INVALID_HEADER_NAME = 'Invalid header name.';
  static NOT_A_FUNCTION = 'The passed js cannot be parsed into a function.';
  static METHOD_NOT_FOUND = 'The function is not found, the method is wrong or your browser is too old.';
  static NO_RESPONSE = 'Time out. Maybe the browser is stuck.';
  static UNKNOWN_ERR = 'An unknown error occurred.';
  static FEEDBACK = 'This error may mean that there is a bug in the program, please inform the author of the error message and how to reproduce it, thank you.\nReport url: https://gitee.com/g1879/DrissionPage/issues';
  static INI_NOT_FOUND = 'The ini file does not exist.';
  static EXT_NOT_FOUND = 'The plug-in path does not exist.';
  static WAITING_FAILED_ = 'Wait for {} failed ({} seconds).';
  static GET_OBJ_FAILED = 'Failed to obtain the object.';
  static INCORRECT_VAL_ = 'The {} parameter value is incorrect.';
  static INCORRECT_TYPE_ = 'The {} parameter type is incorrect.';
  static CONNECT_ERR = 'The connection is abnormal.';
  static BROWSER_CONNECT_ERR1_ = 'Browser connect failed, check whether the port {} is a browser and "--remote-debugging-port={}" startup item is added.';
  static BROWSER_CONNECT_ERR2 = 'The browser connection failed. Please ensure that the browser is started.';
  static BROWSER_EXE_NOT_FOUND = 'The browser executable file path cannot be found. Please configure it manually.';
  static BROWSER_NOT_FOUND = 'Browser not found.';
  static BROWSER_NOT_EXIST = 'The browser is not started or closed.';
  static BROWSER_DISCONNECTED = 'The browser is closed or the link is broken.';
  static BROWSER_NOT_FOR_CONTROL = 'The browser version is too old or this browser does not support takeover.';
  static UNSUPPORTED_CSS_SYNTAX = 'This css selector syntax is not supported, please replace it with xpath.';
  static UNSUPPORTED_ARG_TYPE_ = 'The type of parameter {} is not supported: {}.';
  static UPGRADE_WS = 'Upgrade the websocket-client library.';
  static INI_NOT_SET = 'ini_path is not set.';
  static INVALID_XPATH_ = 'Invalid xpath statement: {}';
  static INVALID_CSS_ = 'Invalid css selector statement: {}';
  static INDEX_FORMAT = 'The serial number must be a number or slice.';
  static LOC_NOT_FOR_FRAME = 'This locator does not point to the frame element.';
  static NEED_DOWNLOAD_PATH = 'You need to explicitly set the download path for this function.';
  static GET_WINDOW_SIZE_FAILED = 'Failed to obtain window information.';
  static SET_FAILED_ = 'The argument {} setting failed.';
  static NOT_LISTENING = 'Listening is not started or stopped.';
  static NOT_BLOB = 'The link is not of blob type.';
  static CANNOT_INPUT_FILE = 'This input field cannot handle. Instead, set the input path to the <input> element.';
  static NO_SUCH_KEY_ = 'There is no button: {}';
  static NO_NEW_TAB = 'Failed to wait for new tab.';
  static NO_SUCH_TAB = 'The specified tab was not found.';
  static NEED_DOMAIN = 'You need to set a domain or url value. If the url value is set, it must start with http.';
  static NEED_DOMAIN2 = 'The cookie must have a "domain" or "url" field.';
  static NEED_ARG_ = '{} must be set.';
  static SAVE_PATH_MUST_BE_FOLDER = 'save_path must be a folder.';
  static GET_PDF_FAILED = 'The save fails because the browser version may not support it.';
  static GET_BLOB_FAILED = 'The resource cannot be retrieved.';
  static NO_SRC_ATTR = 'The element does not have a src value or the value is empty.';
  static D_MODE_ONLY = 'The url, domain, and path parameters are valid only in d mode.';
  static S_MODE_ONLY = 'The following parameters take effect only in s mode:';
  static STATUS_CODE_ = 'Status Code: {}';
  static TAB_OBJ_EXISTS = 'There is already a non-mixtab version of this tab. If multiple objects are common, use Settings.set_singleton_tab_obj(False).';
  static ONLY_ENGLISH = 'Only English path and file name are supported when converting to video.';
  static SELECT_ONLY = 'The select method can only be used on <select> elements.';
  static MULTI_SELECT_ONLY = 'You can only do this from the multiple select element.';
  static OPTION_NOT_FOUND = 'The specified option was not found.';
  static STR_FOR_SINGLE_SELECT = 'Single-choice select element can only be passed in str format.';
  static JS_RUNTIME_ERR = 'The js runtime environment is faulty.';
  static TIMEOUT_ = 'Wait for {} timeout ({} seconds).';
  static JS_RESULT_ERR = 'js result parsing error.';
  static S_MODE_GET_FAILED = 'S mode access fails, please set go=False and construct connection parameters for access.';
  static ZERO_PAGE_SIZE = 'The page size is 0, please try to wait for the page to load.';
  static CONTENT_IS_EMPTY = 'The returned content is empty.';
  static FIND_ELE_ERR = 'Find element exceptions.';
  static SYMBOL_CONFLICT = '"@@" and "@|" cannot appear in the same location statement.';
  static INVALID_LOC = 'Unrecognized locator.';
  static LOC_LEN = 'The length of the locator must be 2.';
  static INCORRECT_SIGN_ = 'Incorrect symbol: {}';
  static DOMAIN_NOT_SET = 'No domain name is set, please set the domain parameter of the cookie or visit a website first.';
  static PLUGIN_NEED_FOLDER = 'The plugin needs to be decompressed into a folder: {}';
  static NEED_FILES_OR_TEXT_ARG = 'At least one of the "files" parameter and the "text" parameter must be entered.';

  static ELE_DISPLAYED = 'element display';
  static ELE_LOADED = 'element loaded';
  static PAGE_LOADED = 'page loaded';
  static NEW_TAB = 'new tab';
  static DATA_PACKET = 'data packet';
  static ELE_HIDDEN_DEL = 'element is hidden or deleted';
  static ELE_DEL = 'element be deleted';
  static ELE_HAS_RECT = 'element has size and position';
  static ELE_HIDDEN = 'element hidden';
  static ELE_CLICKABLE = 'element clickable';
  static ELE_COVERED = 'element is covered';
  static ELE_NOT_COVERED = 'element is not covered';
  static ELE_AVAILABLE = 'element available';
  static ELE_NOT_AVAILABLE = 'element not available';
  static ELE_STOP_MOVING = 'element stop moving';
  static ELE_STATE_CHANGED_ = 'Failed to wait for element state change ({} seconds).';
  static RUN_BY_ADMIN = 'Try to run with administrator rights.';
  static BROWSER_CONNECT_ERR_INFO = '\n1, the user folder does not conflict with the open browser\n2, if no interface system, please add \'--headless=new\' startup parameter\n3, if the system is Linux, try adding \'--no-sandbox\' boot parameter\nThe port and user folder paths can be set using ChromiumOptions.';

  static LOC_OR_IND = 'A locator (str or tuple of length 2) or serial number.';
  static STR_ONLY = 'Str format and not support xpath or css selector.';
  static LOC_FORMAT = 'str or tuple of length 2';
  static ELE_OR_LOC = 'A locator (str or tuple of length 2) or element.';
  static FRAME_LOC_FORMAT = 'locator, iframe serial number, id, name, ChromiumFrame object';
  static SET_DOWNLOAD_PATH = 'Use the set.download_path() method, configuration object, or ini file.';
  static SET_WINDOW_NORMAL = 'When the browser is in full screen or minimized state, call set.window.normal() first to restore the normal state.';
  static HTML_ELE_TYPE = 'Element, Tab object, or html text';
  static ELE_LOC_FORMAT = '(x, y) format coordinates, or ChromiumElement objects';
  static IP_OR_OPTIONS = 'ip:port format character string or ChromiumOptions type';

  static TAB_OR_ID = 'Tab object or tab id';
  static RUN_JS = 'run js';
  static PAGE_CONNECT = 'Page connection';
  static NEW_ELE_INFO = 'html text, or tuple format: (tag, {name: value}).';
  static DICT_TO_NEW_ELE = 'This page does not support new elements in html format. Please pass the html_or_info parameter with dict.';

  static RETRY = 'Retry';
  static OPTIONS_HAVE_SAVED = 'The configuration is saved to a file';
  static AUTO_LOAD_TIP = 'Later the program can automatically load the configuration from the file';
  static STOP_RECORDING = 'Stop recording.';
  static START_RECORD = 'Start recording.';
  static CHOOSE_RECORD_TARGET = 'Manually select the target you want to record.';
  static UNSUPPORTED_USER_PROXY = 'You seem to be setting up a proxy that uses the account password, which is not supported for the time being, and can be implemented by the plug-in itself.';
  static UNSUPPORTED_SOCKS_PROXY = 'You seem to be setting up the use of socks proxy, this proxy is not supported for the time being, you can use your own plug-in to achieve the requirements.';
  static NOT_SUPPORT_DOWNLOAD = 'The browser version is too low to use the download management function.';
  static FILE_NAME = 'File Name';
  static FOLDER_PATH = 'Folder Path';
  static UNKNOWN = 'Unknown';
  static DOWNLOAD_COMPLETED = 'Complete';
  static COMPLETED_AND_RENAME = 'Renamed';
  static OVERWROTE = 'Overwrote';
  static DOWNLOAD_CANCELED = 'Canceled';
  static SKIPPED = 'Skipped';
}

export { Texts, English, get_txt_class };
