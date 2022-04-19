/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { parse } from 'querystring';
import pathRegexp from 'path-to-regexp';
import type { Route } from '@/models/connect';
import { message } from 'antd';
import 'animate.css';

/* eslint no-useless-escape:0 */
const reg =
  /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

export const isUrl = (path: string): boolean => reg.test(path);

export const isAntDesignPro = (): boolean => {
  if (ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site') {
    return true;
  }
  return window.location.hostname === 'preview.pro.ant.design';
};

// 给官方演示站点用，用于关闭真实开发环境不需要使用的特性
export const isAntDesignProOrDev = (): boolean => {
  const { NODE_ENV } = process.env;
  if (NODE_ENV === 'development') {
    return true;
  }
  return isAntDesignPro();
};

const nargs = /\{([0-9a-zA-Z_.]+)\}/g;
/**
 * 字符串模板替换,字段之中可以有.号，即属性能是对象
 * @param str
 * @param object
 */
export const templateReplace = (str: string, object: object) => {
  return str.replace(nargs, function replaceArg(match, i, index) {
    if (str[index - 1] === '{' && str[index + match.length] === '}') {
      return i;
    }
    const result = object.hasOwnProperty(i) ? object[i] : null;
    if (result === null || result === undefined) {
      return '';
    }
    return result;
  });
};

/**
 * 分割数组，拆分数组
 * @param arr
 * @param size
 * @returns
 */
export const getSplitArray = (arr: any[], size: number): any[] => {
  // size=5，要分割的长度
  const arrNum = Math.ceil(arr.length / size);
  let index = 0; // 定义初始索引
  let resIndex = 0; // 用来保存每次拆分的长度
  const result: any[] = [];
  while (index < arrNum) {
    result[index] = arr.slice(resIndex, size + resIndex);
    resIndex += size;
    index += 1;
  }
  return result;
};

/**
 * 在做某些操作的时候，例如form.setInit(object),里面不能有对象属性
 * @param object
 * @returns
 */
export const deleteObjectPropertys = (obj: object) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object') delete obj[key];
  });
  return obj;
};

const SETTING_MONETARYTYPE = 'settings-monetaryType';
const SETTING_MONETARYPOSITION = 'settings-monetaryPosition';
export const getLocalMonetaryType = (moduleName: string) => {
  return (
    (localStorage.getItem(`${SETTING_MONETARYTYPE}-${moduleName}`) as any) ||
    (localStorage.getItem(`${SETTING_MONETARYTYPE}`) as any) ||
    'tenthousand'
  );
};

export const setLocalMonetaryType = (moduleName: string, value: string) => {
  localStorage.setItem(`${SETTING_MONETARYTYPE}-${moduleName}`, value);
};

export const getLocalMonetaryPosition = (moduleName: string) => {
  return (
    (localStorage.getItem(`${SETTING_MONETARYPOSITION}-${moduleName}`) as any) ||
    (localStorage.getItem(`${SETTING_MONETARYPOSITION}`) as any) ||
    'behindnumber'
  );
};

export const setLocalMonetaryPosition = (moduleName: string, value: string) => {
  localStorage.setItem(`${SETTING_MONETARYPOSITION}-${moduleName}`, value);
};

interface callbackFunc {
  (record: any, pos: number, data: any[]): void;
}
/**
 * 在树形结构中找到key的记录，并执行相应的callback
 * @param data
 * @param key
 * @param callback
 */
export const loop = (data: any[], key: string, callback: callbackFunc) => {
  for (let i = 0; i < data.length; i += 1) {
    if (data[i].key === key) {
      callback(data[i], i, data);
      return;
    }
    if (data[i].children) {
      loop(data[i].children, key, callback);
    }
  }
};

/**
 * https://animate.style/
 * @param element
 * @param animation
 * @param prefix
 * @returns
 */
export const animateCSS = (element: any, animation: any, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve) => {
    const animationName = `${prefix}${animation}`;
    const node = document.querySelector(element);
    node.classList.add(`${prefix}animated`, animationName);
    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event: any) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }
    node.addEventListener('animationend', handleAnimationEnd, { once: true });
  });

const digitsFormat: string[] = [
  '0,0',
  '0,0.0',
  '0,0.00',
  '0,0.000',
  '0,0.0000',
  '0,0.00000',
  '0,0.000000',
];
// 根据小数长度返回浮点数显示的格式
export const getNumberDigitsFormat = (digits: number | undefined): string => {
  if (typeof digits !== 'number')
    // 默认小数点2位
    return digitsFormat[2];
  if (digits <= 0) return digitsFormat[0];
  if (digits >= 6) return digitsFormat[6];
  return digitsFormat[digits];
};

