const SCRIPT_NAME = "小黑盒签到与任务";
const SCRIPT_VERSION = "3.2.0";
const STORAGE_KEY = "xhh_sign_accounts_v1";
const API_BASE = "https://api.xiaoheihe.cn";
const DATA_BASE = "https://data.xiaoheihe.cn";
const HKEY_API = "https://hkey.qcciii.com/hkey";
const PATH_TASK_LIST = "/task/list_v2/";
const PATH_SIGN = "/task/sign_v3/sign";
const PATH_SIGN_STATE = "/task/sign_v3/get_sign_state";
const PATH_FEEDS = "/bbs/app/feeds";
const PATH_GAME_RECOMMEND = "/game/all_recommend/v2";
const PATH_GAME_COMMENTS = "/bbs/app/link/game/comments";
const PATH_VIEW_TIME = "/bbs/app/link/view/time";
const PATH_DATA_REPORT = "/account/data_report/";
const PATH_DATA_REPORT_WEB = "/account/data_report_web/";
const PATH_BBS_POST = "/bbs/app/api/link/post";
const PATH_BBS_DELETE = "/bbs/app/link/delete";
const APP_UA =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 ApiMaxJia/1.0";
const APP_REFERER = "http://api.maxjia.com/";
const MAX_ACCOUNTS = 10;
const WAITING_STATE = "waiting";
const FINISH_STATE = "finish";
const OK_STATE = "ok";
const SHARE_TASK_SETTLE_MS = 2200;
const GAME_REVIEW_CONTENT = "好玩推荐游戏体验非常好";
const RUN_BUDGET_MS = 540 * 1000;
const SIGN_ATTEMPTS = 2;
const SIGN_WAIT_DEFAULT_SEC = 30;
const SIGN_WAIT_MIN_SEC = 6;
const SIGN_WAIT_MAX_SEC = 120;
const SIGN_POLL_GAPS = [2000, 4000, 7000, 11000, 15000];
const SIGN_FINAL_WAIT_MS = 5000;
const SIGN_RETRY_DELAY_MS = 2000;
const SIGNED_STATES = /^(ok|finish|ignore)$/i;
const LOGIN_EXPIRED_HINT = "登录态已失效，请打开小黑盒 App 进入“我的”页面刷新一次以重新获取账号";
const APP_PROFILE = {
  os_type: "Android",
  x_os_type: "Android",
  x_client_type: "mobile",
  os_version: "12",
  dw: "360",
  channel: "heybox",
  x_app: "heybox",
  time_zone: "Asia/Shanghai",
  device_info: "HBP-AL00"
};

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b1 = has1 ? bytes[i + 1] : 0;
    const b2 = has2 ? bytes[i + 2] : 0;
    out += B64_CHARS.charAt(b0 >> 2);
    out += B64_CHARS.charAt(((b0 & 3) << 4) | (b1 >> 4));
    out += has1 ? B64_CHARS.charAt(((b1 & 15) << 2) | (b2 >> 6)) : "=";
    out += has2 ? B64_CHARS.charAt(b2 & 63) : "=";
  }
  return out;
}

function base64ToBytes(text) {
  const source = String(text || "").replace(/[^A-Za-z0-9+/=]/g, "");
  const bytes = [];
  for (let i = 0; i < source.length; i += 4) {
    const c0 = B64_CHARS.indexOf(source.charAt(i));
    const c1 = B64_CHARS.indexOf(source.charAt(i + 1));
    const c2 = source.charAt(i + 2) === "=" ? -1 : B64_CHARS.indexOf(source.charAt(i + 2));
    const c3 = source.charAt(i + 3) === "=" ? -1 : B64_CHARS.indexOf(source.charAt(i + 3));
    if (c0 < 0 || c1 < 0) break;
    bytes.push(((c0 << 2) | (c1 >> 4)) & 0xff);
    if (c2 >= 0) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 >= 0) bytes.push(((c2 & 3) << 6) | c3);
  }
  return bytes;
}

function utf8Bytes(text) {
  const str = String(text == null ? "" : text);
  const bytes = [];
  for (let i = 0; i < str.length; i += 1) {
    let code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const low = str.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i += 1;
      }
    }
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63)
      );
    }
  }
  return bytes;
}

function bytesToHex(bytes) {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += hex.charAt((bytes[i] >> 4) & 15) + hex.charAt(bytes[i] & 15);
  }
  return out;
}

function sha1Bytes(message) {
  const bytes = Array.isArray(message) ? message.slice() : utf8Bytes(message);
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  bytes.push((high >>> 24) & 255, (high >>> 16) & 255, (high >>> 8) & 255, high & 255);
  bytes.push((low >>> 24) & 255, (low >>> 16) & 255, (low >>> 8) & 255, low & 255);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Array(80);

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    for (let i = 0; i < 16; i += 1) {
      const p = chunk + i * 4;
      w[i] = ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
    }
    for (let i = 16; i < 80; i += 1) {
      const value = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = ((value << 1) | (value >>> 31)) >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let i = 0; i < 80; i += 1) {
      let f;
      let k;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  const out = [];
  [h0, h1, h2, h3, h4].forEach((value) => {
    out.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
  });
  return out;
}

function sha1Hex(input) {
  return bytesToHex(sha1Bytes(input));
}

const AES_SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

function aesExpandKey(key) {
  const expanded = key.slice();
  let rcon = 1;
  const temp = [0, 0, 0, 0];
  for (let i = 16; i < 176; i += 4) {
    temp[0] = expanded[i - 4];
    temp[1] = expanded[i - 3];
    temp[2] = expanded[i - 2];
    temp[3] = expanded[i - 1];
    if (i % 16 === 0) {
      const first = temp[0];
      temp[0] = AES_SBOX[temp[1]] ^ rcon;
      temp[1] = AES_SBOX[temp[2]];
      temp[2] = AES_SBOX[temp[3]];
      temp[3] = AES_SBOX[first];
      rcon = ((rcon << 1) ^ (rcon & 0x80 ? 0x1b : 0)) & 0xff;
    }
    expanded[i] = expanded[i - 16] ^ temp[0];
    expanded[i + 1] = expanded[i - 15] ^ temp[1];
    expanded[i + 2] = expanded[i - 14] ^ temp[2];
    expanded[i + 3] = expanded[i - 13] ^ temp[3];
  }
  return expanded;
}

function gmul(a, b) {
  let p = 0;
  let x = a & 0xff;
  let y = b & 0xff;
  for (let i = 0; i < 8; i += 1) {
    if (y & 1) p ^= x;
    const high = x & 0x80;
    x = (x << 1) & 0xff;
    if (high) x ^= 0x1b;
    y >>= 1;
  }
  return p & 0xff;
}

function aesEncryptBlock(block, expandedKey) {
  const s = block.slice();
  for (let i = 0; i < 16; i += 1) s[i] ^= expandedKey[i];
  for (let round = 1; round <= 10; round += 1) {
    for (let i = 0; i < 16; i += 1) s[i] = AES_SBOX[s[i]];
    const t = s.slice();
    for (let col = 0; col < 4; col += 1) {
      for (let row = 1; row < 4; row += 1) {
        s[row + 4 * col] = t[row + 4 * ((col + row) % 4)];
      }
    }
    if (round !== 10) {
      for (let col = 0; col < 4; col += 1) {
        const base = col * 4;
        const a0 = s[base];
        const a1 = s[base + 1];
        const a2 = s[base + 2];
        const a3 = s[base + 3];
        s[base] = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3;
        s[base + 1] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3;
        s[base + 2] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3);
        s[base + 3] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2);
      }
    }
    const keyOffset = round * 16;
    for (let i = 0; i < 16; i += 1) s[i] ^= expandedKey[keyOffset + i];
  }
  return s;
}

function toByteArray(input) {
  if (Array.isArray(input)) return input.slice();
  if (input && typeof input.length === "number") {
    const out = [];
    for (let i = 0; i < input.length; i += 1) out.push(input[i] & 0xff);
    return out;
  }
  return utf8Bytes(input);
}

function aes128CbcEncrypt(plainBytes, keyBytes, ivBytes) {
  const expanded = aesExpandKey(toByteArray(keyBytes));
  const bytes = toByteArray(plainBytes);
  const iv = toByteArray(ivBytes);
  const padLength = bytes.length % 16 === 0 ? 16 : 16 - (bytes.length % 16);
  for (let i = 0; i < padLength; i += 1) bytes.push(padLength);
  let previous = iv.slice();
  const output = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const block = [];
    for (let i = 0; i < 16; i += 1) block.push(bytes[offset + i] ^ previous[i]);
    previous = aesEncryptBlock(block, expanded);
    for (let i = 0; i < 16; i += 1) output.push(previous[i]);
  }
  return output;
}

