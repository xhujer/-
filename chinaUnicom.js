"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/crypto-js/core.js
  var require_core = __commonJS({
    "node_modules/crypto-js/core.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory();
        } else if (typeof define === "function" && define.amd) {
          define([], factory);
        } else {
          root.CryptoJS = factory();
        }
      })(exports, function() {
        var CryptoJS2 = CryptoJS2 || function(Math2, undefined2) {
          var create = Object.create || /* @__PURE__ */ function() {
            function F() {
            }
            ;
            return function(obj) {
              var subtype;
              F.prototype = obj;
              subtype = new F();
              F.prototype = null;
              return subtype;
            };
          }();
          var C = {};
          var C_lib = C.lib = {};
          var Base = C_lib.Base = /* @__PURE__ */ function() {
            return {
              /**
               * Creates a new object that inherits from this object.
               *
               * @param {Object} overrides Properties to copy into the new object.
               *
               * @return {Object} The new object.
               *
               * @static
               *
               * @example
               *
               *     var MyType = CryptoJS.lib.Base.extend({
               *         field: 'value',
               *
               *         method: function () {
               *         }
               *     });
               */
              extend: function(overrides) {
                var subtype = create(this);
                if (overrides) {
                  subtype.mixIn(overrides);
                }
                if (!subtype.hasOwnProperty("init") || this.init === subtype.init) {
                  subtype.init = function() {
                    subtype.$super.init.apply(this, arguments);
                  };
                }
                subtype.init.prototype = subtype;
                subtype.$super = this;
                return subtype;
              },
              /**
               * Extends this object and runs the init method.
               * Arguments to create() will be passed to init().
               *
               * @return {Object} The new object.
               *
               * @static
               *
               * @example
               *
               *     var instance = MyType.create();
               */
              create: function() {
                var instance = this.extend();
                instance.init.apply(instance, arguments);
                return instance;
              },
              /**
               * Initializes a newly created object.
               * Override this method to add some logic when your objects are created.
               *
               * @example
               *
               *     var MyType = CryptoJS.lib.Base.extend({
               *         init: function () {
               *             // ...
               *         }
               *     });
               */
              init: function() {
              },
              /**
               * Copies properties into this object.
               *
               * @param {Object} properties The properties to mix in.
               *
               * @example
               *
               *     MyType.mixIn({
               *         field: 'value'
               *     });
               */
              mixIn: function(properties) {
                for (var propertyName in properties) {
                  if (properties.hasOwnProperty(propertyName)) {
                    this[propertyName] = properties[propertyName];
                  }
                }
                if (properties.hasOwnProperty("toString")) {
                  this.toString = properties.toString;
                }
              },
              /**
               * Creates a copy of this object.
               *
               * @return {Object} The clone.
               *
               * @example
               *
               *     var clone = instance.clone();
               */
              clone: function() {
                return this.init.prototype.extend(this);
              }
            };
          }();
          var WordArray = C_lib.WordArray = Base.extend({
            /**
             * Initializes a newly created word array.
             *
             * @param {Array} words (Optional) An array of 32-bit words.
             * @param {number} sigBytes (Optional) The number of significant bytes in the words.
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.create();
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
             */
            init: function(words, sigBytes) {
              words = this.words = words || [];
              if (sigBytes != undefined2) {
                this.sigBytes = sigBytes;
              } else {
                this.sigBytes = words.length * 4;
              }
            },
            /**
             * Converts this word array to a string.
             *
             * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
             *
             * @return {string} The stringified word array.
             *
             * @example
             *
             *     var string = wordArray + '';
             *     var string = wordArray.toString();
             *     var string = wordArray.toString(CryptoJS.enc.Utf8);
             */
            toString: function(encoder) {
              return (encoder || Hex).stringify(this);
            },
            /**
             * Concatenates a word array to this word array.
             *
             * @param {WordArray} wordArray The word array to append.
             *
             * @return {WordArray} This word array.
             *
             * @example
             *
             *     wordArray1.concat(wordArray2);
             */
            concat: function(wordArray) {
              var thisWords = this.words;
              var thatWords = wordArray.words;
              var thisSigBytes = this.sigBytes;
              var thatSigBytes = wordArray.sigBytes;
              this.clamp();
              if (thisSigBytes % 4) {
                for (var i = 0; i < thatSigBytes; i++) {
                  var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                  thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
                }
              } else {
                for (var i = 0; i < thatSigBytes; i += 4) {
                  thisWords[thisSigBytes + i >>> 2] = thatWords[i >>> 2];
                }
              }
              this.sigBytes += thatSigBytes;
              return this;
            },
            /**
             * Removes insignificant bits.
             *
             * @example
             *
             *     wordArray.clamp();
             */
            clamp: function() {
              var words = this.words;
              var sigBytes = this.sigBytes;
              words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
              words.length = Math2.ceil(sigBytes / 4);
            },
            /**
             * Creates a copy of this word array.
             *
             * @return {WordArray} The clone.
             *
             * @example
             *
             *     var clone = wordArray.clone();
             */
            clone: function() {
              var clone = Base.clone.call(this);
              clone.words = this.words.slice(0);
              return clone;
            },
            /**
             * Creates a word array filled with random bytes.
             *
             * @param {number} nBytes The number of random bytes to generate.
             *
             * @return {WordArray} The random word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.random(16);
             */
            random: function(nBytes) {
              var words = [];
              var r = function(m_w) {
                var m_w = m_w;
                var m_z = 987654321;
                var mask2 = 4294967295;
                return function() {
                  m_z = 36969 * (m_z & 65535) + (m_z >> 16) & mask2;
                  m_w = 18e3 * (m_w & 65535) + (m_w >> 16) & mask2;
                  var result = (m_z << 16) + m_w & mask2;
                  result /= 4294967296;
                  result += 0.5;
                  return result * (Math2.random() > 0.5 ? 1 : -1);
                };
              };
              for (var i = 0, rcache; i < nBytes; i += 4) {
                var _r = r((rcache || Math2.random()) * 4294967296);
                rcache = _r() * 987654071;
                words.push(_r() * 4294967296 | 0);
              }
              return new WordArray.init(words, nBytes);
            }
          });
          var C_enc = C.enc = {};
          var Hex = C_enc.Hex = {
            /**
             * Converts a word array to a hex string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The hex string.
             *
             * @static
             *
             * @example
             *
             *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var hexChars = [];
              for (var i = 0; i < sigBytes; i++) {
                var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 15).toString(16));
              }
              return hexChars.join("");
            },
            /**
             * Converts a hex string to a word array.
             *
             * @param {string} hexStr The hex string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
             */
            parse: function(hexStr) {
              var hexStrLength = hexStr.length;
              var words = [];
              for (var i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
              }
              return new WordArray.init(words, hexStrLength / 2);
            }
          };
          var Latin1 = C_enc.Latin1 = {
            /**
             * Converts a word array to a Latin1 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Latin1 string.
             *
             * @static
             *
             * @example
             *
             *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var latin1Chars = [];
              for (var i = 0; i < sigBytes; i++) {
                var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                latin1Chars.push(String.fromCharCode(bite));
              }
              return latin1Chars.join("");
            },
            /**
             * Converts a Latin1 string to a word array.
             *
             * @param {string} latin1Str The Latin1 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
             */
            parse: function(latin1Str) {
              var latin1StrLength = latin1Str.length;
              var words = [];
              for (var i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
              }
              return new WordArray.init(words, latin1StrLength);
            }
          };
          var Utf8 = C_enc.Utf8 = {
            /**
             * Converts a word array to a UTF-8 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-8 string.
             *
             * @static
             *
             * @example
             *
             *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
             */
            stringify: function(wordArray) {
              try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
              } catch (e) {
                throw new Error("Malformed UTF-8 data");
              }
            },
            /**
             * Converts a UTF-8 string to a word array.
             *
             * @param {string} utf8Str The UTF-8 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
             */
            parse: function(utf8Str) {
              return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
            }
          };
          var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
            /**
             * Resets this block algorithm's data buffer to its initial state.
             *
             * @example
             *
             *     bufferedBlockAlgorithm.reset();
             */
            reset: function() {
              this._data = new WordArray.init();
              this._nDataBytes = 0;
            },
            /**
             * Adds new data to this block algorithm's buffer.
             *
             * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
             *
             * @example
             *
             *     bufferedBlockAlgorithm._append('data');
             *     bufferedBlockAlgorithm._append(wordArray);
             */
            _append: function(data) {
              if (typeof data == "string") {
                data = Utf8.parse(data);
              }
              this._data.concat(data);
              this._nDataBytes += data.sigBytes;
            },
            /**
             * Processes available data blocks.
             *
             * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
             *
             * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
             *
             * @return {WordArray} The processed data.
             *
             * @example
             *
             *     var processedData = bufferedBlockAlgorithm._process();
             *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
             */
            _process: function(doFlush) {
              var data = this._data;
              var dataWords = data.words;
              var dataSigBytes = data.sigBytes;
              var blockSize = this.blockSize;
              var blockSizeBytes = blockSize * 4;
              var nBlocksReady = dataSigBytes / blockSizeBytes;
              if (doFlush) {
                nBlocksReady = Math2.ceil(nBlocksReady);
              } else {
                nBlocksReady = Math2.max((nBlocksReady | 0) - this._minBufferSize, 0);
              }
              var nWordsReady = nBlocksReady * blockSize;
              var nBytesReady = Math2.min(nWordsReady * 4, dataSigBytes);
              if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                  this._doProcessBlock(dataWords, offset);
                }
                var processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
              }
              return new WordArray.init(processedWords, nBytesReady);
            },
            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = bufferedBlockAlgorithm.clone();
             */
            clone: function() {
              var clone = Base.clone.call(this);
              clone._data = this._data.clone();
              return clone;
            },
            _minBufferSize: 0
          });
          var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             */
            cfg: Base.extend(),
            /**
             * Initializes a newly created hasher.
             *
             * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
             *
             * @example
             *
             *     var hasher = CryptoJS.algo.SHA256.create();
             */
            init: function(cfg) {
              this.cfg = this.cfg.extend(cfg);
              this.reset();
            },
            /**
             * Resets this hasher to its initial state.
             *
             * @example
             *
             *     hasher.reset();
             */
            reset: function() {
              BufferedBlockAlgorithm.reset.call(this);
              this._doReset();
            },
            /**
             * Updates this hasher with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {Hasher} This hasher.
             *
             * @example
             *
             *     hasher.update('message');
             *     hasher.update(wordArray);
             */
            update: function(messageUpdate) {
              this._append(messageUpdate);
              this._process();
              return this;
            },
            /**
             * Finalizes the hash computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The hash.
             *
             * @example
             *
             *     var hash = hasher.finalize();
             *     var hash = hasher.finalize('message');
             *     var hash = hasher.finalize(wordArray);
             */
            finalize: function(messageUpdate) {
              if (messageUpdate) {
                this._append(messageUpdate);
              }
              var hash = this._doFinalize();
              return hash;
            },
            blockSize: 512 / 32,
            /**
             * Creates a shortcut function to a hasher's object interface.
             *
             * @param {Hasher} hasher The hasher to create a helper for.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
             */
            _createHelper: function(hasher) {
              return function(message, cfg) {
                return new hasher.init(cfg).finalize(message);
              };
            },
            /**
             * Creates a shortcut function to the HMAC's object interface.
             *
             * @param {Hasher} hasher The hasher to use in this HMAC helper.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
             */
            _createHmacHelper: function(hasher) {
              return function(message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
              };
            }
          });
          var C_algo = C.algo = {};
          return C;
        }(Math);
        return CryptoJS2;
      });
    }
  });

  // node_modules/crypto-js/x64-core.js
  var require_x64_core = __commonJS({
    "node_modules/crypto-js/x64-core.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function(undefined2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var Base = C_lib.Base;
          var X32WordArray = C_lib.WordArray;
          var C_x64 = C.x64 = {};
          var X64Word = C_x64.Word = Base.extend({
            /**
             * Initializes a newly created 64-bit word.
             *
             * @param {number} high The high 32 bits.
             * @param {number} low The low 32 bits.
             *
             * @example
             *
             *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
             */
            init: function(high, low) {
              this.high = high;
              this.low = low;
            }
            /**
             * Bitwise NOTs this word.
             *
             * @return {X64Word} A new x64-Word object after negating.
             *
             * @example
             *
             *     var negated = x64Word.not();
             */
            // not: function () {
            // var high = ~this.high;
            // var low = ~this.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Bitwise ANDs this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to AND with this word.
             *
             * @return {X64Word} A new x64-Word object after ANDing.
             *
             * @example
             *
             *     var anded = x64Word.and(anotherX64Word);
             */
            // and: function (word) {
            // var high = this.high & word.high;
            // var low = this.low & word.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Bitwise ORs this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to OR with this word.
             *
             * @return {X64Word} A new x64-Word object after ORing.
             *
             * @example
             *
             *     var ored = x64Word.or(anotherX64Word);
             */
            // or: function (word) {
            // var high = this.high | word.high;
            // var low = this.low | word.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Bitwise XORs this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to XOR with this word.
             *
             * @return {X64Word} A new x64-Word object after XORing.
             *
             * @example
             *
             *     var xored = x64Word.xor(anotherX64Word);
             */
            // xor: function (word) {
            // var high = this.high ^ word.high;
            // var low = this.low ^ word.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Shifts this word n bits to the left.
             *
             * @param {number} n The number of bits to shift.
             *
             * @return {X64Word} A new x64-Word object after shifting.
             *
             * @example
             *
             *     var shifted = x64Word.shiftL(25);
             */
            // shiftL: function (n) {
            // if (n < 32) {
            // var high = (this.high << n) | (this.low >>> (32 - n));
            // var low = this.low << n;
            // } else {
            // var high = this.low << (n - 32);
            // var low = 0;
            // }
            // return X64Word.create(high, low);
            // },
            /**
             * Shifts this word n bits to the right.
             *
             * @param {number} n The number of bits to shift.
             *
             * @return {X64Word} A new x64-Word object after shifting.
             *
             * @example
             *
             *     var shifted = x64Word.shiftR(7);
             */
            // shiftR: function (n) {
            // if (n < 32) {
            // var low = (this.low >>> n) | (this.high << (32 - n));
            // var high = this.high >>> n;
            // } else {
            // var low = this.high >>> (n - 32);
            // var high = 0;
            // }
            // return X64Word.create(high, low);
            // },
            /**
             * Rotates this word n bits to the left.
             *
             * @param {number} n The number of bits to rotate.
             *
             * @return {X64Word} A new x64-Word object after rotating.
             *
             * @example
             *
             *     var rotated = x64Word.rotL(25);
             */
            // rotL: function (n) {
            // return this.shiftL(n).or(this.shiftR(64 - n));
            // },
            /**
             * Rotates this word n bits to the right.
             *
             * @param {number} n The number of bits to rotate.
             *
             * @return {X64Word} A new x64-Word object after rotating.
             *
             * @example
             *
             *     var rotated = x64Word.rotR(7);
             */
            // rotR: function (n) {
            // return this.shiftR(n).or(this.shiftL(64 - n));
            // },
            /**
             * Adds this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to add with this word.
             *
             * @return {X64Word} A new x64-Word object after adding.
             *
             * @example
             *
             *     var added = x64Word.add(anotherX64Word);
             */
            // add: function (word) {
            // var low = (this.low + word.low) | 0;
            // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
            // var high = (this.high + word.high + carry) | 0;
            // return X64Word.create(high, low);
            // }
          });
          var X64WordArray = C_x64.WordArray = Base.extend({
            /**
             * Initializes a newly created word array.
             *
             * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
             * @param {number} sigBytes (Optional) The number of significant bytes in the words.
             *
             * @example
             *
             *     var wordArray = CryptoJS.x64.WordArray.create();
             *
             *     var wordArray = CryptoJS.x64.WordArray.create([
             *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
             *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
             *     ]);
             *
             *     var wordArray = CryptoJS.x64.WordArray.create([
             *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
             *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
             *     ], 10);
             */
            init: function(words, sigBytes) {
              words = this.words = words || [];
              if (sigBytes != undefined2) {
                this.sigBytes = sigBytes;
              } else {
                this.sigBytes = words.length * 8;
              }
            },
            /**
             * Converts this 64-bit word array to a 32-bit word array.
             *
             * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
             *
             * @example
             *
             *     var x32WordArray = x64WordArray.toX32();
             */
            toX32: function() {
              var x64Words = this.words;
              var x64WordsLength = x64Words.length;
              var x32Words = [];
              for (var i = 0; i < x64WordsLength; i++) {
                var x64Word = x64Words[i];
                x32Words.push(x64Word.high);
                x32Words.push(x64Word.low);
              }
              return X32WordArray.create(x32Words, this.sigBytes);
            },
            /**
             * Creates a copy of this word array.
             *
             * @return {X64WordArray} The clone.
             *
             * @example
             *
             *     var clone = x64WordArray.clone();
             */
            clone: function() {
              var clone = Base.clone.call(this);
              var words = clone.words = this.words.slice(0);
              var wordsLength = words.length;
              for (var i = 0; i < wordsLength; i++) {
                words[i] = words[i].clone();
              }
              return clone;
            }
          });
        })();
        return CryptoJS2;
      });
    }
  });

  // node_modules/crypto-js/lib-typedarrays.js
  var require_lib_typedarrays = __commonJS({
    "node_modules/crypto-js/lib-typedarrays.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          if (typeof ArrayBuffer != "function") {
            return;
          }
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var superInit = WordArray.init;
          var subInit = WordArray.init = function(typedArray) {
            if (typedArray instanceof ArrayBuffer) {
              typedArray = new Uint8Array(typedArray);
            }
            if (typedArray instanceof Int8Array || typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray || typedArray instanceof Int16Array || typedArray instanceof Uint16Array || typedArray instanceof Int32Array || typedArray instanceof Uint32Array || typedArray instanceof Float32Array || typedArray instanceof Float64Array) {
              typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
            }
            if (typedArray instanceof Uint8Array) {
              var typedArrayByteLength = typedArray.byteLength;
              var words = [];
              for (var i = 0; i < typedArrayByteLength; i++) {
                words[i >>> 2] |= typedArray[i] << 24 - i % 4 * 8;
              }
              superInit.call(this, words, typedArrayByteLength);
            } else {
              superInit.apply(this, arguments);
            }
          };
          subInit.prototype = WordArray;
        })();
        return CryptoJS2.lib.WordArray;
      });
    }
  });

  // node_modules/crypto-js/enc-utf16.js
  var require_enc_utf16 = __commonJS({
    "node_modules/crypto-js/enc-utf16.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var C_enc = C.enc;
          var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
            /**
             * Converts a word array to a UTF-16 BE string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-16 BE string.
             *
             * @static
             *
             * @example
             *
             *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var utf16Chars = [];
              for (var i = 0; i < sigBytes; i += 2) {
                var codePoint = words[i >>> 2] >>> 16 - i % 4 * 8 & 65535;
                utf16Chars.push(String.fromCharCode(codePoint));
              }
              return utf16Chars.join("");
            },
            /**
             * Converts a UTF-16 BE string to a word array.
             *
             * @param {string} utf16Str The UTF-16 BE string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
             */
            parse: function(utf16Str) {
              var utf16StrLength = utf16Str.length;
              var words = [];
              for (var i = 0; i < utf16StrLength; i++) {
                words[i >>> 1] |= utf16Str.charCodeAt(i) << 16 - i % 2 * 16;
              }
              return WordArray.create(words, utf16StrLength * 2);
            }
          };
          C_enc.Utf16LE = {
            /**
             * Converts a word array to a UTF-16 LE string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-16 LE string.
             *
             * @static
             *
             * @example
             *
             *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var utf16Chars = [];
              for (var i = 0; i < sigBytes; i += 2) {
                var codePoint = swapEndian(words[i >>> 2] >>> 16 - i % 4 * 8 & 65535);
                utf16Chars.push(String.fromCharCode(codePoint));
              }
              return utf16Chars.join("");
            },
            /**
             * Converts a UTF-16 LE string to a word array.
             *
             * @param {string} utf16Str The UTF-16 LE string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
             */
            parse: function(utf16Str) {
              var utf16StrLength = utf16Str.length;
              var words = [];
              for (var i = 0; i < utf16StrLength; i++) {
                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << 16 - i % 2 * 16);
              }
              return WordArray.create(words, utf16StrLength * 2);
            }
          };
          function swapEndian(word) {
            return word << 8 & 4278255360 | word >>> 8 & 16711935;
          }
        })();
        return CryptoJS2.enc.Utf16;
      });
    }
  });

  // node_modules/crypto-js/enc-base64.js
  var require_enc_base64 = __commonJS({
    "node_modules/crypto-js/enc-base64.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var C_enc = C.enc;
          var Base64 = C_enc.Base64 = {
            /**
             * Converts a word array to a Base64 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Base64 string.
             *
             * @static
             *
             * @example
             *
             *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var map = this._map;
              wordArray.clamp();
              var base64Chars = [];
              for (var i = 0; i < sigBytes; i += 3) {
                var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
                var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
                var triplet = byte1 << 16 | byte2 << 8 | byte3;
                for (var j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
                  base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
                }
              }
              var paddingChar = map.charAt(64);
              if (paddingChar) {
                while (base64Chars.length % 4) {
                  base64Chars.push(paddingChar);
                }
              }
              return base64Chars.join("");
            },
            /**
             * Converts a Base64 string to a word array.
             *
             * @param {string} base64Str The Base64 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
             */
            parse: function(base64Str) {
              var base64StrLength = base64Str.length;
              var map = this._map;
              var reverseMap = this._reverseMap;
              if (!reverseMap) {
                reverseMap = this._reverseMap = [];
                for (var j = 0; j < map.length; j++) {
                  reverseMap[map.charCodeAt(j)] = j;
                }
              }
              var paddingChar = map.charAt(64);
              if (paddingChar) {
                var paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex !== -1) {
                  base64StrLength = paddingIndex;
                }
              }
              return parseLoop(base64Str, base64StrLength, reverseMap);
            },
            _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
          };
          function parseLoop(base64Str, base64StrLength, reverseMap) {
            var words = [];
            var nBytes = 0;
            for (var i = 0; i < base64StrLength; i++) {
              if (i % 4) {
                var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2;
                var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
                words[nBytes >>> 2] |= (bits1 | bits2) << 24 - nBytes % 4 * 8;
                nBytes++;
              }
            }
            return WordArray.create(words, nBytes);
          }
        })();
        return CryptoJS2.enc.Base64;
      });
    }
  });

  // node_modules/crypto-js/md5.js
  var require_md5 = __commonJS({
    "node_modules/crypto-js/md5.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function(Math2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C.algo;
          var T = [];
          (function() {
            for (var i = 0; i < 64; i++) {
              T[i] = Math2.abs(Math2.sin(i + 1)) * 4294967296 | 0;
            }
          })();
          var MD5 = C_algo.MD5 = Hasher.extend({
            _doReset: function() {
              this._hash = new WordArray.init([
                1732584193,
                4023233417,
                2562383102,
                271733878
              ]);
            },
            _doProcessBlock: function(M, offset) {
              for (var i = 0; i < 16; i++) {
                var offset_i = offset + i;
                var M_offset_i = M[offset_i];
                M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
              }
              var H = this._hash.words;
              var M_offset_0 = M[offset + 0];
              var M_offset_1 = M[offset + 1];
              var M_offset_2 = M[offset + 2];
              var M_offset_3 = M[offset + 3];
              var M_offset_4 = M[offset + 4];
              var M_offset_5 = M[offset + 5];
              var M_offset_6 = M[offset + 6];
              var M_offset_7 = M[offset + 7];
              var M_offset_8 = M[offset + 8];
              var M_offset_9 = M[offset + 9];
              var M_offset_10 = M[offset + 10];
              var M_offset_11 = M[offset + 11];
              var M_offset_12 = M[offset + 12];
              var M_offset_13 = M[offset + 13];
              var M_offset_14 = M[offset + 14];
              var M_offset_15 = M[offset + 15];
              var a = H[0];
              var b = H[1];
              var c = H[2];
              var d = H[3];
              a = FF(a, b, c, d, M_offset_0, 7, T[0]);
              d = FF(d, a, b, c, M_offset_1, 12, T[1]);
              c = FF(c, d, a, b, M_offset_2, 17, T[2]);
              b = FF(b, c, d, a, M_offset_3, 22, T[3]);
              a = FF(a, b, c, d, M_offset_4, 7, T[4]);
              d = FF(d, a, b, c, M_offset_5, 12, T[5]);
              c = FF(c, d, a, b, M_offset_6, 17, T[6]);
              b = FF(b, c, d, a, M_offset_7, 22, T[7]);
              a = FF(a, b, c, d, M_offset_8, 7, T[8]);
              d = FF(d, a, b, c, M_offset_9, 12, T[9]);
              c = FF(c, d, a, b, M_offset_10, 17, T[10]);
              b = FF(b, c, d, a, M_offset_11, 22, T[11]);
              a = FF(a, b, c, d, M_offset_12, 7, T[12]);
              d = FF(d, a, b, c, M_offset_13, 12, T[13]);
              c = FF(c, d, a, b, M_offset_14, 17, T[14]);
              b = FF(b, c, d, a, M_offset_15, 22, T[15]);
              a = GG(a, b, c, d, M_offset_1, 5, T[16]);
              d = GG(d, a, b, c, M_offset_6, 9, T[17]);
              c = GG(c, d, a, b, M_offset_11, 14, T[18]);
              b = GG(b, c, d, a, M_offset_0, 20, T[19]);
              a = GG(a, b, c, d, M_offset_5, 5, T[20]);
              d = GG(d, a, b, c, M_offset_10, 9, T[21]);
              c = GG(c, d, a, b, M_offset_15, 14, T[22]);
              b = GG(b, c, d, a, M_offset_4, 20, T[23]);
              a = GG(a, b, c, d, M_offset_9, 5, T[24]);
              d = GG(d, a, b, c, M_offset_14, 9, T[25]);
              c = GG(c, d, a, b, M_offset_3, 14, T[26]);
              b = GG(b, c, d, a, M_offset_8, 20, T[27]);
              a = GG(a, b, c, d, M_offset_13, 5, T[28]);
              d = GG(d, a, b, c, M_offset_2, 9, T[29]);
              c = GG(c, d, a, b, M_offset_7, 14, T[30]);
              b = GG(b, c, d, a, M_offset_12, 20, T[31]);
              a = HH(a, b, c, d, M_offset_5, 4, T[32]);
              d = HH(d, a, b, c, M_offset_8, 11, T[33]);
              c = HH(c, d, a, b, M_offset_11, 16, T[34]);
              b = HH(b, c, d, a, M_offset_14, 23, T[35]);
              a = HH(a, b, c, d, M_offset_1, 4, T[36]);
              d = HH(d, a, b, c, M_offset_4, 11, T[37]);
              c = HH(c, d, a, b, M_offset_7, 16, T[38]);
              b = HH(b, c, d, a, M_offset_10, 23, T[39]);
              a = HH(a, b, c, d, M_offset_13, 4, T[40]);
              d = HH(d, a, b, c, M_offset_0, 11, T[41]);
              c = HH(c, d, a, b, M_offset_3, 16, T[42]);
              b = HH(b, c, d, a, M_offset_6, 23, T[43]);
              a = HH(a, b, c, d, M_offset_9, 4, T[44]);
              d = HH(d, a, b, c, M_offset_12, 11, T[45]);
              c = HH(c, d, a, b, M_offset_15, 16, T[46]);
              b = HH(b, c, d, a, M_offset_2, 23, T[47]);
              a = II(a, b, c, d, M_offset_0, 6, T[48]);
              d = II(d, a, b, c, M_offset_7, 10, T[49]);
              c = II(c, d, a, b, M_offset_14, 15, T[50]);
              b = II(b, c, d, a, M_offset_5, 21, T[51]);
              a = II(a, b, c, d, M_offset_12, 6, T[52]);
              d = II(d, a, b, c, M_offset_3, 10, T[53]);
              c = II(c, d, a, b, M_offset_10, 15, T[54]);
              b = II(b, c, d, a, M_offset_1, 21, T[55]);
              a = II(a, b, c, d, M_offset_8, 6, T[56]);
              d = II(d, a, b, c, M_offset_15, 10, T[57]);
              c = II(c, d, a, b, M_offset_6, 15, T[58]);
              b = II(b, c, d, a, M_offset_13, 21, T[59]);
              a = II(a, b, c, d, M_offset_4, 6, T[60]);
              d = II(d, a, b, c, M_offset_11, 10, T[61]);
              c = II(c, d, a, b, M_offset_2, 15, T[62]);
              b = II(b, c, d, a, M_offset_9, 21, T[63]);
              H[0] = H[0] + a | 0;
              H[1] = H[1] + b | 0;
              H[2] = H[2] + c | 0;
              H[3] = H[3] + d | 0;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              var nBitsTotalH = Math2.floor(nBitsTotal / 4294967296);
              var nBitsTotalL = nBitsTotal;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = (nBitsTotalH << 8 | nBitsTotalH >>> 24) & 16711935 | (nBitsTotalH << 24 | nBitsTotalH >>> 8) & 4278255360;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotalL << 8 | nBitsTotalL >>> 24) & 16711935 | (nBitsTotalL << 24 | nBitsTotalL >>> 8) & 4278255360;
              data.sigBytes = (dataWords.length + 1) * 4;
              this._process();
              var hash = this._hash;
              var H = hash.words;
              for (var i = 0; i < 4; i++) {
                var H_i = H[i];
                H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
              }
              return hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          function FF(a, b, c, d, x, s, t) {
            var n = a + (b & c | ~b & d) + x + t;
            return (n << s | n >>> 32 - s) + b;
          }
          function GG(a, b, c, d, x, s, t) {
            var n = a + (b & d | c & ~d) + x + t;
            return (n << s | n >>> 32 - s) + b;
          }
          function HH(a, b, c, d, x, s, t) {
            var n = a + (b ^ c ^ d) + x + t;
            return (n << s | n >>> 32 - s) + b;
          }
          function II(a, b, c, d, x, s, t) {
            var n = a + (c ^ (b | ~d)) + x + t;
            return (n << s | n >>> 32 - s) + b;
          }
          C.MD5 = Hasher._createHelper(MD5);
          C.HmacMD5 = Hasher._createHmacHelper(MD5);
        })(Math);
        return CryptoJS2.MD5;
      });
    }
  });

  // node_modules/crypto-js/sha1.js
  var require_sha1 = __commonJS({
    "node_modules/crypto-js/sha1.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C.algo;
          var W = [];
          var SHA1 = C_algo.SHA1 = Hasher.extend({
            _doReset: function() {
              this._hash = new WordArray.init([
                1732584193,
                4023233417,
                2562383102,
                271733878,
                3285377520
              ]);
            },
            _doProcessBlock: function(M, offset) {
              var H = this._hash.words;
              var a = H[0];
              var b = H[1];
              var c = H[2];
              var d = H[3];
              var e = H[4];
              for (var i = 0; i < 80; i++) {
                if (i < 16) {
                  W[i] = M[offset + i] | 0;
                } else {
                  var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                  W[i] = n << 1 | n >>> 31;
                }
                var t = (a << 5 | a >>> 27) + e + W[i];
                if (i < 20) {
                  t += (b & c | ~b & d) + 1518500249;
                } else if (i < 40) {
                  t += (b ^ c ^ d) + 1859775393;
                } else if (i < 60) {
                  t += (b & c | b & d | c & d) - 1894007588;
                } else {
                  t += (b ^ c ^ d) - 899497514;
                }
                e = d;
                d = c;
                c = b << 30 | b >>> 2;
                b = a;
                a = t;
              }
              H[0] = H[0] + a | 0;
              H[1] = H[1] + b | 0;
              H[2] = H[2] + c | 0;
              H[3] = H[3] + d | 0;
              H[4] = H[4] + e | 0;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
              data.sigBytes = dataWords.length * 4;
              this._process();
              return this._hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          C.SHA1 = Hasher._createHelper(SHA1);
          C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
        })();
        return CryptoJS2.SHA1;
      });
    }
  });

  // node_modules/crypto-js/sha256.js
  var require_sha256 = __commonJS({
    "node_modules/crypto-js/sha256.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function(Math2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C.algo;
          var H = [];
          var K = [];
          (function() {
            function isPrime(n2) {
              var sqrtN = Math2.sqrt(n2);
              for (var factor = 2; factor <= sqrtN; factor++) {
                if (!(n2 % factor)) {
                  return false;
                }
              }
              return true;
            }
            function getFractionalBits(n2) {
              return (n2 - (n2 | 0)) * 4294967296 | 0;
            }
            var n = 2;
            var nPrime = 0;
            while (nPrime < 64) {
              if (isPrime(n)) {
                if (nPrime < 8) {
                  H[nPrime] = getFractionalBits(Math2.pow(n, 1 / 2));
                }
                K[nPrime] = getFractionalBits(Math2.pow(n, 1 / 3));
                nPrime++;
              }
              n++;
            }
          })();
          var W = [];
          var SHA256 = C_algo.SHA256 = Hasher.extend({
            _doReset: function() {
              this._hash = new WordArray.init(H.slice(0));
            },
            _doProcessBlock: function(M, offset) {
              var H2 = this._hash.words;
              var a = H2[0];
              var b = H2[1];
              var c = H2[2];
              var d = H2[3];
              var e = H2[4];
              var f = H2[5];
              var g = H2[6];
              var h = H2[7];
              for (var i = 0; i < 64; i++) {
                if (i < 16) {
                  W[i] = M[offset + i] | 0;
                } else {
                  var gamma0x = W[i - 15];
                  var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
                  var gamma1x = W[i - 2];
                  var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
                  W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
                }
                var ch = e & f ^ ~e & g;
                var maj = a & b ^ a & c ^ b & c;
                var sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
                var sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
                var t1 = h + sigma1 + ch + K[i] + W[i];
                var t2 = sigma0 + maj;
                h = g;
                g = f;
                f = e;
                e = d + t1 | 0;
                d = c;
                c = b;
                b = a;
                a = t1 + t2 | 0;
              }
              H2[0] = H2[0] + a | 0;
              H2[1] = H2[1] + b | 0;
              H2[2] = H2[2] + c | 0;
              H2[3] = H2[3] + d | 0;
              H2[4] = H2[4] + e | 0;
              H2[5] = H2[5] + f | 0;
              H2[6] = H2[6] + g | 0;
              H2[7] = H2[7] + h | 0;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math2.floor(nBitsTotal / 4294967296);
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
              data.sigBytes = dataWords.length * 4;
              this._process();
              return this._hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          C.SHA256 = Hasher._createHelper(SHA256);
          C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
        })(Math);
        return CryptoJS2.SHA256;
      });
    }
  });

  // node_modules/crypto-js/sha224.js
  var require_sha224 = __commonJS({
    "node_modules/crypto-js/sha224.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_sha256());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./sha256"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var C_algo = C.algo;
          var SHA256 = C_algo.SHA256;
          var SHA224 = C_algo.SHA224 = SHA256.extend({
            _doReset: function() {
              this._hash = new WordArray.init([
                3238371032,
                914150663,
                812702999,
                4144912697,
                4290775857,
                1750603025,
                1694076839,
                3204075428
              ]);
            },
            _doFinalize: function() {
              var hash = SHA256._doFinalize.call(this);
              hash.sigBytes -= 4;
              return hash;
            }
          });
          C.SHA224 = SHA256._createHelper(SHA224);
          C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
        })();
        return CryptoJS2.SHA224;
      });
    }
  });

  // node_modules/crypto-js/sha512.js
  var require_sha512 = __commonJS({
    "node_modules/crypto-js/sha512.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_x64_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./x64-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var Hasher = C_lib.Hasher;
          var C_x64 = C.x64;
          var X64Word = C_x64.Word;
          var X64WordArray = C_x64.WordArray;
          var C_algo = C.algo;
          function X64Word_create() {
            return X64Word.create.apply(X64Word, arguments);
          }
          var K = [
            X64Word_create(1116352408, 3609767458),
            X64Word_create(1899447441, 602891725),
            X64Word_create(3049323471, 3964484399),
            X64Word_create(3921009573, 2173295548),
            X64Word_create(961987163, 4081628472),
            X64Word_create(1508970993, 3053834265),
            X64Word_create(2453635748, 2937671579),
            X64Word_create(2870763221, 3664609560),
            X64Word_create(3624381080, 2734883394),
            X64Word_create(310598401, 1164996542),
            X64Word_create(607225278, 1323610764),
            X64Word_create(1426881987, 3590304994),
            X64Word_create(1925078388, 4068182383),
            X64Word_create(2162078206, 991336113),
            X64Word_create(2614888103, 633803317),
            X64Word_create(3248222580, 3479774868),
            X64Word_create(3835390401, 2666613458),
            X64Word_create(4022224774, 944711139),
            X64Word_create(264347078, 2341262773),
            X64Word_create(604807628, 2007800933),
            X64Word_create(770255983, 1495990901),
            X64Word_create(1249150122, 1856431235),
            X64Word_create(1555081692, 3175218132),
            X64Word_create(1996064986, 2198950837),
            X64Word_create(2554220882, 3999719339),
            X64Word_create(2821834349, 766784016),
            X64Word_create(2952996808, 2566594879),
            X64Word_create(3210313671, 3203337956),
            X64Word_create(3336571891, 1034457026),
            X64Word_create(3584528711, 2466948901),
            X64Word_create(113926993, 3758326383),
            X64Word_create(338241895, 168717936),
            X64Word_create(666307205, 1188179964),
            X64Word_create(773529912, 1546045734),
            X64Word_create(1294757372, 1522805485),
            X64Word_create(1396182291, 2643833823),
            X64Word_create(1695183700, 2343527390),
            X64Word_create(1986661051, 1014477480),
            X64Word_create(2177026350, 1206759142),
            X64Word_create(2456956037, 344077627),
            X64Word_create(2730485921, 1290863460),
            X64Word_create(2820302411, 3158454273),
            X64Word_create(3259730800, 3505952657),
            X64Word_create(3345764771, 106217008),
            X64Word_create(3516065817, 3606008344),
            X64Word_create(3600352804, 1432725776),
            X64Word_create(4094571909, 1467031594),
            X64Word_create(275423344, 851169720),
            X64Word_create(430227734, 3100823752),
            X64Word_create(506948616, 1363258195),
            X64Word_create(659060556, 3750685593),
            X64Word_create(883997877, 3785050280),
            X64Word_create(958139571, 3318307427),
            X64Word_create(1322822218, 3812723403),
            X64Word_create(1537002063, 2003034995),
            X64Word_create(1747873779, 3602036899),
            X64Word_create(1955562222, 1575990012),
            X64Word_create(2024104815, 1125592928),
            X64Word_create(2227730452, 2716904306),
            X64Word_create(2361852424, 442776044),
            X64Word_create(2428436474, 593698344),
            X64Word_create(2756734187, 3733110249),
            X64Word_create(3204031479, 2999351573),
            X64Word_create(3329325298, 3815920427),
            X64Word_create(3391569614, 3928383900),
            X64Word_create(3515267271, 566280711),
            X64Word_create(3940187606, 3454069534),
            X64Word_create(4118630271, 4000239992),
            X64Word_create(116418474, 1914138554),
            X64Word_create(174292421, 2731055270),
            X64Word_create(289380356, 3203993006),
            X64Word_create(460393269, 320620315),
            X64Word_create(685471733, 587496836),
            X64Word_create(852142971, 1086792851),
            X64Word_create(1017036298, 365543100),
            X64Word_create(1126000580, 2618297676),
            X64Word_create(1288033470, 3409855158),
            X64Word_create(1501505948, 4234509866),
            X64Word_create(1607167915, 987167468),
            X64Word_create(1816402316, 1246189591)
          ];
          var W = [];
          (function() {
            for (var i = 0; i < 80; i++) {
              W[i] = X64Word_create();
            }
          })();
          var SHA512 = C_algo.SHA512 = Hasher.extend({
            _doReset: function() {
              this._hash = new X64WordArray.init([
                new X64Word.init(1779033703, 4089235720),
                new X64Word.init(3144134277, 2227873595),
                new X64Word.init(1013904242, 4271175723),
                new X64Word.init(2773480762, 1595750129),
                new X64Word.init(1359893119, 2917565137),
                new X64Word.init(2600822924, 725511199),
                new X64Word.init(528734635, 4215389547),
                new X64Word.init(1541459225, 327033209)
              ]);
            },
            _doProcessBlock: function(M, offset) {
              var H = this._hash.words;
              var H0 = H[0];
              var H1 = H[1];
              var H2 = H[2];
              var H3 = H[3];
              var H4 = H[4];
              var H5 = H[5];
              var H6 = H[6];
              var H7 = H[7];
              var H0h = H0.high;
              var H0l = H0.low;
              var H1h = H1.high;
              var H1l = H1.low;
              var H2h = H2.high;
              var H2l = H2.low;
              var H3h = H3.high;
              var H3l = H3.low;
              var H4h = H4.high;
              var H4l = H4.low;
              var H5h = H5.high;
              var H5l = H5.low;
              var H6h = H6.high;
              var H6l = H6.low;
              var H7h = H7.high;
              var H7l = H7.low;
              var ah = H0h;
              var al = H0l;
              var bh = H1h;
              var bl = H1l;
              var ch = H2h;
              var cl = H2l;
              var dh = H3h;
              var dl = H3l;
              var eh = H4h;
              var el = H4l;
              var fh = H5h;
              var fl = H5l;
              var gh = H6h;
              var gl = H6l;
              var hh = H7h;
              var hl = H7l;
              for (var i = 0; i < 80; i++) {
                var Wi = W[i];
                if (i < 16) {
                  var Wih = Wi.high = M[offset + i * 2] | 0;
                  var Wil = Wi.low = M[offset + i * 2 + 1] | 0;
                } else {
                  var gamma0x = W[i - 15];
                  var gamma0xh = gamma0x.high;
                  var gamma0xl = gamma0x.low;
                  var gamma0h = (gamma0xh >>> 1 | gamma0xl << 31) ^ (gamma0xh >>> 8 | gamma0xl << 24) ^ gamma0xh >>> 7;
                  var gamma0l = (gamma0xl >>> 1 | gamma0xh << 31) ^ (gamma0xl >>> 8 | gamma0xh << 24) ^ (gamma0xl >>> 7 | gamma0xh << 25);
                  var gamma1x = W[i - 2];
                  var gamma1xh = gamma1x.high;
                  var gamma1xl = gamma1x.low;
                  var gamma1h = (gamma1xh >>> 19 | gamma1xl << 13) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
                  var gamma1l = (gamma1xl >>> 19 | gamma1xh << 13) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xl >>> 6 | gamma1xh << 26);
                  var Wi7 = W[i - 7];
                  var Wi7h = Wi7.high;
                  var Wi7l = Wi7.low;
                  var Wi16 = W[i - 16];
                  var Wi16h = Wi16.high;
                  var Wi16l = Wi16.low;
                  var Wil = gamma0l + Wi7l;
                  var Wih = gamma0h + Wi7h + (Wil >>> 0 < gamma0l >>> 0 ? 1 : 0);
                  var Wil = Wil + gamma1l;
                  var Wih = Wih + gamma1h + (Wil >>> 0 < gamma1l >>> 0 ? 1 : 0);
                  var Wil = Wil + Wi16l;
                  var Wih = Wih + Wi16h + (Wil >>> 0 < Wi16l >>> 0 ? 1 : 0);
                  Wi.high = Wih;
                  Wi.low = Wil;
                }
                var chh = eh & fh ^ ~eh & gh;
                var chl = el & fl ^ ~el & gl;
                var majh = ah & bh ^ ah & ch ^ bh & ch;
                var majl = al & bl ^ al & cl ^ bl & cl;
                var sigma0h = (ah >>> 28 | al << 4) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
                var sigma0l = (al >>> 28 | ah << 4) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
                var sigma1h = (eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9);
                var sigma1l = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9);
                var Ki = K[i];
                var Kih = Ki.high;
                var Kil = Ki.low;
                var t1l = hl + sigma1l;
                var t1h = hh + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
                var t1l = t1l + chl;
                var t1h = t1h + chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
                var t1l = t1l + Kil;
                var t1h = t1h + Kih + (t1l >>> 0 < Kil >>> 0 ? 1 : 0);
                var t1l = t1l + Wil;
                var t1h = t1h + Wih + (t1l >>> 0 < Wil >>> 0 ? 1 : 0);
                var t2l = sigma0l + majl;
                var t2h = sigma0h + majh + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
                hh = gh;
                hl = gl;
                gh = fh;
                gl = fl;
                fh = eh;
                fl = el;
                el = dl + t1l | 0;
                eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
                dh = ch;
                dl = cl;
                ch = bh;
                cl = bl;
                bh = ah;
                bl = al;
                al = t1l + t2l | 0;
                ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
              }
              H0l = H0.low = H0l + al;
              H0.high = H0h + ah + (H0l >>> 0 < al >>> 0 ? 1 : 0);
              H1l = H1.low = H1l + bl;
              H1.high = H1h + bh + (H1l >>> 0 < bl >>> 0 ? 1 : 0);
              H2l = H2.low = H2l + cl;
              H2.high = H2h + ch + (H2l >>> 0 < cl >>> 0 ? 1 : 0);
              H3l = H3.low = H3l + dl;
              H3.high = H3h + dh + (H3l >>> 0 < dl >>> 0 ? 1 : 0);
              H4l = H4.low = H4l + el;
              H4.high = H4h + eh + (H4l >>> 0 < el >>> 0 ? 1 : 0);
              H5l = H5.low = H5l + fl;
              H5.high = H5h + fh + (H5l >>> 0 < fl >>> 0 ? 1 : 0);
              H6l = H6.low = H6l + gl;
              H6.high = H6h + gh + (H6l >>> 0 < gl >>> 0 ? 1 : 0);
              H7l = H7.low = H7l + hl;
              H7.high = H7h + hh + (H7l >>> 0 < hl >>> 0 ? 1 : 0);
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 128 >>> 10 << 5) + 30] = Math.floor(nBitsTotal / 4294967296);
              dataWords[(nBitsLeft + 128 >>> 10 << 5) + 31] = nBitsTotal;
              data.sigBytes = dataWords.length * 4;
              this._process();
              var hash = this._hash.toX32();
              return hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            },
            blockSize: 1024 / 32
          });
          C.SHA512 = Hasher._createHelper(SHA512);
          C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
        })();
        return CryptoJS2.SHA512;
      });
    }
  });

  // node_modules/crypto-js/sha384.js
  var require_sha384 = __commonJS({
    "node_modules/crypto-js/sha384.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_x64_core(), require_sha512());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./x64-core", "./sha512"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_x64 = C.x64;
          var X64Word = C_x64.Word;
          var X64WordArray = C_x64.WordArray;
          var C_algo = C.algo;
          var SHA512 = C_algo.SHA512;
          var SHA384 = C_algo.SHA384 = SHA512.extend({
            _doReset: function() {
              this._hash = new X64WordArray.init([
                new X64Word.init(3418070365, 3238371032),
                new X64Word.init(1654270250, 914150663),
                new X64Word.init(2438529370, 812702999),
                new X64Word.init(355462360, 4144912697),
                new X64Word.init(1731405415, 4290775857),
                new X64Word.init(2394180231, 1750603025),
                new X64Word.init(3675008525, 1694076839),
                new X64Word.init(1203062813, 3204075428)
              ]);
            },
            _doFinalize: function() {
              var hash = SHA512._doFinalize.call(this);
              hash.sigBytes -= 16;
              return hash;
            }
          });
          C.SHA384 = SHA512._createHelper(SHA384);
          C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
        })();
        return CryptoJS2.SHA384;
      });
    }
  });

  // node_modules/crypto-js/sha3.js
  var require_sha3 = __commonJS({
    "node_modules/crypto-js/sha3.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_x64_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./x64-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function(Math2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_x64 = C.x64;
          var X64Word = C_x64.Word;
          var C_algo = C.algo;
          var RHO_OFFSETS = [];
          var PI_INDEXES = [];
          var ROUND_CONSTANTS = [];
          (function() {
            var x = 1, y = 0;
            for (var t = 0; t < 24; t++) {
              RHO_OFFSETS[x + 5 * y] = (t + 1) * (t + 2) / 2 % 64;
              var newX = y % 5;
              var newY = (2 * x + 3 * y) % 5;
              x = newX;
              y = newY;
            }
            for (var x = 0; x < 5; x++) {
              for (var y = 0; y < 5; y++) {
                PI_INDEXES[x + 5 * y] = y + (2 * x + 3 * y) % 5 * 5;
              }
            }
            var LFSR = 1;
            for (var i = 0; i < 24; i++) {
              var roundConstantMsw = 0;
              var roundConstantLsw = 0;
              for (var j = 0; j < 7; j++) {
                if (LFSR & 1) {
                  var bitPosition = (1 << j) - 1;
                  if (bitPosition < 32) {
                    roundConstantLsw ^= 1 << bitPosition;
                  } else {
                    roundConstantMsw ^= 1 << bitPosition - 32;
                  }
                }
                if (LFSR & 128) {
                  LFSR = LFSR << 1 ^ 113;
                } else {
                  LFSR <<= 1;
                }
              }
              ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
            }
          })();
          var T = [];
          (function() {
            for (var i = 0; i < 25; i++) {
              T[i] = X64Word.create();
            }
          })();
          var SHA3 = C_algo.SHA3 = Hasher.extend({
            /**
             * Configuration options.
             *
             * @property {number} outputLength
             *   The desired number of bits in the output hash.
             *   Only values permitted are: 224, 256, 384, 512.
             *   Default: 512
             */
            cfg: Hasher.cfg.extend({
              outputLength: 512
            }),
            _doReset: function() {
              var state = this._state = [];
              for (var i = 0; i < 25; i++) {
                state[i] = new X64Word.init();
              }
              this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
            },
            _doProcessBlock: function(M, offset) {
              var state = this._state;
              var nBlockSizeLanes = this.blockSize / 2;
              for (var i = 0; i < nBlockSizeLanes; i++) {
                var M2i = M[offset + 2 * i];
                var M2i1 = M[offset + 2 * i + 1];
                M2i = (M2i << 8 | M2i >>> 24) & 16711935 | (M2i << 24 | M2i >>> 8) & 4278255360;
                M2i1 = (M2i1 << 8 | M2i1 >>> 24) & 16711935 | (M2i1 << 24 | M2i1 >>> 8) & 4278255360;
                var lane = state[i];
                lane.high ^= M2i1;
                lane.low ^= M2i;
              }
              for (var round = 0; round < 24; round++) {
                for (var x = 0; x < 5; x++) {
                  var tMsw = 0, tLsw = 0;
                  for (var y = 0; y < 5; y++) {
                    var lane = state[x + 5 * y];
                    tMsw ^= lane.high;
                    tLsw ^= lane.low;
                  }
                  var Tx = T[x];
                  Tx.high = tMsw;
                  Tx.low = tLsw;
                }
                for (var x = 0; x < 5; x++) {
                  var Tx4 = T[(x + 4) % 5];
                  var Tx1 = T[(x + 1) % 5];
                  var Tx1Msw = Tx1.high;
                  var Tx1Lsw = Tx1.low;
                  var tMsw = Tx4.high ^ (Tx1Msw << 1 | Tx1Lsw >>> 31);
                  var tLsw = Tx4.low ^ (Tx1Lsw << 1 | Tx1Msw >>> 31);
                  for (var y = 0; y < 5; y++) {
                    var lane = state[x + 5 * y];
                    lane.high ^= tMsw;
                    lane.low ^= tLsw;
                  }
                }
                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
                  var lane = state[laneIndex];
                  var laneMsw = lane.high;
                  var laneLsw = lane.low;
                  var rhoOffset = RHO_OFFSETS[laneIndex];
                  if (rhoOffset < 32) {
                    var tMsw = laneMsw << rhoOffset | laneLsw >>> 32 - rhoOffset;
                    var tLsw = laneLsw << rhoOffset | laneMsw >>> 32 - rhoOffset;
                  } else {
                    var tMsw = laneLsw << rhoOffset - 32 | laneMsw >>> 64 - rhoOffset;
                    var tLsw = laneMsw << rhoOffset - 32 | laneLsw >>> 64 - rhoOffset;
                  }
                  var TPiLane = T[PI_INDEXES[laneIndex]];
                  TPiLane.high = tMsw;
                  TPiLane.low = tLsw;
                }
                var T0 = T[0];
                var state0 = state[0];
                T0.high = state0.high;
                T0.low = state0.low;
                for (var x = 0; x < 5; x++) {
                  for (var y = 0; y < 5; y++) {
                    var laneIndex = x + 5 * y;
                    var lane = state[laneIndex];
                    var TLane = T[laneIndex];
                    var Tx1Lane = T[(x + 1) % 5 + 5 * y];
                    var Tx2Lane = T[(x + 2) % 5 + 5 * y];
                    lane.high = TLane.high ^ ~Tx1Lane.high & Tx2Lane.high;
                    lane.low = TLane.low ^ ~Tx1Lane.low & Tx2Lane.low;
                  }
                }
                var lane = state[0];
                var roundConstant = ROUND_CONSTANTS[round];
                lane.high ^= roundConstant.high;
                lane.low ^= roundConstant.low;
                ;
              }
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              var blockSizeBits = this.blockSize * 32;
              dataWords[nBitsLeft >>> 5] |= 1 << 24 - nBitsLeft % 32;
              dataWords[(Math2.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits >>> 5) - 1] |= 128;
              data.sigBytes = dataWords.length * 4;
              this._process();
              var state = this._state;
              var outputLengthBytes = this.cfg.outputLength / 8;
              var outputLengthLanes = outputLengthBytes / 8;
              var hashWords = [];
              for (var i = 0; i < outputLengthLanes; i++) {
                var lane = state[i];
                var laneMsw = lane.high;
                var laneLsw = lane.low;
                laneMsw = (laneMsw << 8 | laneMsw >>> 24) & 16711935 | (laneMsw << 24 | laneMsw >>> 8) & 4278255360;
                laneLsw = (laneLsw << 8 | laneLsw >>> 24) & 16711935 | (laneLsw << 24 | laneLsw >>> 8) & 4278255360;
                hashWords.push(laneLsw);
                hashWords.push(laneMsw);
              }
              return new WordArray.init(hashWords, outputLengthBytes);
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              var state = clone._state = this._state.slice(0);
              for (var i = 0; i < 25; i++) {
                state[i] = state[i].clone();
              }
              return clone;
            }
          });
          C.SHA3 = Hasher._createHelper(SHA3);
          C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
        })(Math);
        return CryptoJS2.SHA3;
      });
    }
  });

  // node_modules/crypto-js/ripemd160.js
  var require_ripemd160 = __commonJS({
    "node_modules/crypto-js/ripemd160.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function(Math2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C.algo;
          var _zl = WordArray.create([
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            7,
            4,
            13,
            1,
            10,
            6,
            15,
            3,
            12,
            0,
            9,
            5,
            2,
            14,
            11,
            8,
            3,
            10,
            14,
            4,
            9,
            15,
            8,
            1,
            2,
            7,
            0,
            6,
            13,
            11,
            5,
            12,
            1,
            9,
            11,
            10,
            0,
            8,
            12,
            4,
            13,
            3,
            7,
            15,
            14,
            5,
            6,
            2,
            4,
            0,
            5,
            9,
            7,
            12,
            2,
            10,
            14,
            1,
            3,
            8,
            11,
            6,
            15,
            13
          ]);
          var _zr = WordArray.create([
            5,
            14,
            7,
            0,
            9,
            2,
            11,
            4,
            13,
            6,
            15,
            8,
            1,
            10,
            3,
            12,
            6,
            11,
            3,
            7,
            0,
            13,
            5,
            10,
            14,
            15,
            8,
            12,
            4,
            9,
            1,
            2,
            15,
            5,
            1,
            3,
            7,
            14,
            6,
            9,
            11,
            8,
            12,
            2,
            10,
            0,
            4,
            13,
            8,
            6,
            4,
            1,
            3,
            11,
            15,
            0,
            5,
            12,
            2,
            13,
            9,
            7,
            10,
            14,
            12,
            15,
            10,
            4,
            1,
            5,
            8,
            7,
            6,
            2,
            13,
            14,
            0,
            3,
            9,
            11
          ]);
          var _sl = WordArray.create([
            11,
            14,
            15,
            12,
            5,
            8,
            7,
            9,
            11,
            13,
            14,
            15,
            6,
            7,
            9,
            8,
            7,
            6,
            8,
            13,
            11,
            9,
            7,
            15,
            7,
            12,
            15,
            9,
            11,
            7,
            13,
            12,
            11,
            13,
            6,
            7,
            14,
            9,
            13,
            15,
            14,
            8,
            13,
            6,
            5,
            12,
            7,
            5,
            11,
            12,
            14,
            15,
            14,
            15,
            9,
            8,
            9,
            14,
            5,
            6,
            8,
            6,
            5,
            12,
            9,
            15,
            5,
            11,
            6,
            8,
            13,
            12,
            5,
            12,
            13,
            14,
            11,
            8,
            5,
            6
          ]);
          var _sr = WordArray.create([
            8,
            9,
            9,
            11,
            13,
            15,
            15,
            5,
            7,
            7,
            8,
            11,
            14,
            14,
            12,
            6,
            9,
            13,
            15,
            7,
            12,
            8,
            9,
            11,
            7,
            7,
            12,
            7,
            6,
            15,
            13,
            11,
            9,
            7,
            15,
            11,
            8,
            6,
            6,
            14,
            12,
            13,
            5,
            14,
            13,
            13,
            7,
            5,
            15,
            5,
            8,
            11,
            14,
            14,
            6,
            14,
            6,
            9,
            12,
            9,
            12,
            5,
            15,
            8,
            8,
            5,
            12,
            9,
            12,
            5,
            14,
            6,
            8,
            13,
            6,
            5,
            15,
            13,
            11,
            11
          ]);
          var _hl = WordArray.create([0, 1518500249, 1859775393, 2400959708, 2840853838]);
          var _hr = WordArray.create([1352829926, 1548603684, 1836072691, 2053994217, 0]);
          var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
            _doReset: function() {
              this._hash = WordArray.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
            },
            _doProcessBlock: function(M, offset) {
              for (var i = 0; i < 16; i++) {
                var offset_i = offset + i;
                var M_offset_i = M[offset_i];
                M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
              }
              var H = this._hash.words;
              var hl = _hl.words;
              var hr = _hr.words;
              var zl = _zl.words;
              var zr = _zr.words;
              var sl = _sl.words;
              var sr = _sr.words;
              var al, bl, cl, dl, el;
              var ar, br, cr, dr, er;
              ar = al = H[0];
              br = bl = H[1];
              cr = cl = H[2];
              dr = dl = H[3];
              er = el = H[4];
              var t;
              for (var i = 0; i < 80; i += 1) {
                t = al + M[offset + zl[i]] | 0;
                if (i < 16) {
                  t += f1(bl, cl, dl) + hl[0];
                } else if (i < 32) {
                  t += f2(bl, cl, dl) + hl[1];
                } else if (i < 48) {
                  t += f3(bl, cl, dl) + hl[2];
                } else if (i < 64) {
                  t += f4(bl, cl, dl) + hl[3];
                } else {
                  t += f5(bl, cl, dl) + hl[4];
                }
                t = t | 0;
                t = rotl(t, sl[i]);
                t = t + el | 0;
                al = el;
                el = dl;
                dl = rotl(cl, 10);
                cl = bl;
                bl = t;
                t = ar + M[offset + zr[i]] | 0;
                if (i < 16) {
                  t += f5(br, cr, dr) + hr[0];
                } else if (i < 32) {
                  t += f4(br, cr, dr) + hr[1];
                } else if (i < 48) {
                  t += f3(br, cr, dr) + hr[2];
                } else if (i < 64) {
                  t += f2(br, cr, dr) + hr[3];
                } else {
                  t += f1(br, cr, dr) + hr[4];
                }
                t = t | 0;
                t = rotl(t, sr[i]);
                t = t + er | 0;
                ar = er;
                er = dr;
                dr = rotl(cr, 10);
                cr = br;
                br = t;
              }
              t = H[1] + cl + dr | 0;
              H[1] = H[2] + dl + er | 0;
              H[2] = H[3] + el + ar | 0;
              H[3] = H[4] + al + br | 0;
              H[4] = H[0] + bl + cr | 0;
              H[0] = t;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotal << 8 | nBitsTotal >>> 24) & 16711935 | (nBitsTotal << 24 | nBitsTotal >>> 8) & 4278255360;
              data.sigBytes = (dataWords.length + 1) * 4;
              this._process();
              var hash = this._hash;
              var H = hash.words;
              for (var i = 0; i < 5; i++) {
                var H_i = H[i];
                H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
              }
              return hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          function f1(x, y, z) {
            return x ^ y ^ z;
          }
          function f2(x, y, z) {
            return x & y | ~x & z;
          }
          function f3(x, y, z) {
            return (x | ~y) ^ z;
          }
          function f4(x, y, z) {
            return x & z | y & ~z;
          }
          function f5(x, y, z) {
            return x ^ (y | ~z);
          }
          function rotl(x, n) {
            return x << n | x >>> 32 - n;
          }
          C.RIPEMD160 = Hasher._createHelper(RIPEMD160);
          C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
        })(Math);
        return CryptoJS2.RIPEMD160;
      });
    }
  });

  // node_modules/crypto-js/hmac.js
  var require_hmac = __commonJS({
    "node_modules/crypto-js/hmac.js"(exports, module) {
      (function(root, factory) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var Base = C_lib.Base;
          var C_enc = C.enc;
          var Utf8 = C_enc.Utf8;
          var C_algo = C.algo;
          var HMAC = C_algo.HMAC = Base.extend({
            /**
             * Initializes a newly created HMAC.
             *
             * @param {Hasher} hasher The hash algorithm to use.
             * @param {WordArray|string} key The secret key.
             *
             * @example
             *
             *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
             */
            init: function(hasher, key) {
              hasher = this._hasher = new hasher.init();
              if (typeof key == "string") {
                key = Utf8.parse(key);
              }
              var hasherBlockSize = hasher.blockSize;
              var hasherBlockSizeBytes = hasherBlockSize * 4;
              if (key.sigBytes > hasherBlockSizeBytes) {
                key = hasher.finalize(key);
              }
              key.clamp();
              var oKey = this._oKey = key.clone();
              var iKey = this._iKey = key.clone();
              var oKeyWords = oKey.words;
              var iKeyWords = iKey.words;
              for (var i = 0; i < hasherBlockSize; i++) {
                oKeyWords[i] ^= 1549556828;
                iKeyWords[i] ^= 909522486;
              }
              oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
              this.reset();
            },
            /**
             * Resets this HMAC to its initial state.
             *
             * @example
             *
             *     hmacHasher.reset();
             */
            reset: function() {
              var hasher = this._hasher;
              hasher.reset();
              hasher.update(this._iKey);
            },
            /**
             * Updates this HMAC with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {HMAC} This HMAC instance.
             *
             * @example
             *
             *     hmacHasher.update('message');
             *     hmacHasher.update(wordArray);
             */
            update: function(messageUpdate) {
              this._hasher.update(messageUpdate);
              return this;
            },
            /**
             * Finalizes the HMAC computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The HMAC.
             *
             * @example
             *
             *     var hmac = hmacHasher.finalize();
             *     var hmac = hmacHasher.finalize('message');
             *     var hmac = hmacHasher.finalize(wordArray);
             */
            finalize: function(messageUpdate) {
              var hasher = this._hasher;
              var innerHash = hasher.finalize(messageUpdate);
              hasher.reset();
              var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));
              return hmac;
            }
          });
        })();
      });
    }
  });

  // node_modules/crypto-js/pbkdf2.js
  var require_pbkdf2 = __commonJS({
    "node_modules/crypto-js/pbkdf2.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_sha1(), require_hmac());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./sha1", "./hmac"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var Base = C_lib.Base;
          var WordArray = C_lib.WordArray;
          var C_algo = C.algo;
          var SHA1 = C_algo.SHA1;
          var HMAC = C_algo.HMAC;
          var PBKDF2 = C_algo.PBKDF2 = Base.extend({
            /**
             * Configuration options.
             *
             * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
             * @property {Hasher} hasher The hasher to use. Default: SHA1
             * @property {number} iterations The number of iterations to perform. Default: 1
             */
            cfg: Base.extend({
              keySize: 128 / 32,
              hasher: SHA1,
              iterations: 1
            }),
            /**
             * Initializes a newly created key derivation function.
             *
             * @param {Object} cfg (Optional) The configuration options to use for the derivation.
             *
             * @example
             *
             *     var kdf = CryptoJS.algo.PBKDF2.create();
             *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
             *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
             */
            init: function(cfg) {
              this.cfg = this.cfg.extend(cfg);
            },
            /**
             * Computes the Password-Based Key Derivation Function 2.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             *
             * @return {WordArray} The derived key.
             *
             * @example
             *
             *     var key = kdf.compute(password, salt);
             */
            compute: function(password, salt) {
              var cfg = this.cfg;
              var hmac = HMAC.create(cfg.hasher, password);
              var derivedKey = WordArray.create();
              var blockIndex = WordArray.create([1]);
              var derivedKeyWords = derivedKey.words;
              var blockIndexWords = blockIndex.words;
              var keySize = cfg.keySize;
              var iterations = cfg.iterations;
              while (derivedKeyWords.length < keySize) {
                var block = hmac.update(salt).finalize(blockIndex);
                hmac.reset();
                var blockWords = block.words;
                var blockWordsLength = blockWords.length;
                var intermediate = block;
                for (var i = 1; i < iterations; i++) {
                  intermediate = hmac.finalize(intermediate);
                  hmac.reset();
                  var intermediateWords = intermediate.words;
                  for (var j = 0; j < blockWordsLength; j++) {
                    blockWords[j] ^= intermediateWords[j];
                  }
                }
                derivedKey.concat(block);
                blockIndexWords[0]++;
              }
              derivedKey.sigBytes = keySize * 4;
              return derivedKey;
            }
          });
          C.PBKDF2 = function(password, salt, cfg) {
            return PBKDF2.create(cfg).compute(password, salt);
          };
        })();
        return CryptoJS2.PBKDF2;
      });
    }
  });

  // node_modules/crypto-js/evpkdf.js
  var require_evpkdf = __commonJS({
    "node_modules/crypto-js/evpkdf.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_sha1(), require_hmac());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./sha1", "./hmac"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var Base = C_lib.Base;
          var WordArray = C_lib.WordArray;
          var C_algo = C.algo;
          var MD5 = C_algo.MD5;
          var EvpKDF = C_algo.EvpKDF = Base.extend({
            /**
             * Configuration options.
             *
             * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
             * @property {Hasher} hasher The hash algorithm to use. Default: MD5
             * @property {number} iterations The number of iterations to perform. Default: 1
             */
            cfg: Base.extend({
              keySize: 128 / 32,
              hasher: MD5,
              iterations: 1
            }),
            /**
             * Initializes a newly created key derivation function.
             *
             * @param {Object} cfg (Optional) The configuration options to use for the derivation.
             *
             * @example
             *
             *     var kdf = CryptoJS.algo.EvpKDF.create();
             *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
             *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
             */
            init: function(cfg) {
              this.cfg = this.cfg.extend(cfg);
            },
            /**
             * Derives a key from a password.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             *
             * @return {WordArray} The derived key.
             *
             * @example
             *
             *     var key = kdf.compute(password, salt);
             */
            compute: function(password, salt) {
              var cfg = this.cfg;
              var hasher = cfg.hasher.create();
              var derivedKey = WordArray.create();
              var derivedKeyWords = derivedKey.words;
              var keySize = cfg.keySize;
              var iterations = cfg.iterations;
              while (derivedKeyWords.length < keySize) {
                if (block) {
                  hasher.update(block);
                }
                var block = hasher.update(password).finalize(salt);
                hasher.reset();
                for (var i = 1; i < iterations; i++) {
                  block = hasher.finalize(block);
                  hasher.reset();
                }
                derivedKey.concat(block);
              }
              derivedKey.sigBytes = keySize * 4;
              return derivedKey;
            }
          });
          C.EvpKDF = function(password, salt, cfg) {
            return EvpKDF.create(cfg).compute(password, salt);
          };
        })();
        return CryptoJS2.EvpKDF;
      });
    }
  });

  // node_modules/crypto-js/cipher-core.js
  var require_cipher_core = __commonJS({
    "node_modules/crypto-js/cipher-core.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_evpkdf());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./evpkdf"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.lib.Cipher || function(undefined2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var Base = C_lib.Base;
          var WordArray = C_lib.WordArray;
          var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
          var C_enc = C.enc;
          var Utf8 = C_enc.Utf8;
          var Base64 = C_enc.Base64;
          var C_algo = C.algo;
          var EvpKDF = C_algo.EvpKDF;
          var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             *
             * @property {WordArray} iv The IV to use for this operation.
             */
            cfg: Base.extend(),
            /**
             * Creates this cipher in encryption mode.
             *
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {Cipher} A cipher instance.
             *
             * @static
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
             */
            createEncryptor: function(key, cfg) {
              return this.create(this._ENC_XFORM_MODE, key, cfg);
            },
            /**
             * Creates this cipher in decryption mode.
             *
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {Cipher} A cipher instance.
             *
             * @static
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
             */
            createDecryptor: function(key, cfg) {
              return this.create(this._DEC_XFORM_MODE, key, cfg);
            },
            /**
             * Initializes a newly created cipher.
             *
             * @param {number} xformMode Either the encryption or decryption transormation mode constant.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
             */
            init: function(xformMode, key, cfg) {
              this.cfg = this.cfg.extend(cfg);
              this._xformMode = xformMode;
              this._key = key;
              this.reset();
            },
            /**
             * Resets this cipher to its initial state.
             *
             * @example
             *
             *     cipher.reset();
             */
            reset: function() {
              BufferedBlockAlgorithm.reset.call(this);
              this._doReset();
            },
            /**
             * Adds data to be encrypted or decrypted.
             *
             * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
             *
             * @return {WordArray} The data after processing.
             *
             * @example
             *
             *     var encrypted = cipher.process('data');
             *     var encrypted = cipher.process(wordArray);
             */
            process: function(dataUpdate) {
              this._append(dataUpdate);
              return this._process();
            },
            /**
             * Finalizes the encryption or decryption process.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
             *
             * @return {WordArray} The data after final processing.
             *
             * @example
             *
             *     var encrypted = cipher.finalize();
             *     var encrypted = cipher.finalize('data');
             *     var encrypted = cipher.finalize(wordArray);
             */
            finalize: function(dataUpdate) {
              if (dataUpdate) {
                this._append(dataUpdate);
              }
              var finalProcessedData = this._doFinalize();
              return finalProcessedData;
            },
            keySize: 128 / 32,
            ivSize: 128 / 32,
            _ENC_XFORM_MODE: 1,
            _DEC_XFORM_MODE: 2,
            /**
             * Creates shortcut functions to a cipher's object interface.
             *
             * @param {Cipher} cipher The cipher to create a helper for.
             *
             * @return {Object} An object with encrypt and decrypt shortcut functions.
             *
             * @static
             *
             * @example
             *
             *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
             */
            _createHelper: /* @__PURE__ */ function() {
              function selectCipherStrategy(key) {
                if (typeof key == "string") {
                  return PasswordBasedCipher;
                } else {
                  return SerializableCipher;
                }
              }
              return function(cipher) {
                return {
                  encrypt: function(message, key, cfg) {
                    return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                  },
                  decrypt: function(ciphertext, key, cfg) {
                    return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                  }
                };
              };
            }()
          });
          var StreamCipher = C_lib.StreamCipher = Cipher.extend({
            _doFinalize: function() {
              var finalProcessedBlocks = this._process(true);
              return finalProcessedBlocks;
            },
            blockSize: 1
          });
          var C_mode = C.mode = {};
          var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
            /**
             * Creates this mode for encryption.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @static
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
             */
            createEncryptor: function(cipher, iv) {
              return this.Encryptor.create(cipher, iv);
            },
            /**
             * Creates this mode for decryption.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @static
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
             */
            createDecryptor: function(cipher, iv) {
              return this.Decryptor.create(cipher, iv);
            },
            /**
             * Initializes a newly created mode.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
             */
            init: function(cipher, iv) {
              this._cipher = cipher;
              this._iv = iv;
            }
          });
          var CBC = C_mode.CBC = function() {
            var CBC2 = BlockCipherMode.extend();
            CBC2.Encryptor = CBC2.extend({
              /**
               * Processes the data block at offset.
               *
               * @param {Array} words The data words to operate on.
               * @param {number} offset The offset where the block starts.
               *
               * @example
               *
               *     mode.processBlock(data.words, offset);
               */
              processBlock: function(words, offset) {
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;
                xorBlock.call(this, words, offset, blockSize);
                cipher.encryptBlock(words, offset);
                this._prevBlock = words.slice(offset, offset + blockSize);
              }
            });
            CBC2.Decryptor = CBC2.extend({
              /**
               * Processes the data block at offset.
               *
               * @param {Array} words The data words to operate on.
               * @param {number} offset The offset where the block starts.
               *
               * @example
               *
               *     mode.processBlock(data.words, offset);
               */
              processBlock: function(words, offset) {
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;
                var thisBlock = words.slice(offset, offset + blockSize);
                cipher.decryptBlock(words, offset);
                xorBlock.call(this, words, offset, blockSize);
                this._prevBlock = thisBlock;
              }
            });
            function xorBlock(words, offset, blockSize) {
              var iv = this._iv;
              if (iv) {
                var block = iv;
                this._iv = undefined2;
              } else {
                var block = this._prevBlock;
              }
              for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= block[i];
              }
            }
            return CBC2;
          }();
          var C_pad = C.pad = {};
          var Pkcs7 = C_pad.Pkcs7 = {
            /**
             * Pads data using the algorithm defined in PKCS #5/7.
             *
             * @param {WordArray} data The data to pad.
             * @param {number} blockSize The multiple that the data should be padded to.
             *
             * @static
             *
             * @example
             *
             *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
             */
            pad: function(data, blockSize) {
              var blockSizeBytes = blockSize * 4;
              var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
              var paddingWord = nPaddingBytes << 24 | nPaddingBytes << 16 | nPaddingBytes << 8 | nPaddingBytes;
              var paddingWords = [];
              for (var i = 0; i < nPaddingBytes; i += 4) {
                paddingWords.push(paddingWord);
              }
              var padding = WordArray.create(paddingWords, nPaddingBytes);
              data.concat(padding);
            },
            /**
             * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
             *
             * @param {WordArray} data The data to unpad.
             *
             * @static
             *
             * @example
             *
             *     CryptoJS.pad.Pkcs7.unpad(wordArray);
             */
            unpad: function(data) {
              var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
              data.sigBytes -= nPaddingBytes;
            }
          };
          var BlockCipher = C_lib.BlockCipher = Cipher.extend({
            /**
             * Configuration options.
             *
             * @property {Mode} mode The block mode to use. Default: CBC
             * @property {Padding} padding The padding strategy to use. Default: Pkcs7
             */
            cfg: Cipher.cfg.extend({
              mode: CBC,
              padding: Pkcs7
            }),
            reset: function() {
              Cipher.reset.call(this);
              var cfg = this.cfg;
              var iv = cfg.iv;
              var mode = cfg.mode;
              if (this._xformMode == this._ENC_XFORM_MODE) {
                var modeCreator = mode.createEncryptor;
              } else {
                var modeCreator = mode.createDecryptor;
                this._minBufferSize = 1;
              }
              if (this._mode && this._mode.__creator == modeCreator) {
                this._mode.init(this, iv && iv.words);
              } else {
                this._mode = modeCreator.call(mode, this, iv && iv.words);
                this._mode.__creator = modeCreator;
              }
            },
            _doProcessBlock: function(words, offset) {
              this._mode.processBlock(words, offset);
            },
            _doFinalize: function() {
              var padding = this.cfg.padding;
              if (this._xformMode == this._ENC_XFORM_MODE) {
                padding.pad(this._data, this.blockSize);
                var finalProcessedBlocks = this._process(true);
              } else {
                var finalProcessedBlocks = this._process(true);
                padding.unpad(finalProcessedBlocks);
              }
              return finalProcessedBlocks;
            },
            blockSize: 128 / 32
          });
          var CipherParams = C_lib.CipherParams = Base.extend({
            /**
             * Initializes a newly created cipher params object.
             *
             * @param {Object} cipherParams An object with any of the possible cipher parameters.
             *
             * @example
             *
             *     var cipherParams = CryptoJS.lib.CipherParams.create({
             *         ciphertext: ciphertextWordArray,
             *         key: keyWordArray,
             *         iv: ivWordArray,
             *         salt: saltWordArray,
             *         algorithm: CryptoJS.algo.AES,
             *         mode: CryptoJS.mode.CBC,
             *         padding: CryptoJS.pad.PKCS7,
             *         blockSize: 4,
             *         formatter: CryptoJS.format.OpenSSL
             *     });
             */
            init: function(cipherParams) {
              this.mixIn(cipherParams);
            },
            /**
             * Converts this cipher params object to a string.
             *
             * @param {Format} formatter (Optional) The formatting strategy to use.
             *
             * @return {string} The stringified cipher params.
             *
             * @throws Error If neither the formatter nor the default formatter is set.
             *
             * @example
             *
             *     var string = cipherParams + '';
             *     var string = cipherParams.toString();
             *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
             */
            toString: function(formatter) {
              return (formatter || this.formatter).stringify(this);
            }
          });
          var C_format = C.format = {};
          var OpenSSLFormatter = C_format.OpenSSL = {
            /**
             * Converts a cipher params object to an OpenSSL-compatible string.
             *
             * @param {CipherParams} cipherParams The cipher params object.
             *
             * @return {string} The OpenSSL-compatible string.
             *
             * @static
             *
             * @example
             *
             *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
             */
            stringify: function(cipherParams) {
              var ciphertext = cipherParams.ciphertext;
              var salt = cipherParams.salt;
              if (salt) {
                var wordArray = WordArray.create([1398893684, 1701076831]).concat(salt).concat(ciphertext);
              } else {
                var wordArray = ciphertext;
              }
              return wordArray.toString(Base64);
            },
            /**
             * Converts an OpenSSL-compatible string to a cipher params object.
             *
             * @param {string} openSSLStr The OpenSSL-compatible string.
             *
             * @return {CipherParams} The cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
             */
            parse: function(openSSLStr) {
              var ciphertext = Base64.parse(openSSLStr);
              var ciphertextWords = ciphertext.words;
              if (ciphertextWords[0] == 1398893684 && ciphertextWords[1] == 1701076831) {
                var salt = WordArray.create(ciphertextWords.slice(2, 4));
                ciphertextWords.splice(0, 4);
                ciphertext.sigBytes -= 16;
              }
              return CipherParams.create({ ciphertext, salt });
            }
          };
          var SerializableCipher = C_lib.SerializableCipher = Base.extend({
            /**
             * Configuration options.
             *
             * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
             */
            cfg: Base.extend({
              format: OpenSSLFormatter
            }),
            /**
             * Encrypts a message.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {WordArray|string} message The message to encrypt.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {CipherParams} A cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             */
            encrypt: function(cipher, message, key, cfg) {
              cfg = this.cfg.extend(cfg);
              var encryptor = cipher.createEncryptor(key, cfg);
              var ciphertext = encryptor.finalize(message);
              var cipherCfg = encryptor.cfg;
              return CipherParams.create({
                ciphertext,
                key,
                iv: cipherCfg.iv,
                algorithm: cipher,
                mode: cipherCfg.mode,
                padding: cipherCfg.padding,
                blockSize: cipher.blockSize,
                formatter: cfg.format
              });
            },
            /**
             * Decrypts serialized ciphertext.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {WordArray} The plaintext.
             *
             * @static
             *
             * @example
             *
             *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             */
            decrypt: function(cipher, ciphertext, key, cfg) {
              cfg = this.cfg.extend(cfg);
              ciphertext = this._parse(ciphertext, cfg.format);
              var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
              return plaintext;
            },
            /**
             * Converts serialized ciphertext to CipherParams,
             * else assumed CipherParams already and returns ciphertext unchanged.
             *
             * @param {CipherParams|string} ciphertext The ciphertext.
             * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
             *
             * @return {CipherParams} The unserialized ciphertext.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
             */
            _parse: function(ciphertext, format) {
              if (typeof ciphertext == "string") {
                return format.parse(ciphertext, this);
              } else {
                return ciphertext;
              }
            }
          });
          var C_kdf = C.kdf = {};
          var OpenSSLKdf = C_kdf.OpenSSL = {
            /**
             * Derives a key and IV from a password.
             *
             * @param {string} password The password to derive from.
             * @param {number} keySize The size in words of the key to generate.
             * @param {number} ivSize The size in words of the IV to generate.
             * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
             *
             * @return {CipherParams} A cipher params object with the key, IV, and salt.
             *
             * @static
             *
             * @example
             *
             *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
             *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
             */
            execute: function(password, keySize, ivSize, salt) {
              if (!salt) {
                salt = WordArray.random(64 / 8);
              }
              var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
              var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
              key.sigBytes = keySize * 4;
              return CipherParams.create({ key, iv, salt });
            }
          };
          var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
            /**
             * Configuration options.
             *
             * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
             */
            cfg: SerializableCipher.cfg.extend({
              kdf: OpenSSLKdf
            }),
            /**
             * Encrypts a message using a password.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {WordArray|string} message The message to encrypt.
             * @param {string} password The password.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {CipherParams} A cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
             *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
             */
            encrypt: function(cipher, message, password, cfg) {
              cfg = this.cfg.extend(cfg);
              var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);
              cfg.iv = derivedParams.iv;
              var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);
              ciphertext.mixIn(derivedParams);
              return ciphertext;
            },
            /**
             * Decrypts serialized ciphertext using a password.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
             * @param {string} password The password.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {WordArray} The plaintext.
             *
             * @static
             *
             * @example
             *
             *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
             *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
             */
            decrypt: function(cipher, ciphertext, password, cfg) {
              cfg = this.cfg.extend(cfg);
              ciphertext = this._parse(ciphertext, cfg.format);
              var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);
              cfg.iv = derivedParams.iv;
              var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);
              return plaintext;
            }
          });
        }();
      });
    }
  });

  // node_modules/crypto-js/mode-cfb.js
  var require_mode_cfb = __commonJS({
    "node_modules/crypto-js/mode-cfb.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.mode.CFB = function() {
          var CFB = CryptoJS2.lib.BlockCipherMode.extend();
          CFB.Encryptor = CFB.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
              this._prevBlock = words.slice(offset, offset + blockSize);
            }
          });
          CFB.Decryptor = CFB.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var thisBlock = words.slice(offset, offset + blockSize);
              generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
              this._prevBlock = thisBlock;
            }
          });
          function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
            var iv = this._iv;
            if (iv) {
              var keystream = iv.slice(0);
              this._iv = void 0;
            } else {
              var keystream = this._prevBlock;
            }
            cipher.encryptBlock(keystream, 0);
            for (var i = 0; i < blockSize; i++) {
              words[offset + i] ^= keystream[i];
            }
          }
          return CFB;
        }();
        return CryptoJS2.mode.CFB;
      });
    }
  });

  // node_modules/crypto-js/mode-ctr.js
  var require_mode_ctr = __commonJS({
    "node_modules/crypto-js/mode-ctr.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.mode.CTR = function() {
          var CTR = CryptoJS2.lib.BlockCipherMode.extend();
          var Encryptor = CTR.Encryptor = CTR.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var counter = this._counter;
              if (iv) {
                counter = this._counter = iv.slice(0);
                this._iv = void 0;
              }
              var keystream = counter.slice(0);
              cipher.encryptBlock(keystream, 0);
              counter[blockSize - 1] = counter[blockSize - 1] + 1 | 0;
              for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= keystream[i];
              }
            }
          });
          CTR.Decryptor = Encryptor;
          return CTR;
        }();
        return CryptoJS2.mode.CTR;
      });
    }
  });

  // node_modules/crypto-js/mode-ctr-gladman.js
  var require_mode_ctr_gladman = __commonJS({
    "node_modules/crypto-js/mode-ctr-gladman.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.mode.CTRGladman = function() {
          var CTRGladman = CryptoJS2.lib.BlockCipherMode.extend();
          function incWord(word) {
            if ((word >> 24 & 255) === 255) {
              var b1 = word >> 16 & 255;
              var b2 = word >> 8 & 255;
              var b3 = word & 255;
              if (b1 === 255) {
                b1 = 0;
                if (b2 === 255) {
                  b2 = 0;
                  if (b3 === 255) {
                    b3 = 0;
                  } else {
                    ++b3;
                  }
                } else {
                  ++b2;
                }
              } else {
                ++b1;
              }
              word = 0;
              word += b1 << 16;
              word += b2 << 8;
              word += b3;
            } else {
              word += 1 << 24;
            }
            return word;
          }
          function incCounter(counter) {
            if ((counter[0] = incWord(counter[0])) === 0) {
              counter[1] = incWord(counter[1]);
            }
            return counter;
          }
          var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var counter = this._counter;
              if (iv) {
                counter = this._counter = iv.slice(0);
                this._iv = void 0;
              }
              incCounter(counter);
              var keystream = counter.slice(0);
              cipher.encryptBlock(keystream, 0);
              for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= keystream[i];
              }
            }
          });
          CTRGladman.Decryptor = Encryptor;
          return CTRGladman;
        }();
        return CryptoJS2.mode.CTRGladman;
      });
    }
  });

  // node_modules/crypto-js/mode-ofb.js
  var require_mode_ofb = __commonJS({
    "node_modules/crypto-js/mode-ofb.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.mode.OFB = function() {
          var OFB = CryptoJS2.lib.BlockCipherMode.extend();
          var Encryptor = OFB.Encryptor = OFB.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var keystream = this._keystream;
              if (iv) {
                keystream = this._keystream = iv.slice(0);
                this._iv = void 0;
              }
              cipher.encryptBlock(keystream, 0);
              for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= keystream[i];
              }
            }
          });
          OFB.Decryptor = Encryptor;
          return OFB;
        }();
        return CryptoJS2.mode.OFB;
      });
    }
  });

  // node_modules/crypto-js/mode-ecb.js
  var require_mode_ecb = __commonJS({
    "node_modules/crypto-js/mode-ecb.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.mode.ECB = function() {
          var ECB = CryptoJS2.lib.BlockCipherMode.extend();
          ECB.Encryptor = ECB.extend({
            processBlock: function(words, offset) {
              this._cipher.encryptBlock(words, offset);
            }
          });
          ECB.Decryptor = ECB.extend({
            processBlock: function(words, offset) {
              this._cipher.decryptBlock(words, offset);
            }
          });
          return ECB;
        }();
        return CryptoJS2.mode.ECB;
      });
    }
  });

  // node_modules/crypto-js/pad-ansix923.js
  var require_pad_ansix923 = __commonJS({
    "node_modules/crypto-js/pad-ansix923.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.pad.AnsiX923 = {
          pad: function(data, blockSize) {
            var dataSigBytes = data.sigBytes;
            var blockSizeBytes = blockSize * 4;
            var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;
            var lastBytePos = dataSigBytes + nPaddingBytes - 1;
            data.clamp();
            data.words[lastBytePos >>> 2] |= nPaddingBytes << 24 - lastBytePos % 4 * 8;
            data.sigBytes += nPaddingBytes;
          },
          unpad: function(data) {
            var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
            data.sigBytes -= nPaddingBytes;
          }
        };
        return CryptoJS2.pad.Ansix923;
      });
    }
  });

  // node_modules/crypto-js/pad-iso10126.js
  var require_pad_iso10126 = __commonJS({
    "node_modules/crypto-js/pad-iso10126.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.pad.Iso10126 = {
          pad: function(data, blockSize) {
            var blockSizeBytes = blockSize * 4;
            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
            data.concat(CryptoJS2.lib.WordArray.random(nPaddingBytes - 1)).concat(CryptoJS2.lib.WordArray.create([nPaddingBytes << 24], 1));
          },
          unpad: function(data) {
            var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
            data.sigBytes -= nPaddingBytes;
          }
        };
        return CryptoJS2.pad.Iso10126;
      });
    }
  });

  // node_modules/crypto-js/pad-iso97971.js
  var require_pad_iso97971 = __commonJS({
    "node_modules/crypto-js/pad-iso97971.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.pad.Iso97971 = {
          pad: function(data, blockSize) {
            data.concat(CryptoJS2.lib.WordArray.create([2147483648], 1));
            CryptoJS2.pad.ZeroPadding.pad(data, blockSize);
          },
          unpad: function(data) {
            CryptoJS2.pad.ZeroPadding.unpad(data);
            data.sigBytes--;
          }
        };
        return CryptoJS2.pad.Iso97971;
      });
    }
  });

  // node_modules/crypto-js/pad-zeropadding.js
  var require_pad_zeropadding = __commonJS({
    "node_modules/crypto-js/pad-zeropadding.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.pad.ZeroPadding = {
          pad: function(data, blockSize) {
            var blockSizeBytes = blockSize * 4;
            data.clamp();
            data.sigBytes += blockSizeBytes - (data.sigBytes % blockSizeBytes || blockSizeBytes);
          },
          unpad: function(data) {
            var dataWords = data.words;
            var i = data.sigBytes - 1;
            while (!(dataWords[i >>> 2] >>> 24 - i % 4 * 8 & 255)) {
              i--;
            }
            data.sigBytes = i + 1;
          }
        };
        return CryptoJS2.pad.ZeroPadding;
      });
    }
  });

  // node_modules/crypto-js/pad-nopadding.js
  var require_pad_nopadding = __commonJS({
    "node_modules/crypto-js/pad-nopadding.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        CryptoJS2.pad.NoPadding = {
          pad: function() {
          },
          unpad: function() {
          }
        };
        return CryptoJS2.pad.NoPadding;
      });
    }
  });

  // node_modules/crypto-js/format-hex.js
  var require_format_hex = __commonJS({
    "node_modules/crypto-js/format-hex.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function(undefined2) {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var CipherParams = C_lib.CipherParams;
          var C_enc = C.enc;
          var Hex = C_enc.Hex;
          var C_format = C.format;
          var HexFormatter = C_format.Hex = {
            /**
             * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
             *
             * @param {CipherParams} cipherParams The cipher params object.
             *
             * @return {string} The hexadecimally encoded string.
             *
             * @static
             *
             * @example
             *
             *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
             */
            stringify: function(cipherParams) {
              return cipherParams.ciphertext.toString(Hex);
            },
            /**
             * Converts a hexadecimally encoded ciphertext string to a cipher params object.
             *
             * @param {string} input The hexadecimally encoded string.
             *
             * @return {CipherParams} The cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
             */
            parse: function(input) {
              var ciphertext = Hex.parse(input);
              return CipherParams.create({ ciphertext });
            }
          };
        })();
        return CryptoJS2.format.Hex;
      });
    }
  });

  // node_modules/crypto-js/aes.js
  var require_aes = __commonJS({
    "node_modules/crypto-js/aes.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var BlockCipher = C_lib.BlockCipher;
          var C_algo = C.algo;
          var SBOX = [];
          var INV_SBOX = [];
          var SUB_MIX_0 = [];
          var SUB_MIX_1 = [];
          var SUB_MIX_2 = [];
          var SUB_MIX_3 = [];
          var INV_SUB_MIX_0 = [];
          var INV_SUB_MIX_1 = [];
          var INV_SUB_MIX_2 = [];
          var INV_SUB_MIX_3 = [];
          (function() {
            var d = [];
            for (var i = 0; i < 256; i++) {
              if (i < 128) {
                d[i] = i << 1;
              } else {
                d[i] = i << 1 ^ 283;
              }
            }
            var x = 0;
            var xi = 0;
            for (var i = 0; i < 256; i++) {
              var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
              sx = sx >>> 8 ^ sx & 255 ^ 99;
              SBOX[x] = sx;
              INV_SBOX[sx] = x;
              var x2 = d[x];
              var x4 = d[x2];
              var x8 = d[x4];
              var t = d[sx] * 257 ^ sx * 16843008;
              SUB_MIX_0[x] = t << 24 | t >>> 8;
              SUB_MIX_1[x] = t << 16 | t >>> 16;
              SUB_MIX_2[x] = t << 8 | t >>> 24;
              SUB_MIX_3[x] = t;
              var t = x8 * 16843009 ^ x4 * 65537 ^ x2 * 257 ^ x * 16843008;
              INV_SUB_MIX_0[sx] = t << 24 | t >>> 8;
              INV_SUB_MIX_1[sx] = t << 16 | t >>> 16;
              INV_SUB_MIX_2[sx] = t << 8 | t >>> 24;
              INV_SUB_MIX_3[sx] = t;
              if (!x) {
                x = xi = 1;
              } else {
                x = x2 ^ d[d[d[x8 ^ x2]]];
                xi ^= d[d[xi]];
              }
            }
          })();
          var RCON = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
          var AES = C_algo.AES = BlockCipher.extend({
            _doReset: function() {
              if (this._nRounds && this._keyPriorReset === this._key) {
                return;
              }
              var key = this._keyPriorReset = this._key;
              var keyWords = key.words;
              var keySize = key.sigBytes / 4;
              var nRounds = this._nRounds = keySize + 6;
              var ksRows = (nRounds + 1) * 4;
              var keySchedule = this._keySchedule = [];
              for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                if (ksRow < keySize) {
                  keySchedule[ksRow] = keyWords[ksRow];
                } else {
                  var t = keySchedule[ksRow - 1];
                  if (!(ksRow % keySize)) {
                    t = t << 8 | t >>> 24;
                    t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[t & 255];
                    t ^= RCON[ksRow / keySize | 0] << 24;
                  } else if (keySize > 6 && ksRow % keySize == 4) {
                    t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[t & 255];
                  }
                  keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                }
              }
              var invKeySchedule = this._invKeySchedule = [];
              for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                var ksRow = ksRows - invKsRow;
                if (invKsRow % 4) {
                  var t = keySchedule[ksRow];
                } else {
                  var t = keySchedule[ksRow - 4];
                }
                if (invKsRow < 4 || ksRow <= 4) {
                  invKeySchedule[invKsRow] = t;
                } else {
                  invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[t >>> 16 & 255]] ^ INV_SUB_MIX_2[SBOX[t >>> 8 & 255]] ^ INV_SUB_MIX_3[SBOX[t & 255]];
                }
              }
            },
            encryptBlock: function(M, offset) {
              this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
            },
            decryptBlock: function(M, offset) {
              var t = M[offset + 1];
              M[offset + 1] = M[offset + 3];
              M[offset + 3] = t;
              this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
              var t = M[offset + 1];
              M[offset + 1] = M[offset + 3];
              M[offset + 3] = t;
            },
            _doCryptBlock: function(M, offset, keySchedule, SUB_MIX_02, SUB_MIX_12, SUB_MIX_22, SUB_MIX_32, SBOX2) {
              var nRounds = this._nRounds;
              var s0 = M[offset] ^ keySchedule[0];
              var s1 = M[offset + 1] ^ keySchedule[1];
              var s2 = M[offset + 2] ^ keySchedule[2];
              var s3 = M[offset + 3] ^ keySchedule[3];
              var ksRow = 4;
              for (var round = 1; round < nRounds; round++) {
                var t0 = SUB_MIX_02[s0 >>> 24] ^ SUB_MIX_12[s1 >>> 16 & 255] ^ SUB_MIX_22[s2 >>> 8 & 255] ^ SUB_MIX_32[s3 & 255] ^ keySchedule[ksRow++];
                var t1 = SUB_MIX_02[s1 >>> 24] ^ SUB_MIX_12[s2 >>> 16 & 255] ^ SUB_MIX_22[s3 >>> 8 & 255] ^ SUB_MIX_32[s0 & 255] ^ keySchedule[ksRow++];
                var t2 = SUB_MIX_02[s2 >>> 24] ^ SUB_MIX_12[s3 >>> 16 & 255] ^ SUB_MIX_22[s0 >>> 8 & 255] ^ SUB_MIX_32[s1 & 255] ^ keySchedule[ksRow++];
                var t3 = SUB_MIX_02[s3 >>> 24] ^ SUB_MIX_12[s0 >>> 16 & 255] ^ SUB_MIX_22[s1 >>> 8 & 255] ^ SUB_MIX_32[s2 & 255] ^ keySchedule[ksRow++];
                s0 = t0;
                s1 = t1;
                s2 = t2;
                s3 = t3;
              }
              var t0 = (SBOX2[s0 >>> 24] << 24 | SBOX2[s1 >>> 16 & 255] << 16 | SBOX2[s2 >>> 8 & 255] << 8 | SBOX2[s3 & 255]) ^ keySchedule[ksRow++];
              var t1 = (SBOX2[s1 >>> 24] << 24 | SBOX2[s2 >>> 16 & 255] << 16 | SBOX2[s3 >>> 8 & 255] << 8 | SBOX2[s0 & 255]) ^ keySchedule[ksRow++];
              var t2 = (SBOX2[s2 >>> 24] << 24 | SBOX2[s3 >>> 16 & 255] << 16 | SBOX2[s0 >>> 8 & 255] << 8 | SBOX2[s1 & 255]) ^ keySchedule[ksRow++];
              var t3 = (SBOX2[s3 >>> 24] << 24 | SBOX2[s0 >>> 16 & 255] << 16 | SBOX2[s1 >>> 8 & 255] << 8 | SBOX2[s2 & 255]) ^ keySchedule[ksRow++];
              M[offset] = t0;
              M[offset + 1] = t1;
              M[offset + 2] = t2;
              M[offset + 3] = t3;
            },
            keySize: 256 / 32
          });
          C.AES = BlockCipher._createHelper(AES);
        })();
        return CryptoJS2.AES;
      });
    }
  });

  // node_modules/crypto-js/tripledes.js
  var require_tripledes = __commonJS({
    "node_modules/crypto-js/tripledes.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var WordArray = C_lib.WordArray;
          var BlockCipher = C_lib.BlockCipher;
          var C_algo = C.algo;
          var PC1 = [
            57,
            49,
            41,
            33,
            25,
            17,
            9,
            1,
            58,
            50,
            42,
            34,
            26,
            18,
            10,
            2,
            59,
            51,
            43,
            35,
            27,
            19,
            11,
            3,
            60,
            52,
            44,
            36,
            63,
            55,
            47,
            39,
            31,
            23,
            15,
            7,
            62,
            54,
            46,
            38,
            30,
            22,
            14,
            6,
            61,
            53,
            45,
            37,
            29,
            21,
            13,
            5,
            28,
            20,
            12,
            4
          ];
          var PC2 = [
            14,
            17,
            11,
            24,
            1,
            5,
            3,
            28,
            15,
            6,
            21,
            10,
            23,
            19,
            12,
            4,
            26,
            8,
            16,
            7,
            27,
            20,
            13,
            2,
            41,
            52,
            31,
            37,
            47,
            55,
            30,
            40,
            51,
            45,
            33,
            48,
            44,
            49,
            39,
            56,
            34,
            53,
            46,
            42,
            50,
            36,
            29,
            32
          ];
          var BIT_SHIFTS = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];
          var SBOX_P = [
            {
              0: 8421888,
              268435456: 32768,
              536870912: 8421378,
              805306368: 2,
              1073741824: 512,
              1342177280: 8421890,
              1610612736: 8389122,
              1879048192: 8388608,
              2147483648: 514,
              2415919104: 8389120,
              2684354560: 33280,
              2952790016: 8421376,
              3221225472: 32770,
              3489660928: 8388610,
              3758096384: 0,
              4026531840: 33282,
              134217728: 0,
              402653184: 8421890,
              671088640: 33282,
              939524096: 32768,
              1207959552: 8421888,
              1476395008: 512,
              1744830464: 8421378,
              2013265920: 2,
              2281701376: 8389120,
              2550136832: 33280,
              2818572288: 8421376,
              3087007744: 8389122,
              3355443200: 8388610,
              3623878656: 32770,
              3892314112: 514,
              4160749568: 8388608,
              1: 32768,
              268435457: 2,
              536870913: 8421888,
              805306369: 8388608,
              1073741825: 8421378,
              1342177281: 33280,
              1610612737: 512,
              1879048193: 8389122,
              2147483649: 8421890,
              2415919105: 8421376,
              2684354561: 8388610,
              2952790017: 33282,
              3221225473: 514,
              3489660929: 8389120,
              3758096385: 32770,
              4026531841: 0,
              134217729: 8421890,
              402653185: 8421376,
              671088641: 8388608,
              939524097: 512,
              1207959553: 32768,
              1476395009: 8388610,
              1744830465: 2,
              2013265921: 33282,
              2281701377: 32770,
              2550136833: 8389122,
              2818572289: 514,
              3087007745: 8421888,
              3355443201: 8389120,
              3623878657: 0,
              3892314113: 33280,
              4160749569: 8421378
            },
            {
              0: 1074282512,
              16777216: 16384,
              33554432: 524288,
              50331648: 1074266128,
              67108864: 1073741840,
              83886080: 1074282496,
              100663296: 1073758208,
              117440512: 16,
              134217728: 540672,
              150994944: 1073758224,
              167772160: 1073741824,
              184549376: 540688,
              201326592: 524304,
              218103808: 0,
              234881024: 16400,
              251658240: 1074266112,
              8388608: 1073758208,
              25165824: 540688,
              41943040: 16,
              58720256: 1073758224,
              75497472: 1074282512,
              92274688: 1073741824,
              109051904: 524288,
              125829120: 1074266128,
              142606336: 524304,
              159383552: 0,
              176160768: 16384,
              192937984: 1074266112,
              209715200: 1073741840,
              226492416: 540672,
              243269632: 1074282496,
              260046848: 16400,
              268435456: 0,
              285212672: 1074266128,
              301989888: 1073758224,
              318767104: 1074282496,
              335544320: 1074266112,
              352321536: 16,
              369098752: 540688,
              385875968: 16384,
              402653184: 16400,
              419430400: 524288,
              436207616: 524304,
              452984832: 1073741840,
              469762048: 540672,
              486539264: 1073758208,
              503316480: 1073741824,
              520093696: 1074282512,
              276824064: 540688,
              293601280: 524288,
              310378496: 1074266112,
              327155712: 16384,
              343932928: 1073758208,
              360710144: 1074282512,
              377487360: 16,
              394264576: 1073741824,
              411041792: 1074282496,
              427819008: 1073741840,
              444596224: 1073758224,
              461373440: 524304,
              478150656: 0,
              494927872: 16400,
              511705088: 1074266128,
              528482304: 540672
            },
            {
              0: 260,
              1048576: 0,
              2097152: 67109120,
              3145728: 65796,
              4194304: 65540,
              5242880: 67108868,
              6291456: 67174660,
              7340032: 67174400,
              8388608: 67108864,
              9437184: 67174656,
              10485760: 65792,
              11534336: 67174404,
              12582912: 67109124,
              13631488: 65536,
              14680064: 4,
              15728640: 256,
              524288: 67174656,
              1572864: 67174404,
              2621440: 0,
              3670016: 67109120,
              4718592: 67108868,
              5767168: 65536,
              6815744: 65540,
              7864320: 260,
              8912896: 4,
              9961472: 256,
              11010048: 67174400,
              12058624: 65796,
              13107200: 65792,
              14155776: 67109124,
              15204352: 67174660,
              16252928: 67108864,
              16777216: 67174656,
              17825792: 65540,
              18874368: 65536,
              19922944: 67109120,
              20971520: 256,
              22020096: 67174660,
              23068672: 67108868,
              24117248: 0,
              25165824: 67109124,
              26214400: 67108864,
              27262976: 4,
              28311552: 65792,
              29360128: 67174400,
              30408704: 260,
              31457280: 65796,
              32505856: 67174404,
              17301504: 67108864,
              18350080: 260,
              19398656: 67174656,
              20447232: 0,
              21495808: 65540,
              22544384: 67109120,
              23592960: 256,
              24641536: 67174404,
              25690112: 65536,
              26738688: 67174660,
              27787264: 65796,
              28835840: 67108868,
              29884416: 67109124,
              30932992: 67174400,
              31981568: 4,
              33030144: 65792
            },
            {
              0: 2151682048,
              65536: 2147487808,
              131072: 4198464,
              196608: 2151677952,
              262144: 0,
              327680: 4198400,
              393216: 2147483712,
              458752: 4194368,
              524288: 2147483648,
              589824: 4194304,
              655360: 64,
              720896: 2147487744,
              786432: 2151678016,
              851968: 4160,
              917504: 4096,
              983040: 2151682112,
              32768: 2147487808,
              98304: 64,
              163840: 2151678016,
              229376: 2147487744,
              294912: 4198400,
              360448: 2151682112,
              425984: 0,
              491520: 2151677952,
              557056: 4096,
              622592: 2151682048,
              688128: 4194304,
              753664: 4160,
              819200: 2147483648,
              884736: 4194368,
              950272: 4198464,
              1015808: 2147483712,
              1048576: 4194368,
              1114112: 4198400,
              1179648: 2147483712,
              1245184: 0,
              1310720: 4160,
              1376256: 2151678016,
              1441792: 2151682048,
              1507328: 2147487808,
              1572864: 2151682112,
              1638400: 2147483648,
              1703936: 2151677952,
              1769472: 4198464,
              1835008: 2147487744,
              1900544: 4194304,
              1966080: 64,
              2031616: 4096,
              1081344: 2151677952,
              1146880: 2151682112,
              1212416: 0,
              1277952: 4198400,
              1343488: 4194368,
              1409024: 2147483648,
              1474560: 2147487808,
              1540096: 64,
              1605632: 2147483712,
              1671168: 4096,
              1736704: 2147487744,
              1802240: 2151678016,
              1867776: 4160,
              1933312: 2151682048,
              1998848: 4194304,
              2064384: 4198464
            },
            {
              0: 128,
              4096: 17039360,
              8192: 262144,
              12288: 536870912,
              16384: 537133184,
              20480: 16777344,
              24576: 553648256,
              28672: 262272,
              32768: 16777216,
              36864: 537133056,
              40960: 536871040,
              45056: 553910400,
              49152: 553910272,
              53248: 0,
              57344: 17039488,
              61440: 553648128,
              2048: 17039488,
              6144: 553648256,
              10240: 128,
              14336: 17039360,
              18432: 262144,
              22528: 537133184,
              26624: 553910272,
              30720: 536870912,
              34816: 537133056,
              38912: 0,
              43008: 553910400,
              47104: 16777344,
              51200: 536871040,
              55296: 553648128,
              59392: 16777216,
              63488: 262272,
              65536: 262144,
              69632: 128,
              73728: 536870912,
              77824: 553648256,
              81920: 16777344,
              86016: 553910272,
              90112: 537133184,
              94208: 16777216,
              98304: 553910400,
              102400: 553648128,
              106496: 17039360,
              110592: 537133056,
              114688: 262272,
              118784: 536871040,
              122880: 0,
              126976: 17039488,
              67584: 553648256,
              71680: 16777216,
              75776: 17039360,
              79872: 537133184,
              83968: 536870912,
              88064: 17039488,
              92160: 128,
              96256: 553910272,
              100352: 262272,
              104448: 553910400,
              108544: 0,
              112640: 553648128,
              116736: 16777344,
              120832: 262144,
              124928: 537133056,
              129024: 536871040
            },
            {
              0: 268435464,
              256: 8192,
              512: 270532608,
              768: 270540808,
              1024: 268443648,
              1280: 2097152,
              1536: 2097160,
              1792: 268435456,
              2048: 0,
              2304: 268443656,
              2560: 2105344,
              2816: 8,
              3072: 270532616,
              3328: 2105352,
              3584: 8200,
              3840: 270540800,
              128: 270532608,
              384: 270540808,
              640: 8,
              896: 2097152,
              1152: 2105352,
              1408: 268435464,
              1664: 268443648,
              1920: 8200,
              2176: 2097160,
              2432: 8192,
              2688: 268443656,
              2944: 270532616,
              3200: 0,
              3456: 270540800,
              3712: 2105344,
              3968: 268435456,
              4096: 268443648,
              4352: 270532616,
              4608: 270540808,
              4864: 8200,
              5120: 2097152,
              5376: 268435456,
              5632: 268435464,
              5888: 2105344,
              6144: 2105352,
              6400: 0,
              6656: 8,
              6912: 270532608,
              7168: 8192,
              7424: 268443656,
              7680: 270540800,
              7936: 2097160,
              4224: 8,
              4480: 2105344,
              4736: 2097152,
              4992: 268435464,
              5248: 268443648,
              5504: 8200,
              5760: 270540808,
              6016: 270532608,
              6272: 270540800,
              6528: 270532616,
              6784: 8192,
              7040: 2105352,
              7296: 2097160,
              7552: 0,
              7808: 268435456,
              8064: 268443656
            },
            {
              0: 1048576,
              16: 33555457,
              32: 1024,
              48: 1049601,
              64: 34604033,
              80: 0,
              96: 1,
              112: 34603009,
              128: 33555456,
              144: 1048577,
              160: 33554433,
              176: 34604032,
              192: 34603008,
              208: 1025,
              224: 1049600,
              240: 33554432,
              8: 34603009,
              24: 0,
              40: 33555457,
              56: 34604032,
              72: 1048576,
              88: 33554433,
              104: 33554432,
              120: 1025,
              136: 1049601,
              152: 33555456,
              168: 34603008,
              184: 1048577,
              200: 1024,
              216: 34604033,
              232: 1,
              248: 1049600,
              256: 33554432,
              272: 1048576,
              288: 33555457,
              304: 34603009,
              320: 1048577,
              336: 33555456,
              352: 34604032,
              368: 1049601,
              384: 1025,
              400: 34604033,
              416: 1049600,
              432: 1,
              448: 0,
              464: 34603008,
              480: 33554433,
              496: 1024,
              264: 1049600,
              280: 33555457,
              296: 34603009,
              312: 1,
              328: 33554432,
              344: 1048576,
              360: 1025,
              376: 34604032,
              392: 33554433,
              408: 34603008,
              424: 0,
              440: 34604033,
              456: 1049601,
              472: 1024,
              488: 33555456,
              504: 1048577
            },
            {
              0: 134219808,
              1: 131072,
              2: 134217728,
              3: 32,
              4: 131104,
              5: 134350880,
              6: 134350848,
              7: 2048,
              8: 134348800,
              9: 134219776,
              10: 133120,
              11: 134348832,
              12: 2080,
              13: 0,
              14: 134217760,
              15: 133152,
              2147483648: 2048,
              2147483649: 134350880,
              2147483650: 134219808,
              2147483651: 134217728,
              2147483652: 134348800,
              2147483653: 133120,
              2147483654: 133152,
              2147483655: 32,
              2147483656: 134217760,
              2147483657: 2080,
              2147483658: 131104,
              2147483659: 134350848,
              2147483660: 0,
              2147483661: 134348832,
              2147483662: 134219776,
              2147483663: 131072,
              16: 133152,
              17: 134350848,
              18: 32,
              19: 2048,
              20: 134219776,
              21: 134217760,
              22: 134348832,
              23: 131072,
              24: 0,
              25: 131104,
              26: 134348800,
              27: 134219808,
              28: 134350880,
              29: 133120,
              30: 2080,
              31: 134217728,
              2147483664: 131072,
              2147483665: 2048,
              2147483666: 134348832,
              2147483667: 133152,
              2147483668: 32,
              2147483669: 134348800,
              2147483670: 134217728,
              2147483671: 134219808,
              2147483672: 134350880,
              2147483673: 134217760,
              2147483674: 134219776,
              2147483675: 0,
              2147483676: 133120,
              2147483677: 2080,
              2147483678: 131104,
              2147483679: 134350848
            }
          ];
          var SBOX_MASK = [
            4160749569,
            528482304,
            33030144,
            2064384,
            129024,
            8064,
            504,
            2147483679
          ];
          var DES = C_algo.DES = BlockCipher.extend({
            _doReset: function() {
              var key = this._key;
              var keyWords = key.words;
              var keyBits = [];
              for (var i = 0; i < 56; i++) {
                var keyBitPos = PC1[i] - 1;
                keyBits[i] = keyWords[keyBitPos >>> 5] >>> 31 - keyBitPos % 32 & 1;
              }
              var subKeys = this._subKeys = [];
              for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
                var subKey = subKeys[nSubKey] = [];
                var bitShift = BIT_SHIFTS[nSubKey];
                for (var i = 0; i < 24; i++) {
                  subKey[i / 6 | 0] |= keyBits[(PC2[i] - 1 + bitShift) % 28] << 31 - i % 6;
                  subKey[4 + (i / 6 | 0)] |= keyBits[28 + (PC2[i + 24] - 1 + bitShift) % 28] << 31 - i % 6;
                }
                subKey[0] = subKey[0] << 1 | subKey[0] >>> 31;
                for (var i = 1; i < 7; i++) {
                  subKey[i] = subKey[i] >>> (i - 1) * 4 + 3;
                }
                subKey[7] = subKey[7] << 5 | subKey[7] >>> 27;
              }
              var invSubKeys = this._invSubKeys = [];
              for (var i = 0; i < 16; i++) {
                invSubKeys[i] = subKeys[15 - i];
              }
            },
            encryptBlock: function(M, offset) {
              this._doCryptBlock(M, offset, this._subKeys);
            },
            decryptBlock: function(M, offset) {
              this._doCryptBlock(M, offset, this._invSubKeys);
            },
            _doCryptBlock: function(M, offset, subKeys) {
              this._lBlock = M[offset];
              this._rBlock = M[offset + 1];
              exchangeLR.call(this, 4, 252645135);
              exchangeLR.call(this, 16, 65535);
              exchangeRL.call(this, 2, 858993459);
              exchangeRL.call(this, 8, 16711935);
              exchangeLR.call(this, 1, 1431655765);
              for (var round = 0; round < 16; round++) {
                var subKey = subKeys[round];
                var lBlock = this._lBlock;
                var rBlock = this._rBlock;
                var f = 0;
                for (var i = 0; i < 8; i++) {
                  f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
                }
                this._lBlock = rBlock;
                this._rBlock = lBlock ^ f;
              }
              var t = this._lBlock;
              this._lBlock = this._rBlock;
              this._rBlock = t;
              exchangeLR.call(this, 1, 1431655765);
              exchangeRL.call(this, 8, 16711935);
              exchangeRL.call(this, 2, 858993459);
              exchangeLR.call(this, 16, 65535);
              exchangeLR.call(this, 4, 252645135);
              M[offset] = this._lBlock;
              M[offset + 1] = this._rBlock;
            },
            keySize: 64 / 32,
            ivSize: 64 / 32,
            blockSize: 64 / 32
          });
          function exchangeLR(offset, mask2) {
            var t = (this._lBlock >>> offset ^ this._rBlock) & mask2;
            this._rBlock ^= t;
            this._lBlock ^= t << offset;
          }
          function exchangeRL(offset, mask2) {
            var t = (this._rBlock >>> offset ^ this._lBlock) & mask2;
            this._lBlock ^= t;
            this._rBlock ^= t << offset;
          }
          C.DES = BlockCipher._createHelper(DES);
          var TripleDES = C_algo.TripleDES = BlockCipher.extend({
            _doReset: function() {
              var key = this._key;
              var keyWords = key.words;
              this._des1 = DES.createEncryptor(WordArray.create(keyWords.slice(0, 2)));
              this._des2 = DES.createEncryptor(WordArray.create(keyWords.slice(2, 4)));
              this._des3 = DES.createEncryptor(WordArray.create(keyWords.slice(4, 6)));
            },
            encryptBlock: function(M, offset) {
              this._des1.encryptBlock(M, offset);
              this._des2.decryptBlock(M, offset);
              this._des3.encryptBlock(M, offset);
            },
            decryptBlock: function(M, offset) {
              this._des3.decryptBlock(M, offset);
              this._des2.encryptBlock(M, offset);
              this._des1.decryptBlock(M, offset);
            },
            keySize: 192 / 32,
            ivSize: 64 / 32,
            blockSize: 64 / 32
          });
          C.TripleDES = BlockCipher._createHelper(TripleDES);
        })();
        return CryptoJS2.TripleDES;
      });
    }
  });

  // node_modules/crypto-js/rc4.js
  var require_rc4 = __commonJS({
    "node_modules/crypto-js/rc4.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var StreamCipher = C_lib.StreamCipher;
          var C_algo = C.algo;
          var RC4 = C_algo.RC4 = StreamCipher.extend({
            _doReset: function() {
              var key = this._key;
              var keyWords = key.words;
              var keySigBytes = key.sigBytes;
              var S = this._S = [];
              for (var i = 0; i < 256; i++) {
                S[i] = i;
              }
              for (var i = 0, j = 0; i < 256; i++) {
                var keyByteIndex = i % keySigBytes;
                var keyByte = keyWords[keyByteIndex >>> 2] >>> 24 - keyByteIndex % 4 * 8 & 255;
                j = (j + S[i] + keyByte) % 256;
                var t = S[i];
                S[i] = S[j];
                S[j] = t;
              }
              this._i = this._j = 0;
            },
            _doProcessBlock: function(M, offset) {
              M[offset] ^= generateKeystreamWord.call(this);
            },
            keySize: 256 / 32,
            ivSize: 0
          });
          function generateKeystreamWord() {
            var S = this._S;
            var i = this._i;
            var j = this._j;
            var keystreamWord = 0;
            for (var n = 0; n < 4; n++) {
              i = (i + 1) % 256;
              j = (j + S[i]) % 256;
              var t = S[i];
              S[i] = S[j];
              S[j] = t;
              keystreamWord |= S[(S[i] + S[j]) % 256] << 24 - n * 8;
            }
            this._i = i;
            this._j = j;
            return keystreamWord;
          }
          C.RC4 = StreamCipher._createHelper(RC4);
          var RC4Drop = C_algo.RC4Drop = RC4.extend({
            /**
             * Configuration options.
             *
             * @property {number} drop The number of keystream words to drop. Default 192
             */
            cfg: RC4.cfg.extend({
              drop: 192
            }),
            _doReset: function() {
              RC4._doReset.call(this);
              for (var i = this.cfg.drop; i > 0; i--) {
                generateKeystreamWord.call(this);
              }
            }
          });
          C.RC4Drop = StreamCipher._createHelper(RC4Drop);
        })();
        return CryptoJS2.RC4;
      });
    }
  });

  // node_modules/crypto-js/rabbit.js
  var require_rabbit = __commonJS({
    "node_modules/crypto-js/rabbit.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var StreamCipher = C_lib.StreamCipher;
          var C_algo = C.algo;
          var S = [];
          var C_ = [];
          var G = [];
          var Rabbit = C_algo.Rabbit = StreamCipher.extend({
            _doReset: function() {
              var K = this._key.words;
              var iv = this.cfg.iv;
              for (var i = 0; i < 4; i++) {
                K[i] = (K[i] << 8 | K[i] >>> 24) & 16711935 | (K[i] << 24 | K[i] >>> 8) & 4278255360;
              }
              var X = this._X = [
                K[0],
                K[3] << 16 | K[2] >>> 16,
                K[1],
                K[0] << 16 | K[3] >>> 16,
                K[2],
                K[1] << 16 | K[0] >>> 16,
                K[3],
                K[2] << 16 | K[1] >>> 16
              ];
              var C2 = this._C = [
                K[2] << 16 | K[2] >>> 16,
                K[0] & 4294901760 | K[1] & 65535,
                K[3] << 16 | K[3] >>> 16,
                K[1] & 4294901760 | K[2] & 65535,
                K[0] << 16 | K[0] >>> 16,
                K[2] & 4294901760 | K[3] & 65535,
                K[1] << 16 | K[1] >>> 16,
                K[3] & 4294901760 | K[0] & 65535
              ];
              this._b = 0;
              for (var i = 0; i < 4; i++) {
                nextState.call(this);
              }
              for (var i = 0; i < 8; i++) {
                C2[i] ^= X[i + 4 & 7];
              }
              if (iv) {
                var IV = iv.words;
                var IV_0 = IV[0];
                var IV_1 = IV[1];
                var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
                var i2 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
                var i1 = i0 >>> 16 | i2 & 4294901760;
                var i3 = i2 << 16 | i0 & 65535;
                C2[0] ^= i0;
                C2[1] ^= i1;
                C2[2] ^= i2;
                C2[3] ^= i3;
                C2[4] ^= i0;
                C2[5] ^= i1;
                C2[6] ^= i2;
                C2[7] ^= i3;
                for (var i = 0; i < 4; i++) {
                  nextState.call(this);
                }
              }
            },
            _doProcessBlock: function(M, offset) {
              var X = this._X;
              nextState.call(this);
              S[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
              S[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
              S[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
              S[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
              for (var i = 0; i < 4; i++) {
                S[i] = (S[i] << 8 | S[i] >>> 24) & 16711935 | (S[i] << 24 | S[i] >>> 8) & 4278255360;
                M[offset + i] ^= S[i];
              }
            },
            blockSize: 128 / 32,
            ivSize: 64 / 32
          });
          function nextState() {
            var X = this._X;
            var C2 = this._C;
            for (var i = 0; i < 8; i++) {
              C_[i] = C2[i];
            }
            C2[0] = C2[0] + 1295307597 + this._b | 0;
            C2[1] = C2[1] + 3545052371 + (C2[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
            C2[2] = C2[2] + 886263092 + (C2[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
            C2[3] = C2[3] + 1295307597 + (C2[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
            C2[4] = C2[4] + 3545052371 + (C2[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
            C2[5] = C2[5] + 886263092 + (C2[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
            C2[6] = C2[6] + 1295307597 + (C2[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
            C2[7] = C2[7] + 3545052371 + (C2[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
            this._b = C2[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
            for (var i = 0; i < 8; i++) {
              var gx = X[i] + C2[i];
              var ga = gx & 65535;
              var gb = gx >>> 16;
              var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
              var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
              G[i] = gh ^ gl;
            }
            X[0] = G[0] + (G[7] << 16 | G[7] >>> 16) + (G[6] << 16 | G[6] >>> 16) | 0;
            X[1] = G[1] + (G[0] << 8 | G[0] >>> 24) + G[7] | 0;
            X[2] = G[2] + (G[1] << 16 | G[1] >>> 16) + (G[0] << 16 | G[0] >>> 16) | 0;
            X[3] = G[3] + (G[2] << 8 | G[2] >>> 24) + G[1] | 0;
            X[4] = G[4] + (G[3] << 16 | G[3] >>> 16) + (G[2] << 16 | G[2] >>> 16) | 0;
            X[5] = G[5] + (G[4] << 8 | G[4] >>> 24) + G[3] | 0;
            X[6] = G[6] + (G[5] << 16 | G[5] >>> 16) + (G[4] << 16 | G[4] >>> 16) | 0;
            X[7] = G[7] + (G[6] << 8 | G[6] >>> 24) + G[5] | 0;
          }
          C.Rabbit = StreamCipher._createHelper(Rabbit);
        })();
        return CryptoJS2.Rabbit;
      });
    }
  });

  // node_modules/crypto-js/rabbit-legacy.js
  var require_rabbit_legacy = __commonJS({
    "node_modules/crypto-js/rabbit-legacy.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        } else {
          factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        (function() {
          var C = CryptoJS2;
          var C_lib = C.lib;
          var StreamCipher = C_lib.StreamCipher;
          var C_algo = C.algo;
          var S = [];
          var C_ = [];
          var G = [];
          var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
            _doReset: function() {
              var K = this._key.words;
              var iv = this.cfg.iv;
              var X = this._X = [
                K[0],
                K[3] << 16 | K[2] >>> 16,
                K[1],
                K[0] << 16 | K[3] >>> 16,
                K[2],
                K[1] << 16 | K[0] >>> 16,
                K[3],
                K[2] << 16 | K[1] >>> 16
              ];
              var C2 = this._C = [
                K[2] << 16 | K[2] >>> 16,
                K[0] & 4294901760 | K[1] & 65535,
                K[3] << 16 | K[3] >>> 16,
                K[1] & 4294901760 | K[2] & 65535,
                K[0] << 16 | K[0] >>> 16,
                K[2] & 4294901760 | K[3] & 65535,
                K[1] << 16 | K[1] >>> 16,
                K[3] & 4294901760 | K[0] & 65535
              ];
              this._b = 0;
              for (var i = 0; i < 4; i++) {
                nextState.call(this);
              }
              for (var i = 0; i < 8; i++) {
                C2[i] ^= X[i + 4 & 7];
              }
              if (iv) {
                var IV = iv.words;
                var IV_0 = IV[0];
                var IV_1 = IV[1];
                var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
                var i2 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
                var i1 = i0 >>> 16 | i2 & 4294901760;
                var i3 = i2 << 16 | i0 & 65535;
                C2[0] ^= i0;
                C2[1] ^= i1;
                C2[2] ^= i2;
                C2[3] ^= i3;
                C2[4] ^= i0;
                C2[5] ^= i1;
                C2[6] ^= i2;
                C2[7] ^= i3;
                for (var i = 0; i < 4; i++) {
                  nextState.call(this);
                }
              }
            },
            _doProcessBlock: function(M, offset) {
              var X = this._X;
              nextState.call(this);
              S[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
              S[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
              S[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
              S[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
              for (var i = 0; i < 4; i++) {
                S[i] = (S[i] << 8 | S[i] >>> 24) & 16711935 | (S[i] << 24 | S[i] >>> 8) & 4278255360;
                M[offset + i] ^= S[i];
              }
            },
            blockSize: 128 / 32,
            ivSize: 64 / 32
          });
          function nextState() {
            var X = this._X;
            var C2 = this._C;
            for (var i = 0; i < 8; i++) {
              C_[i] = C2[i];
            }
            C2[0] = C2[0] + 1295307597 + this._b | 0;
            C2[1] = C2[1] + 3545052371 + (C2[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
            C2[2] = C2[2] + 886263092 + (C2[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
            C2[3] = C2[3] + 1295307597 + (C2[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
            C2[4] = C2[4] + 3545052371 + (C2[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
            C2[5] = C2[5] + 886263092 + (C2[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
            C2[6] = C2[6] + 1295307597 + (C2[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
            C2[7] = C2[7] + 3545052371 + (C2[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
            this._b = C2[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
            for (var i = 0; i < 8; i++) {
              var gx = X[i] + C2[i];
              var ga = gx & 65535;
              var gb = gx >>> 16;
              var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
              var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
              G[i] = gh ^ gl;
            }
            X[0] = G[0] + (G[7] << 16 | G[7] >>> 16) + (G[6] << 16 | G[6] >>> 16) | 0;
            X[1] = G[1] + (G[0] << 8 | G[0] >>> 24) + G[7] | 0;
            X[2] = G[2] + (G[1] << 16 | G[1] >>> 16) + (G[0] << 16 | G[0] >>> 16) | 0;
            X[3] = G[3] + (G[2] << 8 | G[2] >>> 24) + G[1] | 0;
            X[4] = G[4] + (G[3] << 16 | G[3] >>> 16) + (G[2] << 16 | G[2] >>> 16) | 0;
            X[5] = G[5] + (G[4] << 8 | G[4] >>> 24) + G[3] | 0;
            X[6] = G[6] + (G[5] << 16 | G[5] >>> 16) + (G[4] << 16 | G[4] >>> 16) | 0;
            X[7] = G[7] + (G[6] << 8 | G[6] >>> 24) + G[5] | 0;
          }
          C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
        })();
        return CryptoJS2.RabbitLegacy;
      });
    }
  });

  // node_modules/crypto-js/index.js
  var require_crypto_js = __commonJS({
    "node_modules/crypto-js/index.js"(exports, module) {
      (function(root, factory, undef) {
        if (typeof exports === "object") {
          module.exports = exports = factory(require_core(), require_x64_core(), require_lib_typedarrays(), require_enc_utf16(), require_enc_base64(), require_md5(), require_sha1(), require_sha256(), require_sha224(), require_sha512(), require_sha384(), require_sha3(), require_ripemd160(), require_hmac(), require_pbkdf2(), require_evpkdf(), require_cipher_core(), require_mode_cfb(), require_mode_ctr(), require_mode_ctr_gladman(), require_mode_ofb(), require_mode_ecb(), require_pad_ansix923(), require_pad_iso10126(), require_pad_iso97971(), require_pad_zeropadding(), require_pad_nopadding(), require_format_hex(), require_aes(), require_tripledes(), require_rc4(), require_rabbit(), require_rabbit_legacy());
        } else if (typeof define === "function" && define.amd) {
          define(["./core", "./x64-core", "./lib-typedarrays", "./enc-utf16", "./enc-base64", "./md5", "./sha1", "./sha256", "./sha224", "./sha512", "./sha384", "./sha3", "./ripemd160", "./hmac", "./pbkdf2", "./evpkdf", "./cipher-core", "./mode-cfb", "./mode-ctr", "./mode-ctr-gladman", "./mode-ofb", "./mode-ecb", "./pad-ansix923", "./pad-iso10126", "./pad-iso97971", "./pad-zeropadding", "./pad-nopadding", "./format-hex", "./aes", "./tripledes", "./rc4", "./rabbit", "./rabbit-legacy"], factory);
        } else {
          root.CryptoJS = factory(root.CryptoJS);
        }
      })(exports, function(CryptoJS2) {
        return CryptoJS2;
      });
    }
  });

  // chinaUnicom.source.js
  var CryptoJS = require_crypto_js();
  var VERSION = "v1.2.1-loon.1";
  var STORE_KEY = "cu_accounts_v2";
  var DEVICE_KEY = "cu_device_ids_v2";
  var UA = "Dalvik/2.1.0 (Linux; U; Android 12; Mi 10 Pro MIUI/21.11.3);unicom{version:android@11.0802}";
  var H5_UA = "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/143.0.7499.146 Mobile Safari/537.36; unicom{version:android@11.0802,desmobile:0};devicetype{deviceBrand:Xiaomi,deviceModel:MI 8}";
  var AITING_JF_UA = "Mozilla/5.0 (Linux; Android 12; Redmi K30 Pro Build/SKQ1.220303.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.159 Mobile Safari/537.36 WoReaderApp/Android";
  var AITING_AES_IV = "16-Bytes--String";
  var ADDREADTIME_KEY = "UNS#READDAY39COM";
  var SEC_APP_UA = "ChinaUnicom4.x/12.3.1 (com.chinaunicom.mobilebusiness; build:77; iOS 16.6.0) Alamofire/4.7.3 unicom{version:iphone_c@12.0301}";
  var WOSTORE_SIGN_CODE = "Points_Sign_2507";
  var WOSTORE_LOGIN_ACTIVITY_ID = "HD2026033000125";
  var WOSTORE_ACTIVITY_CODES = ["Points_Obtain_2507", "Points_Obtain_2506", "Points_Obtain_2505", "Points_Obtain_2504"];
  var WOSTORE_LOTTERY_CODES = ["HD2026062200218", "Lottery_251201"];
  var WOSTORE_POINTS_ACT_CODE = "Points_Exchange_2507";
  var WOSTORE_GOODS_1 = "2026031001";
  var WOSTORE_GOODS_10 = "2026031010";
  var WOSTORE_STOP_PRIZE = "7天体验卡";
  var ISLAND_ACTIVITY_ID = "NDA=";
  var ISLAND_CLOUD_TTL_HOURS = 12;
  var ISLAND_MGTV_BASE = "https://mgcact.api.mgtv.com";
  var ISLAND_MGTV_TEMPLATE_ID = "2104457184351981568";
  var ISLAND_MGTV_IMG_FID = "";
  var ISLAND_TEMP_PHOTO_PREFIX = "cmfface_";
  var ISLAND_PRIZE_KEY = "cu_island_prizes_v1";
  var ISLAND_ACT_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) LianTongYunPan/6.0.0 (iPhone; iOS 16.6)";

  var CLOUD_TOKEN_KEY = "cu_cloud_token_v1";
  var HOMETOWN_MOBILE_KEY = "CBWGjFHjZdhTf7h8";
  var HOMETOWN_AES_IV = "wNSOYIB1k1DjY5lA";
  var HOMETOWN_LOTTERY_SECRET = "s8Hf3LqP9xN2vM5bR7tY1wZ4cA6eG0K";
  var HOMETOWN_OPEN_ACTIVITY_ID = "MjU=";
  var HOMETOWN_LOTTERY_ACTIVITY_ID = "MzA=";
  var HOMETOWN_MATERIAL_B64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxD/2Q==";
  var DEFAULTS = {
    mode: "all",
    enableSign: true,
    enableTtlxj: true,
    enableTtxc: true,
    enableLtzf: true,
    enableWoread: false,
    enableSecurity: true,
    enableCloud: true,
    enableMarket: true,
    enableAiting: true,
    enableWostore: true,
    enableRegional: true,
    enableNotify: true,
    // v1.1.2 已移除已下架的浇水任务
    marketWater: false,
    marketTask: true,
    marketMember: true,
    marketDraw: true,
    marketClaim: true,
    grabCoupon: false,
    grabAmount: "5",
    ahFriday: false,
    ahAmount: "",
    queryOnly: false,
    requestNode: "",
    provinceOverride: "",
    clearAllAccounts: false,
    cloudImageFid: "",
    cloudUploadName: "8648",
    hometownEnable: false,
    ttxcGarbageWait: 28,
    ttxcGrowMax: 20,
    wostoreMaxDraw: 1
  };
  var isRequest = typeof $request !== "undefined";
  var scriptName = !isRequest && typeof $script !== "undefined" ? String($script.name || "") : "";
  var isGrabJob = /抢兑/.test(scriptName);
  var isAhJob = /安徽超级星期五/.test(scriptName);
  var arg = typeof $argument === "object" && $argument ? $argument : {};
  var bool = (v, d) => v === void 0 || v === null || v === "" ? d : String(v).toLowerCase() === "true";
  var num = (v, d) => Number.isFinite(Number(v)) ? Number(v) : d;
  var CFG = {
    mode: isGrabJob ? "sign" : isAhJob ? "regional" : arg.mode || DEFAULTS.mode,
    enableSign: bool(arg.enableSign, DEFAULTS.enableSign),
    enableTtlxj: bool(arg.enableTtlxj, DEFAULTS.enableTtlxj),
    enableTtxc: bool(arg.enableTtxc, DEFAULTS.enableTtxc),
    enableLtzf: bool(arg.enableLtzf, DEFAULTS.enableLtzf),
    enableWoread: bool(arg.enableWoread, DEFAULTS.enableWoread),
    enableSecurity: bool(arg.enableSecurity, DEFAULTS.enableSecurity),
    enableCloud: bool(arg.enableCloud, DEFAULTS.enableCloud),
    enableMarket: bool(arg.enableMarket, DEFAULTS.enableMarket),
    enableAiting: bool(arg.enableAiting, DEFAULTS.enableAiting),
    enableWostore: bool(arg.enableWostore, DEFAULTS.enableWostore),
    enableRegional: bool(arg.enableRegional, DEFAULTS.enableRegional),
    enableNotify: bool(arg.enableNotify, DEFAULTS.enableNotify),
    marketWater: bool(arg.marketWater, DEFAULTS.marketWater),
    marketTask: bool(arg.marketTask, DEFAULTS.marketTask),
    marketMember: bool(arg.marketMember, DEFAULTS.marketMember),
    marketDraw: bool(arg.marketDraw, DEFAULTS.marketDraw),
    marketClaim: bool(arg.marketClaim, DEFAULTS.marketClaim),
    grabCoupon: isGrabJob || bool(arg.grabCoupon, DEFAULTS.grabCoupon),
    grabAmount: String(arg.grabAmount || DEFAULTS.grabAmount),
    ahFriday: isAhJob || bool(arg.ahFriday, DEFAULTS.ahFriday),
    ahAmount: String(arg.ahAmount || DEFAULTS.ahAmount),
    queryOnly: bool(arg.queryOnly, DEFAULTS.queryOnly),
    requestNode: String(arg.requestNode || DEFAULTS.requestNode).trim(),
    provinceOverride: String(arg.provinceOverride || DEFAULTS.provinceOverride).trim(),
    clearAllAccounts: bool(arg["清空全部账号"] !== void 0 ? arg["清空全部账号"] : arg.clearAllAccounts, DEFAULTS.clearAllAccounts),
    cloudImageFid: String(arg.cloudImageFid || DEFAULTS.cloudImageFid).trim(),
    cloudUploadName: String(arg.cloudUploadName || DEFAULTS.cloudUploadName).trim(),
    hometownEnable: bool(arg.hometownEnable, DEFAULTS.hometownEnable),
    ttxcGarbageWait: num(arg.ttxcGarbageWait, DEFAULTS.ttxcGarbageWait),
    ttxcGrowMax: num(arg.ttxcGrowMax, DEFAULTS.ttxcGrowMax),
    wostoreMaxDraw: num(arg.wostoreMaxDraw, DEFAULTS.wostoreMaxDraw)
  };
  function readJSON(key, fallback) {
    try {
      return JSON.parse($persistentStore.read(key) || "");
    } catch (_) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    return $persistentStore.write(JSON.stringify(value), key);
  }
  function safeJSON(text, fallback = {}) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return fallback;
    }
  }
  function safeInt(v, d = 0) {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : d;
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function nowMs() {
    return Date.now();
  }
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function dateTime(d = /* @__PURE__ */ new Date()) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }
  function compactTime(d = /* @__PURE__ */ new Date()) {
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  }
  function today() {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function randomString(len, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  function uuid32(upper = false) {
    const s = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 3 | 8).toString(16);
    });
    return upper ? s.toUpperCase() : s;
  }
  function mask(s) {
    s = String(s || "");
    if (/^\d{11}$/.test(s)) return `${s.slice(0, 3)}****${s.slice(7)}`;
    if (s.length >= 8) return `${s.slice(0, 4)}******${s.slice(-4)}`;
    return "****";
  }
  function form(obj) {
    return Object.keys(obj || {}).filter((k) => obj[k] !== void 0 && obj[k] !== null).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(obj[k]))}`).join("&");
  }
  function parseForm(s) {
    const out = {};
    String(s || "").split("&").forEach((p) => {
      const i = p.indexOf("=");
      if (i >= 0) out[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1).replace(/\+/g, " "));
    });
    return out;
  }
  function qs(url) {
    const q = String(url || "").split("?")[1] || "";
    return parseForm(q);
  }
  function b64Utf8(s) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(String(s)));
  }
  function b64urlDecode(s) {
    s = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return CryptoJS.enc.Base64.parse(s).toString(CryptoJS.enc.Utf8);
  }
  function md5(s) {
    return CryptoJS.MD5(String(s)).toString();
  }
  function sha256HmacHex(msg, key) {
    return CryptoJS.HmacSHA256(String(msg), String(key)).toString(CryptoJS.enc.Hex);
  }
  function sha256HmacB64(msg, key) {
    return CryptoJS.HmacSHA256(String(msg), String(key)).toString(CryptoJS.enc.Base64);
  }
  function aesCbcB64(text, key, iv, hexThenB64 = false, upperHex = false) {    const enc = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(String(text)), CryptoJS.enc.Utf8.parse(String(key)), { iv: CryptoJS.enc.Utf8.parse(String(iv)), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    if (!hexThenB64) return enc.ciphertext.toString(CryptoJS.enc.Base64);
    let h = enc.ciphertext.toString(CryptoJS.enc.Hex);
    if (upperHex) h = h.toUpperCase();
    return b64Utf8(h);
  }
  function aesCbcDecryptB64(b64, key, iv) {
    const dec = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(String(b64)) }, CryptoJS.enc.Utf8.parse(String(key)), { iv: CryptoJS.enc.Utf8.parse(String(iv)), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    return dec.toString(CryptoJS.enc.Utf8);
  }
  function b64ToBytes(b64) {
    const wa = CryptoJS.enc.Base64.parse(String(b64));
    const out = new Uint8Array(wa.sigBytes);
    for (let i = 0; i < wa.sigBytes; i++) out[i] = wa.words[i >>> 2] >>> (24 - i % 4 * 8) & 255;
    return out;
  }
  function asciiBytes(str) {
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
    return out;
  }
  function concatBytes(list) {
    let len = 0;
    for (const a of list) len += a.length;
    const out = new Uint8Array(len);
    let off = 0;
    for (const a of list) {
      out.set(a, off);
      off += a.length;
    }
    return out;
  }
  function responseMessage(x) {
    if (!x || typeof x !== "object") return String(x || "\u63A5\u53E3\u8FD4\u56DE\u5F02\u5E38");
    const s = x.meta && typeof x.meta === "object" ? x.meta : x;
    const detail = s.message || s.msg || s.desc || s.resultMsg || s.resultDesc || s.rsp_desc || s.statusDesc || s.prizeName || s.prizeNameRed;
    if (detail) return String(detail);
    const code = s.code !== void 0 ? s.code : s.resultCode !== void 0 ? s.resultCode : s.rsp_code;
    if (String(code) === "0000" || String(code) === "0" || String(code) === "200") return "成功";
    return code !== void 0 ? `接口返回 code=${code}` : "接口返回异常";
  }
  function getHeader(headers, name) {
    const k = Object.keys(headers || {}).find((x) => x.toLowerCase() === name.toLowerCase());
    return k ? headers[k] : "";
  }
  function findNestedValue(value, names, depth = 0) {
    if (depth > 5 || value === null || value === void 0) return "";
    if (typeof value !== "object") return "";
    for (const key of Object.keys(value)) {
      if (names.some((name) => key.toLowerCase() === name.toLowerCase())) {
        const found = value[key];
        if (found !== null && found !== void 0 && typeof found !== "object") return String(found);
      }
    }
    for (const key of Object.keys(value)) {
      const found = findNestedValue(value[key], names, depth + 1);
      if (found) return found;
    }
    return "";
  }
  function parseCapturedBody(raw) {
    const text = String(raw || "").trim();
    if (!text) return {};
    const json = safeJSON(text, null);
    if (json && typeof json === "object") return json;
    const parsed = parseForm(text);
    if (parsed.token_online || parsed.tokenOnline || parsed.appId || parsed.appid || parsed.app_id) return parsed;
    // v1.1.2: 兼容联通App v12.14+ Base64编码body
    try {
      const b64 = b64urlDecode(text);
      if (b64 && b64 !== text && b64.includes("=")) {
        const b64parsed = parseForm(b64);
        if (Object.keys(b64parsed).length) return b64parsed;
        const b64json = safeJSON(b64, null);
        if (b64json && typeof b64json === "object") return b64json;
      }
    } catch (_) {}
    try {
      const decoded = decodeURIComponent(text);
      const decodedJSON = safeJSON(decoded, null);
      if (decodedJSON && typeof decodedJSON === "object") return decodedJSON;
      return parseForm(decoded);
    } catch (_) {
      return {};
    }
  }
  function http(method, url, options = {}) {
    const run = (attempt) => new Promise((resolve) => {
      const params = { url, timeout: options.timeout || 15e3, headers: options.headers || {}, "auto-redirect": options.redirect !== false, "auto-cookie": options.cookie !== false, alpn: options.alpn || "h1" };
      if (CFG.requestNode) params.node = CFG.requestNode;
      if (options.body !== void 0) params.body = options.body;
      const fn = $httpClient[String(method).toLowerCase()] || $httpClient.get;
      fn(params, async (error, response, data) => {
        const body = typeof data === "string" ? data : "";
        const result = { error: error || null, status: response && response.status || 0, headers: response && response.headers || {}, body, json: safeJSON(body, {}) };
        if (error && attempt < (options.retries === void 0 ? 2 : options.retries)) {
          await sleep(500 * (attempt + 1));
          resolve(run(attempt + 1));
          return;
        }
        resolve(result);
      });
    });
    return run(0);
  }
  async function captureAccount() {
    if (CFG.clearAllAccounts) {
      const accounts = readJSON(STORE_KEY, []);
      writeJSON(STORE_KEY, []);
      if (accounts.length) {
        console.log(`[中国联通] 已清空全部 ${accounts.length} 个账号`);
        $notification.post("中国联通", "全部账号已清空", `已删除 ${accounts.length} 个账号，请关闭“清空全部账号”开关后重新登录抓取。`);
      }
      $done({});
      return;
    }
    const body = parseCapturedBody($request.body || "");
    const query = qs($request.url);
    const cookie = getHeader($request.headers, "Cookie");
    const cookieObj = parseForm(cookie.replace(/;\s*/g, "&"));
    const token = String(findNestedValue(body, ["token_online", "tokenOnline"]) || query.token_online || query.tokenOnline || cookieObj.token_online || cookieObj.tokenOnline || getHeader($request.headers, "token_online") || getHeader($request.headers, "tokenOnline") || "").trim();
    const appId = String(findNestedValue(body, ["appId", "appid", "app_id"]) || query.appId || query.appid || query.app_id || cookieObj.appId || cookieObj.appid || getHeader($request.headers, "appId") || getHeader($request.headers, "appid") || "").trim();
    if (!token) {
      const bodyType = String(getHeader($request.headers, "Content-Type") || "\u672A\u77E5");
      console.log(`[\u4E2D\u56FD\u8054\u901A] \u6293\u53D6\u89C4\u5219\u5DF2\u89E6\u53D1\uFF0C\u4F46\u672A\u5728\u8BF7\u6C42\u4E2D\u627E\u5230 token_online\uFF1BContent-Type=${bodyType}\uFF0CBodyLength=${String($request.body || "").length}`);
      $notification.post("\u4E2D\u56FD\u8054\u901A\u8D26\u53F7\u6293\u53D6\u5931\u8D25", "\u89C4\u5219\u5DF2\u89E6\u53D1\uFF0C\u4F46\u672A\u627E\u5230 token_online", `\u8BF7\u786E\u8BA4\u662F\u5728\u8054\u901A App \u4E2D\u201C\u9000\u51FA\u767B\u5F55\u2192\u91CD\u65B0\u767B\u5F55\u201D\u3002
\u8BF7\u6C42\u7C7B\u578B\uFF1A${bodyType}
\u8BF7\u6C42\u4F53\u957F\u5EA6\uFF1A${String($request.body || "").length}`);
      $done({});
      return;
    }
    const list = readJSON(STORE_KEY, []);
    // 抓包阶段只追加不弹通知：token 每次登录都不同，直接追加或更新
    // 真正的去重交由登录成功后（onLine 返回 mobile）按手机号合并
    const index = list.findIndex((x) => x.tokenOnline === token);
    const item = { tokenOnline: token, appId, updatedAt: dateTime(), mobile: index >= 0 ? list[index].mobile || "" : "" };
    if (index < 0) {
      list.push(item);
    } else {
      list[index] = { ...list[index], ...item };
    }
    writeJSON(STORE_KEY, list);
    console.log(`[\u4E2D\u56FD\u8054\u901A] \u5DF2\u4FDD\u5B58\u8D26\u53F7 (${list.length}\u4E2A)\uFF0CToken=${mask(token)}\uFF0CAppId=${mask(appId)}`);
    $done({});
  }
  var UserService = class {
    constructor(index, saved) {
      this.index = index;
      this.saved = saved;
      this.tokenOnline = saved.tokenOnline || "";
      this.appId = saved.appId || "";
      this.mobile = saved.mobile || "";
      this.accountMobile = this.mobile;
      this.ecsToken = "";
      this.t3Token = "";
      this.privateToken = "";
      this.cityInfo = [];
      this.logs = [];
      this.notifyLogs = [];
      this.cookies = {};
      this.pendingClaims = {};
      const devices = readJSON(DEVICE_KEY, {});
      const key = this.appId || this.tokenOnline.slice(0, 20);
      const old = devices[key] || {};
      this.uuid = old.uuid || uuid32();
      this.unicomTokenId = old.unicomTokenId || uuid32();
      this.tokenIdCookie = old.tokenIdCookie || `chinaunicom-${uuid32(true)}`;
      devices[key] = { uuid: this.uuid, unicomTokenId: this.unicomTokenId, tokenIdCookie: this.tokenIdCookie };
      writeJSON(DEVICE_KEY, devices);
      this.cookieString = `TOKENID_COOKIE=${this.tokenIdCookie}; UNICOM_TOKENID=${this.unicomTokenId}; sdkuuid=${this.unicomTokenId}; token_online=${this.tokenOnline}${this.appId ? `; appId=${this.appId}` : ""}`;
    }
    log(msg, notify = false) {
      const line = `\u8D26\u53F7[${this.index}] ${msg}`;
      console.log(line);
      this.logs.push(String(msg));
      if (notify) this.notifyLogs.push(String(msg));
    }
    headers(extra = {}) {
      return { "User-Agent": UA, "Connection": "keep-alive", "Cookie": this.cookieString, ...extra };
    }
    async req(method, url, opt = {}) {
      const headers = this.headers(opt.headers || {});
      const r = await http(method, url, { ...opt, headers });
      if (r.error) this.log(`\u8BF7\u6C42\u5F02\u5E38 ${url}: ${r.error}`);
      else if (r.status >= 400) this.log(`\u8BF7\u6C42 ${url} \u8FD4\u56DE HTTP ${r.status}${r.body ? `：${String(r.body).slice(0, 180)}` : ""}`);
      return r;
    }
    async json(method, url, opt = {}) {
      const r = await this.req(method, url, opt);
      return r.json || {};
    }
    async postForm(url, data = {}, headers = {}, opt = {}) {
      return this.json("post", url, { ...opt, headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers }, body: form(data) });
    }
    async postJSON(url, data = {}, headers = {}, opt = {}) {
      return this.json("post", url, { ...opt, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data) });
    }
    async get(url, headers = {}, opt = {}) {
      return this.json("get", url, { ...opt, headers });
    }
    async login() {
      if (!this.tokenOnline) {
        this.log("\u7F3A\u5C11 token_online");
        return false;
      }
      const data = { isFirstInstall: "1", netWay: "Wifi", version: "android@11.0000", token_online: this.tokenOnline, provinceChanel: "general", deviceModel: "ALN-AL10", step: "dingshi", androidId: this.uuid.slice(0, 16), reqtime: nowMs() };
      if (this.appId) data.appId = this.appId;
      const r = await this.postForm("https://m.client.10010.com/mobileService/onLine.htm", data);
      if (String(r.code) === "0") {
        this.mobile = /^\d{11}$/.test(String(r.desmobile || "")) ? String(r.desmobile) : this.mobile;
        this.accountMobile = this.mobile;
        this.cityInfo = r.list || [];
        this.ecsToken = r.ecs_token || "";
        this.t3Token = r.t3_token || "";
        this.privateToken = r.private_token || "";
        this.cookieString += `; ecs_token=${this.ecsToken}; t3_token=${this.t3Token}`;
        const list = readJSON(STORE_KEY, []);
        // 按手机号去重：同一号码只保留一个账号。
        // 抓包阶段 token 每次登录都不同会产生多条相同号码记录，
        // 登录成功后拿到真实 mobile，这里合并成一条（当前 token），
        // 同时清理所有 mobile 为空的失效残留记录（旧 token 已过期）。
        if (this.mobile) {
          const same = [];
          for (let k = 0; k < list.length; k++) {
            if ((list[k].mobile && list[k].mobile === this.mobile) || (list[k].tokenOnline === this.tokenOnline)) same.push(k);
          }
          const base = { tokenOnline: this.tokenOnline, appId: this.appId, mobile: this.mobile, updatedAt: dateTime() };
          if (same.length) {
            // 合并同类记录，保留索引最小的一条
            const keep = same[0];
            const merged = [];
            for (let k = 0; k < list.length; k++) {
              if (k === keep) merged.push(base);
              else if (same.indexOf(k) === -1 && list[k].mobile) merged.push(list[k]);
              // 丢弃：same 中非 keep 的旧记录 + mobile 为空的孤儿记录
            }
            writeJSON(STORE_KEY, merged);
            this.index = keep + 1;
          } else {
            // 清理空 mobile 的孤儿记录后，再追加当前账号
            const cleaned = list.filter((x) => x.mobile);
            cleaned.push(base);
            writeJSON(STORE_KEY, cleaned);
            this.index = cleaned.length;
          }
        }
        this.log(`\u767B\u5F55\u6210\u529F ${mask(this.mobile)}`);
        await this.refreshCityInfo();
        return true;
      }
      this.log(`\u767B\u5F55\u5931\u8D25[${r.code}]: ${r.msg || ""}`, true);
      return false;
    }
    async refreshCityInfo() {
      if (CFG.provinceOverride) {
        this.cityInfo = [{ proName: CFG.provinceOverride, provinceName: CFG.provinceOverride }];
        return true;
      }
      const r = await this.postForm("https://m.client.10010.com/mobileService/business/get/getCity", {});
      if (String(r.code) === "200" && Array.isArray(r.list) && r.list.length) {
        this.cityInfo = r.list;
        return true;
      }
      return false;
    }
    async openPlat(toUrl) {
      const url = `https://m.client.10010.com/mobileService/openPlatform/openPlatLineNew.htm?${form({ to_url: toUrl })}`;
      const r = await this.req("get", url, { redirect: false });
      if (r.status !== 302) return null;
      const loc = getHeader(r.headers, "Location");
      const p = qs(loc);
      return p.ticket ? { ticket: p.ticket, type: p.type || "", loc } : null;
    }
    async queryRemain() {
      if (!this.ecsToken) return;
      const r = await this.get("https://m.client.10010.com/servicequerybusiness/balancenew/accountBalancenew.htm", { "Cookie": `ecs_token=${this.ecsToken}` });
      if (r.code === "0000") this.log(`\u8D44\u4EA7-\u8BDD\u8D39\uFF1A\u4F59\u989D ${r.curntbalancecust || "0.00"}\u5143\uFF0C\u5B9E\u65F6\u8BDD\u8D39 ${r.realfeecust || "0.00"}\u5143`, true);
    }
    async signTask() {
      this.log("==== \u9996\u9875\u7B7E\u5230 ====");
      await this.signTelephone(true);
      const state = await this.get(`https://activity.10010.com/sixPalaceGridTurntableLottery/signin/getContinuous?${form({ taskId: "", channel: "wode", imei: this.uuid })}`);
      if (state.code === "0000") {
        const signed = state.data && state.data.todayIsSignIn === "y";
        this.log(`\u4ECA\u5929${signed ? "\u5DF2" : "\u672A"}\u7B7E\u5230`, true);
        if (!signed && !CFG.queryOnly) {
          const s = await this.postForm("https://activity.10010.com/sixPalaceGridTurntableLottery/signin/daySign", {});
          this.log(s.code === "0000" || s.code === "0002" ? `\u7B7E\u5230\u6210\u529F\uFF1A${(s.data || {}).statusDesc || s.desc || "\u5B8C\u6210"}` : `\u7B7E\u5230\u5931\u8D25[${s.code}] ${s.desc || ""}`, true);
        }
      }
      await this.signMonth();
      if (!CFG.queryOnly) await this.signTasks();
      if (CFG.grabCoupon && !CFG.queryOnly) await this.signGrab();
      await this.signTelephone(false);
      await this.signRecords();
    }
    async signTelephone(initial) {
      const r = await this.postForm("https://act.10010.com/SigninApp/convert/getTelephone", {});
      if (r.status === "0000" && r.data) {
        const v = Number(r.data.telephone || 0);
        if (initial) this.signInitial = v;
        else this.log(`\u8BDD\u8D39\u7EA2\u5305\uFF1A\u603B\u989D ${v.toFixed(2)}\u5143\uFF0C\u672C\u6B21\u589E\u52A0 ${(v - (this.signInitial || v)).toFixed(2)}\u5143`, true);
        return v;
      }
      return null;
    }
    async signMonth() {
      const r = await this.get("https://activity.10010.com/sixPalaceGridTurntableLottery/floor/getMonthSign", { "Referer": "https://img.client.10010.com/" });
      const list = (r.data || {}).taskList || [];
      for (const t of list) {
        if (String(t.taskStatus) === "1" && !CFG.queryOnly) {
          const x = await this.get(`https://activity.10010.com/sixPalaceGridTurntableLottery/task/getTaskReward?${form({ taskId: t.taskId, taskType: "30", id: t.id })}`, { "Referer": "https://img.client.10010.com/" });
          this.log(`\u6708\u7B7E\u6709\u793C[${t.taskName || ""}]\uFF1A${responseMessage(x)}`, x.code === "0000");
          await sleep(800);
        }
      }
    }
    async signTasks() {
      for (let round = 0; round < 30; round++) {
        const r = await this.get("https://activity.10010.com/sixPalaceGridTurntableLottery/task/taskList?type=2", { "Referer": "https://img.client.10010.com/" });
        if (r.code !== "0000") break;
        const all = [...(r.data || {}).taskList || [], ...((r.data || {}).tagList || []).flatMap((x) => x.taskDTOList || [])];
        const todo = all.find((t) => t.taskState === "1" && t.taskType === "5");
        const claim = all.find((t) => t.taskState === "0");
        if (todo) {
          if (todo.url && /^http/.test(todo.url)) await this.req("get", todo.url, {});
          await sleep(3e3);
          const orderId = uuid32(true);
          await this.postForm("https://m.client.10010.com/taskcallback/topstories/gettaskip", { mobile: this.accountMobile, orderId });
          const x = await this.get(`https://activity.10010.com/sixPalaceGridTurntableLottery/task/completeTask?${form({ taskId: todo.id, orderId, systemCode: "QDQD" })}`);
          this.log(`\u4EFB\u52A1[${todo.taskName}]\uFF1A${responseMessage(x)}`);
          continue;
        }
        if (claim) {
          const x = await this.get(`https://activity.10010.com/sixPalaceGridTurntableLottery/task/getTaskReward?taskId=${encodeURIComponent(claim.id)}`);
          this.log(`\u9886\u53D6[${claim.taskName}]\uFF1A${responseMessage(x)}`);
          continue;
        }
        break;
      }
    }
    async signRecords() {
      const r = await this.postForm("https://act.10010.com/SigninApp/convert/phoneDetails", { log_type: "1", number: "1", list_num: "" }, { "Origin": "https://img.client.10010.com" });
      const list = ((r.data || {}).detailedBO || []).filter((x) => String(x.remark || x.from_bussname || "").includes("\u5151\u6362")).slice(0, 5);
      list.forEach((x) => this.log(`\u62A2\u5151\u8BB0\u5F55\uFF1A${x.order_time || ""} ${x.remark || x.from_bussname || ""}`, true));
    }
    async signGrab() {
      const r = await this.postForm("https://act.10010.com/SigninApp/new_convert/prizeList", {}, { "Origin": "https://img.client.10010.com" });
      const tabs = ((r.data || {}).datails || {}).tabItems || [];
      const candidates = [];
      tabs.forEach((tab) => (tab.timeLimitQuanListData || []).forEach((p) => {
        if (String(p.product_name || "").includes(CFG.grabAmount) && (String(p.product_name).includes("\u5143") || String(p.product_name).includes("\u8BDD\u8D39"))) candidates.push({ ...p, round: tab.time });
      }));
      if (!candidates.length) {
        this.log(`\u672A\u5339\u914D\u5230 ${CFG.grabAmount}\u5143\u8BDD\u8D39\u5238`);
        return;
      }
      const c = candidates[0];
      for (let i = 1; i <= 5; i++) {
        const x = await this.postForm("https://act.10010.com/SigninApp/convert/prizeConvert", { product_id: c.product_id, typeCode: c.type_code || "0" }, { "Origin": "https://img.client.10010.com", "X-Requested-With": "com.sinovatech.unicom.ui" });
        const id = x.data && x.data.uuid;
        if (x.status === "0000" && id) {
          const y = await this.postForm("https://act.10010.com/SigninApp/convert/prizeConvertResult", { uuid: id });
          if (y.status === "0000") {
            this.log(`\u62A2\u5151\u6210\u529F\uFF1A${c.product_name}`, true);
            return;
          }
        }
        await sleep(200);
      }
    }
    epayBiz() {
      return JSON.stringify({ bizChannelCode: "225", disriBiz: "party", unionSessionId: "", stType: "", stDesmobile: "", source: "", rptId: this.rptId || "", ticket: "", tongdunTokenId: this.tokenIdCookie, xindunTokenId: this.unicomTokenId });
    }
    epayAuth() {
      return JSON.stringify({ mobile: "", sessionId: this.sessionId || "", tokenId: this.tokenId || "", userId: "" });
    }
    async ttlxjTask() {
      this.log("==== \u5929\u5929\u9886\u73B0\u91D1 ====");
      let entry = null;
      for (let i = 0; i < 5 && !entry; i++) {
        entry = await this.openPlat("https://epay.10010.com/ci-mps-st-web/ttlxj/");
        if (!entry) await sleep(1500);
      }
      if (!entry) {
        this.log("\u83B7\u53D6\u5165\u53E3 Ticket \u5931\u8D25");
        return;
      }
      const payload = { response_type: "rptid", client_id: "73b138fd-250c-4126-94e2-48cbcc8b9cbe", redirect_uri: "https://epay.10010.com/ci-mps-st-web/", login_hint: { credential_type: "st_ticket", credential: entry.ticket, st_type: entry.type, force_logout: true, source: "app_sjyyt" }, device_info: { token_id: `chinaunicom-pro-${nowMs()}-${randomString(13)}`, trace_id: uuid32() } };
      await this.postJSON("https://epay.10010.com/woauth2/v2/authorize", payload, { "Origin": "https://epay.10010.com", "Referer": entry.loc });
      let auth = await this.postJSON("https://epay.10010.com/ps-pafs-auth-front/v1/auth/check", {}, { "bizchannelinfo": this.epayBiz() });
      if (auth.code === "2101000100" && auth.data && auth.data.woauth_login_url) {
        const rr = await this.req("get", `${auth.data.woauth_login_url}https://epay.10010.com/ci-mcss-party-web/clockIn/?bizFrom=225&bizChannelCode=225`, { redirect: false });
        this.rptId = qs(getHeader(rr.headers, "Location")).rptid || "";
        auth = await this.postJSON("https://epay.10010.com/ps-pafs-auth-front/v1/auth/check", {}, { "bizchannelinfo": this.epayBiz() });
      }
      if (auth.code !== "0000") {
        this.ttlxjRetry = safeInt(this.ttlxjRetry) + 1;
        if (this.ttlxjRetry < 3) {
          this.log(`\u6388\u6743\u672A\u5C31\u7EEA\uFF1A${responseMessage(auth)}\uFF0C\u7B49\u5F85\u540E\u91CD\u8BD5(${this.ttlxjRetry}/3)`);
          await sleep(1500);
          return this.ttlxjTask();
        }
        this.log(`\u6388\u6743\u5931\u8D25[${auth.code}]\uFF1A${responseMessage(auth)}`);
        this.ttlxjRetry = 0;
        return;
      }
      this.ttlxjRetry = 0;
      const ai = (auth.data || {}).authInfo || {};
      this.sessionId = ai.sessionId || "";
      this.tokenId = ai.tokenId || "";
      if (!CFG.queryOnly) {
        const info = await this.postJSON("https://epay.10010.com/ci-mcss-party-front/v1/ttlxj/userDrawInfo", {}, { "bizchannelinfo": this.epayBiz(), "authinfo": this.epayAuth() });
        if (info.code === "0000") {
          const d = info.data || {};
          if (d[`day${d.dayOfWeek}`] === "1") {
            const draw = await this.postForm("https://epay.10010.com/ci-mcss-party-front/v1/ttlxj/unifyDrawNew", { drawType: (/* @__PURE__ */ new Date()).getDay() === 0 ? "C" : "B", bizFrom: "225", activityId: "TTLXJ20210330" }, { "bizchannelinfo": this.epayBiz(), "authinfo": this.epayAuth() });
            this.log(`\u6253\u5361\u62BD\u5956\uFF1A${draw.code === "0000" ? (draw.data || {}).prizeName || "\u6210\u529F" : responseMessage(draw)}`, true);
          } else this.log("\u4ECA\u65E5\u5DF2\u6253\u5361", true);
        }
      }
      const bal = await this.postJSON("https://epay.10010.com/ci-mcss-party-front/v1/ttlxj/queryAvailable", {}, { "bizchannelinfo": this.epayBiz(), "authinfo": this.epayAuth() });
      if (bal.code === "0000") this.log(`\u53EF\u7528\u7ACB\u51CF\u91D1\uFF1A${(safeInt((bal.data || {}).availableAmount) / 100).toFixed(2)}\u5143`, true);
    }
    ttxcHeaders(auth = true, ecs = false) {
      const h = { "User-Agent": H5_UA, "Content-Type": "application/json", "Origin": "https://epay.10010.com", "Referer": "https://epay.10010.com/cu-ca-game-web/index.html?channel=qdqp", "X-Requested-With": "com.sinovatech.unicom.ui" };
      if (auth && this.ttxcToken) h.Authorization = this.ttxcToken;
      if (ecs) h.Cookie = `ecs_token=${this.ecsToken}`;
      return h;
    }
    async ttxcPost(path, data = {}, auth = true, withUser = true, ecs = false) {
      const b = { ...data };
      if (withUser) b.userId = this.ttxcUserId || "";
      b.channel = "225";
      return this.postJSON(`https://epay.10010.com/cu-ca-game-front${path}`, b, this.ttxcHeaders(auth, ecs));
    }
    async ttxcLogin() {
      let init = await this.postJSON("https://epay.10010.com/cu-ca-app-front/v1/login/ttGame?channel=225&rptId=", { unicomTokenId: this.unicomTokenId }, this.ttxcHeaders(false, true));
      if (init.code === "4003" && init.data) {
        const page = await this.req("get", init.data, { headers: { "User-Agent": H5_UA } });
        const m = page.body.match(/var token = "([^"]+)"/);
        if (m) {
          let next = `https://epay.10010.com/woauth2/after-collected-device-digest?deviceDigestTraceId=&deviceDigestTokenId=&token=${encodeURIComponent(m[1])}&source=app_sjyyt`;
          for (let i = 0; i < 6; i++) {
            const z = await this.req("get", next, { redirect: false, headers: { "User-Agent": H5_UA } });
            const loc = getHeader(z.headers, "Location");
            if (!loc) break;
            next = loc;
          }
        }
        init = await this.postJSON("https://epay.10010.com/cu-ca-app-front/v1/login/ttGame?channel=225&rptId=", { unicomTokenId: this.unicomTokenId }, this.ttxcHeaders(false, true));
      }
      const initOK = ["0000", "0", "200"].includes(String(init.code)) || String(init.msg || init.message || "").toLowerCase() === "success" || String(init.msg || init.message || "") === "成功";
      if (!initOK) {
        this.log(`\u901A\u901A\u4E61\u6751\u521D\u59CB\u5316\u5931\u8D25[${init.code}]\uFF1A${responseMessage(init)}`);
        return false;
      }
      const r = await this.ttxcPost("/user/v1/login", {}, false, false, true);
      if (r.code !== 0) {
        this.log(`\u901A\u901A\u4E61\u6751\u767B\u5F55\u5931\u8D25\uFF1A${responseMessage(r)}`);
        return false;
      }
      const u = r.data || {};
      this.ttxcUserId = u.userId || "";
      this.ttxcToken = r.token || "";
      this.ttxcCharge = u.chargeLevel || {};
      this.ttxcNewbie = u.newbieList;
      this.log(`\u901A\u901A\u4E61\u6751\u767B\u5F55\u6210\u529F\uFF0C\u78B3\u80FD\u91CF${this.ttxcCharge.carbonNum || 0}g\uFF0C\u751F\u6001\u503C${this.ttxcCharge.ecologyAmount || 0}`, true);
      return true;
    }
    async ttxcTask() {
      this.log("==== \u901A\u901A\u4E61\u6751 ====");
      if (!await this.ttxcLogin()) return;
      await this.ttxcSign();
      let tasks = await this.ttxcTasks();
      if (CFG.queryOnly) {
        this.log(`\u5F85\u505A ${tasks.filter((x) => x.taskStatus === "UNDO").length} \u4E2A\uFF0C\u53EF\u9886\u53D6 ${tasks.filter((x) => x.taskStatus === "UNCLA").length} \u4E2A`, true);
        return;
      }
      await this.ttxcClaim(tasks);
      for (const t of tasks) {
        if (t.taskType === "GAME" && t.taskStatus === "UNDO" && t.jumpUrl) {
          await this.ttxcPost("/client/v1/task/do", { taskId: t.taskCode });
          await sleep(1e3);
        }
      }
      const garbage = tasks.find((t) => t.taskStatus === "UNDO" && String(t.taskTitle).includes("\u5783\u573E\u5206\u7C7B"));
      if (garbage) {
        const s = await this.ttxcPost("/user/v1/start", {});
        if (s.data && s.data.answerNo) {
          await sleep(CFG.ttxcGarbageWait * 1e3);
          await this.ttxcPost("/user/v1/finish", { answerNo: s.data.answerNo });
          this.log("\u5783\u573E\u5206\u7C7B\u4EFB\u52A1\u5DF2\u6267\u884C");
        }
      }
      await this.ttxcFarm(tasks);
      tasks = await this.ttxcTasks();
      await this.ttxcClaim(tasks);
    }
    async ttxcSign() {
      const info = await this.ttxcPost("/client/v1/sign/info", {});
      const code = (info.data || {}).signinCode;
      if (!code) return;
      const user = await this.ttxcPost("/client/v1/sign/user", { code });
      const signed = String((user.data || {}).lastSigninTime || "").startsWith(today());
      if (signed) {
        this.log("\u901A\u901A\u4E61\u6751\u4ECA\u65E5\u5DF2\u7B7E\u5230", true);
        return;
      }
      if (!CFG.queryOnly) {
        const r = await this.ttxcPost("/client/v1/sign/signIn", { code });
        this.log(r.code === 0 ? "\u901A\u901A\u4E61\u6751\u7B7E\u5230\u6210\u529F" : `\u901A\u901A\u4E61\u6751\u7B7E\u5230\u5931\u8D25\uFF1A${responseMessage(r)}`, true);
      }
    }
    async ttxcTasks() {
      const r = await this.ttxcPost("/client/v1/task/list", {});
      return (r.data || []).flatMap((g) => (g.taskList || []).map((t) => ({ ...t, taskGroupName: g.taskGroupName || "" })));
    }
    async ttxcClaim(tasks) {
      for (const t of tasks) {
        if (t.taskStatus === "UNCLA") {
          const r = await this.ttxcPost("/client/v1/task/finish", { taskId: t.taskCode });
          this.log(`\u9886\u53D6[${t.taskTitle || t.taskCode}]\uFF1A${r.code === 0 ? "\u6210\u529F" : responseMessage(r)}`);
          await sleep(500);
        }
      }
    }
    async ttxcLands() {
      const r = await this.ttxcPost("/plant/v1/user", { land: safeInt((this.ttxcCharge || {}).land, 4) });
      return r.data || [];
    }
    async ttxcPlantId() {
      const r = await this.ttxcPost("/client/v1/plant/page", { itemType: "SPE", pageNum: 1, pageSize: 20 });
      const list = (r.data || {}).list || [];
      return list.length ? list[0].itemNo : "";
    }
    async ttxcPlant(index, id) {
      if (!id) id = await this.ttxcPlantId();
      if (!id) return null;
      await this.ttxcPost("/client/v1/plant/buy", { plantId: id, gameCfgId: "" });
      const r = await this.ttxcPost("/plant/v1/planting", { landIndex: index, plantId: id });
      return r.code === 0 ? { landIndex: index, status: 3, plant: { plantId: id } } : null;
    }
    async ttxcChargeLand(land, mock) {
      const p = land.plant || {};
      if (!p.plantId) return null;
      const r = await this.ttxcPost("/plant/v1/charge", { landIndex: land.landIndex, plantId: p.plantId, mock });
      if (r.code === 0) {
        this.log(`\u5730\u5757${land.landIndex}\u5145\u80FD\u6210\u529F`);
        const d = r.data || land;
        if (!d.plant) d.plant = p;
        return d;
      }
      return null;
    }
    async ttxcHarvest(land) {
      const p = land.plant || {};
      if (!p.plantId) return false;
      const r = await this.ttxcPost("/plant/v1/harvest", { landIndex: land.landIndex, plantId: p.plantId });
      if (r.code === 0) {
        this.log(`\u5730\u5757${land.landIndex}\u6536\u83B7\u6210\u529F`);
        await this.ttxcPlant(land.landIndex);
        return true;
      }
      return false;
    }
    async ttxcFarm(tasks) {
      if (!tasks.some((t) => /充能|三块不同|收获一次/.test(String(t.taskTitle)))) return;
      let lands = await this.ttxcLands();
      const pid = await this.ttxcPlantId();
      for (const l of lands.filter((x) => x.status === 1)) {
        const p = await this.ttxcPlant(l.landIndex, pid);
        if (p) lands.push(p);
      }
      for (let land of lands.filter((x) => [2, 3].includes(x.status) && (x.plant || {}).plantId)) {
        if (land.status === 2) {
          await this.ttxcHarvest(land);
          continue;
        }
        for (let n = 0; n < CFG.ttxcGrowMax && land && land.status === 3; n++) {
          land = await this.ttxcChargeLand(land);
          if (land && land.status === 2) {
            await this.ttxcHarvest(land);
            break;
          }
          await sleep(700);
        }
      }
    }
    wocareBody(apiCode, requestData = {}) {
      const d = /* @__PURE__ */ new Date();
      const ts = compactTime(d) + String(d.getMilliseconds()).padStart(3, "0");
      const body = { version: "1", apiCode, channelId: "beea1c7edf7c4989b2d3621c4255132f", transactionId: ts + randomString(6, "0123456789"), timeStamp: ts, messageContent: b64Utf8(JSON.stringify(requestData)) };
      const raw = Object.keys(body).sort().map((k) => `${k}=${body[k]}`).concat("sign=f4cd4ffeb5554586acf65ba7110534f5").join("&");
      body.sign = md5(raw);
      return body;
    }
    async wocareApi(code, data) {
      const r = await this.postForm(`https://wocare.unisk.cn/api/v1/${code}`, this.wocareBody(code, data));
      if (r.messageContent) {
        const s = b64urlDecode(String(r.messageContent).replace(/\s/g, ""));
        const x = safeJSON(s, {});
        if (x.data !== void 0) r.data = x.data;
        if (x.resultCode) r.resultCode = x.resultCode;
        if (x.resultMsg) r.resultMsg = x.resultMsg;
      }
      return r;
    }
    async ltzfTask() {
      this.log("==== \u8054\u901A\u795D\u798F ====");
      const entry = await this.openPlat("https://wocare.unisk.cn/mbh/getToken?channelType=wocareMBHServiceLife1&homePage=home&duanlianjieabc=qAz2m");
      if (!entry) {
        this.log("\u83B7\u53D6 Ticket \u5931\u8D25");
        return;
      }
      const u = `https://wocare.unisk.cn/mbh/getToken?${form({ channelType: "wocareMBHServiceLife1", type: "02", ticket: entry.ticket, version: "android@11.0802", timestamp: compactTime() + String((/* @__PURE__ */ new Date()).getMilliseconds()).padStart(3, "0"), desmobile: this.accountMobile, num: "0", postage: uuid32(), homePage: "home", duanlianjieabc: "qAz2m", userNumber: this.accountMobile })}`;
      const rr = await this.req("get", u, { redirect: false });
      const p = qs(getHeader(rr.headers, "Location"));
      const sid = p.sid || p.uuid;
      if (!sid) {
        this.log("\u83B7\u53D6 sid \u5931\u8D25");
        return;
      }
      const login = await this.wocareApi("loginmbh", { sid, channelType: "wocareMBHServiceLife1", apiCode: "loginmbh" });
      if (login.resultCode !== "0000") {
        this.log(`\u767B\u5F55\u5931\u8D25\uFF1A${responseMessage(login)}`);
        return;
      }
      this.wocareToken = (login.data || {}).token;
      const banners = await this.wocareApi("getSpecificityBanner", { token: this.wocareToken, apiCode: "getSpecificityBanner" });
      const list = Array.isArray(banners.data) ? banners.data : [];
      for (const a of list.filter((x) => String(x.activityStatus) === "0" && String(x.isDeleted) === "0")) await this.wocareActivity({ id: a.id, name: a.name || a.title || `\u6D3B\u52A8${a.id}` });
      for (const a of [{ id: 2, name: "\u661F\u5EA7\u914D\u5BF9" }, { id: 3, name: "\u5927\u8F6C\u76D8" }, { id: 4, name: "\u76F2\u76D2\u62BD\u5956" }]) await this.wocareActivity(a);
    }
    async wocareActivity(a) {
      const tasks = await this.wocareApi("getDrawTask", { token: this.wocareToken, channelType: "wocareMBHServiceLife1", type: a.id, apiCode: "getDrawTask" });
      for (const t of (tasks.data || {}).taskList || []) {
        if (!t.taskStatus || String(t.taskStatus) === "0") {
          for (const step of ["1", "4"]) {
            const x = await this.wocareApi("completeTask", { token: this.wocareToken, channelType: "wocareMBHServiceLife1", task: t.id, taskStep: step, type: a.id, apiCode: "completeTask" });
            this.log(`\u8054\u901A\u795D\u798F[${a.name}] ${t.title || ""}\uFF1A${responseMessage(x)}`);
            await sleep(500);
          }
        }
      }
      const init = await this.wocareApi("loadInit", { token: this.wocareToken, channelType: "wocareMBHServiceLife1", type: a.id, apiCode: "loadInit" });
      if (init.resultCode !== "0000") return;
      const d = init.data || {};
      let count = a.id === 2 ? (d.data || {}).isPartake ? 0 : 1 : a.id === 3 ? safeInt(d.raffleCountValue) : safeInt(d.mhRaffleCountValue);
      while (count-- > 0) {
        const x = await this.wocareApi("luckDraw", { token: this.wocareToken, channelType: "wocareMBHServiceLife1", zActiveModuleGroupId: d.zActiveModuleGroupId, type: a.id, apiCode: "luckDraw" });
        const prize = (((x.data || {}).data || {}).prize || {}).prizeName;
        this.log(`\u8054\u901A\u795D\u798F[${a.name}]\uFF1A${prize || responseMessage(x)}`, !!prize);
        await sleep(1500);
      }
    }
    marketHeaders(token) {
      return { "User-Agent": UA, "Authorization": `Bearer ${String(token).replace("Bearer ", "")}`, "Content-Type": "application/json", "X-Requested-With": "com.sinovatech.unicom.ui", "Origin": "https://contact.bol.wo.cn", "Referer": "https://contact.bol.wo.cn/market" };
    }
    marketPayload(token) {
      try {
        return safeJSON(b64urlDecode(String(token).replace("Bearer ", "").split(".")[1]), {});
      } catch (_) {
        return {};
      }
    }
    marketSignature(token, query = "", body = "") {
      const loginId = this.marketPayload(token).loginId || "";
      const secret = md5(`al:ak:${loginId}`);
      const nonce = uuid32();
      return { "X-User-Id": loginId, "X-Nonce": nonce, "X-Timestamp": String(nowMs()), "X-Signature": sha256HmacB64(`${loginId}${secret}${nonce}${query}${body}`, secret) };
    }
    async marketLogin() {
      const e = await this.openPlat("https://contact.bol.wo.cn/market");
      if (!e) return "";
      const r = await this.postJSON(`https://backward.bol.wo.cn/prod-api/auth/marketUnicomLogin?ticket=${encodeURIComponent(e.ticket)}`, {}, { "User-Agent": UA });
      return r.code === 200 ? (r.data || {}).token || "" : "";
    }
    async marketTask() {
      this.log("==== \u6743\u76CA\u8D85\u5E02 ====");
      const token = await this.marketLogin();
      if (!token) {
        this.log("\u83B7\u53D6 userToken \u5931\u8D25");
        return;
      }
      const h = this.marketHeaders(token);
      if (CFG.marketWater) {
        const st = await this.get("https://backward.bol.wo.cn/prod-api/promotion/activityTask/getMultiCycleProcess?activityId=13", h);
        const d = st.data || {};
        this.log(`\u6D47\u82B1\u8FDB\u5EA6 ${d.triggeredTime || 0}/${d.triggerTime || 0}`, true);
        if (!CFG.queryOnly && String(d.createDate || "").slice(0, 10) !== today() && safeInt(d.triggeredTime) < safeInt(d.triggerTime)) {
          const loginId = this.marketPayload(token).loginId || "";
          const ts = String(nowMs()), x = "Y1mN8fNYktY0";
          const sig = sha256HmacB64(`td:433:tp${x}td:334:et${loginId}td:334:et${ts}td:334:et`, loginId);
          const r = await this.postJSON(`https://backward.bol.wo.cn/prod-api/promotion/activityTaskShare/checkWatering?xbsosjl=${x}&timeVerRan=${ts}&diceid=${loginId}`, {}, { ...h, "X-Signature": sig, "User-Agent": H5_UA });
          this.log(`\u6D47\u82B1\uFF1A${r.code === 200 ? "\u6210\u529F" : responseMessage(r)}`, true);
        }
      }
      if (CFG.queryOnly) {
        await this.marketRecords(token);
        return;
      }
      if (CFG.marketTask) {
        const r = await this.get("https://backward.bol.wo.cn/prod-api/promotion/activityTask/getAllActivityTasks?activityId=12", h);
        for (const t of (r.data || {}).activityTaskUserDetailVOList || []) {
          if (safeInt(t.triggeredTime) >= safeInt(t.triggerTime) || /购买|秒杀/.test(t.name || "")) continue;
          const action = /分享/.test(t.name || "") ? "checkShare" : /浏览|查看/.test(t.name || "") ? "checkView" : "";
          if (action) {
            const x = await this.postJSON(`https://backward.bol.wo.cn/prod-api/promotion/activityTaskShare/${action}?checkKey=${encodeURIComponent(t.param1 || "")}`, {}, h);
            this.log(`\u4EFB\u52A1[${t.name}]\uFF1A${x.code === 200 ? "\u6210\u529F" : responseMessage(x)}`);
            await sleep(1e3);
          }
        }
      }
      if (CFG.marketMember) await this.marketMember(token);
      if (CFG.marketDraw) {
        const ts = nowMs(), q = `id=12&channel=unicomTab&timeVerRan=${ts}`, body = "{}";
        const hs = { ...h, ...this.marketSignature(token, q, body) };
        const count = await this.postJSON(`https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/getUserRaffleCountExt?${q}`, {}, hs);
        let n = typeof count.data === "object" ? safeInt(count.data.raffleCount) : safeInt(count.data);
        while (n-- > 0) {
          const x = await this.postJSON(`https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/userRaffle?${q}`, {}, hs);
          this.log(`\u6743\u76CA\u62BD\u5956\uFF1A${(x.data || {}).prizesName || x.msg || "\u672A\u4E2D\u5956"}`, true);
          await sleep(2e3);
        }
      }
      await this.marketRecords(token);
    }
    async marketMember(token) {
      const h = this.marketHeaders(token);
      const t = await this.get("https://backward.bol.wo.cn/prod-api/auth/getTicket?channel=pointsPlatform", h);
      if (t.code !== 200 || !t.data) return;
      const ticket = t.data;
      const base = { "origin": "https://m.jf.10010.com", "clienttype": "marketUnicom", "ticket": ticket, "partnersid": "1703", "content-type": "application/json;charset=UTF-8", "pageid": "s782351687947921408", "User-Agent": H5_UA };
      const secret = await this.get("https://m.jf.10010.com/jf-external-application/jftask/getSecretKey", base);
      const key = (secret.data || {}).secretKey || "";
      const signed = () => {
        const ts = String(nowMs()), nonce = randomString(8, "0123456789abcdefghijklmnopqrstuvwxyz");
        return { ...base, "x-request-timestamp": ts, "x-request-nonce": nonce, "x-request-signature": sha256HmacHex(`${nonce}${ts}`, key) };
      };
      const detail = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/taskDetail", {}, signed());
      const task = (((detail.data || {}).taskDetail || {}).taskList || []).find((x) => x.taskCode === "s769153426294495232");
      if (!task) return;
      if (safeInt(task.finish) === 0) {
        const m = String(task.jumpUrl || "").match(/taskFixId=(\d+)/);
        const id = m ? m[1] : "90";
        const d = await this.get(`https://backward.bol.wo.cn/prod-api/promotion/activityTask/getActivityTaskDetailByFixId?taskFixId=${id}`, h);
        const x = d.data || {};
        await sleep(Math.max(safeInt(x.content, 17), 15) * 1e3);
        await this.postJSON(`https://backward.bol.wo.cn/prod-api/promotion/activityTaskShare/checkView?checkKey=${encodeURIComponent(x.param1 || "")}`, {}, h);
      }
      const rec = await this.postJSON("https://m.jf.10010.com/jf-external-application/jfmarkettask/receive", { taskCode: "s769153426294495232" }, signed());
      this.log(`\u4F1A\u5458\u4E2D\u5FC3\uFF1A${rec.code === "0000" ? `\u9886\u53D6 ${(rec.data || {}).score || ""}` : responseMessage(rec)}`, rec.code === "0000");
    }
    async marketRecords(token) {
      const h = this.marketHeaders(token);
      const r = await this.postJSON("https://backward.bol.wo.cn/prod-api/market/contactReceive/queryReceiveRecord", { isReceive: null, receiveStatus: null, limit: 20, page: 1, mobile: this.accountMobile, businessSources: ["3", "4", "5", "6", "99"], isPromotion: 1, returnFormatType: 1 }, h);
      const list = ((r.data || {}).recordObjs || []).slice(0, 10);
      list.forEach((x) => this.log(`\u6743\u76CA\u8BB0\u5F55\uFF1A${x.receiveTime || ""} ${x.recordName || ""}`, true));
    }
    async cloudLogin() {
      const t = await this.get(`https://m.client.10010.com/edop_ng/getTicketByNative?appId=edop_unicom_d67b3e30&token=${encodeURIComponent(this.ecsToken)}`);
      if (!t.ticket) return "";
      const ts = String(nowMs()), seq = String(123456 + Math.floor(Math.random() * 76543));
      const p = { header: { key: "HandheldHallAutoLoginV2", resTime: ts, reqSeq: seq, channel: "wohome", version: "", sign: md5(`HandheldHallAutoLoginV2${ts}${seq}wohome`) }, body: { clientId: "1001000003", ticket: t.ticket } };
      const r = await this.postJSON("https://panservice.mail.wo.cn/wohome/dispatcher", p, { "User-Agent": UA });
      return ((r.RSP || {}).DATA || {}).token || "";
    }
    cloudHeaders(client = "1001000035") {
      return { "X-YP-Access-Token": this.cloudToken, "Access-Token": this.cloudToken, "accesstoken": this.cloudToken, "Client-Id": client, "X-YP-Client-Id": client, "App-Version": "yp-app/5.5.0", "app-type": "liantongyunpanapp", "Content-Type": "application/json", "User-Agent": "LianTongYunPan/5.5.0 (Android 9)" };
    }
    async cloudSigned(path, key, payload = {}, client = "1001000035") {
      const ts = await this.postJSON("https://panservice.mail.wo.cn/activity/getTimestamp", { key }, this.cloudHeaders(client));
      const x = ts.result || {};
      if (!x.nonce || !x.timestamp) return {};
      const b = { ...payload, activityId: "Mjg=", nonce: x.nonce, timestamp: x.timestamp };
      const raw = Object.keys(b).sort().map((k) => `${k}=${b[k]}`).join("&") + "&secret=s8Hf3LqP9xN2vM5bR7tY1wZ4cA6eG0K";
      b.sign = sha256HmacHex(raw, "s8Hf3LqP9xN2vM5bR7tY1wZ4cA6eG0K");
      return this.postJSON(`https://panservice.mail.wo.cn${path}`, b, this.cloudHeaders(client));
    }
    async cloudTask() {
      this.log("==== \u8054\u901A\u4E91\u76D8 ====");
      this.cloudDisk = {};
      if (!this.ecsToken) return;
      this.cloudToken = "";
      const cached = this.islandLoadCachedToken();
      if (cached && await this.islandTokenValid(cached)) {
        this.cloudToken = cached;
        this.cloudDisk.userToken = cached;
        this.cloudDisk.ticket = "";
        this.log("\u4E91\u76D8\u4EFB\u52A1: [\u7F13\u5B58\u590D\u7528] \u4E91\u76D8Token\u6709\u6548, \u8DF3\u8FC7\u767B\u5F55\u94FE");
      } else {
        this.cloudToken = await this.cloudLogin();
        if (!this.cloudToken) {
          this.log("\u4E91\u76D8\u767B\u5F55\u5931\u8D25");
          return;
        }
        this.islandSaveCachedToken(this.cloudToken);
      }
      if (CFG.queryOnly) {
        this.log("\u4E91\u76D8\u4EFB\u52A1: [\u67E5\u8BE2\u6A21\u5F0F] \u767B\u5F55\u6210\u529F\uFF0C\u8DF3\u8FC7\u6D3B\u52A8\u548C\u6587\u4EF6\u6E05\u7406");
        return;
      }
      const phone = aesCbcB64(this.accountMobile, "yEKmse436lnvTsle", "wNSOYIB1k1DjY5lA");
      const check = await this.postJSON("https://panservice.mail.wo.cn/activity/check/yp/members/eligibility", { phone }, this.cloudHeaders("1001000001"));
      if (String((check.meta || {}).code) === "200" && safeInt((check.result || {}).state) === 0) {
        const c = await this.postJSON("https://panservice.mail.wo.cn/activity/experience/yp/members", { phone, skuCode: "S251222T1F1M3702758", activityCode: "7IO6ren5HVMw3ouGRTepcSoFBM0r86ZGs9+Fjv6Xjv0=", channel: "6", touchpoint: "300300010005" }, this.cloudHeaders("1001000001"));
        this.log(`\u4E91\u76D8\u4F1A\u5458\u4F53\u9A8C\uFF1A${responseMessage(c)}`);
      }
      if (CFG.hometownEnable) {
        await this.hometownTask(this.cloudToken);
        this.cloudDisk.uploadedFileCount = (this.hometownUploadedFiles || []).length ? 1 : 0;
      }
      await this.islandTask(this.cloudToken);
      await this.cloudClean();
    }
    cloudUploadName() {
      return String(CFG.cloudUploadName || "8648").trim() || "8648";
    }
    cloudEncrypt(text, token) {
      const key = String(token || "").padEnd(16, " ").slice(0, 16);
      return aesCbcB64(String(text), key, "wNSOYIB1k1DjY5lA");
    }
    async cloudDispatcher(key, param, timeout = 15000, clientId = "1001000035") {
      const token = this.cloudToken || "";
      if (!token) return {};
      const ts = String(nowMs()), seq = String(10000 + Math.floor(Math.random() * 90000));
      const payload = {
        header: { key, resTime: ts, reqSeq: seq, channel: "wohome", version: "", sign: md5(`${key}${ts}${seq}wohome`).toUpperCase() },
        body: { param: this.cloudEncrypt(JSON.stringify(param), token) }
      };
      const headers = {
        "X-YP-Device-Id": "kQ+77Ax9QjhBHAFAAVbCoTTly6IDtegY",
        accesstoken: token,
        appversion: "5.5.0",
        bundleid: "com.chinaunicom.bol.cloudapp",
        platfomr: "1",
        width: "900",
        height: "1600",
        appchannel: "yyb",
        "app-type": "liantongyunpanapp",
        "User-Agent": "LianTongYunPan/5.5.0 (Android 9)",
        "network-type": "mobile",
        oaid: "00000000",
        "Access-Token": token,
        "App-Version": "yp-app/5.5.0",
        platform: "1",
        "sys-version": "Android/9",
        "Sys-Version": "Android/9",
        "Client-Id": String(clientId),
        "Content-Type": "application/json; charset=utf-8"
      };
      const r = await this.postJSON("https://s.pan.wo.cn/wohome/dispatcher", payload, headers, { timeout, retries: 1 });
      return r || {};
    }
    async queryAllFiles(spaceType = "0", parentId = "0", pageNum = 0, pageSize = 500) {
      const token = this.cloudToken || "";
      if (!token) return {};
      const res = await this.cloudDispatcher("QueryAllFiles", { clientId: "1001000035", spaceType: String(spaceType), sortRule: "0", parentDirectoryId: String(parentId), pageNum: String(pageNum), pageSize: Number(pageSize) });
      const rsp = res.RSP || {};
      if (String(rsp.RSP_CODE) !== "0000" || !rsp.DATA) return {};
      try {
        const plain = aesCbcDecryptB64(rsp.DATA, String(token).padEnd(16, " ").slice(0, 16), "wNSOYIB1k1DjY5lA");
        return safeJSON(plain, {});
      } catch (e) {
        this.log(`\u4E91\u76D8\u4EFB\u52A1: \u67E5\u8BE2\u6839\u76EE\u5F55\u6587\u4EF6\u5931\u8D25: ${e && e.message || e}`);
        return {};
      }
    }
    async listUploadNamedFiles(maxPages = 4) {
      const name = this.cloudUploadName();
      if (!name) return [];
      const pattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\(\\d+\\))?(?:\\.[^.]+)?$`);
      const matched = [], seen = new Set();
      for (let page = 0; page < maxPages; page++) {
        const data = await this.queryAllFiles("0", "0", page, 500);
        const files = data.files || [];
        if (!files.length) break;
        for (const item of files) {
          const id = item && item.id, fname = String((item || {}).name || "").trim();
          if (id && !seen.has(id) && pattern.test(fname)) {
            seen.add(id);
            matched.push(item);
          }
        }
        if (files.length < 500) break;
      }
      return matched;
    }
    async deleteRootFiles(items, spaceType = "0") {
      const targets = (items || []).map((x) => ({ id: String((x || {}).id || "").trim(), dir: String((x || {}).type || "1") === "0" })).filter((x) => x.id);
      let deleted = 0;
      for (let offset = 0; offset < targets.length; offset += 100) {
        const batch = targets.slice(offset, offset + 100);
        const dirList = batch.filter((x) => x.dir).map((x) => x.id);
        const fileList = batch.filter((x) => !x.dir).map((x) => x.id);
        if (!dirList.length && !fileList.length) continue;
        const res = await this.cloudDispatcher("DeleteFile", { spaceType: String(spaceType), vipLevel: "0", dirList, fileList, clientId: "1001000035" }, 20000);
        const rsp = res.RSP || {};
        if (String(rsp.RSP_CODE) === "0000") {
          deleted += batch.length;
          this.log(`\u4E91\u76D8\u4EFB\u52A1: \u7B2C${offset / 100 + 1}\u6279\u6839\u76EE\u5F55\u5220\u9664\u6210\u529F\uFF0C\u5171${batch.length}\u4E2A\u6587\u4EF6`);
        } else {
          this.log(`\u4E91\u76D8\u4EFB\u52A1: \u7B2C${offset / 100 + 1}\u6279\u6839\u76EE\u5F55\u5220\u9664\u5931\u8D25: ${rsp.RSP_DESC || "\u65E0\u54CD\u5E94"}`);
        }
        await sleep(1000);
      }
      return deleted;
    }
    islandHeaders(token, extra = {}) {
      return {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) LianTongYunPan/6.0.0 (iPhone; iOS 16.6)",
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "X-YP-GRAY-FLAG": "undefined",
        requestTime: String(nowMs()),
        clientId: "1001000165",
        "X-YP-Client-Id": "1001000165",
        "Access-Token": token,
        "X-YP-Access-Token": token,
        token,
        "X-SH-Access-Token": "",
        "source-type": "woapi",
        Origin: "https://panservice.mail.wo.cn",
        Referer: `https://panservice.mail.wo.cn/h5/activitymobile/cmf2026/home?activityId=NDA%3D&touchpoint=300300010005&token=${token}`,
        ...extra
      };
    }
    async islandRequest(token, path, payload = {}, key = "") {
      const headers = this.islandHeaders(token);
      const body = { ...payload };
      if (key) {
        const tsRes = await this.postJSON("https://panservice.mail.wo.cn/activity/getTimestamp", { key }, headers, { timeout: 20000 });
        const stamp = tsRes.result || {};
        if (!stamp.nonce || stamp.timestamp === undefined) {
          this.log("\u6D77\u5C9B\u9010\u6D6A: \u83B7\u53D6\u7B7E\u540D\u65F6\u95F4\u6233\u5931\u8D25");
          return {};
        }
        body.activityId = ISLAND_ACTIVITY_ID;
        body.nonce = stamp.nonce;
        body.timestamp = stamp.timestamp;
        body.sign = this.hometownSign(body);
      }
      return await this.postJSON(`https://panservice.mail.wo.cn${path}`, body, headers, { timeout: 20000 });
    }
    async islandGet(token, path, params = {}, extra = {}) {
      const query = Object.keys(params).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
      const url = `https://panservice.mail.wo.cn${path}${query ? "?" + query : ""}`;
      try {
        return await this.get(url, this.islandHeaders(token, extra)) || {};
      } catch (e) {
        return { meta: { code: "-1", message: "\u8BF7\u6C42\u5F02\u5E38" } };
      }
    }
    async islandPost(token, path, payload = {}, extra = {}) {
      try {
        return await this.postJSON(`https://panservice.mail.wo.cn${path}`, payload, this.islandHeaders(token, extra)) || {};
      } catch (e) {
        return { meta: { code: "-1", message: "\u8BF7\u6C42\u5F02\u5E38" } };
      }
    }
    async islandTask(token) {
      this.log("==== \u4E91\u76D8\u6D77\u5C9B\u9010\u6D6A\u5E94\u63F4 ====");
      try {
        const status = await this.islandGet(token, "/activity/checkActivityStatus", { activityId: ISLAND_ACTIVITY_ID });
        const result = status.result || {};
        const state = safeInt(result.state, -1);
        const end = result.activityEndTime;
        if (end && safeInt(end) < nowMs()) {
          this.log("\u6D77\u5C9B\u9010\u6D6A: \u6D3B\u52A8\u5DF2\u7ED3\u675F");
          return;
        }
        if (state === -1) {
          this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6D3B\u52A8\u72B6\u6001\u67E5\u8BE2\u5931\u8D25 ${responseMessage(status)}`);
          return;
        }
        const joined = state === 1;
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6D3B\u52A8\u8FDB\u884C\u4E2D (\u672C\u8D26\u53F7${joined ? "\u5DF2\u53C2\u4E0E" : "\u5C1A\u672A\u53C2\u4E0E"})`);
        if (!joined) {
          const activated = await this.islandPost(token, "/activity/task/activate", { activityId: ISLAND_ACTIVITY_ID });
          if (String((activated.meta || {}).code) === "200") this.log("\u6D77\u5C9B\u9010\u6D6A: \u5DF2\u6FC0\u6D3B\u53C2\u4E0E");
          else this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6FC0\u6D3B\u5931\u8D25 ${responseMessage(activated)}`);
        }
        await this.islandFirstLevel(token);
        await this.islandHangInfo(token);
        await this.islandRoleInfo(token);
        await this.islandSaveRolePhoto(token);
        let videoOk = false;
        try {
          videoOk = await this.islandAiVideo(token);
        } catch (e) {
          this.log(`\u6D77\u5C9B\u9010\u6D6A: AI\u5165\u620F\u5F02\u5E38 ${e && e.message || e}`);
        }
        await this.islandCleanupPhotos(token);
        await this.islandCheckin(token, videoOk);
        const runPrizes = await this.islandLottery(token);
        await this.islandSyncPrizes(token, runPrizes);
      } catch (e) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u8BF7\u6C42\u5F02\u5E38 ${e && e.message || e}`);
      }
    }
    async islandLevel(token) {
      const data = await this.islandPost(token, "/activity/user/levelProgress", { activityId: ISLAND_ACTIVITY_ID });
      const result = data.result;
      return result && typeof result === "object" ? safeInt(result.maxPassLevel) : 0;
    }
    islandWalk(node, out) {
      if (!node) return;
      if (Array.isArray(node)) {
        for (const v of node) this.islandWalk(v, out);
      } else if (typeof node === "object") {
        if (node.targetId || node.targetName || (node.id && node.name)) out.push(node);
        for (const k of Object.keys(node)) this.islandWalk(node[k], out);
      }
    }
    async islandFirstLevel(token) {
      if (await this.islandLevel(token) >= 1) return true;
      this.log("\u6D77\u5C9B\u9010\u6D6A: \u672A\u8FC7\u7B2C\u4E00\u5173(\u672A\u9009\u89D2\u8272), \u81EA\u52A8\u4FDD\u5B58\u89D2\u8272\u6D77\u62A5...");
      const hits = [];
      const data = await this.islandGet(token, "/activity/poster/list", { activityId: ISLAND_ACTIVITY_ID });
      this.islandWalk(data.result, hits);
      const roles = [];
      for (const it of hits) {
        const tid = it.targetId || it.targetID || it.id;
        const fid = String(it.fid || "");
        if (tid && fid) roles.push({ targetId: safeInt(tid), targetName: String(it.targetName || it.name || ""), fid });
      }
      if (!roles.length) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: \u89D2\u8272\u5217\u8868\u83B7\u53D6\u5931\u8D25, \u8BF7\u624B\u52A8\u6253\u5F00\u6D3B\u52A8\u9875\u9009\u62E9\u89D2\u8272");
        return false;
      }
      const role = roles[0];
      await this.islandPost(token, "/wohome/open/v1/ai/moveFile2Person", { activityId: ISLAND_ACTIVITY_ID, fids: [role.fid], taskType: 10, fileType: 2, fileName: `\u62AB\u8346\u65A9\u68D82026-${role.targetName}.jpg`, directoryId: 0, additionalParams: { aiHeaderSubType: 0 } });
      if (await this.islandLevel(token) >= 1) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u7B2C\u4E00\u5173\u5B8C\u6210 (\u5DF2\u9009\u89D2\u8272 ${role.targetName})`, true);
        return true;
      }
      this.log("\u6D77\u5C9B\u9010\u6D6A: \u81EA\u52A8\u9009\u89D2\u672A\u901A\u8FC7");
      return false;
    }
    async islandRoleInfo(token) {
      const data = await this.islandGet(token, "/activity/user/bindInfo", { activityId: ISLAND_ACTIVITY_ID });
      const result = data.result || {};
      this.islandRole = result;
      if (result.targetName) this.log(`\u6D77\u5C9B\u9010\u6D6A: \u5DF2\u9009\u89D2\u8272 ${result.targetName}`);
      return result;
    }
    async islandSaveRolePhoto(token) {
      const role = this.islandRole || {};
      const fid = String(role.fid || ""), name = String(role.targetName || "");
      if (!fid) return;
      const data = await this.islandPost(token, "/wohome/open/v1/ai/moveFile2Person", { activityId: ISLAND_ACTIVITY_ID, fids: [fid], taskType: 10, fileType: 2, fileName: name ? `\u62AB\u8346\u65A9\u68D82026-${name}.jpg` : "\u62AB\u8346\u65A9\u68D82026.jpg", directoryId: 0, additionalParams: { aiHeaderSubType: 0 } });
      if (String((data.meta || {}).code) === "200") this.log("\u6D77\u5C9B\u9010\u6D6A: \u89D2\u8272\u5F62\u8C61\u5DF2\u4FDD\u5B58\u5230\u4E91\u76D8");
    }
    async islandHangInfo(token) {
      const data = await this.islandPost(token, "/activity/aiRole/hangValue/userInfo", { activityId: ISLAND_ACTIVITY_ID });
      const result = data.result || {};
      let hv = result.hangValue;
      if (hv === undefined || hv === null) hv = result.totalHangValue !== undefined ? result.totalHangValue : result.hangValueAfter;
      if (hv === undefined || hv === null) return;
      const rank = result.rank || result.rankAfter || "\u672A\u77E5";
      const region = `${result.provinceName || ""}${result.cityName || ""}`;
      this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6D6A\u82B1\u503C ${hv} | \u6392\u540D ${rank} | ${region}`, true);
    }
    async islandCheckin(token, videoOk = false) {
      const month = today().slice(0, 7);
      const panel = await this.islandRequest(token, "/activity/islandWaves/task2/checkin/panel", { month }, "activity:island:activate");
      const result = panel.result || {};
      if (!result.todayDate) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6253\u5361\u65E5\u5386\u67E5\u8BE2\u5931\u8D25 ${responseMessage(panel)}`);
        return false;
      }
      let days = safeInt(result.continuousCheckinDays);
      if (result.checkedToday || !result.canCheckinToday) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u4ECA\u65E5\u5DF2\u6253\u5361 (\u8FDE\u7EED${days}\u5929)`);
        return true;
      }
      let signed = await this.islandRequest(token, "/activity/islandWaves/task2/checkin/submit", {}, "activity:island:activate");
      let ok = signed.result === true;
      if (!ok && videoOk && String(responseMessage(signed.meta || signed)).includes("\u7B2C\u4E00\u5173")) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: \u89C6\u9891\u521A\u5B8C\u6210, \u7B49\u5F8510\u79D2\u540C\u6B65\u540E\u91CD\u8BD5\u6253\u5361...");
        await sleep(10000);
        signed = await this.islandRequest(token, "/activity/islandWaves/task2/checkin/submit", {}, "activity:island:activate");
        ok = signed.result === true;
      }
      if (ok) {
        const panel2 = await this.islandRequest(token, "/activity/islandWaves/task2/checkin/panel", { month }, "activity:island:activate");
        days = safeInt((panel2.result || {}).continuousCheckinDays) || days + 1;
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6253\u5361\u6210\u529F (\u8FDE\u7EED${days}\u5929)`, true);
      } else {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6253\u5361\u5931\u8D25 ${responseMessage(signed.meta || signed)}`);
      }
      return ok;
    }
    async islandLottery(token) {
      const data = await this.islandGet(token, "/activity/lottery/lottery-times", { activityId: ISLAND_ACTIVITY_ID });
      if (String((data.meta || {}).code) !== "200") {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u62BD\u5956\u6B21\u6570\u67E5\u8BE2\u5931\u8D25 ${responseMessage(data)}`);
        return [];
      }
      let count = data.result;
      if (count && typeof count === "object") count = count.lotteryTimes !== undefined ? count.lotteryTimes : count.times !== undefined ? count.times : count.count;
      count = safeInt(count, 0);
      this.log(`\u6D77\u5C9B\u9010\u6D6A: \u53EF\u7528\u62BD\u5956\u6B21\u6570 ${count}`, true);
      const prizes = [];
      for (let i = 0; i < count; i++) {
        const result = await this.islandRequest(token, "/activity/lottery", {}, "activity:lottery");
        const info = result.result || {};
        if (info && typeof info === "object" && info.prizeName) {
          const name = String(info.prizeName), code = String(info.redeemCode || "");
          prizes.push({ \u5956\u54C1: name, \u5151\u6362\u7801: code, \u8BB0\u5F55ID: String(info.recordId || ""), \u65F6\u95F4: dateTime().slice(5, 16), _ts: nowMs() });
          this.log(`\u6D77\u5C9B\u9010\u6D6A: \u7B2C${i + 1}\u6B21\u62BD\u5956 ${name}${code ? ` (\u5151\u6362\u7801: ${code})` : ""}`, true);
        } else {
          this.log(`\u6D77\u5C9B\u9010\u6D6A: \u7B2C${i + 1}\u6B21\u62BD\u5956 ${responseMessage(result)}`);
        }
        await sleep(2000);
      }
      return prizes;
    }
    islandParseTime(item) {
      for (const k of ["lotteryTime", "createTime", "addTime", "updateTime", "receiveTime", "gmtCreated"]) {
        const v = item[k];
        if (!v) continue;
        const ts = parseInt(String(v), 10);
        if (Number.isFinite(ts)) {
          const ms = ts > 1e12 ? ts : ts * 1000;
          const d = new Date(ms);
          return [ms, `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`];
        }
        return [0, String(v).slice(0, 16)];
      }
      return [0, ""];
    }
    async islandFetchPrizeHistory(token) {
      const candidates = [
        ["post", "/activity/aiRole/userDrawRecords", { activityId: ISLAND_ACTIVITY_ID }],
        ["post", "/activity/aiRole/userDrawRecords", { activityId: ISLAND_ACTIVITY_ID, pageNum: 1, pageSize: 10 }],
        ["get", "/activity/v1/recordList", { activityId: ISLAND_ACTIVITY_ID }]
      ];
      for (const [method, path, payload] of candidates) {
        const data = method === "post" ? await this.islandPost(token, path, payload) : await this.islandGet(token, path, payload);
        if (String((data.meta || {}).code || "") !== "200") continue;
        const result = data.result;
        let items = Array.isArray(result) ? result : [];
        if (result && !Array.isArray(result) && typeof result === "object") {
          for (const k of ["list", "records", "rows", "data", "prizeList"]) {
            if (Array.isArray(result[k])) {
              items = result[k];
              break;
            }
          }
        }
        if (!items.length) continue;
        const records = [];
        for (const it of items) {
          if (!it || typeof it !== "object" || !it.prizeName) continue;
          const [ts, tstr] = this.islandParseTime(it);
          records.push({ \u5956\u54C1: String(it.prizeName), \u5151\u6362\u7801: String(it.redeemCode || ""), \u8BB0\u5F55ID: String(it.recordId || ""), \u65F6\u95F4: tstr, _ts: ts });
        }
        return records;
      }
      return [];
    }
    async islandSyncPrizes(token, runPrizes) {
      const merged = {};
      const put = (rec) => {
        const name = String(rec.\u5956\u54C1 || "");
        if (!name || name === "\u8C22\u8C22\u53C2\u4E0E") return;
        const key = String(rec.\u8BB0\u5F55ID || "") || `${name}|${rec.\u65F6\u95F4 || ""}`;
        const old = merged[key];
        if (!old) {
          merged[key] = { ...rec };
          return;
        }
        for (const f of ["\u5151\u6362\u7801", "\u65F6\u95F4", "_ts"]) if (!old[f] && rec[f]) old[f] = rec[f];
      };
      for (const rec of await this.islandFetchPrizeHistory(token)) put(rec);
      for (const rec of this.islandLoadPrizeCache()) put(rec);
      for (const rec of runPrizes || []) put(rec);
      const records = Object.values(merged).sort((a, b) => (b._ts || 0) - (a._ts || 0)).slice(0, 3);
      if (records.length) {
        this.islandSavePrizeCache(records);
        const detail = records.map((r) => `${r.\u65F6\u95F4 ? `[${r.\u65F6\u95F4}] ` : ""}${r.\u5956\u54C1}${r.\u5151\u6362\u7801 ? `(\u7801:${r.\u5151\u6362\u7801})` : ""}`).join("\u3001");
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u4E2D\u5956\u8BB0\u5F55 ${detail}`, true);
      }
      return records;
    }
    islandLoadPrizeCache() {
      const key = this.islandCacheKey();
      if (!key) return [];
      const cache = readJSON(ISLAND_PRIZE_KEY, {});
      const value = cache[key];
      return Array.isArray(value) ? value.filter((x) => x && typeof x === "object") : [];
    }
    islandSavePrizeCache(records) {
      const key = this.islandCacheKey();
      if (!key) return;
      const cache = readJSON(ISLAND_PRIZE_KEY, {});
      cache[key] = records;
      writeJSON(ISLAND_PRIZE_KEY, cache);
    }
    async islandCloudPhotoMap(token, maxPages = 20) {
      const mapping = {};
      const extra = { Referer: `https://panservice.mail.wo.cn/h5/mobile/mgtv?type=1&token=${token}`, "X-YP-Client-Id": "1001000003", clientId: "1001000003" };
      for (let page = 1; page <= maxPages; page++) {
        const data = await this.islandPost(token, "/wohome/knowledge/queryTypeFileList", { pageSize: 100, pageNo: page, suffixList: ["jpg", "jpeg", "png"], fileType: "1", spaceType: 0, sortRule: "0" }, extra);
        const details = (data.result || {}).details || [];
        for (const item of details) {
          const name = String(item.fileName || "").trim(), fid = String(item.fid || "").trim();
          if (name && fid && !mapping[name]) mapping[name] = fid;
        }
        if (details.length < 100) break;
      }
      return mapping;
    }
    async islandUploadPhoto(token, bytes, remoteName) {
      const fsize = bytes.length;
      const ext = String(remoteName).toLowerCase().slice(-4);
      const mime = ext === ".png" ? "image/png" : "image/jpeg";
      const plain = `{"spaceType":"0","directoryId":"0","batchNo":"${compactTime()}","fileName":"${remoteName}","fileSize":${fsize},"fileType":"1"}`;
      let fileInfo = "";
      try {
        fileInfo = this.cloudEncrypt(plain, token);
      } catch (e) {
        return "";
      }
      const boundary = `----LoonBoundary${randomString(16, "0123456789abcdef")}`;
      const parts = [];
      const field = (name, value) => parts.push(asciiBytes(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
      const uniqueId = `${nowMs()}_${randomString(6, "abcdefghijklmnopqrstuvwxyz0123456789")}`;
      field("uniqueId", uniqueId);
      field("accessToken", token);
      field("fileName", remoteName);
      field("psToken", "undefined");
      field("fileSize", String(fsize));
      field("totalPart", "1");
      field("partSize", String(fsize));
      field("partIndex", "1");
      field("channel", "wocloud");
      field("directoryId", "0");
      field("fileInfo", fileInfo);
      parts.push(asciiBytes(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${remoteName}"\r\nContent-Type: ${mime}\r\n\r\n`));
      parts.push(bytes);
      parts.push(asciiBytes(`\r\n--${boundary}--\r\n`));
      const r = await this.req("post", "https://du.smartont.net:8443/openapi/client/upload2C", {
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0", origin: "https://pan.wo.cn", referer: "https://pan.wo.cn/", "accept-language": "zh-CN,zh;q=0.9" },
        body: concatBytes(parts),
        timeout: 60000
      });
      if (r.status !== 200) return "";
      const fid = this.islandFindFid(r.json);
      if (fid) return fid;
      const map = await this.islandCloudPhotoMap(token);
      return map[remoteName] || "";
    }
    async islandImageCandidates(token) {
      const candidates = [], seen = new Set();
      const add = (value, name) => {
        const v = String(value || "").trim();
        if (v && !seen.has(v)) {
          seen.add(v);
          candidates.push([v, name]);
        }
      };
      if (ISLAND_MGTV_IMG_FID) add(ISLAND_MGTV_IMG_FID, "\u6307\u5B9A\u56FE\u7247");
      const works = await this.islandPost(token, "/wohome/open/v1/ai/getNewYearWorksList", { pageSize: 20, pageNo: 1, type: 0 }, { Referer: `https://panservice.mail.wo.cn/h5/mobile/aiProduct?token=${token}`, "X-YP-Client-Id": "1001000003", clientId: "1001000003" });
      for (const item of ((works.result || {}).result || [])) {
        if (safeInt(item.status) === 1 && safeInt(item.type) === 5) {
          const fid = qs(String(item.uploadPictureUrl || "")).fid || "";
          add(fid, `\u5386\u53F2\u4F5C\u54C1${item.id || ""}\u4EBA\u8138\u56FE`);
        }
      }
      for (let page = 1; page <= 2; page++) {
        const data = await this.islandPost(token, "/wohome/knowledge/queryTypeFileList", { pageSize: 100, pageNo: page, suffixList: ["jpg", "jpeg", "png"], fileType: "1", spaceType: 0, sortRule: "0" }, { Referer: `https://panservice.mail.wo.cn/h5/mobile/mgtv?type=1&token=${token}`, "X-YP-Client-Id": "1001000003", clientId: "1001000003" });
        const details = (data.result || {}).details || [];
        for (const item of details) add(item.fid, item.fileName || String(item.fid).slice(0, 12));
        if (details.length < 100) break;
      }
      if (!candidates.length) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: \u672A\u627E\u5230\u53EF\u7528\u4EBA\u8138\u56FE\u7247, \u8BF7\u5728\u8054\u901A\u4E91\u76D8\u653E\u4E00\u5F20\u6E05\u6670\u5355\u4EBA\u6B63\u8138\u56FE");
        return candidates;
      }
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = candidates[i];
        candidates[i] = candidates[j];
        candidates[j] = tmp;
      }
      return candidates;
    }
    async islandCleanupPhotos(token) {
      try {
        const map = await this.islandCloudPhotoMap(token);
        const targets = [];
        for (const name of Object.keys(map)) {
          if (name.indexOf(ISLAND_TEMP_PHOTO_PREFIX) === 0) targets.push({ id: map[name], type: "1" });
        }
        if (!targets.length) {
          this.log("\u6D77\u5C9B\u9010\u6D6A: \u7F51\u76D8\u65E0\u4E34\u65F6\u7167\u7247\u9700\u6E05\u7406");
          return;
        }
        const deleted = await this.deleteRootFiles(targets, "0");
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u5DF2\u6E05\u7406\u7F51\u76D8\u4E34\u65F6\u7167\u7247 ${deleted} \u4E2A`);
      } catch (e) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6E05\u7406\u4E34\u65F6\u7167\u7247\u5F02\u5E38 ${e && e.message || e}`);
      }
    }
    islandMgtvHeaders() {
      return {
        "User-Agent": ISLAND_ACT_UA,
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Origin: "https://pop.mgtv.com",
        Referer: "https://pop.mgtv.com/",
        "sec-fetch-site": "same-site",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "accept-language": "zh-CN,zh-Hans;q=0.9"
      };
    }
    async islandMgtvGet(path, ticket, params = {}) {
      const all = { ticket, t: nowMs(), ...params };
      const query = Object.keys(all).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(all[k])}`).join("&");
      try {
        return await this.get(`${ISLAND_MGTV_BASE}${path}?${query}`, this.islandMgtvHeaders()) || {};
      } catch (e) {
        return {};
      }
    }
    islandBool(value) {
      return value === true || ["true", "1", "yes"].indexOf(String(value).trim().toLowerCase()) >= 0;
    }
    async islandMgtvAvailable(ticket) {
      const data = await this.islandMgtvGet("/api/cu/queryAvailableTimes", ticket);
      const info = data.data;
      if (String(data.errno) !== "0" || !info || typeof info !== "object" || info.faceCount === undefined) return -1;
      return safeInt(info.faceCount);
    }
    async islandMgtvWaitQuota(ticket, cycles = 6, gap = 10) {
      for (let i = 0; i < cycles; i++) {
        const n = await this.islandMgtvAvailable(ticket);
        if (n > 0) {
          this.log(`\u6D77\u5C9B\u9010\u6D6A: AI\u6B21\u6570\u5DF2\u5230\u8D26 ${n}`);
          return n;
        }
        if (i < cycles - 1) {
          this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6743\u76CA\u53D1\u653E\u4E2D, \u7B49\u5F85\u5230\u8D26... (${i + 1}/${cycles})`);
          await sleep(gap * 1000);
        }
      }
      return 0;
    }
    async islandMgtvEnsureQuota(ticket) {
      const face = await this.islandMgtvAvailable(ticket);
      if (face < 0) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: AI\u6B21\u6570\u67E5\u8BE2\u5931\u8D25, \u76F4\u63A5\u5C1D\u8BD5\u63D0\u4EA4");
        return "ok";
      }
      this.log(`\u6D77\u5C9B\u9010\u6D6A: AI\u53EF\u7528\u6B21\u6570 ${face}`);
      if (face > 0) return "ok";
      const mem = (await this.islandMgtvGet("/api/cu/queryMemberInfo", ticket)).data || {};
      const offSub = safeInt(mem.offlineSubscribeSuccess);
      const raw = (await this.islandMgtvGet("/api/cu/queryClaimEligibilityDetail", ticket)).data;
      const el = raw && typeof raw === "object" && raw.data && typeof raw.data === "object" ? raw.data : raw || {};
      if (!el || !Object.keys(el).length) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: \u9886\u53D6\u8D44\u683C\u67E5\u8BE2\u5931\u8D25, \u65E0AI\u6B21\u6570\u53EF\u7528");
        return "no";
      }
      const hasCampus = this.islandBool(el.hasCampusRights);
      const claimed = this.islandBool(el.isClaimThisMonth);
      const thisChannel = this.islandBool(el.isThisChannelRights);
      const remain = this.islandBool(el.hasRemainingNum);
      this.log(`\u6D77\u5C9B\u9010\u6D6A: \u9886\u53D6\u8D44\u683C hasCampusRights=${hasCampus} isClaimThisMonth=${claimed} isThisChannelRights=${thisChannel} hasRemainingNum=${remain}`);
      if (!hasCampus) return "probe";
      if (claimed) {
        if (thisChannel && offSub === 1) {
          this.log("\u6D77\u5C9B\u9010\u6D6A: \u5DF2\u9886\u53D6\u8BE5\u9891\u9053\u6743\u76CA, \u53D1\u653E\u4E2D, \u7B49\u5F85\u5230\u8D26...");
          if (await this.islandMgtvWaitQuota(ticket) > 0) return "ok";
        }
        return "no";
      }
      if (!remain) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: \u65E0\u5269\u4F59\u53EF\u9886\u6B21\u6570, \u9700\u5F00\u901A\u8292\u679CAI\u670D\u52A1\u5305");
        return "no";
      }
      const grant = await this.islandMgtvGet("/api/cu/offlineSubscribe", ticket);
      const ok = safeInt((grant.data || {}).success) === 1;
      this.log(`\u6D77\u5C9B\u9010\u6D6A: \u9886\u53D6\u6743\u76CA ${ok ? "\u6210\u529F" : "\u5931\u8D25"}`);
      if (ok && await this.islandMgtvWaitQuota(ticket) > 0) return "ok";
      return "no";
    }
    async islandMgtvSubmit(ticket, imgFid) {
      try {
        return await this.postJSON(`${ISLAND_MGTV_BASE}/api/cu/video/template/submit`, { ticket, t: nowMs(), templateId: ISLAND_MGTV_TEMPLATE_ID, index: 0, imgUrl: imgFid }, this.islandMgtvHeaders(), { timeout: 20000 }) || {};
      } catch (e) {
        return {};
      }
    }
    async islandAiVideo(token) {
      const result = await this.islandRequest(token, "/api-user/api/user/ticket");
      const ticket = (result.result || {}).ticket;
      if (!ticket) {
        this.log("\u6D77\u5C9B\u9010\u6D6A: AI\u5165\u620F\u672A\u83B7\u53D6\u5230\u767B\u5F55\u51ED\u636E");
        return false;
      }
      const login = await this.islandMgtvGet("/api/cu/login", ticket);
      const mgtvTicket = (login.data || {}).ticket;
      if (!mgtvTicket) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: AI\u5165\u620F\u767B\u5F55\u5931\u8D25 ${responseMessage(login)}`);
        return false;
      }
      this.log("\u6D77\u5C9B\u9010\u6D6A: \u8292\u679CTV\u767B\u5F55\u6210\u529F");
      await this.islandMgtvGet("/api/cu/popup/check", mgtvTicket);
      const candidates = await this.islandImageCandidates(token);
      if (!candidates.length) return false;
      const quotaState = await this.islandMgtvEnsureQuota(mgtvTicket);
      if (quotaState === "no") return false;
      for (const [imgFid, imgName] of candidates) {
        this.log(`\u6D77\u5C9B\u9010\u6D6A: \u9009\u7528\u56FE\u7247 ${imgName}`);
        let data = await this.islandMgtvSubmit(mgtvTicket, imgFid);
        for (let i = 0; i < 2; i++) {
          if (String(data.msg) !== "\u6743\u76CA\u6263\u51CF\u5931\u8D25") break;
          if (quotaState === "probe") {
            this.log("\u6D77\u5C9B\u9010\u6D6A: \u514D\u8D39\u4F53\u9A8C\u989D\u5EA6\u4E0D\u53EF\u7528, \u9700\u624B\u52A8\u9886\u53D6\u6743\u76CA");
            return false;
          }
          this.log("\u6D77\u5C9B\u9010\u6D6A: \u6743\u76CA\u6263\u51CF\u5931\u8D25, \u91CD\u65B0\u6821\u9A8C\u6743\u76CA");
          if (await this.islandMgtvEnsureQuota(mgtvTicket) !== "ok") return false;
          data = await this.islandMgtvSubmit(mgtvTicket, imgFid);
        }
        const taskId = ((data.data || {}).taskId) || data.taskId;
        if (!taskId) {
          const msg = String(data.msg || responseMessage(data));
          this.log(`\u6D77\u5C9B\u9010\u6D6A: \u6A21\u677F\u63D0\u4EA4\u5931\u8D25 ${msg}`);
          if (["\u7167\u7247", "\u4EBA\u8138", "\u8BC6\u522B", "\u753B\u8D28", "\u6E05\u6670", "\u56FE\u7247"].some((k) => msg.indexOf(k) >= 0)) {
            this.log(`\u6D77\u5C9B\u9010\u6D6A: \u8BE5\u7167\u7247\u4E0D\u7B26\u5408\u6807\u51C6, \u6362\u4E0B\u4E00\u5F20 (${imgName})`);
            continue;
          }
          return false;
        }
        for (let i = 0; i < 20; i++) {
          const info = (await this.islandMgtvGet("/api/cu/video/template/result", mgtvTicket, { taskId })).data || {};
          const audit = safeInt(info.auditState), algorithm = safeInt(info.algorithmState);
          if (audit === 2 || (audit > 1 && algorithm > 1)) {
            this.log("\u6D77\u5C9B\u9010\u6D6A: AI\u5165\u620F\u5236\u4F5C\u6210\u529F", true);
            return true;
          }
          await sleep(3000);
        }
        this.log("\u6D77\u5C9B\u9010\u6D6A: \u6A21\u677F\u4ECD\u5728\u751F\u6210, \u8BF7\u7A0D\u540E\u91CD\u8DD1");
        return false;
      }
      this.log("\u6D77\u5C9B\u9010\u6D6A: \u6CA1\u6709\u53EF\u901A\u8FC7\u8BC6\u522B\u7684\u56FE\u7247");
      return false;
    }
    islandCacheKey() {
      return String(this.accountMobile || this.mobile || "").trim();
    }
    islandLoadCachedToken() {
      const key = this.islandCacheKey();
      if (!key) return "";
      const cache = readJSON(CLOUD_TOKEN_KEY, {});
      const entry = cache[key];
      if (!entry || !entry.userToken) return "";
      const ts = safeInt(entry.ts);
      if (nowMs() - ts >= ISLAND_CLOUD_TTL_HOURS * 3600 * 1000) return "";
      return String(entry.userToken);
    }
    islandSaveCachedToken(token) {
      const key = this.islandCacheKey();
      if (!key || !token) return;
      const cache = readJSON(CLOUD_TOKEN_KEY, {});
      cache[key] = { userToken: token, ts: nowMs(), time: dateTime() };
      writeJSON(CLOUD_TOKEN_KEY, cache);
    }
    async islandTokenValid(token) {
      const data = await this.islandGet(token, "/activity/checkActivityStatus", { activityId: ISLAND_ACTIVITY_ID });
      const meta = data.meta || {};
      const code = String(meta.code || "");
      if (code === "200" || code === "-1") return true;
      const msg = String(meta.message || "");
      if (["401", "403", "40101", "40001", "40401"].indexOf(code) >= 0) return false;
      if (["\u767B\u5F55", "token", "Token", "\u6388\u6743", "\u8EAB\u4EFD", "\u5931\u6548"].some((k) => msg.indexOf(k) >= 0)) return false;
      return true;
    }
    async cloudClean() {
      if (!this.cloudToken) return;
      this.log("\u4E91\u76D8\u4EFB\u52A1: \u5F00\u59CB\u6E05\u7406\u4E91\u76D8\u91CD\u590D\u6587\u4EF6");
      const uploadedCount = safeInt((this.cloudDisk || {}).uploadedFileCount);
      const retryCount = uploadedCount > 0 ? 6 : 1;
      let taskId = "", fileIds = [];
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        const res = await this.postJSON("https://s.pan.wo.cn/wohome/intelligentClean/getScanStateAndResult", { pathLevelList: [{ levelType: "space", levelName: "\u4E2A\u4EBA\u4E91", busId: "0" }] }, this.cloudHeaders(), { timeout: 10000 });
        if (String((res.meta || {}).code) !== "200") {
          this.log("\u4E91\u76D8\u4EFB\u52A1: \u83B7\u53D6\u626B\u63CF\u72B6\u6001\u5931\u8D25");
          return;
        }
        taskId = "";
        for (const item of (res.result || {}).subTaskList || []) {
          if (item && item.taskId) {
            taskId = item.taskId;
            break;
          }
        }
        if (taskId) {
          fileIds = [];
          let page = 1, maxPage = 1;
          while (page <= maxPage) {
            const pageRes = await this.postJSON("https://s.pan.wo.cn/wohome/intelligentClean/getCleanData", { pageNum: page, taskId, type: 3, pageSize: 50 }, this.cloudHeaders(), { timeout: 10000 });
            if (String((pageRes.meta || {}).code) !== "200") break;
            maxPage = safeInt((pageRes.result || {}).maxPageNum, 1);
            for (const group of (pageRes.result || {}).fileGroupList || []) {
              (group.fileList || []).forEach((fi, idx) => {
                if (idx > 0 && fi && fi.fileId) fileIds.push({ fileId: fi.fileId, spaceType: fi.spaceType || "0" });
              });
            }
            page++;
          }
        }
        if (fileIds.length) {
          this.log(`\u4E91\u76D8\u4EFB\u52A1: \u7B2C${attempt}\u6B21\u91CD\u590D\u626B\u63CF\u5B8C\u6210\uFF0C\u5171${fileIds.length}\u4E2A\u91CD\u590D\u6587\u4EF6`);
          break;
        }
        if (attempt < retryCount) {
          const wait = Math.min(5 + (attempt - 1) * 2, 12);
          this.log(`\u4E91\u76D8\u4EFB\u52A1: \u7B2C${attempt}\u6B21\u91CD\u590D\u626B\u63CF\u672A\u53D1\u73B0\u53EF\u6E05\u7406\u6587\u4EF6\uFF0C${wait}\u79D2\u540E\u91CD\u8BD5`);
          await sleep(wait * 1000);
        }
      }
      const preview = (list) => `${list.slice(0, 6).map((x) => x.name).join("\u3001")}${list.length > 6 ? "..." : ""}`;
      if (!fileIds.length) {
        const named = uploadedCount > 0 ? await this.listUploadNamedFiles() : [];
        if (named.length) {
          this.log(`\u4E91\u76D8\u4EFB\u52A1: \u667A\u80FD\u6E05\u7406\u672A\u8BC6\u522B\u5230\u91CD\u590D\u9879\uFF0C\u4F46\u6839\u76EE\u5F55\u68C0\u6D4B\u5230${named.length}\u4E2A[${this.cloudUploadName()}]\u7CFB\u5217\u6587\u4EF6: ${preview(named)}`);
          const deleted = await this.deleteRootFiles(named);
          if (this.cloudDisk) this.cloudDisk.uploadedFileCount = 0;
          this.log(deleted ? `\u4E91\u76D8\u4EFB\u52A1: \u5DF2\u901A\u8FC7\u5B98\u65B9\u5220\u9664\u63A5\u53E3\u6E05\u7406${deleted}\u4E2A[${this.cloudUploadName()}]\u7CFB\u5217\u6587\u4EF6` : `\u4E91\u76D8\u4EFB\u52A1: [${this.cloudUploadName()}]\u7CFB\u5217\u6587\u4EF6\u5220\u9664\u5931\u8D25`);
        } else {
          if (this.cloudDisk) this.cloudDisk.uploadedFileCount = 0;
          this.log("\u4E91\u76D8\u4EFB\u52A1: \u65E0\u91CD\u590D\u6587\u4EF6");
        }
        return;
      }
      for (let offset = 0; offset < fileIds.length; offset += 100) {
        const batch = fileIds.slice(offset, offset + 100);
        const batchRes = await this.postJSON("https://s.pan.wo.cn/wohome/intelligentClean/batchClean", { fileList: batch, taskType: 3, taskId }, this.cloudHeaders(), { timeout: 30000 });
        this.log(`\u4E91\u76D8\u4EFB\u52A1: \u7B2C${offset / 100 + 1}\u6279\u6E05\u7406: ${String((batchRes.meta || {}).code) === "200" ? "\u6210\u529F" : "\u5931\u8D25"}`);
        await sleep(2000);
      }
      const named2 = uploadedCount > 0 ? await this.listUploadNamedFiles() : [];
      if (named2.length) {
        this.log(`\u4E91\u76D8\u4EFB\u52A1: \u667A\u80FD\u6E05\u7406\u540E\u6839\u76EE\u5F55\u4ECD\u68C0\u6D4B\u5230${named2.length}\u4E2A[${this.cloudUploadName()}]\u7CFB\u5217\u6587\u4EF6: ${preview(named2)}`);
        const deleted = await this.deleteRootFiles(named2);
        if (deleted) this.log(`\u4E91\u76D8\u4EFB\u52A1: \u5DF2\u901A\u8FC7\u5B98\u65B9\u5220\u9664\u63A5\u53E3\u8865\u5145\u6E05\u7406${deleted}\u4E2A[${this.cloudUploadName()}]\u7CFB\u5217\u6587\u4EF6`);
      }
      if (this.cloudDisk) this.cloudDisk.uploadedFileCount = 0;
      this.log("\u4E91\u76D8\u4EFB\u52A1: \u4E91\u76D8\u91CD\u590D\u6587\u4EF6\u6E05\u7406\u5B8C\u6210");
    }
    hometownHeaders(token, extra = {}) {
      return {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) LianTongYunPan/5.1.0 (iPhone; iOS 16.6)",
        "source-type": "woapi",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        clientId: "1001000165",
        "X-YP-Client-Id": "1001000165",
        "X-YP-Access-Token": token,
        token,
        "X-SH-Access-Token": "",
        "X-YP-GRAY-FLAG": "undefined",
        requestTime: String(nowMs()),
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        ...extra
      };
    }
    hometownAes(text, key) {
      return aesCbcB64(String(text), String(key), HOMETOWN_AES_IV);
    }
    hometownSign(payload) {
      const parts = Object.keys(payload).sort().filter((k) => k !== "sign" && payload[k] !== null && payload[k] !== undefined && String(payload[k]).trim() !== "").map((k) => `${k}=${String(payload[k]).trim()}`);
      return sha256HmacHex(parts.join("&") + `&secret=${HOMETOWN_LOTTERY_SECRET}`, HOMETOWN_LOTTERY_SECRET);
    }
    async hometownTimestamp(token, key = "activity:lottery") {
      const res = await this.postJSON("https://panservice.mail.wo.cn/activity/getTimestamp", { key }, this.hometownHeaders(token), { timeout: 15000 });
      if (String((res.meta || {}).code) === "200") return res.result || {};
      this.log(`\u5BB6\u4E61\u6253\u5361: \u83B7\u53D6\u65F6\u95F4\u6233\u5931\u8D25 ${responseMessage(res)}`);
      return null;
    }
    async hometownLocation(token) {
      const mobile = this.accountMobile;
      if (!token || !mobile) {
        this.log("\u5BB6\u4E61\u6253\u5361: \u67E5\u8BE2\u5F52\u5C5E\u5730\u5931\u8D25\uFF0CToken\u6216\u624B\u673A\u53F7\u4E3A\u7A7A");
        return null;
      }
      const res = await this.postJSON("https://panservice.mail.wo.cn/api-user/user/info/query", { mobile: this.hometownAes(mobile, HOMETOWN_MOBILE_KEY) }, this.hometownHeaders(token), { timeout: 15000 });
      if (String((res.meta || {}).code) === "200") {
        const r = res.result || {};
        if (r.provinceCode) {
          this.log(`\u5BB6\u4E61\u6253\u5361: \u5F52\u5C5E\u5730 ${r.provinceName}(${r.provinceCode})`);
          return r;
        }
        this.log("\u5BB6\u4E61\u6253\u5361: \u5F52\u5C5E\u5730\u67E5\u8BE2\u5931\u8D25\uFF0C\u65E0\u7701\u4EFD\u4FE1\u606F");
      } else {
        this.log(`\u5BB6\u4E61\u6253\u5361: \u5F52\u5C5E\u5730\u67E5\u8BE2\u5931\u8D25 ${responseMessage(res)}`);
      }
      return null;
    }
    async hometownTicket(token) {
      const res = await this.postJSON("https://panservice.mail.wo.cn/api-user/api/user/ticket", {}, this.hometownHeaders(token, { accesstoken: token, "access-token": token, "app-type": "unicom", "X-CM-SERVICE": "PHONE", "X-YP-Open-Version": "v1.0", Accept: "*" }), { timeout: 15000 });
      const ticket = (res.result || {}).ticket;
      if (!ticket) this.log(`\u5BB6\u4E61\u6253\u5361: \u83B7\u53D6\u4E91\u76D8\u57FA\u7840Ticket\u5931\u8D25 ${responseMessage(res)}`);
      return ticket || "";
    }
    async hometownOpen(token, ticket, provinceCode, provinceName) {
      if (!token || !provinceCode || !provinceName) {
        this.log("\u5BB6\u4E61\u6253\u5361: \u5F00\u542F\u6D3B\u52A8\u5931\u8D25\uFF0CToken\u6216\u5F52\u5C5E\u5730\u4FE1\u606F\u4E0D\u5B8C\u6574");
        return false;
      }
      const mobile = this.accountMobile;
      const referer = `https://panservice.mail.wo.cn/h5/activitymobile/fileUploadActive?touchpoint=300200030001&type=06&ticket=${ticket}&version=iphone_c%4012.0801&timestamp=${nowMs()}&desmobile=${mobile}&num=0&postage=01addda9786dc7eb5ca0eacd9acd664a&activityId=${HOMETOWN_OPEN_ACTIVITY_ID}&clientid=1001000003&userNumber=${mobile}`;
      const res = await this.postJSON("https://panservice.mail.wo.cn/activity/openActivity", { activityId: HOMETOWN_LOTTERY_ACTIVITY_ID, provinceCode, provinceName }, this.hometownHeaders(token, { Referer: referer }), { timeout: 15000 });
      this.log(`\u5BB6\u4E61\u6253\u5361: \u5F00\u542F\u7ED3\u679C ${res.msg || responseMessage(res)}`);
      return true;
    }
    async hometownUpload(token) {
      this.hometownUploadedFiles = [];
      if (!token) {
        this.log("\u5BB6\u4E61\u6253\u5361: \u4E0A\u4F20\u5931\u8D25\uFF0CToken\u4E3A\u7A7A");
        return false;
      }
      const bytes = b64ToBytes(HOMETOWN_MATERIAL_B64);
      const batchNo = compactTime();
      const fileInfoPlain = `{"spaceType":"0","directoryId":"0","batchNo":"${batchNo}","fileName":"8648","fileSize":${bytes.length},"fileType":"1"}`;
      const fileInfo = this.hometownAes(fileInfoPlain, String(token).slice(0, 16));
      const uniqueId = `${nowMs()}_${randomString(6, "abcdefghijklmnopqrstuvwxyz0123456789")}`;
      const boundary = `----LoonBoundary${randomString(16, "0123456789abcdef")}`;
      const parts = [];
      const field = (name, value) => parts.push(asciiBytes(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
      field("uniqueId", uniqueId);
      field("accessToken", token);
      field("fileName", "8648");
      field("psToken", "undefined");
      field("fileSize", String(bytes.length));
      field("totalPart", "1");
      field("partSize", String(bytes.length));
      field("partIndex", "1");
      field("channel", "wocloud");
      field("directoryId", "0");
      field("fileInfo", fileInfo);
      parts.push(asciiBytes(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="8648"\r\nContent-Type: image/jpeg\r\n\r\n`));
      parts.push(bytes);
      parts.push(asciiBytes(`\r\n--${boundary}--\r\n`));
      const body = concatBytes(parts);
      const r = await this.req("post", "https://du.smartont.net:8443/openapi/client/upload2C", {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0",
          origin: "https://pan.wo.cn",
          referer: "https://pan.wo.cn/",
          "accept-language": "zh-CN,zh;q=0.9",
          "sec-fetch-site": "same-site",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty"
        },
        body,
        timeout: 60000
      });
      const res = r.json || {};
      const code = String(res.code !== undefined ? res.code : (res.meta || {}).code || "");
      const success = r.status === 200 && (code === "0000" || code === "0" || code === "200");
      const fid = ((res.data || {}).fid) || this.islandFindFid(res);
      if (success && fid) this.hometownUploadedFiles.push({ id: fid, type: "1" });
      this.log(`\u5BB6\u4E61\u6253\u5361: \u6587\u4EF6\u4E0A\u4F20 ${success ? "\u6210\u529F" : "\u5931\u8D25"} ${responseMessage(res)}`);
      return success;
    }
    islandFindFid(node, depth = 0) {
      if (!node || depth > 6) return "";
      if (typeof node === "object") {
        for (const k of ["fid", "fileId", "fileID", "id"]) {
          const v = String(node[k] || "").trim();
          if (v && v.length > 6) return v;
        }
        for (const k of Object.keys(node)) {
          const found = this.islandFindFid(node[k], depth + 1);
          if (found) return found;
        }
      } else if (Array.isArray(node)) {
        for (const item of node) {
          const found = this.islandFindFid(item, depth + 1);
          if (found) return found;
        }
      }
      return "";
    }
    async hometownOpen(token, ticket, provinceCode, provinceName) {
      if (!token || !provinceCode || !provinceName) {
        this.log("\u5BB6\u4E61\u6253\u5361: \u5F00\u542F\u6D3B\u52A8\u5931\u8D25\uFF0CToken\u6216\u5F52\u5C5E\u5730\u4FE1\u606F\u4E0D\u5B8C\u6574");
        return false;
      }
      const mobile = this.accountMobile;
      const referer = `https://panservice.mail.wo.cn/h5/activitymobile/fileUploadActive?touchpoint=300200030001&type=06&ticket=${ticket}&version=iphone_c%4012.0801&timestamp=${nowMs()}&desmobile=${mobile}&num=0&postage=01addda9786dc7eb5ca0eacd9acd664a&activityId=${HOMETOWN_OPEN_ACTIVITY_ID}&clientid=1001000003&userNumber=${mobile}`;
      const res = await this.postJSON("https://panservice.mail.wo.cn/activity/openActivity", { activityId: HOMETOWN_LOTTERY_ACTIVITY_ID, provinceCode, provinceName }, this.hometownHeaders(token, { Referer: referer }), { timeout: 15000 });
      this.log(`\u5BB6\u4E61\u6253\u5361: \u5F00\u542F\u7ED3\u679C ${res.msg || (res.meta || {}).message || "\u54CD\u5E94\u672A\u5305\u542B\u4E1A\u52A1\u72B6\u6001"}`);
      return String((res.meta || {}).code) === "200";
    }
    async hometownLottery(token) {
      if (!token) return;
      const ts = await this.hometownTimestamp(token);
      if (!ts) {
        this.log("\u5BB6\u4E61\u6253\u5361: \u62BD\u5956\u5931\u8D25\uFF0C\u65E0\u6CD5\u83B7\u53D6\u65F6\u95F4\u6233");
        return;
      }
      const payload = { activityId: HOMETOWN_LOTTERY_ACTIVITY_ID, nonce: ts.nonce || "", timestamp: ts.timestamp || 0 };
      payload.sign = this.hometownSign(payload);
      const res = await this.postJSON("https://panservice.mail.wo.cn/activity/lottery", payload, this.hometownHeaders(token), { timeout: 15000 });
      if (String((res.meta || {}).code) === "200") {
        const r = res.result || {};
        this.log(`\u5BB6\u4E61\u6253\u5361: \u62BD\u5956\u7ED3\u679C ${r.prizeName || "\u672A\u83B7\u53D6\u5230\u5956\u54C1\u4FE1\u606F"}`, true);
        if (safeInt(r.lotteryTimes) > 0) this.log(`\u5BB6\u4E61\u6253\u5361: \u5269\u4F59\u62BD\u5956\u6B21\u6570 ${r.lotteryTimes}`);
      } else {
        this.log(`\u5BB6\u4E61\u6253\u5361: \u62BD\u5956\u5931\u8D25 ${responseMessage(res)}`);
      }
    }
    async hometownCleanup() {
      const matched = this.hometownUploadedFiles || [];
      if (!matched.length) return;
      try {
        const deleted = await this.deleteRootFiles(matched, "0");
        this.log(`\u5BB6\u4E61\u6253\u5361: \u5DF2\u6E05\u7406\u672C\u6B21\u4E0A\u4F20\u6587\u4EF6 ${deleted} \u4E2A`);
        this.hometownUploadedFiles = [];
      } catch (e) {
        this.log(`\u5BB6\u4E61\u6253\u5361: \u6E05\u7406\u672C\u6B21\u4E0A\u4F20\u6587\u4EF6\u5F02\u5E38 ${e && e.message || e}`);
      }
    }
    async hometownTask(token) {
      this.log("==== \u4E91\u76D8\u5BB6\u4E61\u6253\u5361 ====");
      const loc = await this.hometownLocation(token);
      if (!loc) return;
      const ticket = await this.hometownTicket(token);
      if (!await this.hometownOpen(token, ticket, loc.provinceCode, loc.provinceName)) return;
      this.log("\u5BB6\u4E61\u6253\u5361: \u5F00\u59CB\u6587\u4EF6\u4E0A\u4F20...");
      const uploaded = await this.hometownUpload(token);
      this.hometownUploaded = uploaded;
      await sleep(5000);
      await this.hometownLottery(token);
      if (uploaded) await this.hometownCleanup();
    }
    async securityTask() {
      this.log("==== \u8054\u901A\u5B89\u5168\u7BA1\u5BB6 ====");
      if (!this.ecsToken) {
        this.log("\u5B89\u5168\u7BA1\u5BB6: \u7F3A\u5C11 ecs_token\uFF0C\u8DF3\u8FC7");
        return;
      }
      this.secPendingClaims = this.secPendingClaims || {};
      try {
        await this.secGetTicket();
        if (!this.secTicket1) return;
        await this.secGetAuthToken();
        if (!this.secToken) return;
        await this.secGetJfTicket();
        if (!this.secTicket) return;
        this.secOldJFPoints = null;
        await this.secGetUserInfo();
        if (CFG.queryOnly) {
          this.log("\u8054\u901A\u52A9\u7406\u79EF\u5206\uFF1A[\u67E5\u8BE2\u6A21\u5F0F] \u8DF3\u8FC7\u4EFB\u52A1\u6267\u884C");
          return;
        }
        await this.secGetSecretKey();
        await this.secExecuteAllTasks();
        this.log("\u7B49\u5F85\u79EF\u5206\u5230\u8D26\uFF0C\u7B49\u5F85\u4E00\u4F1A...");
        await this.secRecoverPendingClaims(2, 12000, true);
        await sleep(3000);
        await this.secGetUserInfo();
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u5F02\u5E38: ${e && e.message || e}`);
      }
    }
    async secGetTicket() {
      const headers = {
        Cookie: `PvSessionId=${compactTime()}${this.unicomTokenId};c_mobile=${this.accountMobile}; c_version=iphone_c@11.0800; city=036||90063345|-99;devicedId=${this.unicomTokenId}; ecs_token=${this.ecsToken};t3_token=`,
        Accept: "*/*",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ChinaUnicom4.x/12.3.1 (com.chinaunicom.mobilebusiness; build:77; iOS 16.6.0) Alamofire/4.7.3 unicom{version:iphone_c@12.0301}",
        "Accept-Language": "zh-Hans-CN;q=1.0"
      };
      const r = await this.get(`https://m.client.10010.com/edop_ng/getTicketByNative?token=${encodeURIComponent(this.ecsToken)}&appId=edop_unicom_3a6cc75a`, headers);
      this.secTicket1 = r.ticket || "";
      if (!this.secTicket1) this.log(`\u5B89\u5168\u7BA1\u5BB6: getTicketByNative_sec \u5931\u8D25 - ${responseMessage(r)}`);
    }
    async secGetAuthToken() {
      if (!this.secTicket1) return;
      const a = await this.postJSON("https://uca.wo116114.com/api/v1/auth/ticket?product_line=uasp&entry_point=h5&entry_point_id=edop_unicom_3a6cc75a", { productId: "", type: 1, ticket: this.secTicket1 }, { "User-Agent": SEC_APP_UA, "Content-Type": "application/json", clientType: "uasp_unicom_applet" });
      this.secToken = ((a.data || {}).access_token) || "";
      if (!this.secToken) this.log(`\u5B89\u5168\u7BA1\u5BB6: getAuthToken_sec \u5931\u8D25 - ${responseMessage(a)}`);
    }
    async secGetJfTicket() {
      if (!this.secToken) return;
      const j = await this.postJSON("https://uca.wo116114.com/api/v1/auth/getTicket?product_line=uasp&entry_point=h5&entry_point_id=edop_unicom_3a6cc75a", { productId: "91311616", phone: this.accountMobile }, { "User-Agent": SEC_APP_UA, "Content-Type": "application/json", "auth-sa-token": this.secToken, clientType: "uasp_unicom_applet" });
      this.secTicket = ((j.data || {}).ticket) || "";
      if (!this.secTicket) {
        this.log("\u5B89\u5168\u7BA1\u5BB6\u83B7\u53D6\u79EF\u5206\u7968\u636E\u5931\u8D25");
        return;
      }
      for (let i = 0; i < 2; i++) {
        const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/page/query", { headers: this.secJfHeaders(false), body: JSON.stringify({ activityId: "s747395186896173056", partnersId: "1702" }) });
        this.updateSecJea(r.headers);
      }
    }
    updateSecJea(headers) {
      const raw = getHeader(headers || {}, "Set-Cookie");
      const m = String(raw).match(/_jea_id=([^;,\s]+)/);
      if (m) this.secJea = m[1];
      return this.secJea || "";
    }
    secJfHeaders(withSignature = false) {
      const h = {
        ticket: decodeURIComponent(this.secTicket || ""),
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 unicom{version:iphone_c@12.0301};ltst;OSVersion/16.6",
        partnersid: "1702",
        clienttype: "uasp_unicom_applet",
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Origin: "https://m.jf.10010.com",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
      };
      if (this.secJea) h.Cookie = `_jea_id=${this.secJea};`;
      if (withSignature) Object.assign(h, this.secSignatureHeaders());
      return h;
    }
    secSignatureHeaders() {
      if (!this.secSecretKey) return {};
      const ts = String(nowMs()), nonce = randomString(8, "0123456789abcdefghijklmnopqrstuvwxyz");
      return { "x-request-timestamp": ts, "x-request-nonce": nonce, "x-request-signature": sha256HmacHex(nonce + ts, this.secSecretKey) };
    }
    async secGetSecretKey(silent = false) {
      if (this.secSecretKey) return this.secSecretKey;
      if (!this.secTicket) return "";
      const headers = {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 unicom{version:iphone_c@12.0301};ltst;OSVersion/16.6",
        Connection: "keep-alive",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        Origin: "https://m.jf.10010.com",
        clienttype: "uasp_unicom_applet",
        partnersid: "1702",
        ticket: decodeURIComponent(this.secTicket)
      };
      if (this.secJea) headers.Cookie = `_jea_id=${this.secJea};`;
      const r = await this.get("https://m.jf.10010.com/jf-external-application/jftask/getSecretKey", headers);
      const secret = ((r.data || {}).secretKey) || "";
      if (r.code === "0000" && secret) {
        this.secSecretKey = secret;
        if (!silent) this.log("secretKey \u83B7\u53D6\u6210\u529F");
        return secret;
      }
      this.log(`\u5B89\u5168\u7BA1\u5BB6: getSecretKey \u5931\u8D25: ${responseMessage(r)}`);
      return "";
    }
    async secUcaPost(url, body) {
      try {
        return await this.postJSON(url, body, { clientType: "uasp_unicom_applet", "auth-sa-token": this.secToken, "Content-Type": "application/json", Accept: "*", "User-Agent": SEC_APP_UA }) || {};
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: uca_post \u5F02\u5E38: ${e && e.message || e}`);
        return null;
      }
    }
    async secAddToBlacklist() {
      const url = "https://uca.wo116114.com/sjgj/woAssistant/umm/configs/v1/config?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6";
      await this.secUcaPost(url, { productId: "91242950", operationType: 1, type: 1, contents: [{ checked: true, configTime: null, nickname: null, contentTag: "\u7591\u4F3C\u8BC8\u9A97", content: "13088330789" }] });
      await sleep(2000);
      await this.secUcaPost(url, { productId: "91242950", blacklistSource: 0, type: 1, operationType: 0, contents: [{ contentTag: "\u7591\u4F3C\u8BC8\u9A97", content: "13088330789" }] });
    }
    async secMarkPhone() {
      await this.secUcaPost("https://uca.wo116114.com/sjgj/unicomAssistant/uasp/configs/v1/addressBook/saveTagPhone?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6", { productId: "91311616", status: 0, tagIds: [26], tagPhoneNo: "13088330789" });
    }
    async secSyncAddressBook() {
      await this.secUcaPost("https://uca.wo116114.com/sjgj/unicomAssistant/uasp/configs/v1/addressBookBatchConfig?product_line=uasp&entry_point=h5&entry_point_id=edop_unicom_3a6cc75a", { opType: "1", productId: "91311616", addressBookDTOList: [{ addressBookName: "\u53EF\u4E50", addressBookPhoneNo: "13105750575" }] });
    }
    async secSetInterceptionRules() {
      const url = "https://uca.wo116114.com/sjgj/woAssistant/umm/configs/v1/config?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6";
      await this.secUcaPost(url, { productId: "91311616", type: 3, operationType: 0, contents: [{ icon: "alerting", content: "1", contentName: "\u54CD\u4E00\u58F0", contentTag: "8", name: "rings-once" }] });
      await sleep(2000);
      await this.secUcaPost(url, { productId: "91311616", type: 3, operationType: 0, contents: [{ icon: "alerting", content: "0", contentName: "\u54CD\u4E00\u58F0", contentTag: "8", name: "rings-once" }] });
    }
    async secViewWeeklyReport() {
      const base = "https://uca.wo116114.com/sjgj/unicomAssistant/uasp";
      const body = { productId: "91311616" };
      await this.secUcaPost(`${base}/configs/v1/weeklySwitchStatus?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6`, body);
      await this.secUcaPost(`${base}/report/v1/queryKeyData?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6`, body);
      await this.secUcaPost(`${base}/report/v1/weeklySummary?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6`, body);
    }
    async secZhushou() {
      try {
        await this.postJSON("https://ims.wo116114.com/api/AiAssistant/autoReply", { history: [], message: "1", promptId: 10000 }, { "auth-sa-token": this.secToken, token: this.secToken, "Content-Type": "application/json", Accept: "*", "User-Agent": SEC_APP_UA });
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u667A\u80FD\u52A9\u624B\u5F02\u5E38: ${e && e.message || e}`);
      }
    }
    async secDaijie() {
      try {
        await this.postJSON("https://ims.wo116114.com/api/Assistant/assis_save", { page_type: 1, old_ainumber: "XF0", level: 3, dialog: "0", opertype: 1, videoimage: "", speechtype: "06", ainumber: "BD1" }, { "auth-sa-token": this.secToken, token: this.secToken, Authorization: this.secToken, "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B)" });
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u4EE3\u63A5\u52A9\u7406\u5F02\u5E38: ${e && e.message || e}`);
      }
    }
    async secAnquanfen() {
      const url = "https://uca.wo116114.com/sjgj/woAssistant/umm/configs/v1/config?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6";
      const scoreUrl = "https://uca.wo116114.com/sjgj/unicomAssistant/uasp/report/v1/queryScore?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6";
      const off = { productId: "91351080", type: 3, operationType: 0, contents: [{ icon: "phone-fraud", content: "1", contentName: "\u7591\u4F3C\u8BC8\u9A97", contentTag: "0", name: "fraud" }] };
      const on = { productId: "91351080", type: 3, operationType: 0, contents: [{ contentTag: "0", content: "0" }] };
      await this.secUcaPost(url, off);
      await sleep(2000);
      await this.secUcaPost(scoreUrl, { productId: "91311616" });
      await sleep(2000);
      await this.secUcaPost(url, on);
      await sleep(2000);
      await this.secUcaPost(scoreUrl, { productId: "91311616" });
      await sleep(2000);
      await this.secUcaPost(url, off);
    }
    async secHaoduan() {
      const url = "https://uca.wo116114.com/sjgj/woAssistant/umm/configs/v1/config?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6";
      const off = { checked: true, content: "1", contentName: "\u62E6\u622A400\u5F00\u5934\u768410\u4F4D\u7279\u670D\u53F7\u7801", contentTag: "1" };
      const on = { checked: false, content: "0", contentName: "\u62E6\u622A400\u5F00\u5934\u768410\u4F4D\u7279\u670D\u53F7\u7801", contentTag: "1" };
      const base = { productId: "91351080", type: 7, operationType: 0 };
      await this.secUcaPost(url, { ...base, contents: [off] });
      await sleep(2000);
      await this.secUcaPost(url, { ...base, contents: [on] });
      await sleep(2000);
      await this.secUcaPost(url, { ...base, contents: [off] });
    }
    async secOjbk(taskCode) {
      try {
        const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/jftask/taskFinish", { headers: this.secJfHeaders(false), body: JSON.stringify({ taskCode }) });
        this.updateSecJea(r.headers);
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u6D3B\u52A8\u6D4F\u89C8\u5F02\u5E38: ${e && e.message || e}`);
      }
    }
    secWoAiHeaders(useMobile = false, overrideToken = "") {
      const uaPc = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541818) XWEB/19201 miniProgram/wx1e83eef922822ee0";
      const uaMobile = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.69(0x1800452f) NetType/WIFI Language/zh_CN miniProgram/wx1e83eef922822ee0";
      return {
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Origin: "https://ai.wo.cn",
        Authorization: overrideToken || this.secToken,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "User-Agent": useMobile ? uaMobile : uaPc
      };
    }
    async secGetKnowledgeId() {
      try {
        const res = await this.postJSON("https://ai.wo.cn/web-tongtong/knowledge/getKnowledgeList", { appType: 1 }, this.secWoAiHeaders());
        if (res.code === 0 && res.data) return (res.data[0] || {}).id || "";
        this.log(`\u83B7\u53D6\u77E5\u8BC6\u5E93ID\u5931\u8D25\uFF1A${res.msg || responseMessage(res)}`);
      } catch (e) {
        this.log(`\u83B7\u53D6\u77E5\u8BC6\u5E93ID\u5F02\u5E38\uFF1A${e && e.message || e}`);
      }
      return "";
    }
    async secUploadKnowledgeFile() {
      try {
        const kid = await this.secGetKnowledgeId();
        if (!kid) return false;
        const headers = this.secWoAiHeaders();
        delete headers["Content-Type"];
        const boundary = `----LoonBoundary${randomString(16, "0123456789abcdef")}`;
        const data = { knowledgeId: kid, fileName: "task_upload.txt", fileType: "text/plain", fileSize: "1", currentPartSize: "1", currentIndex: "1", totalPart: "1", spaceType: "0" };
        const parts = [];
        for (const k of Object.keys(data)) parts.push(asciiBytes(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${data[k]}\r\n`));
        parts.push(asciiBytes(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="task_upload.txt"\r\nContent-Type: text/plain\r\n\r\n`));
        parts.push(asciiBytes(" "));
        parts.push(asciiBytes(`\r\n--${boundary}--\r\n`));
        const r = await this.req("post", "https://ai.wo.cn/web-tongtong/knowledge/uploadLocalFileToKnowledge", { headers: { ...headers, "Content-Type": `multipart/form-data; boundary=${boundary}` }, body: concatBytes(parts), timeout: 15000 });
        const res = r.json || {};
        if (res.code === 0) {
          this.log("\u4E0A\u4F20\u77E5\u8BC6\u5E93\u6587\u4EF6\u6210\u529F");
          return true;
        }
        this.log(`\u4E0A\u4F20\u77E5\u8BC6\u5E93\u6587\u4EF6\u5931\u8D25\uFF1A${res.msg || responseMessage(res)}`);
        return false;
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u4E0A\u4F20\u77E5\u8BC6\u5E93\u6587\u4EF6\u5F02\u5E38: ${e && e.message || e}`);
        return false;
      }
    }
    async secGetChatList() {
      try {
        const headers = this.secWoAiHeaders();
        headers.Referer = "https://ai.wo.cn/wxMini";
        const res = await this.get("https://ai.wo.cn/web-tongtong/historyChat/list", headers);
        if (res.code === 0) return ((res.data || {}).content) || [];
        if (res.msg) this.log(`\u83B7\u53D6AI\u5BF9\u8BDD\u5386\u53F2\u5931\u8D25\uFF1A${res.msg}`);
      } catch (e) {
        this.log(`\u83B7\u53D6AI\u5BF9\u8BDD\u5386\u53F2\u5F02\u5E38\uFF1A${e && e.message || e}`);
      }
      return [];
    }
    async secSendAiChat() {
      try {
        const sessionId = `mmru${randomString(10, "0123456789")}`, requestId = `rqid_mmru${randomString(10, "0123456789")}`;
        const headers = this.secWoAiHeaders(true);
        headers.Accept = "text/event-stream";
        headers.Referer = "https://ai.wo.cn/wxMini/psychologicalApp/chat?id=1&type=ruole";
        const body = { modelKey: "87e622d9e488", message: "\u5E2E\u6211\u63A8\u83501\u4E2A\u5FC5\u5403\u996D\u5E97", deepThink: false, webSearch: false, attachments: [], imgSize: 0, sessionId, requestId, promptKey: "", knowledgeId: "", ragSearch: false, moduleType: 12 };
        const r = await this.req("post", "https://ai.wo.cn/web-tongtong/chat/chatReplyV2", { headers, body: JSON.stringify(body), timeout: 60000 });
        if (!r.error && r.status >= 200 && r.status < 400) {
          this.log("\u5DF2\u53D1\u9001AI\u5BF9\u8BDD");
          return true;
        }
        this.log(`\u53D1\u9001AI\u5BF9\u8BDD\u5931\u8D25\uFF1AHTTP ${r.status}`);
      } catch (e) {
        this.log(`\u53D1\u9001AI\u5BF9\u8BDD\u5F02\u5E38\uFF1A${e && e.message || e}`);
      }
      return false;
    }
    async secGetShareKey(sessionId) {
      try {
        const headers = this.secWoAiHeaders();
        headers.Referer = "https://ai.wo.cn/wxMini";
        const res = await this.postJSON("https://ai.wo.cn/web-tongtong/historyChat/shareDetail", { sessionId }, headers);
        if (res.code === 0 && res.data) return String(res.data);
        this.log(`\u83B7\u53D6\u5206\u4EABkey\u5931\u8D25\uFF1A${res.msg || responseMessage(res)}`);
      } catch (e) {
        this.log(`\u83B7\u53D6\u5206\u4EABkey\u5F02\u5E38\uFF1A${e && e.message || e}`);
      }
      return "";
    }
    async secViewShareDetail(key, viewToken) {
      try {
        const res = await this.postJSON("https://ai.wo.cn/web-tongtong/historyChat/getShareDetail", { key, pageSize: 10, pageNum: 1 }, this.secWoAiHeaders(true, viewToken));
        if (res.code === 0) {
          this.log("\u67E5\u770B\u5206\u4EAB\u5BF9\u8BDD\u6210\u529F");
          return true;
        }
        this.log(`\u67E5\u770B\u5206\u4EAB\u5BF9\u8BDD\u5931\u8D25\uFF1A${res.msg || responseMessage(res)}`);
      } catch (e) {
        this.log(`\u67E5\u770B\u5206\u4EAB\u5BF9\u8BDD\u5F02\u5E38\uFF1A${e && e.message || e}`);
      }
      return false;
    }
    async secShareAiChat(taskCode = "") {
      try {
        let content = await this.secGetChatList();
        if (!content.length) {
          this.log("\u6682\u65E0AI\u5BF9\u8BDD\u5386\u53F2\uFF0C\u5148\u53D1\u9001\u4E00\u6761\u5BF9\u8BDD...");
          if (!await this.secSendAiChat()) return false;
          await sleep(2000);
          content = await this.secGetChatList();
        }
        if (!content.length) {
          this.log("\u4ECD\u65E0AI\u5BF9\u8BDD\u5386\u53F2\uFF0C\u8DF3\u8FC7\u5206\u4EAB\u4EFB\u52A1");
          return false;
        }
        const sessionId = content[0].chatSessionId || "";
        if (!sessionId) {
          this.log("\u83B7\u53D6\u5206\u4EABkey\u5931\u8D25\uFF1A\u7F3A\u5C11sessionId");
          return false;
        }
        const shareKey = await this.secGetShareKey(sessionId);
        if (!shareKey) return false;
        this.secAiShareKey = shareKey;
        if (taskCode) this.secShareTaskCode = taskCode;
        this.log(`AI\u5BF9\u8BDD\u5206\u4EABkey\u83B7\u53D6\u6210\u529F: ${shareKey.slice(0, 8)}...`);
        return true;
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u5206\u4EABAI\u5BF9\u8BDD\u5F02\u5E38: ${e && e.message || e}`);
        return false;
      }
    }
    async secRoleChat() {
      try {
        const headers = this.secWoAiHeaders();
        headers.Accept = "text/event-stream";
        headers.Referer = "https://ai.wo.cn/wxMini/psychologicalApp/chat?id=1&type=ruole";
        const body = { sessionId: `mmrp${randomString(10, "0123456789")}`, requestId: `rqid_mmrp${randomString(10, "0123456789")}`, roleId: 1, message: "\u6211\u6709\u62D6\u5EF6\u75C7\uFF0C\u597D\u591A\u4E8B\u60C5\u4E0D\u60F3\u505A\u3002" };
        const r = await this.req("post", "https://ai.wo.cn/web-tongtong/lxzn/chat", { headers, body: JSON.stringify(body), timeout: 60000 });
        if (r.error || r.status >= 400) {
          this.log(`\u89D2\u8272\u52A9\u624B\u5BF9\u8BDD\u5931\u8D25\uFF1AHTTP ${r.status}`);
          return false;
        }
        this.log("\u89D2\u8272\u52A9\u624B\u5BF9\u8BDD\u5B8C\u6210");
        return true;
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u89D2\u8272\u52A9\u624B\u5BF9\u8BDD\u5F02\u5E38: ${e && e.message || e}`);
        return false;
      }
    }
    secParseTask(task) {
      return { finishCount: safeInt(task.finishCount), needCount: safeInt(task.needCount), finishText: task.finishText || task.taskStatusName || task.taskStatusDesc || "\u672A\u77E5\u72B6\u6001" };
    }
    secSupportsDelayedClaim(name) {
      return ["\u4E0A\u4F20\u77E5\u8BC6\u5E93\u6587\u4EF6", "\u5206\u4EABAI\u52A9\u624B\u5BF9\u8BDD", "\u89D2\u8272\u52A9\u624B\u5BF9\u8BDD"].some((k) => name.includes(k));
    }
    secTrackPendingClaim(code, name) {
      if (code && name && this.secSupportsDelayedClaim(name)) this.secPendingClaims[code] = name;
    }
    secUntrackPendingClaim(code) {
      if (code) delete this.secPendingClaims[code];
    }
    async secQueryTaskList() {
      const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/jftask/taskDetail", { headers: this.secJfHeaders(false), body: "{}", timeout: 15000 });
      this.updateSecJea(r.headers);
      if (r.error || !r.body) {
        this.log(`\u8054\u901A\u52A9\u7406\u4EFB\u52A1\u5217\u8868\u67E5\u8BE2\u5F02\u5E38: ${r.error || "\u65E0\u54CD\u5E94"}`);
        return [];
      }
      const res = r.json;
      if (!res || typeof res !== "object") {
        this.log(`\u8054\u901A\u52A9\u7406\u4EFB\u52A1\u5217\u8868\u67E5\u8BE2\u5F02\u5E38: \u975EJSON\u54CD\u5E94 ${String(r.body).slice(0, 60)}`);
        return [];
      }
      return (((res.data || {}).taskDetail || {}).taskList) || [];
    }
    async secRefreshSecurityContext(refreshSecret = false) {
      try {
        this.secTicket1 = "";
        this.secToken = "";
        this.secTicket = "";
        await this.secGetTicket();
        if (!this.secTicket1) return false;
        await this.secGetAuthToken();
        if (!this.secToken) return false;
        await this.secGetJfTicket();
        if (!this.secTicket) return false;
        if (refreshSecret) {
          this.secSecretKey = "";
          if (!await this.secGetSecretKey(true)) return false;
        }
        return true;
      } catch (e) {
        this.log(`\u8054\u901A\u52A9\u7406\u4E0A\u4E0B\u6587\u5237\u65B0\u5F02\u5E38: ${e && e.message || e}`);
        return false;
      }
    }
    async secGetTaskSnapshot(code = "", name = "") {
      for (const task of await this.secQueryTaskList()) {
        if (code && task.taskCode === code) return task;
        if (name && task.taskName === name) return task;
      }
      return null;
    }
    async secRefreshTaskSnapshot(code, name, retries = 3, delay = 2000) {
      let latest = null;
      for (let i = 0; i < retries; i++) {
        if (i) await sleep(delay);
        latest = await this.secGetTaskSnapshot(code, name);
        if (!latest) continue;
        const p = this.secParseTask(latest);
        if (p.finishText === "\u5F85\u9886\u53D6" || (p.needCount > 0 && p.finishCount >= p.needCount)) return latest;
      }
      return latest;
    }
    secShouldManualFinish(name) {
      return ["\u65B0\u589E\u4EB2\u60C5\u5B88\u62A4\u6210\u5458", "\u65B0\u589E\u5BBD\u5E26\u7ED1\u5B9A", "\u8BED\u97F3\u63D0\u9192", "\u53CD\u8BC8\u9669\u9886\u53D6", "\u8BBE\u7F6E\u65E5\u7A0B\u63D0\u9192"].some((k) => name.includes(k));
    }
    secWaitSeconds(name) {
      if (["\u4E0A\u4F20\u77E5\u8BC6\u5E93\u6587\u4EF6", "\u5206\u4EABAI\u52A9\u624B\u5BF9\u8BDD", "\u89D2\u8272\u52A9\u624B\u5BF9\u8BDD"].some((k) => name.includes(k))) return 5;
      if (["\u6DFB\u52A0\u9ED1\u540D\u5355", "\u9A9A\u6270\u62E6\u622A\u8BBE\u7F6E", "\u5B89\u5168\u5206\u63D0\u5347", "\u53F7\u6BB5\u62E6\u622A"].some((k) => name.includes(k))) return 8;
      return 4;
    }
    async secReceivePoints(taskCode) {
      const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/jftask/receive", { headers: this.secJfHeaders(true), body: JSON.stringify({ taskCode }), timeout: 10000 });
      this.updateSecJea(r.headers);
      const res = r.json || {};
      const score = String((res.data || {}).score || "").trim();
      const msg = String(res.msg || "").trim();
      if (score) {
        this.secUntrackPendingClaim(taskCode);
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u9886\u53D6${score}\u6210\u529F`, true);
        return "received";
      }
      if (msg.includes("\u4EFB\u52A1\u672A\u5B8C\u6210") || msg.includes("\u4E0D\u53EF\u9886\u53D6")) {
        this.log("\u9886\u53D6\u4EFB\u52A1\u672A\u5B8C\u6210");
        return "pending";
      }
      if (msg.includes("\u81EA\u52A8\u53D1\u653E") || msg.includes("\u5DF2\u9886\u53D6")) {
        this.secUntrackPendingClaim(taskCode);
        this.log("\u4EFB\u52A1\u5DF2\u5B8C\u6210\u4E14\u5956\u52B1\u5DF2\u9886\u53D6");
        return "auto";
      }
      this.log(`\u9886\u53D6\u5931\u8D25\uFF1A${msg || responseMessage(res)}`);
      return "failed";
    }
    async secFinishTask(taskCode, taskName) {
      try {
        const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/jftask/toFinish", { headers: this.secJfHeaders(true), body: JSON.stringify({ taskCode }), timeout: 10000 });
        this.updateSecJea(r.headers);
        const actions = [
          ["\u6DFB\u52A0\u9ED1\u540D\u5355", () => this.secAddToBlacklist()],
          ["\u53F7\u7801\u6807\u8BB0", () => this.secMarkPhone()],
          ["\u540C\u6B65\u901A\u8BAF\u5F55", () => this.secSyncAddressBook()],
          ["\u9A9A\u6270\u62E6\u622A\u8BBE\u7F6E", () => this.secSetInterceptionRules()],
          ["\u667A\u80FD\u52A9\u624B", () => this.secZhushou()],
          ["\u4EE3\u63A5\u52A9\u7406", () => this.secDaijie()],
          ["\u5B89\u5168\u5206", () => this.secAnquanfen()],
          ["\u53F7\u6BB5\u62E6\u622A", () => this.secHaoduan()],
          ["\u67E5\u770B\u5468\u62A5", () => this.secViewWeeklyReport()],
          ["\u6D3B\u52A8\u6D4F\u89C8", () => this.secOjbk(taskCode)],
          ["\u4E0A\u4F20\u77E5\u8BC6\u5E93\u6587\u4EF6", () => this.secUploadKnowledgeFile()],
          ["\u5206\u4EABAI\u52A9\u624B\u5BF9\u8BDD", () => this.secShareAiChat(taskCode)],
          ["\u89D2\u8272\u52A9\u624B\u5BF9\u8BDD", () => this.secRoleChat()]
        ];
        for (const [key, action] of actions) {
          if (taskName.includes(key)) {
            const result = await action();
            return result === false ? false : true;
          }
        }
        this.log(`\u4EFB\u52A1 ${taskName} \u9700\u8981\u624B\u52A8\u5B8C\u6210`);
        return false;
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: finishTask\u5F02\u5E38: ${e && e.message || e}`);
        return false;
      }
    }
    async secSignIn(taskCode) {
      try {
        const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/jftask/sign", { headers: this.secJfHeaders(true), body: JSON.stringify({ taskCode }), timeout: 10000 });
        this.updateSecJea(r.headers);
        const res = r.json || {};
        if (res.code === "0000") return true;
        this.log(`\u7B7E\u5230\u5931\u8D25\uFF1A${res.msg || "\u72B6\u6001\u672A\u77E5"}`);
        return false;
      } catch (e) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u7B7E\u5230\u5F02\u5E38: ${e && e.message || e}`);
        return false;
      }
    }
    async secExecuteAllTasks() {
      try {
        const list = await this.secQueryTaskList();
        if (!list.length) {
          this.log("\u8054\u901A\u52A9\u7406\u4EFB\u52A1\u5217\u8868\u67E5\u8BE2\u5931\u8D25");
          return;
        }
        for (const task of list) {
          const name = task.taskName || "", code = task.taskCode || "";
          let p = this.secParseTask(task);
          this.log(`${name}\uFF1A${p.finishCount}/${p.needCount} - ${p.finishText}`);
          if (!code || p.needCount <= 0) {
            this.log("---------------------");
            continue;
          }
          if (p.finishCount >= p.needCount) {
            if (p.finishText === "\u5F85\u9886\u53D6") {
              await sleep(2000);
              const state = await this.secReceivePoints(code);
              if (state === "pending") this.secTrackPendingClaim(code, name);
            } else {
              this.log("\u4EFB\u52A1\u5DF2\u5B8C\u6210\u4E14\u5956\u52B1\u5DF2\u9886\u53D6");
            }
            this.log("---------------------");
            continue;
          }
          const remaining = Math.max(p.needCount - p.finishCount, 1);
          this.log(`\u4EFB\u52A1\u672A\u5B8C\u6210\uFF0C\u9700\u8981\u518D\u6267\u884C ${remaining} \u6B21`);
          if (this.secShouldManualFinish(name)) {
            this.log(`\u4EFB\u52A1 ${name} \u9700\u8981\u624B\u52A8\u5B8C\u6210`);
            this.log("---------------------");
            continue;
          }
          for (let i = 0; i < remaining; i++) {
            try {
              if (i) await sleep(2000);
              const handled = name.includes("\u7B7E\u5230") ? await this.secSignIn(code) : await this.secFinishTask(code, name);
              if (!handled) break;
              const wait = this.secWaitSeconds(name);
              if (wait > 0) await sleep(wait * 1000);
              const latest = await this.secRefreshTaskSnapshot(code, name, 3, 2000);
              if (latest) p = this.secParseTask(latest);
              if (!latest || (p.finishText !== "\u5F85\u9886\u53D6" && p.finishCount < p.needCount)) {
                this.log(`${name}\uFF1A\u5DF2\u63D0\u4EA4\u64CD\u4F5C\uFF0C\u670D\u52A1\u7AEF\u8FDB\u5EA6\u4ECD\u4E3A ${p.finishCount}/${p.needCount}`);
                this.secTrackPendingClaim(code, name);
                break;
              }
              this.log(`\u7B2C ${i + 1} \u6B21\u6267\u884C${name}\u5DF2\u786E\u8BA4\u5B8C\u6210`);
              const state = await this.secReceivePoints(code);
              if (state === "pending") this.secTrackPendingClaim(code, name);
              if (state === "received" || state === "auto") break;
              if (p.needCount > 0 && p.finishCount >= p.needCount) {
                this.log("\u4EFB\u52A1\u5DF2\u5B8C\u6210\u4E14\u5956\u52B1\u5DF2\u9886\u53D6");
                break;
              }
            } catch (e) {
              this.log(`\u6267\u884C ${name} \u5931\u8D25\uFF1A${e && e.message || e}`);
              break;
            }
          }
          this.log("---------------------");
        }
      } catch (e) {
        this.log(`\u8054\u901A\u52A9\u7406\u4EFB\u52A1\u6267\u884C\u5F02\u5E38: ${e && e.message || e}`);
      }
    }
    async secGetUserInfo() {
      const r = await this.req("post", "https://m.jf.10010.com/jf-external-application/jftask/userInfo", { headers: this.secJfHeaders(false), body: "{}", timeout: 10000 });
      this.updateSecJea(r.headers);
      const res = r.json || {};
      if (!res || res.code !== "0000" || !res.data) {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u67E5\u8BE2\u79EF\u5206\u5931\u8D25: ${res.msg || "\u65E0\u54CD\u5E94"}`);
        return;
      }
      const current = safeInt(res.data.availableScore), today = res.data.todayEarnScore || 0;
      if (this.secOldJFPoints === null || this.secOldJFPoints === undefined) {
        this.secOldJFPoints = current;
        this.log(`\u5F53\u524D\u79EF\u5206\uFF1A${current}\uFF0C\u4ECA\u65E5\u5DF2\u8D5A ${today}`);
      } else {
        this.log(`\u5B89\u5168\u7BA1\u5BB6: \u7528\u6237${this.mobile ? mask(this.mobile) : `\u8D26\u53F7[${this.index}]`}\u79EF\u5206\u53D8\u52A8\uFF1A${this.secOldJFPoints} \u2192 ${current} | \u65B0\u589E: ${current - this.secOldJFPoints}`, true);
      }
    }
    async secRecoverPendingClaims(rounds = 2, delay = 12000, refreshContext = false) {
      const keys = () => Object.keys(this.secPendingClaims || {});
      if (!keys().length) return false;
      let recovered = false;
      const lastStatus = {};
      this.log(`\u8054\u901A\u52A9\u7406\uFF1A\u5F85\u8865\u9886\u4EFB\u52A1 ${keys().length} \u4E2A\uFF0C\u5F00\u59CB\u8865\u67E5`);
      for (let attempt = 0; attempt < rounds; attempt++) {
        if (attempt) await sleep(delay);
        if (!keys().length) break;
        if (refreshContext && !await this.secRefreshSecurityContext(true)) continue;
        for (const code of keys()) {
          const name = this.secPendingClaims[code];
          const latest = await this.secRefreshTaskSnapshot(code, name, 3, 2000);
          if (!latest) {
            if (lastStatus[code] !== "missing") {
              this.log(`${name}\uFF1A\u8865\u67E5\u672A\u53D6\u5230\u4EFB\u52A1\u72B6\u6001`);
              lastStatus[code] = "missing";
            }
            continue;
          }
          const p = this.secParseTask(latest);
          if (p.finishText === "\u5F85\u9886\u53D6" || (p.needCount > 0 && p.finishCount >= p.needCount)) {
            this.log(`${name}\uFF1A\u8865\u67E5\u540E\u5C1D\u8BD5\u9886\u53D6`);
            const state = await this.secReceivePoints(code);
            if (state === "received" || state === "auto") {
              recovered = true;
              delete lastStatus[code];
              continue;
            }
          } else {
            const key = `${p.finishCount}/${p.needCount}-${p.finishText}`;
            if (lastStatus[code] !== key) {
              this.log(`${name}\uFF1A\u8865\u67E5\u72B6\u6001 ${p.finishCount}/${p.needCount} - ${p.finishText}`);
              lastStatus[code] = key;
            }
          }
        }
      }
      if (recovered) await this.secGetUserInfo();
      const left = keys();
      if (left.length) this.log(`\u8054\u901A\u52A9\u7406\uFF1A\u4ECD\u5F85\u8865\u9886 ${left.map((k) => this.secPendingClaims[k]).join("\u3001")}`);
      return recovered;
    }
    woreadEncrypt(data) {
      const s = typeof data === "string" ? data : JSON.stringify(data);
      return aesCbcB64(s, "woreadst^&*12345", "16-Bytes--String", true, false);
    }
    async woreadLogin() {
      const ts = String(nowMs()), product = "10000002";
      const auth = await this.postJSON(`https://10010.woread.com.cn/ng_woread_service/rest/app/auth/${product}/${ts}/${md5(product + "7k1HcDL8RKvc" + ts)}`, { sign: this.woreadEncrypt({ timestamp: compactTime() }) }, { "User-Agent": UA });
      this.woreadAccess = (auth.data || {}).accesstoken || "";
      if (!this.woreadAccess) return false;
      const sign = this.woreadEncrypt(JSON.stringify({ tokenOnline: this.woreadEncrypt(this.tokenOnline), phone: this.woreadEncrypt(this.accountMobile || "13800000000"), timestamp: compactTime() }));
      const r = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/account/login", { sign }, { accesstoken: this.woreadAccess });
      if (r.code !== "0000") return false;
      Object.assign(this, { woreadToken: r.data.token, woreadUserid: r.data.userid, woreadUserindex: r.data.userindex, woreadVerify: r.data.verifycode });
      this.aitingReadUserinfo = r.data;
      if (r.data.phone) this.mobile = r.data.phone;
      return true;
    }
    async woreadTask() {
      this.log("==== \u8054\u901A\u9605\u8BFB ====");
      if (!await this.woreadLogin()) {
        this.log("\u9605\u8BFB\u767B\u5F55\u5931\u8D25");
        return;
      }
      const common = { timestamp: compactTime(), phone: this.mobile || "", token: this.woreadToken, userid: this.woreadUserid, userId: this.woreadUserid, userIndex: this.woreadUserindex, verifyCode: this.woreadVerify };
      const bal = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/phone/vouchers/queryTicketAccount", { sign: this.woreadEncrypt(common) }, { accesstoken: this.woreadAccess });
      if (bal.code === "0000") this.log(`\u9605\u8BFB\u7EA2\u5305\uFF1A${(safeInt((bal.data || {}).usableNum) / 100).toFixed(2)}\u5143`, true);
      if (CFG.queryOnly) return;
      const shelf = await this.get("https://10010.woread.com.cn/ng_woread_service/rest/basics/recommposdetail/14856", { accesstoken: this.woreadAccess });
      const books = ((shelf.data || {}).booklist || {}).message || [];
      if (!books.length) {
        this.log("\u9605\u8BFB\u4E13\u533A: \u83B7\u53D6\u4E66\u67B6\u5931\u8D25");
        return;
      }
      const b = books[0];
      const catid = b.catindex || "";
      const card = (((shelf.data || {}).bindinfo || [])[0] || {}).recommposiindex;
      const ch = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/cnt/chalist", { sign: this.woreadEncrypt({ curPage: 1, limit: 30, index: b.cntindex, sort: 0, finishFlag: 1, ...common }) }, { accesstoken: this.woreadAccess });
      const list = ch.list || (ch.data || {}).list || [];
      const c = ((list[0] || {}).charptercontent || [])[0];
      if (!c) {
        this.log("\u9605\u8BFB\u4E13\u533A: \u672A\u53D6\u5230\u7AE0\u8282\u5185\u5BB9\uFF0C\u8DF3\u8FC7\u6A21\u62DF\u9605\u8BFB");
      } else {
        const words = { chapterAllIndex: c.chapterallindex, cntIndex: b.cntindex, cntTypeFlag: "1", ...common };
        const wordsUrl = `https://10010.woread.com.cn/ng_woread_service/rest/cnt/wordsDetail?catid=${catid}&cardid=${card}&cntindex=${b.cntindex}&chapterallindex=${c.chapterallindex}&chapterseno=1`;
        await this.postJSON(wordsUrl, { sign: this.woreadEncrypt(words) }, { accesstoken: this.woreadAccess });
        const p = { readTime: "2", cntIndex: b.cntindex, cntType: "1", catid: "0", pageIndex: "", cardid: card, cntindex: b.cntindex, cnttype: "1", chapterallindex: c.chapterallindex, chapterseno: "1", channelid: "", chapterid: c.chapterid, readtype: 1, isend: "0", ...common };
        const add = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/history/addReadTime", { sign: this.woreadEncrypt(p) }, { accesstoken: this.woreadAccess });
        const msg = String(add.message || "");
        if (add.code === "0000" || add.code === "9999" || msg.includes("9999") || msg.includes("\u4E0D\u5B58\u5728\u9605\u8BFB\u8BB0\u5F55")) this.log("\u9605\u8BFB\u4E13\u533A: \u6A21\u62DF\u9605\u8BFB\u6210\u529F");
        else this.log(`\u9605\u8BFB\u4E13\u533A: \u6A21\u62DF\u9605\u8BFB\u5931\u8D25 - ${msg || responseMessage(add)}`);
      }
      await sleep(3000);
      const draw = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/basics/doDraw", { sign: this.woreadEncrypt({ activeindex: "8051", timestamp: compactTime(), phone: this.mobile || "", token: this.woreadToken }) }, { accesstoken: this.woreadAccess });
      this.log(`\u9605\u8BFB\u62BD\u5956\uFF1A${(draw.data || {}).prizedesc || draw.message || "\u672A\u4E2D\u5956"}`, !!(draw.data || {}).prizedesc);
    }
    async aitingLogin() {
      const login = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/account/login", { sign: this.aitingAes({ tokenOnline: this.aitingAes(this.tokenOnline, "woreadst^&*12345"), phone: this.aitingAes(this.mobile, "woreadst^&*12345"), timestamp: compactTime() }, "woreadst^&*12345") }, { accesstoken: "ODZERTZCMjA1NTg1MTFFNDNFMThDRDYw" });
      this.aitingWoread = (login.data || {}).token;
      this.aitingReadUserinfo = login.data || {};
      if (!this.aitingWoread) {
        this.log(`\u7231\u542C\u767B\u5F55-\u6C83\u9605\u8BFB\u5931\u8D25\uFF1A${responseMessage(login)}`);
        return false;
      }
      const imei = randomString(15, "0123456789"), confirm = this.aitingAes(`android${this.mobile}${imei}`), stats = `channelid=28015001&sid=${randomString(20)}&eid=${randomString(20)}&osversion=Android12&clientallid=000000100000000000058.0.2.1225&display=2400_1080&ip=192.168.3.24&nettypename=wifi&version=802&versionname=8.0.2&terminalName=Redmi&terminalType=Redmi_K30_Pro&udid=null&woid=WOA${randomString(6)}${imei.slice(0, 8)}LOT${randomString(4)}LV${randomString(2)}&useraccount=${this.mobile}&userid=${this.mobile}&clientconfirm=${confirm}`;
      this.aitingStats = stats;
      let ts = String(nowMs());
      const appkey = md5(`clientId=android&clientSource=3&source=3&timestamp=${ts}&key=7ZxQ9rT3wE5sB2dF`);
      const jwt = await this.postJSON("https://pcc.woread.com.cn/oauth/client/appkey", { clientSource: "3", clientId: b64Utf8("395DEDE9C1D6FE11B7C9C0D82B353E74"), source: "3", timestamp: ts, sign: appkey }, { "Skip-Authorization-Check": "true", statisticsinfo: stats });
      this.aitingJwt = jwt.key;
      if (!this.aitingJwt) {
        this.log(`\u7231\u542C\u767B\u5F55-JWT\u5931\u8D25\uFF1A${responseMessage(jwt)}`);
        return false;
      }
      const loginTime = compactTime();
      const pass = md5(loginTime + this.mobile + "1");
      const nonce = randomString(6, "0123456789");
      const reqTime = String(nowMs());
      const reqSign = md5(`jwt=${this.aitingJwt}&nonestr=${nonce}&osversion=Android12&terminalName=Redmi&timestamp=${reqTime}&key=46iCw24ewAZbNkK6`);
      const u = await this.get(`https://pcc.woread.com.cn/mainrest/rest/read/user/ulogin/3/${this.mobile}/1/1/0?networktype=3&ua=Redmi+K30+Pro&isencode=false&clientversion=8.0.2&versionname=Android_1_1080x2356&channelid=28015001&userlabelisencode=0&validatecode=&sid=&timestamp=${loginTime}&passcode=${pass}`, { AuthorizationClient: `Bearer ${this.aitingJwt}`, statisticsinfo: stats, requerttime: reqTime, nonestr: nonce, requertid: reqSign });
      const msg = u.message || {};
      this.aitingBizToken = (msg.accountinfo || {}).token || msg.token;
      this.aitingUser = (msg.accountinfo || {}).userid || msg.userid || this.mobile;
      if (!this.aitingBizToken) {
        this.log(`\u7231\u542C\u767B\u5F55-\u4E1A\u52A1 API \u5931\u8D25\uFF1A${responseMessage(u)}`);
        return false;
      }
      ts = String(nowMs());
      const body = { token: this.aitingBizToken, timestamp: ts, userid: this.aitingUser };
      body.sign = md5(Object.keys(body).sort().map((k) => `${k}=${body[k]}`).join("&") + "&key=woread!@#qwe1234");
      const tk = await this.postJSON("https://pcc.woread.com.cn/activity/rest/unicom/points/getInfoTicket", body, {});
      const url = tk.message || "";
      this.aitingTicket = qs(url).ticket || url;
      this.aitingPage = qs(url).pageid || "s789081246969976832";
      return !!this.aitingTicket;
    }
    aitingHeaders(extra = {}) {
      const h = {
        ticket: decodeURIComponent(this.aitingTicket || ""),
        pageid: this.aitingPage || "s789081246969976832",
        clienttype: "aiting_ios",
        partnersid: "1706",
        "content-type": "application/json;charset=UTF-8",
        "User-Agent": AITING_JF_UA,
        Origin: "https://m.jf.10010.com"
      };
      if (this.aitingJea) h.Cookie = `_jea_id=${this.aitingJea};`;
      return { ...h, ...extra };
    }
    aitingAes(data, key = "j2K81755sxV12wFx") {
      return aesCbcB64(typeof data === "string" ? data : JSON.stringify(data), key, "16-Bytes--String", true, false);
    }
    updateAitingJea(headers) {
      const raw = getHeader(headers || {}, "Set-Cookie");
      const m = String(raw).match(/_jea_id=([^;,\s]+)/);
      if (m) this.aitingJea = m[1];
      return this.aitingJea || "";
    }
    async aitingSignatureHeaders() {
      if (!this.aitingSecretKey) {
        const r = await this.req("get", "https://m.jf.10010.com/jf-external-application/jftask/getSecretKey", { headers: this.aitingHeaders() });
        this.updateAitingJea(r.headers);
        this.aitingSecretKey = ((r.json || {}).data || {}).secretKey || "";
        if (!this.aitingSecretKey) this.log(`\u7231\u542C\u4EFB\u52A1: getSecretKey \u5931\u8D25 - ${responseMessage(r.json)}`);
      }
      if (!this.aitingSecretKey) return {};
      const ts = String(nowMs()), nonce = randomString(8, "0123456789abcdefghijklmnopqrstuvwxyz");
      return { "x-request-timestamp": ts, "x-request-nonce": nonce, "x-request-signature": sha256HmacHex(nonce + ts, this.aitingSecretKey) };
    }
    async jfRequest(path, body, opt = {}) {
      const extra = { Origin: "https://m.jf.10010.com" };
      if (opt.referer) extra.Referer = opt.referer;
      const headers = this.aitingHeaders(extra);
      if (opt.sign) Object.assign(headers, await this.aitingSignatureHeaders());
      const r = await this.req("post", `https://m.jf.10010.com/jf-external-application/${path}`, { headers, body: JSON.stringify(body || {}) });
      this.updateAitingJea(r.headers);
      return r.json || {};
    }
    async aitingQueryIntegral() {
      const res = await this.jfRequest("jftask/userInfo", {});
      if (res.code === "0000") {
        const d = res.data || {};
        this.log(`\u7231\u542C\u4EFB\u52A1: \u79EF\u5206\u6982\u89C8 - \u4ECA\u65E5\u5DF2\u8D5A ${safeInt(d.todayEarnScore)} | \u5F53\u524D\u4F59\u989D ${safeInt(d.availableScore)}`, true);
      }
      return res;
    }
    async jfTaskDetail() {
      const referer = `https://m.jf.10010.com/jf-external-application/index.html?ticket=${encodeURIComponent(this.aitingTicket || "")}&pageID=s789081246969976832`;
      const res = await this.jfRequest("jftask/taskDetail", {}, { referer });
      return (((res.data || {}).taskDetail || {}).taskList) || [];
    }
    async jfToFinish(taskCode) {
      const res = await this.jfRequest("jftask/toFinish", { taskCode }, { sign: true });
      this.log(`\u7231\u542C\u4EFB\u52A1: \u79EF\u5206\u4EFB\u52A1\u63D0\u4EA4 - ${responseMessage(res)}`);
      return res;
    }
    async jfSign(taskCode) {
      const referer = `https://m.jf.10010.com/ts-mobile/well/s789081246969976832?distributeId=&partnersId=1706&clientType=aiting_ios&ticket=${encodeURIComponent(this.aitingTicket || "")}`;
      const res = await this.jfRequest("uasptask/sign", { taskCode, remindEnabled: "1" }, { sign: true, referer });
      this.log(`\u7231\u542C\u4EFB\u52A1: \u79EF\u5206\u7B7E\u5230 - ${res.code === "0000" ? res.msg || "\u6210\u529F" : res.desc || res.msg || responseMessage(res)}`);
      return res;
    }
    async jfPopUp() {
      const res = await this.jfRequest("jftask/popUp", {});
      const score = (res.data || {}).score;
      if (score) this.log(`\u7231\u542C\u4EFB\u52A1: \u79EF\u5206\u5F39\u7A97 +${score}`, true);
      return res;
    }
    aitingReadHeaders(ua) {
      const ts = String(nowMs()), nonce = randomString(6, "0123456789");
      const sign = md5(`jwt=${this.aitingJwt}&nonestr=${nonce}&osversion=Android12&terminalName=Redmi&timestamp=${ts}&key=46iCw24ewAZbNkK6`);
      return { AuthorizationClient: `Bearer ${this.aitingJwt}`, requerttime: ts, nonestr: nonce, requertid: sign, statisticsinfo: this.aitingStats, "User-Agent": ua };
    }
    aitingReadSubmit(path, payload) {
      const user = this.aitingReadUserinfo || {};
      const body = { ...payload };
      body.timestamp = compactTime();
      body.token = user.token;
      body.userId = user.userid;
      body.userIndex = safeInt(user.userindex);
      body.userAccount = user.phone || this.mobile;
      body.verifyCode = user.verifycode;
      return body;
    }
    async aitingReadPoints() {
      const user = this.aitingReadUserinfo || {};
      if (!user.userid || !user.token || !user.userindex || !user.verifycode) {
        this.log("\u7231\u542C\u4EFB\u52A1: \u7F3A\u5C11\u9605\u8BFB\u767B\u5F55\u4E0A\u4E0B\u6587\uFF0C\u8DF3\u8FC7\u9605\u8BFB\u4E0A\u62A5");
        return false;
      }
      const headers = { "Content-Type": "application/json;charset=UTF-8", accesstoken: "ODZERTZCMjA1NTg1MTFFNDNFMThDRDYw", "User-Agent": UA };
      const base = "https://10010.woread.com.cn/ng_woread_service/rest";
      const submit = async (path, payload) => {
        const body = this.aitingReadSubmit(path, payload);
        return await this.postJSON(`${base}${path}`, { sign: this.woreadEncrypt(body) }, headers, { timeout: 20000 });
      };
      try {
        const opened = await submit("/basics/newreadadd?cntindex=495589&catid=120697&chapterseno=7", {
          userid: user.userid,
          cntindex: 495589,
          chapterallindex: 42332652,
          cnttype: 1,
          cntname: "\u7EAF\u9633\u6218\u795E",
          chaptertitle: "\u7B2C7\u7AE0 \u6076\u5FC3\u7684\u82CD\u8747\u5C0F\u4EBA",
          readtype: 1
        });
        this.log(`\u7231\u542C\u4EFB\u52A1: \u9605\u8BFB\u8BB0\u5F55 ${responseMessage(opened)}`);
        for (let index = 0; index < 2; index++) {
          if (index) {
            this.log("\u7231\u542C\u4EFB\u52A1: \u7B49\u5F85121\u79D2\u540E\u63D0\u4EA4\u7B2C\u4E8C\u6B21\u9605\u8BFB");
            await sleep(121000);
          }
          const result = await submit("/history/addReadTime", {
            readTime: 2,
            cntIndex: "495589",
            cntType: 1,
            catid: "119010",
            pageIndex: "10843",
            cardid: "12540",
            cntindex: "495589",
            cnttype: "1",
            chapterallindex: 42332652,
            chapterseno: 7,
            channelid: "18002061",
            chapterid: "10495589007",
            readtype: 1,
            isend: "0"
          });
          this.log(`\u7231\u542C\u4EFB\u52A1: \u7B2C${index + 1}\u6B21\u9605\u8BFB\u4E0A\u62A5 ${responseMessage(result)}`);
        }
        return true;
      } catch (e) {
        this.log(`\u7231\u542C\u4EFB\u52A1: \u9605\u8BFB\u4E0A\u62A5\u5F02\u5E38 ${e && e.message || e}`);
        return false;
      }
    }
    async aitingCompleteTask(typeVal) {
      const ts = String(nowMs());
      const body = { source: "3", timestamp: ts, token: this.aitingWoread, type: String(typeVal), userid: this.aitingUser || this.mobile };
      body.sign = md5(Object.keys(body).sort().map((k) => `${k}=${body[k]}`).join("&") + "&key=woread!@#qwe1234");
      const r = await this.req("post", "https://pcc.woread.com.cn/activity/rest/unicom/points/completiontask", { headers: { ...this.aitingReadHeaders(AITING_JF_UA), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return r.json || {};
    }
    async aitingTask() {
      this.log("==== \u8054\u901A\u7231\u542C ====");
      if (!await this.aitingLogin()) {
        this.log("\u7231\u542C\u4EFB\u52A1: \u767B\u5F55\u5931\u8D25\uFF0C\u8DF3\u8FC7");
        return;
      }
      this.log("\u7231\u542C\u4EFB\u52A1: \u767B\u5F55\u6210\u529F\uFF0C\u6B63\u5728\u83B7\u53D6\u4EFB\u52A1\u5217\u8868...");
      await this.aitingQueryIntegral();
      const tasks = (await this.jfTaskDetail()).filter((t) => !String(t.taskName || "").includes("\u9080\u8BF7"));
      const done = tasks.filter((t) => safeInt(t.finish) === 1);
      const seen = new Set();
      for (const t of done) {
        const name = t.taskName || "";
        if (seen.has(name)) continue;
        seen.add(name);
        this.log(`\u7231\u542C\u4EFB\u52A1: \u5DF2\u5B8C\u6210[${name}] ${safeInt(t.finishCount)}/${safeInt(t.needCount)}`);
      }
      this.log(`\u7231\u542C\u4EFB\u52A1: \u63D0\u53D6\u5230 ${tasks.length} \u4E2A\u4EFB\u52A1\uFF0C\u6267\u884C\u524D\u5B8C\u6210 ${done.length} \u4E2A`);
      if (!tasks.length) {
        this.log("\u7231\u542C\u4EFB\u52A1: \u2705 \u6240\u6709\u4EFB\u52A1\u5DF2\u5B8C\u6210");
        return;
      }
      if (CFG.queryOnly) {
        this.log("\u7231\u542C\u4EFB\u52A1: [\u67E5\u8BE2\u6A21\u5F0F] \u8DF3\u8FC7\u4EFB\u52A1\u6267\u884C...");
        return;
      }
      for (const t of tasks) {
        if (!t.taskCode) continue;
        const type = String(t.taskType || "");
        this.log(`\u7231\u542C\u4EFB\u52A1: \u6267\u884C[${t.taskName || "\u672A\u77E5"}] \u7C7B\u578B ${type || "\u672A\u77E5"}`);
        if (type === "4" || String(t.taskName || "").includes("\u7B7E\u5230")) await this.jfSign(t.taskCode);
        else await this.jfToFinish(t.taskCode);
        await sleep(1500);
      }
      this.log("\u7231\u542C\u4EFB\u52A1: \u5F00\u59CB\u63D0\u4EA4\u5B8C\u6210\u4EFB\u52A1\u8BF7\u6C42");
      for (let i = 0; i < 5; i++) {
        await this.aitingCompleteTask(4);
        await sleep(1500);
      }
      await this.aitingCompleteTask(2);
      await this.aitingReadPoints();
      await this.jfPopUp();
      const after = (await this.jfTaskDetail()).filter((t) => !String(t.taskName || "").includes("\u9080\u8BF7"));
      this.log(`\u7231\u542C\u4EFB\u52A1: \u6267\u884C\u540E\u5B8C\u6210 ${after.filter((t) => safeInt(t.finish) === 1).length}/${after.length} \u4E2A\u4EFB\u52A1`);
      for (const t of after) this.log(`\u7231\u542C\u4EFB\u52A1: ${t.taskName} - ${safeInt(t.finishCount)}/${safeInt(t.needCount)} finish=${t.finish}`);
      await this.aitingQueryIntegral();
    }
    async wostoreTask() {
      this.log("==== \u6C83\u4E91\u624B\u673A ====");
      if (CFG.queryOnly) {
        this.log("\u6C83\u4E91\u624B\u673A: [\u67E5\u8BE2\u6A21\u5F0F] \u6B64\u5E73\u53F0\u6682\u65E0\u8D44\u4EA7\u6216\u4F59\u989D\u53EF\u4F9B\u67E5\u8BE2", true);
        return;
      }
      const ticket = await this.wostoreTicket();
      if (!ticket) {
        this.log("\u6C83\u4E91\u624B\u673A: \u83B7\u53D6\u5165\u53E3 Ticket \u5931\u8D25 (\u4E3A\u7A7A)");
        return;
      }
      const cloud = await this.wostoreLogin(ticket);
      if (!cloud) {
        this.log("\u6C83\u4E91\u624B\u673A: \u767B\u5F55\u5931\u8D25\uFF0C\u8DF3\u8FC7\u540E\u7EED\u4EFB\u52A1");
        return;
      }
      await this.wostoreUserInfo(cloud);
      await this.wostoreSign(cloud);
      await sleep(3000);
      await this.wostoreSignRewards(cloud);
      let pointsToken = "";
      for (const code of WOSTORE_ACTIVITY_CODES) {
        const ut = await this.wostoreActivityLogin(cloud, code);
        if (!ut) continue;
        if (!pointsToken) pointsToken = ut;
        await this.wostorePointsSign(ut, WOSTORE_SIGN_CODE);
        await this.wostoreTaskList(ut, code);
      }
      for (const code of WOSTORE_LOTTERY_CODES) {
        const lt = await this.wostoreActivityLogin(cloud, code, code);
        if (!lt) continue;
        await this.wostoreTaskList(lt, code);
        const n = await this.wostoreLotteryCount(lt, code);
        for (let i = 0; i < n; i++) {
          await this.wostoreDraw(lt, code);
          await sleep(3000);
        }
      }
      if (pointsToken) {
        if (await this.wostorePointsHistoryHasPrize(pointsToken, WOSTORE_GOODS_1)) {
          this.log("\u6C83\u4E91\u624B\u673A: \u4ECA\u65E5\u5DF2\u4E2D\u5956\uFF0C\u8DF3\u8FC7\u79EF\u5206\u5355\u62BD");
        } else {
          const remain = Math.min(await this.wostorePointsExchangeRemain(pointsToken, WOSTORE_GOODS_1), safeInt(CFG.wostoreMaxDraw, 1));
          for (let i = 0; i < remain; i++) {
            if (await this.wostorePointsLottery(pointsToken, WOSTORE_GOODS_1)) break;
            await sleep(3000);
          }
        }
        const remain10 = Math.min(await this.wostorePointsExchangeRemain(pointsToken, WOSTORE_GOODS_10), safeInt(CFG.wostoreMaxDraw, 1));
        for (let i = 0; i < remain10; i++) {
          await this.wostorePointsLottery(pointsToken, WOSTORE_GOODS_10);
          await sleep(3000);
        }
      }
      await this.wostorePointInfo(cloud);
      await this.wostoreDeviceStatus(cloud);
    }
    async wostoreTicket() {
      const cityCode = String(((this.cityInfo || [])[0] || {}).cityCode || "");
      const appUA = "ChinaUnicom4.x/12.11 (com.chinaunicom.mobilebusiness; build:36; iOS 16.6.0) Alamofire/4.7.3 unicom{version:iphone_c@12.1100}";
      const appCookie = `ecs_token=${this.ecsToken};t3_token=${this.t3Token};PvSessionId=${compactTime()}${this.uuid};devicedId=${this.uuid};c_mobile=${this.accountMobile};c_version=iphone_c@12.1100;city=036|${cityCode}|90063345|-99;`;
      const t = await this.get(`https://m.client.10010.com/edop_ng/getTicketByNative?token=${encodeURIComponent(this.ecsToken)}&appId=edop_unicom_68e8fa69`, {
        "User-Agent": appUA,
        Accept: "*/*",
        "Accept-Language": "zh-Hans-CN;q=1.0, en-CN;q=0.9",
        Cookie: appCookie
      });
      const ticket = t.ticket || (t.result || {}).ticket;
      if (!ticket) this.log(`\u6C83\u4E91\u624B\u673A: \u83B7\u53D6\u5165\u53E3 Ticket \u5931\u8D25 - ${responseMessage(t)}`);
      return ticket || "";
    }
    async wostoreLogin(ticket) {
      const appUA = "ChinaUnicom4.x/12.11 (com.chinaunicom.mobilebusiness; build:36; iOS 16.6.0) Alamofire/4.7.3 unicom{version:iphone_c@12.1100}";
      const l = await this.postJSON("https://uphone.wostore.cn/h5api/token-service/getTokenByTicket", { ticket, channel: "ST-Kuaidai001" }, {
        "User-Agent": appUA,
        Accept: "*/*",
        "Accept-Language": "zh-Hans-CN;q=1.0, en-CN;q=0.9",
        channel: "ST-Kuaidai001",
        channelCode: "ST-Kuaidai001",
        source: "4",
        os: "H5",
        "X-Tingyun": "c=A|uBuVhVARE0A"
      });
      const cloud = l.data;
      if (!cloud) this.log(`\u6C83\u4E91\u624B\u673A: \u83B7\u53D6Token\u5931\u8D25 - ${responseMessage(l)}`);
      else this.log("\u6C83\u4E91\u624B\u673A: \u4E91\u624B\u673AToken\u83B7\u53D6\u6210\u529F");
      return cloud || "";
    }
    wostoreH5Headers(cloud) {
      return {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.57(0x18003930) NetType/WIFI Language/zh_CN",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: cloud
      };
    }
    wostoreActivityHeaders(userToken) {
      return {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.57(0x18003930) NetType/WIFI Language/zh_CN",
        Origin: "https://uphone.wostore.cn",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-USR-TOKEN": userToken || ""
      };
    }
    wostoreBucpHeaders(token) {
      return {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 unicom{version:iphone_c@12.0601};ltst;OSVersion/16.6",
        Authorization: token
      };
    }
    async wostoreActivityPost(path, payload, userToken = "", label = "\u4E91\u624B\u673A\u8BF7\u6C42") {
      const r = await this.postJSON(`https://uphone.wostore.cn${path}`, payload || {}, this.wostoreActivityHeaders(userToken), { timeout: 15000 });
      if (!r || (!r.code && !r.msg && !r.data)) this.log(`\u6C83\u4E91\u624B\u673A: ${label}\u65E0\u54CD\u5E94\u6216\u5F02\u5E38`);
      return r || {};
    }
    async wostoreBucpGet(path, token) {
      return await this.get(`https://uphone.wo-adv.cn/bucp${path}`, this.wostoreBucpHeaders(token)) || {};
    }
    async wostoreBucpPost(path, token, payload = {}) {
      return await this.postJSON(`https://uphone.wo-adv.cn/bucp${path}`, payload, this.wostoreBucpHeaders(token)) || {};
    }
    async wostoreUserInfo(cloud) {
      const res = await this.wostoreBucpGet("/servers/system/user/getAppUserInfo", cloud);
      if (String(res.code) === "200") {
        const d = res.data || {};
        const name = d.nickName || d.userName || d.phoneNumber || d.mobile;
        if (name) this.log(`\u6C83\u4E91\u624B\u673A: \u5F53\u524D\u7528\u6237 ${mask(name)}`);
      } else this.log(`\u6C83\u4E91\u624B\u673A: \u7528\u6237\u4FE1\u606F\u67E5\u8BE2\u5931\u8D25 - ${responseMessage(res)}`);
      return res;
    }
    async wostorePointInfo(cloud) {
      const res = await this.wostoreBucpGet("/servers/order/user-point/point-info", cloud);
      if (String(res.code) === "200") {
        const d = res.data || {};
        const point = d.balanceScoreNum !== undefined ? d.balanceScoreNum : d.totalPoint !== undefined ? d.totalPoint : d.point !== undefined ? d.point : d.availablePoint;
        if (point !== undefined && point !== null) this.log(`\u6C83\u4E91\u624B\u673A: \u5F53\u524D\u79EF\u5206 ${point}`, true);
      } else this.log(`\u6C83\u4E91\u624B\u673A: \u79EF\u5206\u67E5\u8BE2\u5931\u8D25 - ${responseMessage(res)}`);
      return res;
    }
    async wostoreSign(cloud) {
      const res = await this.postJSON("https://h5forphone.wostore.cn/h5forphone/activity/signIn", { accesstoken: cloud }, this.wostoreH5Headers(cloud));
      this.log(`\u6C83\u4E91\u624B\u673A: \u7B7E\u5230\uFF1A${res.msg || "\u672A\u77E5"}`, true);
      return res;
    }
    async wostoreSignRewards(cloud) {
      const res = await this.postJSON("https://h5forphone.wostore.cn/h5forphone/activity/signInRightList", { accesstoken: cloud }, this.wostoreH5Headers(cloud));
      for (const x of (res.data || {}).goodsList || []) {
        if (x.state === "") {
          const r = await this.postJSON("https://h5forphone.wostore.cn/h5forphone/activity/raffleSignIn", { accesstoken: cloud, activityOrderid: x.activityOrderId, account: "", accountType: "" }, this.wostoreH5Headers(cloud));
          this.log(`\u6C83\u4E91\u624B\u673A: \u9886\u53D6${x.name}\uFF1A${r.msg || "\u672A\u77E5"}`, true);
        }
      }
      return res;
    }
    async wostoreActivityLogin(cloud, code, loginActivityId) {
      const res = await this.wostoreActivityPost("/h5api/activity-service/user/login", { identityType: "cloudPhoneLogin", code: cloud, activityId: loginActivityId || WOSTORE_LOGIN_ACTIVITY_ID, device: "device" }, "", "\u83B7\u53D6\u4E91\u4EFB\u52A1token");
      const token = (res.data || {}).user_token || "";
      if (token) this.log(`\u6C83\u4E91\u624B\u673A: \u6D3B\u52A8[${code}]\u4E91\u4EFB\u52A1Token\u83B7\u53D6\u6210\u529F`);
      else this.log(`\u6C83\u4E91\u624B\u673A: \u6D3B\u52A8[${code}]\u4E91\u4EFB\u52A1Token\u83B7\u53D6\u5931\u8D25 - ${responseMessage(res)}`);
      return token;
    }
    async wostorePointsSign(userToken, signCode) {
      if (!signCode) return {};
      const res = await this.wostoreActivityPost("/h5api/activity-service/points/v1/sign", { activityCode: signCode }, userToken, "\u79EF\u5206\u7B7E\u5230");
      this.log(`\u6C83\u4E91\u624B\u673A: \u79EF\u5206\u7B7E\u5230\uFF1A${res.msg || "\u672A\u77E5"}`, true);
      return res;
    }
    async wostoreTaskList(userToken, code) {
      const res = await this.wostoreActivityPost("/h5api/activity-service/user/task/list", { activityCode: code }, userToken, "\u67E5\u8BE2\u4EFB\u52A1\u5217\u8868");
      const data = res.data || {};
      const list = data.taskList || data.list || data.tasks || res.taskList || [];
      this.log(`\u6C83\u4E91\u624B\u673A: \u6D3B\u52A8[${code}]\u67E5\u8BE2\u5230 ${list.length} \u4E2A\u4EFB\u52A1`);
      if (!list.length) {
        this.log(`\u6C83\u4E91\u624B\u673A: \u6D3B\u52A8[${code}]\u65E0\u53EF\u6267\u884C\u4EFB\u52A1 - ${responseMessage(res)}`);
        return res;
      }
      let done = 0;
      for (const task of list) {
        const name = task.taskName || "\u672A\u77E5\u4EFB\u52A1";
        const tcode = task.taskCode || "";
        const status = String(task.status || task.taskStatus || task.state || "").toUpperCase();
        if (/^(OBTAINED|RECEIVED|FINISHED|DONE)$/.test(status)) {
          done++;
          this.log(`\u6C83\u4E91\u624B\u673A: \u5DF2\u5B8C\u6210[${name}]`);
        } else if (/^(UNCLAIMED|CLAIMABLE|COMPLETED|FINISH)$/.test(status)) {
          this.log(`\u6C83\u4E91\u624B\u673A: \u9886\u53D6[${name}]\u5956\u52B1`);
          const result = await this.wostoreRaffleGet(userToken, code, tcode);
          if (String(result.msg || "").includes("\u6BCF\u65E5\u9650\u5B8C\u6210\u4E00\u4E2A\u6B64\u7C7B\u4EFB\u52A1")) {
            this.log("\u6C83\u4E91\u624B\u673A: \u5DF2\u8FBE\u5F53\u65E5\u4EFB\u52A1\u4E0A\u9650\uFF0C\u505C\u6B62\u672C\u6D3B\u52A8");
            break;
          }
        } else if (status === "INCOMPLETE") {
          this.log(`\u6C83\u4E91\u624B\u673A: \u6267\u884C[${name}] \u72B6\u6001 ${status || "\u672A\u77E5"}`);
          const result = await this.wostoreFinishTask(userToken, code, task);
          if (String(result.msg || "").includes("\u6BCF\u65E5\u9650\u5B8C\u6210\u4E00\u4E2A\u6B64\u7C7B\u4EFB\u52A1")) {
            this.log("\u6C83\u4E91\u624B\u673A: \u5DF2\u8FBE\u5F53\u65E5\u4EFB\u52A1\u4E0A\u9650\uFF0C\u505C\u6B62\u672C\u6D3B\u52A8");
            break;
          }
        } else {
          this.log(`\u6C83\u4E91\u624B\u673A: \u8DF3\u8FC7[${name}] \u672A\u77E5\u72B6\u6001 ${status || "\u7A7A"}`);
        }
      }
      this.log(`\u6C83\u4E91\u624B\u673A: \u6D3B\u52A8[${code}]\u6267\u884C\u524D\u5DF2\u5B8C\u6210 ${done}/${list.length} \u4E2A\u4EFB\u52A1`);
      return res;
    }
    async wostoreFinishTask(userToken, code, task) {
      const tcode = task.taskCode || "";
      const name = task.taskName || task.taskDesc || tcode;
      const res = await this.wostoreActivityPost("/h5api/activity-service/user/task/logs", { logType: "01", logCode: tcode, logSource: "01", logDetail: name }, userToken, "\u5B8C\u6210\u4EFB\u52A1");
      this.log(`\u6C83\u4E91\u624B\u673A: \u4EFB\u52A1\u72B6\u6001\uFF1A${res.msg || "\u672A\u77E5"}`);
      if (String(res.code) !== "200") {
        this.log(`\u6C83\u4E91\u624B\u673A: \u4EFB\u52A1[${name}]\u5B8C\u6210\u5931\u8D25\uFF0C\u8DF3\u8FC7\u9886\u53D6`);
        return res;
      }
      await sleep(15000);
      return await this.wostoreRaffleGet(userToken, code, tcode);
    }
    async wostoreRaffleGet(userToken, code, taskCode) {
      const res = await this.wostoreActivityPost("/h5api/activity-service/user/task/raffle/get", { activityCode: code, taskCode }, userToken, "\u9886\u53D6\u4EFB\u52A1\u5956\u52B1");
      this.log(`\u6C83\u4E91\u624B\u673A: \u5956\u52B1\u9886\u53D6\u7ED3\u679C\uFF1A${res.msg || "\u672A\u77E5"}`, true);
      return res;
    }
    async wostoreLotteryCount(userToken, code) {
      const res = await this.wostoreActivityPost("/h5api/activity-service/user/task/list", { activityCode: code }, userToken, "\u67E5\u8BE2\u62BD\u5956\u6B21\u6570");
      const data = res.data || {};
      const count = safeInt(data.rafflesLeftCount || data.raffleLeftCount || data.lotteryLeftCount || res.rafflesLeftCount || res.raffleLeftCount);
      this.log(`\u6C83\u4E91\u624B\u673A: \u6D3B\u52A8[${code}]\u5269\u4F59\u62BD\u5956\u6B21\u6570\uFF1A${count}`);
      return count;
    }
    async wostoreDraw(userToken, code) {
      const res = await this.wostoreActivityPost("/h5api/activity-service/lottery", { activityCode: code }, userToken, "\u62BD\u5956");
      this.log(`\u6C83\u4E91\u624B\u673A: \u62BD\u5956\u83B7\u5F97\uFF1A${(res.data || {}).prizeName || res.msg || "\u672A\u77E5\u5956\u52B1"}`, true);
      return res;
    }
    async wostorePointsHistoryHasPrize(userToken, goodsId) {
      try {
        const res = await this.get(`https://uphone.wostore.cn/h5api/activity-service/points/v1/lottery/history?page=1&pageSize=10&goodsId=${goodsId}`, this.wostoreActivityHeaders(userToken));
        const today = today();
        const data = res.data || {};
        const records = Array.isArray(data) ? data : data.records || data.list || [];
        return records.some((x) => String(x.createTime || x.drawTime || "").startsWith(today) && x.prizeName);
      } catch (e) {
        this.log(`\u6C83\u4E91\u624B\u673A: \u79EF\u5206\u62BD\u5956\u8BB0\u5F55\u67E5\u8BE2\u5F02\u5E38 ${e && e.message || e}`);
        return false;
      }
    }
    async wostorePointsExchangeRemain(userToken, goodsId) {
      try {
        const res = await this.get(`https://uphone.wostore.cn/h5api/activity-service/points/v1/exchange/list?activityCode=${WOSTORE_POINTS_ACT_CODE}`, this.wostoreActivityHeaders(userToken));
        const data = res.data || {};
        const list = Array.isArray(data) ? data : data.goodsList || data.list || [];
        for (const item of list) {
          if (String(item.goodsId) === String(goodsId)) {
            const remain = safeInt(item.remainUser || item.remainCount || item.surplusCount);
            this.log(`\u6C83\u4E91\u624B\u673A: \u79EF\u5206\u5546\u54C1[${goodsId}]\u5269\u4F59\u6B21\u6570\uFF1A${remain}`);
            return remain;
          }
        }
      } catch (e) {
        this.log(`\u6C83\u4E91\u624B\u673A: \u79EF\u5206\u5151\u6362\u5217\u8868\u67E5\u8BE2\u5F02\u5E38 ${e && e.message || e}`);
      }
      return 0;
    }
    async wostorePointsLottery(userToken, goodsId) {
      const res = await this.wostoreActivityPost("/h5api/activity-service/points/v1/lottery", { activityCode: WOSTORE_POINTS_ACT_CODE, goodsId }, userToken, "\u79EF\u5206\u62BD\u5956");
      let results = (res.data || {}).results || [];
      if (!results.length && res.data) results = [res.data];
      const prizes = results.map((x) => String(x.prizeName || "\u672A\u77E5"));
      const label = String(goodsId) === String(WOSTORE_GOODS_1) ? "\u79EF\u5206\u5355\u62BD" : "\u79EF\u520610\u8FDE\u62BD";
      this.log(`\u6C83\u4E91\u624B\u673A: ${label}\uFF1A${res.msg || prizes.join("\u3001") || "\u672A\u77E5"}`, true);
      return prizes.some((x) => x.includes(WOSTORE_STOP_PRIZE));
    }
    async wostoreDeviceStatus(cloud) {
      const res = await this.wostoreBucpGet("/servers/resource/instance/list?pageNum=1&pageSize=200", cloud);
      const rows = res.rows || (res.data || {}).rows || [];
      for (const device of rows) {
        const id = device.id || device.deviceId || "";
        const status = device.status || "?";
        if (status === "running") this.log("\u6C83\u4E91\u624B\u673A: \u8BBE\u5907\u8FD0\u884C\u6B63\u5E38");
        else if (status === "pre_create") await this.wostoreDeviceAction(cloud, "/servers/resource/instance/cpInstanceAction", { action: "allot", cpInstanceId: id }, "\u6FC0\u6D3B\u8BBE\u5907");
        else await this.wostoreDeviceAction(cloud, "/servers/resource/backup/recover", { cpInstanceId: id }, "\u6062\u590D\u8BBE\u5907");
      }
      return res;
    }
    async wostoreDeviceAction(cloud, path, payload, label) {
      const res = await this.wostoreBucpPost(path, cloud, payload);
      this.log(`\u6C83\u4E91\u624B\u673A: ${label}\u7ED3\u679C\uFF1A${res.msg || "\u672A\u77E5"}`);
      return res;
    }
    regions() {
      const out = { xinjiang: false, henan: false, yunnan: false, liaoning: false, anhui: false };
      const map = { "\u65b0\u7586": "xinjiang", "\u6cb3\u5357": "henan", "\u4e91\u5357": "yunnan", "\u8fbd\u5b81": "liaoning", "\u5b89\u5fbd": "anhui" };
      for (const city of this.cityInfo || []) {
        const name = String((city || {}).proName || (city || {}).provinceName || "");
        for (const key of Object.keys(map)) if (name.includes(key)) out[map[key]] = true;
      }
      return out;
    }
    async regionalTask() {
      this.log(`==== \u533A\u57DF\u4E13\u533A${CFG.queryOnly ? "\uFF08\u67E5\u8BE2\u6A21\u5F0F\uFF09" : ""} ====`);
      const r = this.regions();
      const area = Object.keys(r).filter((k) => r[k]).join(",");
      this.log(`\u5F52\u5C5E\u5730\u8BC6\u522B\uFF1A${area || "\u672A\u8BC6\u522B"}${CFG.provinceOverride ? `\uFF08\u624B\u52A8\u6307\u5B9A ${CFG.provinceOverride}\uFF09` : ""}`);
      if (!Object.values(r).some(Boolean)) {
        this.log("\u672A\u8BC6\u522B\u5230\u5DF2\u652F\u6301\u7684\u533A\u57DF\u4E13\u533A");
        return;
      }
      if (r.xinjiang) await this.xinjiangTask();
      if (r.henan) await this.henanTask();
      if (r.yunnan) await this.yunnanTask();
      if (r.liaoning) await this.liaoningTask();
      if (r.anhui) {
        if (!CFG.ahFriday || !CFG.ahAmount) {
          this.log("\u5DF2\u8BC6\u522B\u5B89\u5FBD\u53F7\u7801\uFF1B\u8D85\u7EA7\u661F\u671F\u4E94\u9700\u5F00\u542F\u5F00\u5173\u5E76\u586B\u5199\u7EA2\u5305\u9762\u989D");
        } else if (CFG.queryOnly) this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A[\u67E5\u8BE2\u6A21\u5F0F] \u76EE\u6807\u9762\u989D${CFG.ahAmount}\u5143\uFF08\u4EC5\u5468\u4E9410\u70B9\u6267\u884C\uFF09`);
        else await this.anhuiTask();
      }
    }
    async xinjiangTask() {
      const entryUrl = "https://zy100.xj169.com/touchpoint/openapi/jumpHandRoom1G?source=155&type=02";
      const e = await this.openPlat(entryUrl);
      if (!e || !e.ticket) {
        this.log("\u65B0\u7586\u4E13\u533A\uFF1A\u83B7\u53D6\u5165\u53E3 ticket \u5931\u8D25");
        return;
      }
      const xjUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 unicom{version:iphone_c@12.0701};ltst;OSVersion/16.2";
      const login = await this.postForm("https://zy100.xj169.com/touchpoint/openapi/getTokenAndCity", { ticket: e.ticket }, { Referer: `${entryUrl}&ticket=${encodeURIComponent(e.ticket)}`, "User-Agent": xjUa });
      const token = ((login.result || {}).data || {}).token || (login.data || {}).token;
      if (!token) {
        this.log("\u65B0\u7586\u4E13\u533A\uFF1A\u83B7\u53D6 token \u5931\u8D25");
        return;
      }
      const h = { "userToken": token, "User-Agent": xjUa, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" };
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const activityId = `${months[(/* @__PURE__ */ new Date()).getMonth()]}${(/* @__PURE__ */ new Date()).getFullYear()}Act`;
      if (CFG.queryOnly) {
        this.log("\u65B0\u7586\u4E13\u533A\uFF1A[\u67E5\u8BE2\u6A21\u5F0F] \u8DF3\u8FC7\u6BCF\u65E5\u6253\u5361\u548C\u5BA2\u6237\u65E5\uFF0C\u67E5\u8BE2\u6708\u62BD\u5956\u8BB0\u5F55");
        await this.xinjiangRecords(activityId, h);
        return;
      }
      const daily = await this.postForm("https://zy100.xj169.com/touchpoint/openapi/marchAct/draw_Jan2026Act", { activityId: "dakaJan2026Act", prizeId: "" }, h);
      this.log(`\u65B0\u7586\u4E13\u533A\uFF1A\u6BCF\u65E5\u6253\u5361 - ${(daily.result || {}).msg || (daily.result || {}).data || "\u5931\u8D25"}`, true);
      const day = (/* @__PURE__ */ new Date()).getDate();
      if (day >= 19 && day <= 25) {
        const userDay = await this.postForm("https://zy100.xj169.com/touchpoint/openapi/marchAct/draw_UsersDay2025Act", { activityId: "usersDay2025Act", prizeId: "hfq_twenty" }, h);
        this.log(`\u65B0\u7586\u5BA2\u6237\u65E5\uFF1A\u79D2\u6740\u7ED3\u679C - ${(userDay.result || {}).msg || (userDay.result || {}).data || "\u5931\u8D25"}`, true);
      }
      const draw = await this.postForm(`https://zy100.xj169.com/touchpoint/openapi/themeAct/draw_${activityId}`, { activityId, prizeId: "", commHighFlag: "false" }, h);
      let status = "continue", message = "";
      if (draw.code === "ERROR") {
        const value = String(draw.data || "");
        if (value.includes("\u5DF2\u7528\u5B8C") || value.includes("\u5DF2\u62BD\u5B8C") || String(draw.msgType) === "101") {
          status = "done";
          message = `\u4ECA\u65E5\u673A\u4F1A\u5DF2\u7528\u5C3D\uFF08${value || draw.msg || "\u65E0\u53EF\u7528\u6B21\u6570"}\uFF09`;
        } else if (String(draw.msg || "").includes("\u9891\u7387\u8FC7\u9AD8")) {
          status = "done";
          message = "\u63A5\u53E3\u9891\u7387\u9650\u5236";
        } else if (String(draw.msg || "").includes("\u7F3A\u5C11\u53C2\u6570")) {
          status = "invalid";
          message = "token \u5DF2\u5931\u6548";
        } else {
          status = "done";
          message = `\u62BD\u5956\u5931\u8D25\uFF1A${value || draw.msg || "\u672A\u77E5\u9519\u8BEF"}`;
        }
      } else if (draw.code === "SUCCESS") {
        if (draw.msg === "thanks1") message = `\u672A\u4E2D\u5956\uFF08${draw.data || draw.msg}\uFF09`;
        else {
          status = "won";
          message = `\u4E2D\u5956\uFF1A${draw.data || "\u672A\u77E5\u5956\u54C1"}`;
        }
      } else if (String(draw.code) === "401") {
        status = "invalid";
        message = "token \u5DF2\u5931\u6548";
      } else message = `\u672A\u4E2D\u5956\uFF08${draw.msg || draw.data || draw.code || "\u672A\u77E5"}\uFF09`;
      this.log(`\u65B0\u7586\u4E13\u533A\uFF1A\u6BCF\u6708\u62BD\u5956\u7B2C1\u6B21 - ${message}`, status === "won");
      await this.xinjiangRecords(activityId, h);
    }
    async xinjiangRecords(activityId, headers) {
      const rec = await this.postForm("https://zy100.xj169.com/touchpoint/openapi/drawAct/getPrizesScroll", { activityId }, headers);
      let data = rec.data || [];
      if (data && !Array.isArray(data)) data = [data];
      if (!data.length) {
        this.log("\u65B0\u7586\u4E13\u533A\uFF1A\u6BCF\u6708\u62BD\u5956\u6682\u65E0\u4E2D\u5956\u8BB0\u5F55");
        return;
      }
      let shown = 0;
      for (const item of data) {
        if (shown >= 5) break;
        if (typeof item === "string") {
          this.log(`\u65B0\u7586\u4E13\u533A\uFF1A\u6BCF\u6708\u62BD\u5956\u8BB0\u5F55 - ${item}`, true);
          shown++;
          continue;
        }
        if (!item || typeof item !== "object") continue;
        const name = item.prizeName || item.prizeId || "\u672A\u77E5\u5956\u54C1";
        const ts = safeInt(item.drawDate);
        const date = ts ? `${pad2(new Date(ts).getMonth() + 1)}-${pad2(new Date(ts).getDate())}` : "\u672A\u77E5\u65F6\u95F4";
        this.log(`\u65B0\u7586\u4E13\u533A\uFF1A\u6BCF\u6708\u62BD\u5956\u8BB0\u5F55 - ${name}\uFF08${date}\uFF09`, true);
        shown++;
      }
      if (!shown) this.log("\u65B0\u7586\u4E13\u533A\uFF1A\u6BCF\u6708\u62BD\u5956\u6682\u65E0\u53EF\u5C55\u793A\u8BB0\u5F55");
    }
    async henanTask() {
      const t = await this.get(`https://m.client.10010.com/edop_ng/getTicketByNative?appId=edop_unicom_4b80047a&token=${encodeURIComponent(this.ecsToken)}`);
      const ticket = (t.result || {}).ticket || t.ticket;
      if (!ticket) return;
      await this.get(`https://app.shangdu.com/monthlyBenefit/v1/common/config?ticket=${encodeURIComponent(ticket)}`, { Origin: "https://app.shangdu.com", edop_flag: "0" });
      const s = await this.postJSON("https://app.shangdu.com/monthlyBenefit/v1/signIn/queryCumulativeSignAxis", {}, { Origin: "https://app.shangdu.com", edop_flag: "0" });
      const signed = ((s.result || {}).data || {}).todaySignFlag === "1";
      if (signed || CFG.queryOnly) {
        this.log(`\u6CB3\u5357\u5546\u90FD\uFF1A\u4ECA\u65E5${signed ? "\u5DF2" : "\u672A"}\u7B7E\u5230`, true);
        return;
      }
      const x = await this.postJSON("https://app.shangdu.com/monthlyBenefit/v1/signIn/userSignIn", {}, { Origin: "https://app.shangdu.com", edop_flag: "0" });
      this.log(`\u6CB3\u5357\u5546\u90FD\uFF1A${(((x.result || {}).data || {}).prizeResp || {}).prizeName || (x.result || {}).msg || "\u7B7E\u5230\u5B8C\u6210"}`, true);
    }
    yunnanSign(payload) {
      const raw = Object.keys(payload).sort().map((k) => `${k}=${encodeURIComponent(typeof payload[k] === "object" ? JSON.stringify(payload[k]) : payload[k])}`).join("&").toLowerCase() + "ltynsh@sd23kjkgj2mbnfa0";
      return md5(md5(raw));
    }
    async yunnanTask() {
      const baseUrl = "https://wsm.wx.yn10010.com";
      const to = "https://wsm.wx.yn10010.com/micropage/orderPages/newYear/2025newYearsDay?channelId=1001010";
      const entry = `https://m.client.10010.com/mobileService/openPlatform/openPlatLineNew.htm?${form({ to_url: to, "amp;s": "100000425", "amp;boothCode": "YN-QCQYCS245", "amp;boothAccessMode": "24" })}`;
      const er = await this.req("get", entry, { redirect: false, headers: { Cookie: `ecs_token=${this.ecsToken}`, Referer: `${baseUrl}/`, "User-Agent": H5_UA } });
      const ticket = qs(getHeader(er.headers, "Location")).ticket;
      if (!ticket) {
        this.log("\u4E91\u5357\u751F\u6D3B\uFF1A\u83B7\u53D6 ticket \u5931\u8D25");
        return;
      }
      const rr = await this.req("get", `${baseUrl}/2b2c-mobile/getPhoneNumber?ticket=${encodeURIComponent(ticket)}`, { headers: { "Content-Type": "application/json;charset=gb2312", Referer: `${baseUrl}/`, "User-Agent": H5_UA } });
      const body = rr.json || {};
      let token = getHeader(rr.headers, "token") || getHeader(rr.headers, "Token") || (body.data || {}).token || body.token;
      if (!token) {
        this.log(`\u4E91\u5357\u751F\u6D3B\uFF1A\u672A\u627E\u5230 token\uFF0C\u54CD\u5E94 ${String(rr.body || "").slice(0, 160)}`);
        return;
      }
      if (!String(token).startsWith("Bearer ")) token = `Bearer ${token}`;
      const base = { token, "User-Agent": H5_UA, Origin: baseUrl, Referer: `${baseUrl}/` };
      if (CFG.queryOnly) {
        this.log("\u4E91\u5357\u751F\u6D3B\uFF1A[\u67E5\u8BE2\u6A21\u5F0F] \u67E5\u8BE2\u4E91\u8C46\u4F59\u989D");
        await this.yunnanBalance(baseUrl, base);
        return;
      }
      for (const p of [{ taskName: "\u6BCF\u65E5\u7B7E\u5230", taskCode: "DAILY_SIGN" }, { taskName: "\u6D4F\u89C8\u5E74\u7EC8\u5927\u56DE\u9988,\u597D\u793C\u591A\u591A", taskCode: "BROWSE_5TOWNS" }]) {
        const x = await this.postJSON(`${baseUrl}/2b2c-mobile/activity/task/addTaskUser`, p, { ...base, accessKeyId: "ltynsh", time: String(nowMs()), sign: this.yunnanSign(p) });
        this.log(`\u4E91\u5357\u751F\u6D3B\uFF1A${x.resultCode === "0000" ? "\u2705" : "\u274C"} ${p.taskName}${x.resultCode === "0000" ? "" : `\uFF1A${x.resultMsg || ""}`}`);
        await sleep(2e3);
      }
      const drawBody = { actId: "47191519589909", boothCode: "" };
      for (let i = 0; i < 2; i++) {
        const x = await this.postJSON(`${baseUrl}/2b2c-mobile/acttmpl/lottery/actLuckyDrawy`, drawBody, base);
        this.log(`\u4E91\u5357\u751F\u6D3B\uFF1A${x.resultCode === "0000" ? "\u2705" : "\u274C"} \u7B2C${i + 1}\u6B21\u62BD\u5956${x.resultCode === "0000" ? "\u8BF7\u6C42\u6210\u529F" : `\u5931\u8D25\uFF1A${x.resultMsg || ""}`}`);
        if (i === 0) await sleep(2e3);
      }
      const rec = await this.get(`${baseUrl}/2b2c-mobile/acttmpl/lottery/getUserRecordListActInfo?${form({ actId: "47191519589909", periodId: "47191519589909" })}`, { ...base, "Content-Type": "application/json;charset=gb2312" });
      const awards = ((rec.data || {}).recordList || []).filter((x) => String(x.createTime || "").startsWith(today())).map((x) => x.awardName || "\u672A\u77E5");
      if (awards.length) awards.forEach((x) => this.log(`\u4E91\u5357\u751F\u6D3B\uFF1A\u{1F381} \u62BD\u5956\u7ED3\u679C - ${x}`, true));
      else this.log("\u4E91\u5357\u751F\u6D3B\uFF1A\u4ECA\u65E5\u6682\u65E0\u62BD\u5956\u8BB0\u5F55");
      await this.yunnanBalance(baseUrl, base);
    }
    async yunnanBalance(baseUrl, base) {
      const body = {};
      const x = await this.postJSON(`${baseUrl}/user/beans/api/getTotalAvailableBeansByPhone`, body, { ...base, accessKeyId: "ltynsh", time: String(nowMs()), sign: this.yunnanSign(body) });
      if (x.resultCode === "0000") this.log(`\u4E91\u5357\u751F\u6D3B\uFF1A\u{1F4B0} \u5F53\u524D\u4E91\u8C46\u4F59\u989D ${x.data || 0}`, true);
      else this.log(`\u4E91\u5357\u751F\u6D3B\uFF1A\u83B7\u53D6\u4E91\u8C46\u5931\u8D25 ${x.resultMsg || ""}`);
    }
    async liaoningTask() {
      const e = await this.openPlat("https://weixin.linktech.hk/lv-web/handHall/autoLogin?actcode=sign");
      if (!e || !e.ticket) {
        this.log("\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u83B7\u53D6 ticket \u5931\u8D25");
        return;
      }
      const mobile = this.accountMobile, ts = compactTime();
      const u = `https://weixin.linktech.hk/lv-web/handHall/autoLogin?${form({ actcode: "sign", type: e.type || "06", ticket: e.ticket, version: "android@11.0802", timestamp: ts, desmobile: mobile, num: "0", postage: md5(mobile + ts), userNumber: mobile })}`;
      const rr = await this.req("get", u, { redirect: false });
      const rawLoc = getHeader(rr.headers, "Location");
      let decoded = "";
      try {
        decoded = decodeURIComponent(rawLoc);
      } catch (_) {
        decoded = rawLoc;
      }
      let match = rawLoc.match(/sid[=%]3[Dd]?([a-f0-9]{32})/i) || decoded.match(/[?&]sid=([a-f0-9]{32})/i);
      if (!match) {
        const params = qs(decoded).params || "";
        match = String(params).match(/(?:^|&)sid=([a-f0-9]{32})/i);
      }
      const sid = match && match[1];
      if (!sid) {
        this.log("\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u91CD\u5B9A\u5411\u4E2D\u672A\u627E\u5230 sid");
        return;
      }
      this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u83B7\u53D6 sid \u6210\u529F\uFF08${sid.slice(0, 8)}...\uFF09`);
      const api = async (path, extra = "") => this.postForm(`https://weixin.linktech.hk/lv-apiaccess/welfareCenter/${path}`, parseForm(`sid=${sid}&actcode=welfareCenter${extra ? "&" + extra : ""}`), { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://weixin.linktech.hk", Referer: `https://weixin.linktech.hk/app/flmf/LV-202111-04/moreShatter?sid=${sid}&actcode=welfareCenter`, "User-Agent": H5_UA });
      const add = await api("addUser");
      if (!add || add.resultCode !== "0000") {
        this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u7528\u6237\u521D\u59CB\u5316\u5931\u8D25 ${add && add.resultMsg || "\u65E0\u54CD\u5E94"}`);
        return;
      }
      await sleep(1e3);
      const st = await api("signInInit");
      if (st.resultCode === "0000") {
        const d = st.data || {}, signed = !!d.isSigned, days = safeInt(d.consecutiveDays);
        if (signed) this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u4ECA\u65E5\u5DF2\u7B7E\u5230\uFF08\u8FDE\u7EED${days}\u5929\uFF09`);
        else if (CFG.queryOnly) this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u4ECA\u65E5\u672A\u7B7E\u5230\uFF08\u8FDE\u7EED${days}\u5929\uFF09`);
        else {
          await sleep(1e3);
          const x = await api("signIn");
          this.log(x.resultCode === "0000" ? `\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u2705 \u7B7E\u5230\u6210\u529F\uFF08\u8FDE\u7EED${days + 1}\u5929\uFF09` : `\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u7B7E\u5230\u5931\u8D25 ${x.resultMsg || "\u65E0\u54CD\u5E94"}`, x.resultCode === "0000");
        }
      } else this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u67E5\u8BE2\u7B7E\u5230\u72B6\u6001\u5931\u8D25 ${st.resultMsg || "\u65E0\u54CD\u5E94"}`);
      await sleep(1e3);
      const inf = await api("getUserInfo");
      if (inf.resultCode === "0000") {
        const d = inf.data || {};
        this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A\u6C83\u5E01${d.woBi || 0} | \u7D2F\u8BA1\u7B7E\u5230${d.signTimes || 0}\u5929 | \u4F1A\u5458\u788E\u7247${d.memberwobi || 0} | \u7B49\u7EA7${d.membertrun || 0} | \u6743\u76CA${d.rightsNum || 0}\u6B21`, true);
      }
      if (CFG.queryOnly) return;
      await sleep(1e3);
      const tasks = await api("taskList", "refresh=0&nowTask=");
      if (tasks.resultCode === "0000") {
        for (const group of (tasks.data || {}).taskInfoList || []) {
          for (const t of group.taskInfoList || []) {
            this.log(`\u8FBD\u5B81\u798F\u5229\u9B54\u65B9\uFF1A${safeInt(t.done) > 0 ? "\u2705" : "\u23F3"} ${t.taskName || "\u672A\u77E5\u4EFB\u52A1"}\uFF08${t.done || 0}/${t.count || 0}\uFF09`);
          }
        }
      }
    }
    async anhuiTask() {
      if ((/* @__PURE__ */ new Date()).getDay() !== 5) {
        this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u4ECA\u5929\u4E0D\u662F\u5468\u4E94\uFF0C\u8DF3\u8FC7`);
        return;
      }
      const base = "http://123.138.11.116:8080", entryUrl = `${base}/wxopen/hh/activity/superFriday/index?chnlId=app-ty&type=02`;
      this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u{1F3AF} \u76EE\u6807\u9762\u989D ${CFG.ahAmount}\u5143`);
      const e = await this.openPlat(entryUrl);
      if (!e || !e.ticket) {
        this.log("\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u83B7\u53D6\u5165\u53E3 ticket \u5931\u8D25");
        return;
      }
      const mobile = this.accountMobile, ts = compactTime(), postage = md5(mobile + ts);
      const pageParams = { chnlId: "app-ty", type: "02", ticket: e.ticket, version: "android@11.0802", timestamp: ts, desmobile: mobile, num: "0", postage, userNumber: mobile };
      const page = await this.req("get", `${base}/wxopen/hh/activity/superFriday/index?${form(pageParams)}`, { headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "User-Agent": UA } });
      const setCookie = getHeader(page.headers, "Set-Cookie");
      let m = String(setCookie).match(/(?:^|[,;]\s*)ticket=([^;,\s]+)/i) || String(page.body || "").match(/ticket[=:]\s*["']?([a-zA-Z0-9_-]{8,})/i);
      const ticket = m ? m[1] : e.ticket;
      if (!m) this.log("\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u9875\u9762\u672A\u8FD4\u56DE\u72EC\u7ACB ticket\uFF0C\u4F7F\u7528\u5165\u53E3 ticket \u515C\u5E95");
      else this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u83B7\u53D6\u6D3B\u52A8 ticket \u6210\u529F\uFF08${ticket.slice(0, 12)}...\uFF09`);
      const headers = { Accept: "application/json, text/plain, */*", "Content-Type": "application/json", Origin: base, Cookie: `ticket=${ticket}`, "User-Agent": UA };
      const list = await this.postJSON(`${base}/wxopen/app-activity/AHSecKill/querySecKillInfo`, {}, headers);
      if (!list.success && !list.data) {
        this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u67E5\u8BE2\u5956\u54C1\u5217\u8868\u5931\u8D25 ${list.alertMsg || "\u672A\u77E5"}`);
        return;
      }
      let items = Array.isArray(list.data) ? list.data : (list.data || {}).itemList || [];
      let item = items.find((x) => String(x.itemName || "").includes(CFG.ahAmount) || String(x.itemCode || "").includes(`hb${CFG.ahAmount}`));
      if (!item) {
        item = { itemCode: `AWARD_AHFridaySecKill_10_hb${CFG.ahAmount}`, itemName: `${CFG.ahAmount}\u5143\u7EA2\u5305`, key: "" };
        this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u672A\u5339\u914D\u5956\u54C1\uFF0C\u4F7F\u7528\u9ED8\u8BA4 itemCode ${item.itemCode}`);
      } else this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u5339\u914D\u76EE\u6807 [${item.itemName}]\uFF08${item.itemCode}\uFF09`);
      const now = /* @__PURE__ */ new Date(), target = new Date(now);
      target.setHours(10, 0, 0, 0);
      let waitMs = target.getTime() - Date.now();
      if (waitMs > 3e5) {
        this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u8DDD10:00\u8FD8\u6709 ${(waitMs / 1e3).toFixed(0)}\u79D2\uFF0C\u5927\u4E8E5\u5206\u949F\uFF0C\u5EFA\u8BAE\u4E34\u8FD1\u65F6\u542F\u52A8`);
        return;
      }
      if (waitMs > 0) {
        this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u7B49\u5F85\u5F00\u62A2\uFF08\u5269\u4F59 ${(waitMs / 1e3).toFixed(1)}\u79D2\uFF09`);
        while ((waitMs = target.getTime() - Date.now()) > 300) await sleep(Math.min(100, waitMs - 300));
        this.log("\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u26A1 \u65F6\u95F4\u5230\uFF0C\u5F00\u59CB\u62A2\u8D2D");
      } else this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u5DF2\u8FC710\u70B9 ${(Math.abs(waitMs) / 1e3).toFixed(1)}\u79D2\uFF0C\u76F4\u63A5\u62A2\u8D2D`);
      const referer = `${base}/wxopen/hh/activity/superFriday/index?${form(pageParams)}`;
      let failed = 0;
      this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u5F00\u59CB\u6279\u91CF\u62A2\u8D2D [${item.itemName}]\uFF0C\u517150\u6B21`);
      for (let i = 1; i <= 50; i++) {
        const p = { ticket, itemCode: item.itemCode, time: String(nowMs()) };
        if (item.key) p.key = item.key;
        const x = await this.postJSON(`${base}/wxopen/app-activity/AHSecKill/lotteryAction?${form(p)}`, {}, { ...headers, Referer: referer });
        if (x.success) {
          this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u{1F389} \u7B2C${i}\u6B21\u62A2\u8D2D\u6210\u529F ${JSON.stringify(x)}`, true);
          return;
        }
        failed++;
        const alert = x.alertMsg || "";
        if (i <= 3 || i % 20 === 0) this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u7B2C${i}\u6B21 - ${alert || x.statusCode || "\u672A\u77E5"}`);
        if (/已抢完|已结束|已领取/.test(alert)) {
          this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u26A0\uFE0F ${alert}\uFF0C\u505C\u6B62\u62A2\u8D2D`);
          break;
        }
        if (i < 50) await sleep(300);
      }
      this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A\u62A2\u8D2D\u5B8C\u6210\uFF0C\u5931\u8D25${failed}\u6B21`, true);
    }
    async run() {
      const only = CFG.mode !== "all" ? CFG.mode : "";
      const wants = (name, enabled) => enabled && (!only || only === name);
      await this.queryRemain();
      if (wants("sign", CFG.enableSign)) await this.signTask();
      if (wants("ltzf", CFG.enableLtzf)) await this.ltzfTask();
      if (wants("ttlxj", CFG.enableTtlxj)) await this.ttlxjTask();
      if (wants("ttxc", CFG.enableTtxc)) await this.ttxcTask();
      if (wants("market", CFG.enableMarket)) await this.marketTask();
      if (wants("woread", CFG.enableWoread)) await this.woreadTask();
      if (wants("aiting", CFG.enableAiting)) await this.aitingTask();
      if (wants("security", CFG.enableSecurity)) await this.securityTask();
      if (wants("cloud", CFG.enableCloud)) await this.cloudTask();
      if (wants("wostore", CFG.enableWostore)) await this.wostoreTask();
      if (wants("regional", CFG.enableRegional)) await this.regionalTask();
    }
  };
  async function main() {
    const accounts = readJSON(STORE_KEY, []);
    if (!accounts.length) {
      $notification.post("\u4E2D\u56FD\u8054\u901A", "\u672A\u83B7\u53D6\u8D26\u53F7", "\u8BF7\u5148\u5F00\u542F\u6293\u53D6\u5F00\u5173\uFF0C\u5728\u4E2D\u56FD\u8054\u901A App \u9000\u51FA\u540E\u91CD\u65B0\u767B\u5F55\u4E00\u6B21\u3002");
      $done();
      return;
    }
    console.log(`[\u4E2D\u56FD\u8054\u901A ${VERSION}] \u5171 ${accounts.length} \u4E2A\u8D26\u53F7\uFF0C\u6A21\u5F0F ${CFG.mode}`);
    const users = [];
    for (let i = 0; i < accounts.length; i++) {
      const u = new UserService(i + 1, accounts[i]);
      users.push(u);
      try {
        if (await u.login()) await u.run();
      } catch (e) {
        u.log(`\u8FD0\u884C\u5F02\u5E38\uFF1A${e && e.stack || e}`, true);
      }
      await sleep(1e3);
    }
    if (CFG.enableNotify) {
      const parts = [];
      for (const u of users) {
        if (u.notifyLogs.length) parts.push(`\u3010\u8D26\u53F7${u.index}\u3011${mask(u.mobile)}
${u.notifyLogs.join("\n")}`);
      }
      if (parts.length) $notification.post(`\u4E2D\u56FD\u8054\u901A ${VERSION}`, `${accounts.length} \u4E2A\u8D26\u53F7\u6267\u884C\u5B8C\u6210`, parts.join("\n\n"));
    }
    $done();
  }
  if (isRequest) captureAccount().catch((e) => {
    console.log(e);
    $done({});
  });
  else main().catch((e) => {
    console.log(e);
    $notification.post("\u4E2D\u56FD\u8054\u901A\u811A\u672C\u5F02\u5E38", "", String(e && e.stack || e));
    $done();
  });
})();