// 对小数点前的数值加入千分位
export const numberFormatWithComma = (number: any): string => {
  if (number === null || number === undefined) return '';
  const str = number.toString();
  const res = str.replace(/\d+/, (n: any) => {
    // 先提取整数部分
    return n.replace(/(\d)(?=(\d{3})+$)/g, ($1: string) => {
      return `${$1},`;
    });
  });
  return res;
};

export const getPageQuery = () => parse(window.location.href.split('?')[1]);

/**
 * props.route.routes
 * @param router [{}]
 * @param pathname string
 */
export const getAuthorityFromRouter = <T extends Route>(
  router: T[] = [],
  pathname: string,
): T | undefined => {
  const authority = router.find(
    ({ routes, path = '/' }) =>
      (path && pathRegexp(path).exec(pathname)) ||
      (routes && getAuthorityFromRouter(routes, pathname)),
  );
  if (authority) return authority;
  return undefined;
};

export const getRouteAuthority = (path: string, routeData: Route[]) => {
  let authorities: string[] | string | undefined;
  routeData.forEach((route) => {
    // match prefix
    if (pathRegexp(`${route.path}/(.*)`).test(`${path}/`)) {
      if (route.authority) {
        authorities = route.authority;
      }
      // exact match
      if (route.path === path) {
        authorities = route.authority || authorities;
      }
      // get children authority recursively
      if (route.routes) {
        authorities = getRouteAuthority(path, route.routes) || authorities;
      }
    }
  });
  return authorities;
};

// 把上传的按钮要隐藏掉 openFile
export const PDFVIEWER = '/pdfjs-2.12.313-dist/web/viewer.html';

export const getPdfjsUrl = (url: string, filename: string) => {
  // 如果用浏览器内置pdf浏览器就返回 url
  // return url;
  // pdfjs需要文件名参数，文件名中带有{}则不能预览。
  const fn = filename.replaceAll('}', '｝').replaceAll('{', '｛');
  return `${PDFVIEWER}?file=${encodeURIComponent(`${url}&saveName=${fn}`)}`;
};

/**
 * 简单的加密函数
 */
export const encryptString = (str: string): string => {
  if (!str) return '';
  let c = String.fromCharCode(str.charCodeAt(0) + str.length);
  for (let i = 1; i < str.length; i += 1) {
    c += String.fromCharCode(str.charCodeAt(i) + str.charCodeAt(i - 1));
  }
  return encodeURIComponent(c);
};

/**
 * 简单的解密函数
 */
export const decryptString = (dstr: string): string => {
  if (!dstr) return '';
  const str = decodeURIComponent(dstr);
  let c: string = String.fromCharCode(str.charCodeAt(0) - str.length);
  for (let i = 1; i < str.length; i += 1) {
    c += String.fromCharCode(str.charCodeAt(i) - c.charCodeAt(i - 1));
  }
  return c;
};

/**
 * 根据返回的结果显示信息
 * messages : {info : ['info1'], warn : [] , error : [] }
 *
 * @param messages
 */
export const showResultInfo = (messages: any) => {
  if (messages) {
    if (messages.info) (messages.info as string[]).forEach((mess) => message.info(mess));
    if (messages.warn) (messages.warn as string[]).forEach((mess) => message.warn(mess));
    if (messages.error) (messages.error as string[]).forEach((mess) => message.error(mess));
  }
};

/**
 * 自动生成的label，只取最后的一节，项目合同--合同付款方式 ，返回 合同付款方式
 * @param label
 */
export const getLastLevelLabel = (label: string): string => {
  if (label && label.indexOf('--') !== -1) {
    const parts: string[] = label.split('--');
    // console.log(parts);
    return parts[parts.length - 1];
  }
  return label;
};

/**
 * 通过form post 下载文件
 */
export const download = (url: string, params: Record<string, unknown>) => {
  // 导出表格
  const form = document.createElement('form');
  document.body.appendChild(form);
  Object.keys(params).forEach((obj) => {
    if (params.hasOwnProperty(obj)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = obj;
      input.value = params[obj] as string;
      form.appendChild(input);
    }
  });
  form.method = 'POST';
  form.action = url;
  form.submit();
  document.body.removeChild(form);
};

export const apply = (dest: object, updated: object) => {
  const desttarget = dest;
  if (dest instanceof Object && updated instanceof Object)
    Object.keys(updated).forEach((key) => {
      desttarget[key] = updated[key];
    });
  return dest;
};