const WEB_REPORT_PUBLIC_KEY = [
  "-----BEGIN PUBLIC KEY-----",
  "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZgjVwAiKTjZ55nG+mW6r3TSU4",
  "ECvNYqDMIS/bhCj2QaH5GI/KZb2TBp+CBvUj9SLFnmJQ0kzHzHoGZCQ88VevCffF7JePGF9cmKQqotlfTKbV4oxV5iLz7JSG6b/Vg7AXtrTolNtWsa8HiB0tI0YClYaQlOXm4UxLeSxQwSFETwIDAQAB",
  "-----END PUBLIC KEY-----",
].join("\n");

function pemToDer(pem) {
  const body = String(pem)
    .replace(/-----[^-]+-----/g, "")
    .replace(/\s+/g, "");
  return base64ToBytes(body);
}

function derRead(bytes, offset) {
  const tag = bytes[offset];
  let pos = offset + 1;
  let length = bytes[pos];
  pos += 1;
  if (length & 0x80) {
    const count = length & 0x7f;
    length = 0;
    for (let i = 0; i < count; i += 1) length = (length << 8) | bytes[pos + i];
    pos += count;
  }
  return { tag, start: pos, end: pos + length, next: pos + length };
}

function parseRsaPublicKey(pem) {
  const der = pemToDer(pem);
  const outer = derRead(der, 0);
  const algorithm = derRead(der, outer.start);
  const bitString = derRead(der, algorithm.next);
  const derStart = bitString.start + 1;
  const rsaSeq = derRead(der, derStart);
  const modulus = derRead(der, rsaSeq.start);
  const exponent = derRead(der, modulus.next);
  const trim = (item) => {
    let start = item.start;
    while (start < item.end - 1 && der[start] === 0) start += 1;
    return der.slice(start, item.end);
  };
  const modulusBytes = trim(modulus);
  const exponentBytes = trim(exponent);
  return {
    n: bytesToBigInt(modulusBytes),
    e: bytesToBigInt(exponentBytes),
    size: modulusBytes.length,
    modulusBytes,
  };
}

function bytesToBigInt(bytes) {
  if (typeof BigInt === "undefined") {
    throw new Error("当前 Loon 版本不支持 BigInt，无法本地 RSA，请改用 signMode=app");
  }
  let value = BigInt(0);
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << BigInt(8)) | BigInt(bytes[i] & 0xff);
  }
  return value;
}

function bigIntToBytes(value, size) {
  const bytes = new Array(size).fill(0);
  let current = value;
  const base = BigInt(256);
  for (let i = size - 1; i >= 0; i -= 1) {
    bytes[i] = Number(current % base);
    current /= base;
  }
  return bytes;
}

function modPow(base, exponent, modulus) {
  let result = BigInt(1);
  let b = base % modulus;
  let e = exponent;
  const zero = BigInt(0);
  const one = BigInt(1);
  while (e > zero) {
    if (e & one) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= one;
  }
  return result;
}

function rsaEncryptPkcs1(messageBytes, pem) {
  const key = typeof pem === "string" ? parseRsaPublicKey(pem) : pem;
  const size = key.size;
  const message = Array.isArray(messageBytes) ? messageBytes : utf8Bytes(messageBytes);
  const paddingLength = size - message.length - 3;
  if (paddingLength < 8) throw new Error("RSA 明文过长");
  const block = [0x00, 0x02];
  for (let i = 0; i < paddingLength; i += 1) {
    let value = 0;
    while (value === 0) value = Math.floor(Math.random() * 256) & 0xff;
    block.push(value);
  }
  block.push(0x00);
  for (let i = 0; i < message.length; i += 1) block.push(message[i] & 0xff);
  const cipher = modPow(bytesToBigInt(block), key.e, key.n);
  return bigIntToBytes(cipher, size);
}

const WEB_REPORT_IV = "abcdefghijklmnop";
const WEB_REPORT_KEY_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

function randomWebReportKey() {
  let key = "";
  while (key.length < 16) {
    key += WEB_REPORT_KEY_CHARS.charAt(Math.floor(Math.random() * WEB_REPORT_KEY_CHARS.length));
  }
  return key;
}

function encryptWebReport(payload, timeSec) {
  const aesKey = randomWebReportKey();
  const key = bytesToBase64(rsaEncryptPkcs1(utf8Bytes(aesKey), WEB_REPORT_PUBLIC_KEY));
  const data = bytesToBase64(
    aes128CbcEncrypt(utf8Bytes(payload), utf8Bytes(aesKey), utf8Bytes(WEB_REPORT_IV))
  );
  const time = String(timeSec || Math.floor(Date.now() / 1000));
  return {
    sid: sha1Hex(data + time) + sha1Hex(key),
    key,
    data,
    timeSec: time,
  };
}

const WEB_SIGN_ALPHABET = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";
const WEB_VERSION = "999.0.4";
const WEB_PROFILE = {
  app: "heybox",
  os_type: "web",
  x_app: "heybox",
  x_client_type: "web",
  x_os_type: "Android",
  x_client_version: "1.3.389",
};
const WEB_UA =
  "Mozilla/5.0 (Linux; Android 16; 23113RKC6C Build/BP2A.250605.031.A3; wv) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/143.0.7499.192 Mobile Safari/537.36";

function mul2(value) {
  return 128 & value ? 255 & ((value << 1) ^ 27) : value << 1;
}

function mixX(value) {
  return mul2(value) ^ value;
}

function mixK(value) {
  return mixX(mul2(value));
}

function mixC(value) {
  return mixK(mixX(mul2(value)));
}

function mixS(value) {
  return mixC(value) ^ mixK(value) ^ mixX(value);
}

function mixArray(input) {
  const output = [0, 0, 0, 0];
  output[0] = mixS(input[0]) ^ mixC(input[1]) ^ mixK(input[2]) ^ mixX(input[3]);
  output[1] = mixX(input[0]) ^ mixS(input[1]) ^ mixC(input[2]) ^ mixK(input[3]);
  output[2] = mixK(input[0]) ^ mixX(input[1]) ^ mixS(input[2]) ^ mixC(input[3]);
  output[3] = mixC(input[0]) ^ mixK(input[1]) ^ mixX(input[2]) ^ mixS(input[3]);
  input[0] = output[0];
  input[1] = output[1];
  input[2] = output[2];
  input[3] = output[3];
  return input;
}

function remapByAlphabet(input, alphabet, endOffset) {
  let output = "";
  const base = alphabet.slice(0, endOffset);
  for (let index = 0; index < input.length; index += 1) {
    output += base.charAt(input.charCodeAt(index) % base.length);
  }
  return output;
}

function remapFull(input, alphabet) {
  let output = "";
  for (let index = 0; index < input.length; index += 1) {
    output += alphabet.charAt(input.charCodeAt(index) % alphabet.length);
  }
  return output;
}

function interleaveParts(parts) {
  let output = "";
  let maxLength = 0;
  for (let i = 0; i < parts.length; i += 1) {
    maxLength = Math.max(maxLength, parts[i].length);
  }
  for (let index = 0; index < maxLength; index += 1) {
    for (let i = 0; i < parts.length; i += 1) {
      if (index < parts[i].length) output += parts[i].charAt(index);
    }
  }
  return output;
}

function normalizeSignPath(path) {
  return "/" + String(path).split("/").filter(Boolean).join("/") + "/";
}

function makeWebHkey(path, timeSec, nonce) {
  const alphabet = WEB_SIGN_ALPHABET;
  const timePart = remapByAlphabet(String(timeSec), alphabet, -2);
  const pathPart = remapFull(normalizeSignPath(path), alphabet);
  const noncePart = remapFull(nonce, alphabet);
  const mixed = interleaveParts([timePart, pathPart, noncePart]).slice(0, 20);
  const digest = md5(mixed);
  let suffix = String(
    mixArray(
      digest
        .slice(-6)
        .split("")
        .map((char) => char.charCodeAt(0))
    ).reduce((sum, value) => sum + value, 0) % 100
  );
  if (suffix.length < 2) suffix = "0" + suffix;
  return remapByAlphabet(digest.substring(0, 5), alphabet, -4) + suffix;
}