export const applyIf = (dest: object, updated: object) => {
  const desttarget = dest;
  if (dest instanceof Object && updated instanceof Object)
    Object.keys(updated).forEach((key) => {
      if (typeof dest[key] === 'undefined') desttarget[key] = updated[key];
    });
  return dest;
};

/**
 * 检查一个对象的属性中是否有对象或者数组，有的话转为字符串
 * @param param
 */
export const stringifyObjectField = (param: any) => {
  const result = { ...param };
  Object.keys(param).forEach((key) => {
    if (typeof param[key] === 'object') result[key] = JSON.stringify(param[key]);
  });
  return result;
};

export const getFileExt = (filename: string): string => {
  if (!filename) return '';
  const temp = filename.split('').reverse().join('');
  return temp.substring(0, temp.search(/\./)).split('').reverse().join('').toLowerCase();
};

export const applyOtherSetting = (object: object, othersetting: string) => {
  if (othersetting) {
    let ostr = {};
    let s = `{${othersetting}}`;
    if (othersetting.startsWith('{')) {
      s = `${othersetting}`;
    }
    try {
      // eslint-disable-next-line
      ostr = eval(`(${s})`);
    } catch (e) {
      // eslint-disable-next-line
      alert(`JSON解析错误：${s}`);
    }
    if (ostr) apply(object, ostr);
  }
};

export const applyAllOtherSetting = (object: any) => {
  if (Array.isArray(object)) {
    object.forEach((o: any) => applyAllOtherSetting(o));
  } else if (Object.prototype.toString.call(object) === '[object Object]') {
    Object.keys(object).forEach((key) => {
      if (key === 'othersetting') {
        applyOtherSetting(object, object[key]);
        // delete object[i];
        // console.log(object)
      } else {
        applyAllOtherSetting(object[key]);
      }
    });
  }
};

const getParameterNames = (fn: any) => {
  if (typeof fn !== 'function') return [];
  const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
  const code = fn.toString().replace(COMMENTS, '');
  const result = code.slice(code.indexOf('(') + 1, code.indexOf(')')).match(/([^\s,]+)/g);
  return result === null ? [] : result;
};

/**
 * 从后台传过来的json串中，如果二个对象是相同的，则会有一个传入$ref,需要修正
 * @param moduleinfo
 * @param object
 */
export const replaceRef = (moduleinfo: any, object: any) => {
  const params = getParameterNames(replaceRef);
  if (object.$ref) {
    // eslint-disable-next-line
    apply(object, eval(object.$ref.replace('$', params[0])));
    const o = object;
    delete o.$ref;
  }
  Object.keys(object).forEach((i) => {
    if (Array.isArray(object[i]) || object[i] instanceof Object) replaceRef(moduleinfo, object[i]);
  });
};

// urlEncode
export const urlEncode = (param: any, key: any = null, encode: any = null) => {
  if (param === null) return '';
  let paramStr = '';
  const t = typeof param;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    paramStr += `&${key}=${encode === null || encode ? encodeURIComponent(param) : param}`;
  } else {
    Object.keys(param).forEach((i) => {
      const k = key === null ? i : key + (param instanceof Array ? `[${i}]` : `.${i}`);
      paramStr += urlEncode(param[i], k, encode);
    });
  }
  return paramStr;
};

/**
 * 根据传入的字符串，将最后面的数值加1,返回，如Ａ01,返回 A02
 */
export const getNextId = (aid: string) => {
  // 找到最后n位都是数值的字符串
  const { length } = aid;
  let pos = 0;
  for (let i = length - 1; i >= 0; i -= 1) {
    if (!(aid[i] >= '0' && aid[i] <= '9')) {
      pos = i + 1;
      break;
    }
  }
  if (pos === length) return '';
  if (length - pos > 6) pos = length - 6;
  // 取得从i到length的字符串
  const str = aid.substr(pos);
  const num = parseInt(str, 10) + 1;
  let newstr = `${num}`;
  const addspace = str.length - newstr.length;
  for (let i = 0; i < addspace; i += 1) {
    newstr = `0${newstr}`;
  }
  return aid.substr(0, pos) + newstr;
};

export const getAwesomeIcon = (iconCls: string | undefined) => {
  return <span className={iconCls || 'fa fa-space'} />;
};

/**
 * 取得菜单里的iconCls
 * @param iconCls
 */