function makeWebSignature(path, timeSec, nonce) {
  const time = timeSec || Math.floor(Date.now() / 1000);
  const value = nonce || md5(String(Date.now()) + Math.random()).toUpperCase();
  return {
    version: WEB_VERSION,
    hkey: makeWebHkey(path, time + 1, value),
    _time: String(time),
    nonce: value,
  };
}

function notify(title, subtitle, content) {
  const detail = String(content == null ? "" : content);
  console.log([String(title), String(subtitle), detail].join("\n"));
  $notification.post(String(title), String(subtitle), detail);
}

function md5(input) {
  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function cycle(state, block) {
    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, block[0], 7, -680876936);
    d = ff(d, a, b, c, block[1], 12, -389564586);
    c = ff(c, d, a, b, block[2], 17, 606105819);
    b = ff(b, c, d, a, block[3], 22, -1044525330);
    a = ff(a, b, c, d, block[4], 7, -176418897);
    d = ff(d, a, b, c, block[5], 12, 1200080426);
    c = ff(c, d, a, b, block[6], 17, -1473231341);
    b = ff(b, c, d, a, block[7], 22, -45705983);
    a = ff(a, b, c, d, block[8], 7, 1770035416);
    d = ff(d, a, b, c, block[9], 12, -1958414417);
    c = ff(c, d, a, b, block[10], 17, -42063);
    b = ff(b, c, d, a, block[11], 22, -1990404162);
    a = ff(a, b, c, d, block[12], 7, 1804603682);
    d = ff(d, a, b, c, block[13], 12, -40341101);
    c = ff(c, d, a, b, block[14], 17, -1502002290);
    b = ff(b, c, d, a, block[15], 22, 1236535329);

    a = gg(a, b, c, d, block[1], 5, -165796510);
    d = gg(d, a, b, c, block[6], 9, -1069501632);
    c = gg(c, d, a, b, block[11], 14, 643717713);
    b = gg(b, c, d, a, block[0], 20, -373897302);
    a = gg(a, b, c, d, block[5], 5, -701558691);
    d = gg(d, a, b, c, block[10], 9, 38016083);
    c = gg(c, d, a, b, block[15], 14, -660478335);
    b = gg(b, c, d, a, block[4], 20, -405537848);
    a = gg(a, b, c, d, block[9], 5, 568446438);
    d = gg(d, a, b, c, block[14], 9, -1019803690);
    c = gg(c, d, a, b, block[3], 14, -187363961);
    b = gg(b, c, d, a, block[8], 20, 1163531501);
    a = gg(a, b, c, d, block[13], 5, -1444681467);
    d = gg(d, a, b, c, block[2], 9, -51403784);
    c = gg(c, d, a, b, block[7], 14, 1735328473);
    b = gg(b, c, d, a, block[12], 20, -1926607734);

    a = hh(a, b, c, d, block[5], 4, -378558);
    d = hh(d, a, b, c, block[8], 11, -2022574463);
    c = hh(c, d, a, b, block[11], 16, 1839030562);
    b = hh(b, c, d, a, block[14], 23, -35309556);
    a = hh(a, b, c, d, block[1], 4, -1530992060);
    d = hh(d, a, b, c, block[4], 11, 1272893353);
    c = hh(c, d, a, b, block[7], 16, -155497632);
    b = hh(b, c, d, a, block[10], 23, -1094730640);
    a = hh(a, b, c, d, block[13], 4, 681279174);
    d = hh(d, a, b, c, block[0], 11, -358537222);
    c = hh(c, d, a, b, block[3], 16, -722521979);
    b = hh(b, c, d, a, block[6], 23, 76029189);
    a = hh(a, b, c, d, block[9], 4, -640364487);
    d = hh(d, a, b, c, block[12], 11, -421815835);
    c = hh(c, d, a, b, block[15], 16, 530742520);
    b = hh(b, c, d, a, block[2], 23, -995338651);

    a = ii(a, b, c, d, block[0], 6, -198630844);
    d = ii(d, a, b, c, block[7], 10, 1126891415);
    c = ii(c, d, a, b, block[14], 15, -1416354905);
    b = ii(b, c, d, a, block[5], 21, -57434055);
    a = ii(a, b, c, d, block[12], 6, 1700485571);
    d = ii(d, a, b, c, block[3], 10, -1894986606);
    c = ii(c, d, a, b, block[10], 15, -1051523);
    b = ii(b, c, d, a, block[1], 21, -2054922799);
    a = ii(a, b, c, d, block[8], 6, 1873313359);
    d = ii(d, a, b, c, block[15], 10, -30611744);
    c = ii(c, d, a, b, block[6], 15, -1560198380);
    b = ii(b, c, d, a, block[13], 21, 1309151649);
    a = ii(a, b, c, d, block[4], 6, -145523070);
    d = ii(d, a, b, c, block[11], 10, -1120210379);
    c = ii(c, d, a, b, block[2], 15, 718787259);
    b = ii(b, c, d, a, block[9], 21, -343485551);

    state[0] = add32(a, oa);
    state[1] = add32(b, ob);
    state[2] = add32(c, oc);
    state[3] = add32(d, od);
  }
  function block(text) {
    const out = [];
    for (let i = 0; i < 64; i += 4) {
      out[i >> 2] =
        text.charCodeAt(i) +
        (text.charCodeAt(i + 1) << 8) +
        (text.charCodeAt(i + 2) << 16) +
        (text.charCodeAt(i + 3) << 24);
    }
    return out;
  }
  function digest(text) {
    const state = [1732584193, -271733879, -1732584194, 271733878];
    const totalLength = text.length;
    let i;
    for (i = 64; i <= text.length; i += 64) cycle(state, block(text.substring(i - 64, i)));
    text = text.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < text.length; i += 1) tail[i >> 2] |= text.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      cycle(state, tail);
      for (i = 0; i < 16; i += 1) tail[i] = 0;
    }
    tail[14] = totalLength * 8;
    cycle(state, tail);
    return state;
  }
  function rhex(value) {
    const hex = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < 4; i += 1) {
      out +=
        hex.charAt((value >> (i * 8 + 4)) & 15) +
        hex.charAt((value >> (i * 8)) & 15);
    }
    return out;
  }
  const text = unescape(encodeURIComponent(String(input)));
  return digest(text).map(rhex).join("");
}

function readStore(key, fallback) {
  try {
    const value = $persistentStore.read(key);
    return value == null || value === "" ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function writeStore(value, key) {
  try {
    return $persistentStore.write(value, key);
  } catch (_) {
    return false;
  }
}

function toText(value) {
  return value == null ? "" : String(value).trim();
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].toLowerCase() === target) return headers[keys[i]];
  }
  return "";
}

function getQueryParam(url, name) {
  const match = String(url).match(new RegExp("[?&]" + name + "=([^&#]*)", "i"));
  if (!match) return "";
  try {
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  } catch (_) {
    return match[1];
  }
}

function pickCookieValue(cookie, key) {
  const items = String(cookie || "").split(";");
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i].trim();
    const pos = item.indexOf("=");
    if (pos < 1) continue;
    if (item.slice(0, pos).trim().toLowerCase() === String(key).toLowerCase()) {
      return item.slice(pos + 1).trim();
    }
  }
  return "";
}

function buildAppCookie(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  const token = pickCookieValue(cookie, "x_xhh_tokenid");
  if (!pkey || !token) return "";
  return "pkey=" + pkey + ";x_xhh_tokenid=" + token;
}