export const getMenuAwesomeIcon = (iconCls: string | undefined) => {
  return (
    <span className="anticon" style={{ verticalAlign: 'middle' }}>
      <span
        className={iconCls || 'fa fa-space'}
        style={{
          visibility: iconCls ? 'visible' : 'hidden',
        }}
      />
    </span>
  );
};

export const EMPTY_MENU_ICON = getMenuAwesomeIcon(undefined);

/**
 * 在新窗口中打开url指定的内容，一般是图片或附件的PDF预览文件
 * @param url
 * @param title
 * @param previewmode
 */
export const onOpenInNewWindow = (url: string, title: string, previewmode: string) => {
  const basePath = window.location.origin;
  const baseUrl = basePath + url;
  const htmlMarkup = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />',
    `<title>${title}</title>`,
    `<link rel="icon" href="${basePath}/favicon.png" type="image/x-icon" />`,
    '<style type="text/css">html,body{height:100%;margin:0;text-align:center;}',
    'iframe{display: block;background: #fff;border:none;width:100%;height:100%;}',
    'img {width:auto;height:auto;max-width:100%;max-height:100%;}',
    '</style>',
    '</head>',
    '<body>',
    previewmode === 'image' ? `<img src="${baseUrl}"/>` : `<iframe src="${baseUrl}" ></iframe>`,
    '</body>',
    '</html>',
  ];
  const html = htmlMarkup.join(' ');
  const win: any = window.open('');
  win.document.open();
  win.document.write(html);
  win.document.close();
};

export const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

/**
 * 日期字符串，取消秒，或者取消时间，只留日期， <= 16 取消秒，<=10,取消时间
 * @param dateStr
 * @returns
 */
const DATAMAXLENGTH = 10; // 10|16;
export const deleteSecond = (dateStr: string) => {
  if (!dateStr || dateStr.length <= DATAMAXLENGTH) return dateStr;
  return dateStr.substring(0, DATAMAXLENGTH);
};

// 生成一个uuid
/* eslint-disable */
export function uuid() {
  const s: any[] = [];
  const hexDigits = '0123456789abcdef';
  for (let i = 0; i < 36; i += 1) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-';
  const uuid = s.join('');
  return uuid;
}

/**
 * MD5中文字符的和JAVA是一致的，用md5js不能解决中文加密的问题
 * @param string
 */
export const MD5 = (string: string) => {
  const RotateLeft = (lValue: any, iShiftBits: any) => {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  };
  const AddUnsigned = (lX: any, lY: any) => {
    let lX4;
    let lY4;
    let lX8;
    let lY8;
    let lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      }
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  };
  function F(x: any, y: any, z: any) {
    return (x & y) | (~x & z);
  }
  function G(x: any, y: any, z: any) {
    return (x & z) | (y & ~z);
  }
  function H(x: any, y: any, z: any) {
    return x ^ y ^ z;
  }
  function I(x: any, y: any, z: any) {
    return y ^ (x | ~z);
  }
  function FF(a: any, b: any, c: any, d: any, x: any, s: any, ac: any) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function GG(a: any, b: any, c: any, d: any, x: any, s: any, ac: any) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function HH(a: any, b: any, c: any, d: any, x: any, s: any, ac: any) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function II(a: any, b: any, c: any, d: any, x: any, s: any, ac: any) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function ConvertToWordArray(string: string) {
    let lWordCount;
    const lMessageLength = string.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] =
        lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
      lByteCount += 1;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue: any) {
    let WordToHexValue = '';
    let WordToHexValue_temp = '';
    let lByte;
    let lCount;
    for (lCount = 0; lCount <= 3; lCount += 1) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = `0${lByte.toString(16)}`;
      WordToHexValue += WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  function Utf8Encode(string: any) {
    string = string.replace(/\r\n/g, '\n');
    let utftext = '';
    for (let n = 0; n < string.length; n += 1) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }
  let x = [];
  let k;
  let AA;
  let BB;
  let CC;
  let DD;
  let a;
  let b;
  let c;
  let d;
  const S11 = 7;
  const S12 = 12;
  const S13 = 17;
  const S14 = 22;
  const S21 = 5;
  const S22 = 9;
  const S23 = 14;
  const S24 = 20;
  const S31 = 4;
  const S32 = 11;
  const S33 = 16;
  const S34 = 23;
  const S41 = 6;
  const S42 = 10;
  const S43 = 15;
  const S44 = 21;
  string = Utf8Encode(string);
  x = ConvertToWordArray(string);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }
  const temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
  return temp.toLowerCase();
};
/* eslint-enable */