function decodePkeyUserId(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  if (!pkey) return "";
  let encoded;
  try {
    encoded = decodeURIComponent(pkey);
  } catch (_) {
    encoded = pkey;
  }
  const variants = [encoded];
  const trimmed = encoded.replace(/_+$/, "");
  if (trimmed && trimmed !== encoded) variants.push(trimmed);
  for (let v = 0; v < variants.length; v += 1) {
    const padded = variants[v] + "=".repeat((4 - (variants[v].length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    let plain = "";
    try {
      if (typeof atob === "function") plain = atob(base64);
      else if (typeof Buffer !== "undefined")
        plain = Buffer.from(base64, "base64").toString("utf8");
      else return "";
    } catch (_) {
      plain = "";
    }
    const match = plain.match(/_(\d{5,})/);
    if (match) return match[1];
  }
  return "";
}

function makeImei(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  if (!pkey) throw new Error("Cookie 缺少 pkey");
  return md5(pkey).slice(0, 16);
}

function maskId(id) {
  const value = String(id || "");
  if (value.length <= 4) return value;
  return value.slice(0, 2) + "***" + value.slice(-2);
}

function loadAccounts() {
  try {
    const list = JSON.parse(readStore(STORAGE_KEY, "[]"));
    return Array.isArray(list)
      ? list
          .map((item) => {
            const cookie = buildAppCookie(item && item.cookie);
            const heyboxId =
              toText(item && item.heyboxId) || decodePkeyUserId(cookie);
            if (!cookie || !heyboxId) return null;
            return {
              heyboxId,
              cookie,
              imei: makeImei(cookie),
              updatedAt: Number(item.updatedAt) || 0
            };
          })
          .filter(Boolean)
      : [];
  } catch (_) {
    return [];
  }
}

async function captureAccount() {
  const url = toText($request && $request.url);
  const headers = ($request && $request.headers) || {};
  const cookie = buildAppCookie(getHeader(headers, "Cookie"));
  if (!cookie) return;
  const heyboxId =
    getQueryParam(url, "heybox_id") ||
    getQueryParam(url, "user_id") ||
    decodePkeyUserId(cookie);
  if (!heyboxId) return;

  const accounts = loadAccounts();
  const account = {
    heyboxId: String(heyboxId),
    cookie,
    imei: makeImei(cookie),
    updatedAt: Date.now()
  };
  const index = accounts.findIndex((item) => String(item.heyboxId) === String(heyboxId));
  const previousAccount = index >= 0 ? accounts[index] : null;
  const previousPkey = previousAccount
    ? pickCookieValue(previousAccount.cookie, "pkey")
    : "";
  const currentPkey = pickCookieValue(cookie, "pkey");
  const shouldNotify = !previousAccount || previousPkey !== currentPkey;
  if (index >= 0) accounts[index] = account;
  else accounts.push(account);
  if (accounts.length > MAX_ACCOUNTS) {
    accounts.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
    accounts.length = MAX_ACCOUNTS;
  }

  if (!writeStore(JSON.stringify(accounts), STORAGE_KEY)) {
    notify(SCRIPT_NAME, "❌ 获取账号失败", "Loon 持久化存储写入失败");
    return;
  }

  if (shouldNotify) {
    notify(
      SCRIPT_NAME,
      "✅ 获取账号成功",
      "账号：" + maskId(heyboxId) + "\n已保存 Cookie，并根据 pkey 生成设备标识"
    );
  }
}

function encodeQuery(params) {
  return Object.keys(params || {})
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])))
    .join("&");
}

function parseSwitch(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return !/^(false|0|off|no)$/i.test(String(value));
}

function parseSignMode(value) {
  return /^web$/i.test(String(value == null ? "" : value).trim()) ? "web" : "app";
}

function runtimeOptions() {
  let value = typeof $argument === "undefined" ? null : $argument;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (_) {
      value = value.split(",");
    }
  }
  const pick = (key, index) => {
    if (Array.isArray(value)) return value[index];
    return value && typeof value === "object" ? value[key] : undefined;
  };
  const signWait = Number(pick("signWait", 2));
  return {
    dailyTasks: parseSwitch(pick("dailyTasks", 0), true),
    publishTask: parseSwitch(pick("publishTask", 1), false),
    signWait: signWait > 0 ? signWait : SIGN_WAIT_DEFAULT_SEC,
    signMode: parseSignMode(pick("signMode", 3)),
    reviewTask: parseSwitch(pick("reviewTask", 4), false)
  };
}

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return output;
}

function randomUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 3) | 8).toString(16);
  });
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function httpRequest(method, options) {
  return new Promise((resolve, reject) => {
    const fn = String(method || "GET").toUpperCase() === "POST" ? "post" : "get";
    const request = Object.assign({ timeout: 15000 }, options || {});
    $httpClient[fn](request, (error, response, data) => {
      if (error) {
        const host = toText(request.url).match(/^https?:\/\/([^/?#]+)/i);
        reject(
          taggedError(
            fn.toUpperCase() +
              " " +
              (host ? host[1] : "网络请求") +
              "：" +
              String(error),
            true
          )
        );
        return;
      }
      resolve({
        status: Number(response && (response.status || response.statusCode)) || 0,
        body: data == null ? "" : String(data)
      });
    });
  });
}

function sanitize(text) {
  return String(text == null ? "" : text)
    .replace(/(pkey|x_xhh_tokenid)=[^;&"'\s]*/gi, "$1=***")
    .replace(/Cookie:\s*[^\n]*/gi, "Cookie: ***")
    .slice(0, 160);
}

function taggedError(message, retryable) {
  const error = new Error(message);
  error.retryable = retryable !== false;
  return error;
}

function parseJsonResponse(response, action) {
  if (response.status < 200 || response.status >= 300) {
    const retryable = response.status >= 500 || response.status === 429;
    throw taggedError(
      action + " HTTP " + response.status + " " + sanitize(response.body),
      retryable
    );
  }
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (_) {
    throw taggedError(action + "返回内容不是 JSON：" + sanitize(response.body), false);
  }
}

async function getJsonRequest(options, action) {
  return parseJsonResponse(await httpRequest("GET", options), action);
}

async function postJsonRequest(options, action) {
  return parseJsonResponse(await httpRequest("POST", options), action);
}

function apiFailureMessage(payload, fallback) {
  if (!payload) return fallback;
  return toText(payload.msg || payload.message) || toText(payload.status) || fallback;
}

function requireOk(payload, action) {
  if (!payload || toText(payload.status) !== OK_STATE) {
    const message = apiFailureMessage(payload, "服务器未返回成功状态");
    if (isLoginExpired(payload && payload.status, message)) {
      throw new Error(action + "：" + LOGIN_EXPIRED_HINT);
    }
    throw new Error(action + "：" + message);
  }
  return payload;
}

function unwrapHkeyPayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  if (payload.result && typeof payload.result === "object") return payload.result;
  return payload;
}

async function withRetry(action, handler, options) {
  const opts = options || {};
  const maxAttempts = Number(opts.attempts) > 0 ? Number(opts.attempts) : 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await handler(attempt);
      if (attempt > 1) {
        console.log("[重试成功] " + action + " 第" + attempt + "次");
      }
      return result;
    } catch (error) {
      lastError = error;
      if (error && error.retryable === false) throw error;
      if (attempt < maxAttempts) {
        const backoff = Math.min(700 * Math.pow(2, attempt - 1), 4000);
        console.log(
          "[准备重试] " +
            action +
            " 第" +
            attempt +
            "次失败：" +
            String(error.message || error) +
            "（" +
            (backoff / 1000).toFixed(1) +
            "s 后）"
        );
        await sleep(backoff);
      }
    }
  }
  throw new Error(
    action +
      "连续" +
      maxAttempts +
      "次失败：" +
      String((lastError && lastError.message) || lastError)
  );
}

async function requestHkey(account, path, timeSec) {
  return withRetry("GET hkey " + path, async () => {
    const time = String(timeSec || Math.floor(Date.now() / 1000));
    const payload = await getJsonRequest(
      {
        url:
          HKEY_API +
          "?" +
          encodeQuery({
            mode: "request",
            path,
            time,
            imei: account.imei,
            heybox_id: account.heyboxId
          }),
        headers: { "User-Agent": APP_UA, Accept: "application/json" },
        "auto-cookie": false
      },
      "hkey请求"
    );
    if (payload && payload.status && toText(payload.status) !== OK_STATE) {
      throw taggedError("hkey接口：" + apiFailureMessage(payload, "签名失败"), false);
    }
    const result = unwrapHkeyPayload(payload);
    if (!result.hkey || !result.version || !/^\d+$/.test(toText(result.build))) {
      throw new Error("hkey接口缺少 hkey/version/build");
    }
    return {
      hkey: toText(result.hkey),
      version: toText(result.version),
      build: toText(result.build),
      time
    };
  });
}

async function requestReportData(account, path, textPayload) {
  return withRetry("POST hkey " + path, async () => {
    const time = String(Math.floor(Date.now() / 1000));
    const payload = await postJsonRequest(
      {
        url: HKEY_API,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          mode: "report",
          path,
          text: textPayload,
          time,
          imei: account.imei,
          heybox_id: account.heyboxId
        }),
        "auto-cookie": false
      },
      "任务数据编码"
    );
    if (payload && payload.status && toText(payload.status) !== OK_STATE) {
      throw taggedError("任务数据编码：" + apiFailureMessage(payload, "编码失败"), false);
    }
    const result = unwrapHkeyPayload(payload);
    if (
      !result.hkey ||
      !result.version ||
      !/^\d+$/.test(toText(result.build)) ||
      !result.time ||
      !result.data ||
      !result.key ||
      !result.sid
    ) {
      throw new Error("任务数据编码返回字段不完整");
    }
    return result;
  });
}

function appHeaders(account, hasBody) {
  const headers = {
    "User-Agent": APP_UA,
    Referer: APP_REFERER,
    Cookie: account.cookie,
    Accept: "application/json"
  };
  if (hasBody) headers["Content-Type"] = "application/x-www-form-urlencoded";
  return headers;
}

function buildWebCookie(cookie, heyboxId) {
  const pkey = pickCookieValue(cookie, "pkey");
  const token = pickCookieValue(cookie, "x_xhh_tokenid");
  if (!pkey || !token) return cookie;
  return (
    "pkey=" + pkey + ";x_xhh_tokenid=" + token + ";x_pkey=" + pkey + ";x_heybox_id=" + heyboxId
  );
}

function webHeaders(account, hasBody) {
  const headers = {
    "User-Agent": WEB_UA,
    Accept: "application/json, text/plain, */*",
    Origin: "https://web.xiaoheihe.cn",
    Referer: "https://web.xiaoheihe.cn/",
    "X-Requested-With": "com.max.xiaoheihe",
    Cookie: account.webCookie || buildWebCookie(account.cookie, account.heyboxId)
  };
  if (hasBody) headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
  return headers;
}

function buildWebQuery(account, path, extraQuery) {
  const signature = makeWebSignature(path);
  return Object.assign(
    {},
    WEB_PROFILE,
    {
      heybox_id: account.heyboxId
    },
    signature,
    extraQuery || {}
  );
}

async function webRequest(account, path, extraQuery, baseUrl, bodyData) {
  const url =
    (baseUrl || API_BASE) + path + "?" + encodeQuery(buildWebQuery(account, path, extraQuery));
  if (bodyData == null) {
    return await getJsonRequest(
      { url, headers: webHeaders(account, false), "auto-cookie": false },
      path
    );
  }
  return await postJsonRequest(
    {
      url,
      headers: webHeaders(account, true),
      body: encodeQuery(bodyData),
      "auto-cookie": false
    },
    path
  );
}

async function webGet(account, path, extraQuery, baseUrl) {
  const payload = await webRequest(account, path, extraQuery, baseUrl);
  console.log("[官方接口/web] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

async function webPostForm(account, path, bodyData, extraQuery, baseUrl) {
  const payload = await webRequest(account, path, extraQuery, baseUrl, bodyData || {});
  console.log("[官方接口/web] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

async function webPostEncryptedReport(account, path, textPayload, extraQuery) {
  if (typeof BigInt === "undefined") {
    throw new Error("当前 Loon 版本不支持 BigInt，无法本地加密上报，请把签名模式切回 app");
  }
  const encrypted = encryptWebReport(textPayload);
  const reportPath = PATH_DATA_REPORT_WEB;
  const url =
    DATA_BASE +
    reportPath +
    "?" +
    encodeQuery(
      buildWebQuery(
        account,
        reportPath,
        Object.assign({ type: "104", time_: encrypted.timeSec }, extraQuery || {})
      )
    );
  const payload = await postJsonRequest(
    {
      url,
      headers: webHeaders(account, true),
      body: encodeQuery({ sid: encrypted.sid, key: encrypted.key, data: encrypted.data }),
      "auto-cookie": false
    },
    reportPath
  );
  console.log("[任务上报/web] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

function buildSignedQuery(account, signature, extraQuery) {
  return Object.assign(
    {
      heybox_id: account.heyboxId,
      imei: account.imei,
      device_info: APP_PROFILE.device_info,
      nonce: randomString(32),
      hkey: signature.hkey,
      os_type: APP_PROFILE.os_type,
      x_os_type: APP_PROFILE.x_os_type,
      x_client_type: APP_PROFILE.x_client_type,
      os_version: APP_PROFILE.os_version,
      version: signature.version,
      build: signature.build,
      _time: signature.time,
      dw: APP_PROFILE.dw,
      channel: APP_PROFILE.channel,
      x_app: APP_PROFILE.x_app,
      time_zone: APP_PROFILE.time_zone
    },
    extraQuery || {}
  );
}

function readRetry(action, handler) {
  return withRetry(action, handler, {
    attempts: 2,
    retryable: (error) => !error || error.retryable !== false
  });
}

async function appGet(account, path, extraQuery, baseUrl) {
  const webMode = Boolean(account && account.signMode === "web");
  const payload = await readRetry(path, async () => {
    if (webMode) return await webRequest(account, path, extraQuery, baseUrl);
    const signature = await requestHkey(account, path);
    const url = buildAppUrl(account, baseUrl, path, signature, extraQuery);
    return await getJsonRequest(
      { url, headers: appHeaders(account, false), "auto-cookie": false },
      path
    );
  });
  console.log("[官方接口" + (webMode ? "/web" : "") + "] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

function buildAppUrl(account, baseUrl, path, signature, extraQuery) {
  return (
    (baseUrl || API_BASE) +
    path +
    "?" +
    encodeQuery(buildSignedQuery(account, signature, extraQuery))
  );
}

async function appPostForm(account, path, extraQuery, bodyData, baseUrl) {
  if (account && account.signMode === "web") {
    return await webPostForm(account, path, bodyData, extraQuery, baseUrl);
  }
  const signature = await requestHkey(account, path);
  const url = buildAppUrl(account, baseUrl, path, signature, extraQuery);
  const payload = await postJsonRequest(
    {
      url,
      headers: appHeaders(account, true),
      body: encodeQuery(bodyData || {}),
      "auto-cookie": false
    },
    path
  );
  console.log("[官方接口] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

async function postEncryptedForm(account, path, textPayload, extraQuery, baseUrl) {
  if (account && account.signMode === "web") {
    return await webPostEncryptedReport(account, path, textPayload, extraQuery);
  }
  const encoded = await requestReportData(account, path, textPayload);
  const signature = {
    hkey: encoded.hkey,
    version: encoded.version,
    build: encoded.build,
    time: toText(encoded.time)
  };
  const payload = await postJsonRequest(
    {
      url: buildAppUrl(
        account,
        baseUrl || DATA_BASE,
        path,
        signature,
        Object.assign({ time_: signature.time }, extraQuery || {})
      ),
      headers: appHeaders(account, true),
      body: encodeQuery({
        data: encoded.data,
        key: encoded.key,
        sid: encoded.sid
      }),
      "auto-cookie": false
    },
    path
  );
  console.log("[任务上报] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

function extractTaskList(payload) {
  requireOk(payload, "任务列表");
  const result = payload.result && typeof payload.result === "object" ? payload.result : {};
  const user = result.user && typeof result.user === "object" ? result.user : {};
  const levelInfo =
    user.level_info && typeof user.level_info === "object" ? user.level_info : {};
  const groups = Array.isArray(result.task_list) ? result.task_list : [];
  const tasks = [];
  groups.forEach((group) => {
    const list = Array.isArray(group.tasks) ? group.tasks : [];
    list.forEach((item) => {
      const reportExtra =
        item.report_extra && typeof item.report_extra === "object"
          ? item.report_extra
          : {};
      const awardText = (Array.isArray(item.award_desc_v2) ? item.award_desc_v2 : [])
        .map((award) => {
          const desc = toText(award && award.desc);
          const icon = toText(award && award.icon);
          if (icon.indexOf("b9aca51c") >= 0) return desc + "H币";
          if (icon.indexOf("c10d89ae") >= 0) return desc + "经验";
          if (icon.indexOf("e63b192a") >= 0) return desc + "盒电";
          return desc;
        })
        .filter(Boolean)
        .join(" ");
      tasks.push({
        title: toText(item.title || item.name || "未命名任务"),
        state: toText(item.state),
        stateDesc: toText(item.state_desc),
        taskId: toText(reportExtra.task_id),
        taskType: toText(item.type),
        reportTaskType: toText(reportExtra.task_type),
        maxjia: toText(item.maxjia),
        awardText
      });
    });
  });
  return {
    nickname: toText(user.username),
    coin: toText(levelInfo.coin),
    tasks
  };
}

function taskKey(task) {
  return task.taskId + "|" + task.title;
}

function findTask(snapshot, key) {
  return snapshot.tasks.find((task) => taskKey(task) === key);
}

function isSignTask(task) {
  return task.taskType === "sign";
}

function isDailyTask(task) {
  return isSignTask(task) || task.reportTaskType === "daily";
}

function isTaskEnabled(task, options) {
  if (isSignTask(task)) return true;
  if (task.taskId === "33") return !!options.dailyTasks && !!options.publishTask;
  if (task.taskId === "24") return !!options.dailyTasks && !!options.reviewTask;
  if (!options.dailyTasks) return false;
  return task.reportTaskType === "daily";
}

async function fetchSnapshot(account) {
  return extractTaskList(await appGet(account, PATH_TASK_LIST));
}

function collectObjects(root, matcher, limit) {
  const output = [];
  const stack = [root];
  const max = limit || 20;
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (matcher(node)) {
      output.push(node);
      if (output.length >= max) break;
    }
    const values = Array.isArray(node) ? node : Object.keys(node).map((key) => node[key]);
    for (let i = values.length - 1; i >= 0; i -= 1) stack.push(values[i]);
  }
  return output;
}

function extractFeeds(payload) {
  const links = payload && payload.result && payload.result.links;
  if (!Array.isArray(links)) return [];
  const seen = {};
  return links
    .map((item) => ({
      linkId: toText(item && item.link_id),
      hSrc: toText(item && item.h_src)
    }))
    .filter((item) => {
      const key = item.linkId + "|" + item.hSrc;
      if (!/^\d+$/.test(item.linkId) || !item.hSrc || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function extractGames(payload) {
  const objects = collectObjects(
    payload && payload.result,
    (node) =>
      !Array.isArray(node) &&
      Object.prototype.hasOwnProperty.call(node, "appid") &&
      Object.prototype.hasOwnProperty.call(node, "h_src"),
    40
  );
  const seen = {};
  return objects
    .map((item) => ({
      appid: toText(item.appid),
      hSrc: toText(item.h_src)
    }))
    .filter((item) => {
      const key = item.appid + "|" + item.hSrc;
      if (!/^\d+$/.test(item.appid) || !item.hSrc || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function extractComment(payload) {
  const links = payload && payload.result && payload.result.links;
  if (!Array.isArray(links)) return null;
  for (let i = 0; i < links.length; i += 1) {
    const item = links[i] || {};
    const linkId = toText(item.linkid || item.link_id);
    const userId = toText(item.userid);
    const hSrc = toText(item.h_src);
    if (/^\d+$/.test(linkId) && /^\d+$/.test(userId) && hSrc) {
      return { linkId, userId, hSrc };
    }
  }
  return null;
}

function buildShareReport(action, source, extra) {
  return JSON.stringify({
    events: [
      {
        type: action === "tap" ? "4" : "3",
        path: action === "tap" ? "/share/behavior/tap" : "/share/behavior/success",
        time: String(Math.floor(Date.now() / 1000)),
        addition: Object.assign({}, extra || {}, {
          src: source,
          plat: "WechatSession"
        })
      }
    ]
  });
}

async function sendShareEvents(account, source, extra) {
  const sessionId = randomUuid();
  const actions = ["tap", "success"];
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const payload = await postEncryptedForm(
      account,
      PATH_DATA_REPORT,
      buildShareReport(action, source, extra),
      { type: "104", session_id: sessionId },
      DATA_BASE
    );
    requireOk(payload, "分享 " + action + " 上报");
    if (action === "tap") await sleep(2000);
  }
}

async function settleTask(account, task, detail) {
  await sleep(SHARE_TASK_SETTLE_MS);
  const snapshot = await fetchSnapshot(account);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) {
    return {
      ok: true,
      message: task.title + "完成" + (detail ? " " + detail : ""),
      snapshot
    };
  }
  return { ok: false, message: task.title + "仍为待完成", snapshot };
}

function isSignedState(state) {
  return SIGNED_STATES.test(toText(state));
}

function isLoginExpired(status, message) {
  return /relogin|login|重新登录|请登录|未登录|登录态|失效/i.test(
    toText(status) + " " + toText(message)
  );
}

function signDetailText(state) {
  if (!state) return "";
  const details = [];
  if (state.coin) details.push("+" + state.coin + "H币");
  if (state.exp) details.push("+" + state.exp + "经验");
  if (state.streak) details.push("连签" + state.streak + "天");
  return details.join(" ");
}

function hasSignEvidence(state) {
  if (!state) return false;
  return Boolean(
    state.coin ||
      state.exp ||
      state.streak ||
      /已签到|已经签到|重复签到|签到成功/.test(state.message)
  );
}

function shortPayload(payload) {
  try {
    return JSON.stringify(payload || {}).slice(0, 220);
  } catch (_) {
    return "";
  }
}

async function readSignState(account) {
  const payload = await appGet(account, PATH_SIGN_STATE);
  const result =
    payload && payload.result && typeof payload.result === "object" ? payload.result : {};
  return {
    status: toText(payload && payload.status),
    state: toText(result.state || result.sign_state || result.sign_status),
    message: toText(payload && (payload.msg || payload.message)),
    coin: toText(result.sign_in_coin),
    exp: toText(result.sign_in_exp),
    streak: toText(result.sign_in_streak),
    raw: shortPayload(payload)
  };
}

function signWaitBudget(options) {
  const wanted = Number(options && options.signWait);
  const seconds = Number.isFinite(wanted) && wanted > 0 ? wanted : SIGN_WAIT_DEFAULT_SEC;
  return Math.min(Math.max(seconds, SIGN_WAIT_MIN_SEC), SIGN_WAIT_MAX_SEC) * 1000;
}

async function confirmSignState(account, budgetMs) {
  let last = null;
  let waited = 0;
  let round = 0;
  for (;;) {
    const gap = SIGN_POLL_GAPS[Math.min(round, SIGN_POLL_GAPS.length - 1)];
    await sleep(gap);
    waited += gap;
    round += 1;
    let state;
    try {
      state = await readSignState(account);
    } catch (error) {
      console.log("[签到确认] 第" + round + "次读取失败：" + String(error.message || error));
      continue;
    }
    last = state;
    if (state.status === OK_STATE && isSignedState(state.state)) return { ok: true, state };
    if (isLoginExpired(state.status, state.message)) return { ok: false, expired: true, state };
    if (waited >= budgetMs) return { ok: false, state };
  }
}

async function executeSign(account, options) {
  const budget = signWaitBudget(options);
  const half = Math.round(budget / 2);
  console.log("[签到确认预算] " + Math.round(budget / 1000) + " 秒（每轮 " + Math.round(half / 1000) + " 秒）");
  const diagnostics = [];
  let last = null;
  try {
    last = await readSignState(account);
  } catch (error) {
    console.log("[签到预查] 失败：" + String(error.message || error));
  }
  if (last) {
    if (last.status === OK_STATE && isSignedState(last.state) && hasSignEvidence(last)) {
      return {
        ok: true,
        already: true,
        state: last,
        message: signDetailText(last) || "今日已签到"
      };
    }
    if (isLoginExpired(last.status, last.message)) {
      return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
    }
  }

  for (let attempt = 1; attempt <= SIGN_ATTEMPTS; attempt += 1) {
    let payload = null;
    try {
      payload = await appGet(account, PATH_SIGN);
    } catch (error) {
      diagnostics.push("签到" + attempt + "=" + String(error.message || error).slice(0, 180));
      if (attempt < SIGN_ATTEMPTS) await sleep(SIGN_RETRY_DELAY_MS);
      continue;
    }
    const result =
      payload && payload.result && typeof payload.result === "object" ? payload.result : {};
    const signState = toText(result.state || result.sign_state);
    const signMessage = toText(payload && (payload.msg || payload.message));
    diagnostics.push("签到" + attempt + "=" + shortPayload(payload));
    if (isLoginExpired(payload.status, signMessage)) {
      return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
    }
    console.log(
      "[签到状态详情] " +
        JSON.stringify({ attempt, status: toText(payload.status), state: signState, msg: signMessage })
    );
    if (signState === "ignore" || /已签到|重复签到/.test(signMessage)) {
      let state = last;
      try {
        state = await readSignState(account);
      } catch (_) {}
      return {
        ok: true,
        already: true,
        late: attempt > 1 || !hasSignEvidence(last),
        state,
        message: signDetailText(state) || (attempt > 1 ? "签到已生效（服务器已记录）" : "今日已签到")
      };
    }
    const confirm = await confirmSignState(account, half);
    if (confirm.ok) {
      return { ok: true, state: confirm.state, message: signDetailText(confirm.state) || "签到成功" };
    }
    if (confirm.expired) return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
    if (confirm.state) {
      last = confirm.state;
      diagnostics.push("状态" + attempt + "=" + confirm.state.raw);
    }
    if (attempt < SIGN_ATTEMPTS) await sleep(SIGN_RETRY_DELAY_MS);
  }

  const finalCheck = await confirmSignState(account, SIGN_FINAL_WAIT_MS);
  if (finalCheck.ok) return { ok: true, state: finalCheck.state, message: signDetailText(finalCheck.state) || "签到成功" };
  if (finalCheck.expired) return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
  if (finalCheck.state) {
    last = finalCheck.state;
    diagnostics.push("终检=" + last.raw);
  }
  return {
    ok: false,
    state: last,
    message:
      "已提交但服务器未确认（返回 " + ((last && (last.state || last.message)) || "未知状态") + "）",
    diagnostic: diagnostics.join(" | ")
  };
}

async function executeSharePost(account, task) {
  const feeds = await appGet(account, PATH_FEEDS, {
    pull: "1",
    last_pull: "1",
    is_first: "0",
    list_ver: "2",
    has_cache: "1",
    netmode: "wifi"
  });
  requireOk(feeds, "拉取帖子流");
  const posts = extractFeeds(feeds);
  if (!posts.length) return { ok: false, message: "没有可用帖子" };
  const post = posts[0];
  await sleep(1000);

  const viewPayload = await postEncryptedForm(
    account,
    PATH_VIEW_TIME,
    JSON.stringify({
      duration: [
        {
          id: Number(post.linkId),
          duration: 5,
          duration_ms: 5000,
          type: "link",
          time: Math.floor(Date.now() / 1000),
          h_src: post.hSrc
        }
      ],
      shows: [],
      disappear: []
    }),
    {},
    DATA_BASE
  );
  requireOk(viewPayload, "帖子浏览时长上报");
  await sendShareEvents(account, "link", {
    link_id: post.linkId,
    h_src: post.hSrc
  });
  return settleTask(account, task, "link_id=" + post.linkId);
}

async function pickRecommendGame(account) {
  const payload = await appGet(account, PATH_GAME_RECOMMEND, { offset: "0", limit: "1" });
  requireOk(payload, "拉取推荐游戏");
  return extractGames(payload)[0] || null;
}

async function executeShareGameDetail(account, task) {
  const game = await pickRecommendGame(account);
  if (!game) return { ok: false, message: "没有可用游戏" };
  await sleep(1000);
  await sendShareEvents(account, "game_detail", {
    app_id: game.appid,
    h_src: game.hSrc
  });
  return settleTask(account, task, "appid=" + game.appid);
}

async function fetchGameComments(account, appId) {
  return await appGet(account, PATH_GAME_COMMENTS, {
    api_version: "4",
    offset: "0",
    limit: "30",
    appid: appId
  });
}

async function executeShareGameComment(account, task) {
  const game = await pickRecommendGame(account);
  if (!game) return { ok: false, message: "没有可用游戏" };
  const comments = await fetchGameComments(account, game.appid);
  requireOk(comments, "拉取游戏评价");
  const comment = extractComment(comments);
  if (!comment) return { ok: false, message: "游戏评价缺少关键字段" };
  await sendShareEvents(account, "game_comment", {
    link_id: comment.linkId
  });
  return settleTask(account, task, "appid=" + game.appid);
}

function parseMaxjia(value) {
  const raw = toText(value);
  if (!raw) return null;
  const body = raw.replace(/^heybox:\/\//, "");
  const candidates = [body];
  try {
    candidates.unshift(decodeURIComponent(body));
  } catch (_) {
    return null;
  }
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const parsed = JSON.parse(candidates[i]);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) {
      continue;
    }
  }
  return null;
}

function maxjiaValue(maxjia, key) {
  if (!maxjia) return "";
  const direct = toText(maxjia[key]);
  if (direct) return direct;
  const params = maxjia.params && typeof maxjia.params === "object" ? maxjia.params : {};
  return toText(params[key]);
}

function extractTopicId(maxjia) {
  return maxjiaValue(parseMaxjia(maxjia), "topic_id");
}

async function executeGameReviewTask(account, task) {
  const maxjia = parseMaxjia(task.maxjia);
  const appId = maxjiaValue(maxjia, "app_id") || maxjiaValue(maxjia, "appid");
  if (!appId) return { ok: false, message: "评价值任务缺少 app_id" };

  const comments = await fetchGameComments(account, appId);
  requireOk(comments, "拉取游戏话题");
  const links = comments && comments.result && comments.result.links;
  const topicId = toText(
    Array.isArray(links) &&
      links[0] &&
      Array.isArray(links[0].topics) &&
      links[0].topics[0] &&
      links[0].topics[0].topic_id
  );
  if (!topicId) return { ok: false, message: "游戏 " + appId + " 没有可用话题" };

  const content = GAME_REVIEW_CONTENT;
  const payload = await webPostForm(
    account,
    PATH_BBS_POST,
    {
      link_tag: "3",
      appid: appId,
      score: "5",
      topic_ids: topicId,
      text: JSON.stringify([{ checked: false, text: content, type: "text" }]),
      title: content,
      desc: content,
      draft: "0"
    },
    {},
    API_BASE
  );
  const linkId = toText(payload && payload.result && payload.result.link_id);
  if (toText(payload && payload.status) !== OK_STATE || !linkId) {
    return { ok: false, message: "发布评价失败：" + apiFailureMessage(payload, "无 link_id") };
  }
  const snapshot = await settleThenDelete(account, task, linkId, 7);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) return { ok: true, message: "评价完成 link_id=" + linkId, snapshot };
  return { ok: false, message: "评价已发布(link_id=" + linkId + ")但任务未结算", snapshot };
}

async function settleThenDelete(account, task, linkId, tries) {
  let snapshot = null;
  for (let i = 0; i < tries; i += 1) {
    await sleep(2000);
    snapshot = await fetchSnapshot(account);
    const after = findTask(snapshot, taskKey(task));
    if (after && after.state === FINISH_STATE) break;
  }
  const deletion = await appPostForm(account, PATH_BBS_DELETE, {}, { link_id: linkId }, API_BASE);
  if (toText(deletion && deletion.status) !== OK_STATE) {
    console.log("[警告] 删帖失败 link_id=" + linkId + " msg=" + apiFailureMessage(deletion, "未知"));
  }
  return snapshot;
}

async function executePublishTask(account, task) {
  const topicId = extractTopicId(task.maxjia);
  if (!topicId) return { ok: false, message: "发布任务缺少 topic_id" };
  const title = "前面忘了中间忘了后面也忘了";
  const content = "孩子很爱用，很好吃，会复购";
  const payload = await appPostForm(
    account,
    PATH_BBS_POST,
    {},
    {
      draft: "0",
      topic_ids: topicId,
      link_tag: "27",
      text: JSON.stringify([{ checked: false, text: content, type: "text" }]),
      title,
      desc: content
    },
    API_BASE
  );
  requireOk(payload, "发布内容");
  const linkId = toText(payload.result && payload.result.link_id);
  if (!linkId) return { ok: false, message: "发帖成功但未返回 link_id" };
  const snapshot = await settleThenDelete(account, task, linkId, 3);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) return { ok: true, message: "发布完成 link_id=" + linkId, snapshot };
  return { ok: false, message: "已发布(link_id=" + linkId + ")但任务未结算", snapshot };
}

async function executeTask(account, task, options) {
  try {
    if (task.taskId === "1") return await executeSharePost(account, task);
    if (task.taskId === "19") return await executeShareGameDetail(account, task);
    if (task.taskId === "31") return await executeShareGameComment(account, task);
    if (task.taskId === "33" && options.publishTask) {
      return await executePublishTask(account, task);
    }
    if (task.taskId === "24" && options.reviewTask) {
      return await executeGameReviewTask(account, task);
    }
    return {
      ok: false,
      unsupported: true,
      message:
        task.taskId === "33"
          ? "自动发帖任务已关闭"
          : task.taskId === "24"
            ? "游戏评价任务已关闭"
            : "暂不支持 task_id=" + (task.taskId || "未知")
    };
  } catch (error) {
    return { ok: false, message: String(error.message || error) };
  }
}

async function runAccount(account, index, options, lines) {
  options = Object.assign({ deadline: Date.now() + RUN_BUDGET_MS }, options || {});
  account.signMode = options.signMode === "web" ? "web" : "app";
  if (account.signMode === "web") {
    account.webCookie = buildWebCookie(account.cookie, account.heyboxId);
    lines.push("🔏 签名模式：web（本地计算，无第三方服务）");
  }
  let snapshot = await fetchSnapshot(account);
  const coinBefore = Number(snapshot.coin) || 0;
  lines.push(
    "",
    "账号 " +
      (index + 1) +
      "（" +
      maskId(account.heyboxId) +
      "）" +
      (snapshot.nickname ? " " + snapshot.nickname : "")
  );

  let signOk = false;
  let signResult = null;
  try {
    signResult = await executeSign(account, options);
    signOk = signResult.ok;
  } catch (error) {
    signResult = { ok: false, message: String(error.message || error) };
  }

  snapshot = await fetchSnapshot(account);
  const coinAfterSign = Number(snapshot.coin) || 0;
  const signGain = coinAfterSign - coinBefore;
  let signMessage = toText(signResult && signResult.message);
  if (isLoginExpired("", signMessage)) signMessage = LOGIN_EXPIRED_HINT;
  if (!signOk) {
    const signTask = snapshot.tasks.find((task) => isSignTask(task));
    if (signTask && signTask.state === FINISH_STATE) {
      signOk = true;
      signMessage = "任务列表已确认签到完成";
    } else if (signGain > 0) {
      signOk = true;
      signMessage = "签到收益已到账（H币 +" + signGain + "）";
    }
  }
  lines.push((signOk ? "✅ " : "❌ ") + "签到：" + (signMessage || "状态未确认"));
  const signLineIndex = lines.length - 1;
  if (signGain !== 0) {
    lines.push("💰 H币：" + coinBefore + " → " + coinAfterSign);
  }
  if (!signOk && signResult && signResult.diagnostic) {
    lines.push("🔍 签到诊断：" + signResult.diagnostic);
  }

  const relevant = snapshot.tasks.filter(
    (task) => !isSignTask(task) && isTaskEnabled(task, options)
  );
  if (!options.publishTask && snapshot.tasks.some((task) => task.taskId === "33")) {
    lines.push("⚙️ 发布内容：已按脚本开关跳过（未发帖）");
  }
  if (!options.reviewTask && snapshot.tasks.some((task) => task.taskId === "24")) {
    lines.push("⚙️ 游戏评价：已按脚本开关跳过（不发评）");
  }

  for (let i = 0; i < relevant.length; i += 1) {
    const task = relevant[i];
    if (task.state === FINISH_STATE) {
      lines.push(
        "✅ " +
          task.title +
          "：已完成" +
          (task.awardText ? "（" + task.awardText + "）" : "")
      );
      continue;
    }
    if (task.state !== WAITING_STATE) {
      lines.push("⚠️ " + task.title + "：" + (task.stateDesc || task.state || "状态未知"));
      continue;
    }

    if (Date.now() > options.deadline) {
      lines.push("⏱ 时间预算用尽，剩余任务未执行：" + task.title);
      break;
    }
    snapshot = await fetchSnapshot(account);
    const latest = findTask(snapshot, taskKey(task));
    if (!latest) continue;
    if (latest.state === FINISH_STATE) {
      lines.push("✅ " + latest.title + "：已完成（服务器已更新状态）");
      continue;
    }
    if (latest.state !== WAITING_STATE) {
      lines.push("⚠️ " + latest.title + "：" + (latest.stateDesc || latest.state || "状态未知"));
      continue;
    }
    const result = await executeTask(account, latest, options);
    if (result.unsupported) {
      lines.push("⚠️ " + latest.title + "：" + result.message);
      continue;
    }

    snapshot = result.snapshot || (await fetchSnapshot(account));
    const after = findTask(snapshot, taskKey(latest));
    if (result.ok && after && after.state === FINISH_STATE) {
      lines.push(
        "✅ " +
          after.title +
          "：服务器已确认完成" +
          (latest.awardText ? "（" + latest.awardText + "）" : "")
      );
    } else {
      lines.push("❌ " + latest.title + "：" + result.message);
    }
    await sleep(800);
  }

  const finalSnapshot = await fetchSnapshot(account);
  if (!signOk) {
    const finalSignTask = finalSnapshot.tasks.find((task) => isSignTask(task));
    if (finalSignTask && finalSignTask.state === FINISH_STATE) {
      signOk = true;
      lines[signLineIndex] = "✅ 签到：已确认签到（服务器在运行期间完成结算）";
    }
  }
  lines.push("💰 当前H币：" + (finalSnapshot.coin || "未知"));
  const waiting = finalSnapshot.tasks.filter(
    (task) => !isSignTask(task) && isTaskEnabled(task, options) && task.state === WAITING_STATE
  );
  if (waiting.length) {
    lines.push("▫️ 仍待完成：" + waiting.map((task) => task.title).join("、"));
  }
  return { signOk, tasksOk: waiting.length === 0 };
}

async function runAutomation() {
  const accounts = loadAccounts();
  const options = runtimeOptions();
  if (!accounts.length) {
    notify(
      SCRIPT_NAME,
      "⚠️ 尚未获取账号",
      "请打开小黑盒 App，进入“我的”页面并刷新一次。"
    );
    return;
  }

  const lines = ["📌 签到与任务结果"];
  const deadline = Date.now() + RUN_BUDGET_MS;
  let signOkCount = 0;
  let taskOkCount = 0;
  let skipped = 0;
  for (let i = 0; i < accounts.length; i += 1) {
    if (Date.now() > deadline) {
      skipped = accounts.length - i;
      lines.push("", "⏱ 时间预算用尽，跳过剩余 " + skipped + " 个账号");
      break;
    }
    try {
      const result = await runAccount(
        accounts[i],
        i,
        Object.assign({}, options, { deadline }),
        lines
      );
      if (result.signOk) signOkCount += 1;
      if (result.tasksOk) taskOkCount += 1;
    } catch (error) {
      const detail = String(error.message || error);
      lines.push(
        "",
        "账号 " + (i + 1) + "（" + maskId(accounts[i].heyboxId) + "）",
        "❌ 执行失败：" + sanitize(detail)
      );
      if (isLoginExpired("", detail)) lines.push("🔑 " + LOGIN_EXPIRED_HINT);
    }
    if (i < accounts.length - 1) await sleep(1200);
  }

  lines.push(
    "",
    "签到成功：" + signOkCount + "/" + accounts.length,
    "任务完成：" + taskOkCount + "/" + accounts.length,
    "版本：" + SCRIPT_VERSION
  );
  const allSign = signOkCount === accounts.length;
  const allTask = taskOkCount === accounts.length;
  notify(
    "===小黑盒===",
    skipped
      ? "⏱ 时间预算不足，部分账号未执行"
      : allSign && allTask
        ? "✅ 服务器已确认完成"
        : allTask
          ? "⚠️ 任务已完成，签到未确认"
          : "⚠️ 存在未完成任务",
    lines.join("\n")
  );
}

async function main() {
  if (typeof $request !== "undefined") await captureAccount();
  else await runAutomation();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    md5,
    buildAppCookie,
    decodePkeyUserId,
    makeImei,
    encodeQuery,
    runtimeOptions,
    unwrapHkeyPayload,
    extractTaskList,
    extractFeeds,
    extractGames,
    extractComment,
    buildShareReport,
    extractTopicId,
    taskKey,
    isDailyTask,
    requestHkey,
    requestReportData,
    withRetry,
    executeSign,
    signWaitBudget,
    readSignState,
    isSignedState,
    isLoginExpired,
    isTaskEnabled,
    parseSignMode,
    parseMaxjia,
    maxjiaValue,
    executeGameReviewTask,
    buildWebCookie,
    buildWebQuery,
    webHeaders,
    webGet,
    webPostForm,
    webPostEncryptedReport,
    makeWebHkey,
    makeWebSignature,
    WEB_VERSION,
    encryptWebReport,
    rsaEncryptPkcs1,
    parseRsaPublicKey,
    aes128CbcEncrypt,
    sha1Hex,
    bytesToBase64,
    base64ToBytes,
    utf8Bytes,
    sanitize,
    RUN_BUDGET_MS,
    signDetailText,
    appGet,
    postEncryptedForm,
    loadAccounts,
    captureAccount,
    runAccount,
    runAutomation,
    fetchSnapshot,
    executeTask
  };
} else {
  const requestMode = typeof $request !== "undefined";
  main()
    .catch((error) => {
      notify(SCRIPT_NAME, "❌ 脚本异常", String((error && error.stack) || error));
    })
    .then(() => {
      if (requestMode) $done({});
      else $done();
    });
}
