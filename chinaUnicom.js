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
  var VERSION = "v1.1.1-loon.2";
  var STORE_KEY = "cu_accounts_v2";
  var DEVICE_KEY = "cu_device_ids_v2";
  var UA = "Dalvik/2.1.0 (Linux; U; Android 12; Mi 10 Pro MIUI/21.11.3);unicom{version:android@11.0802}";
  var H5_UA = "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/143.0.7499.146 Mobile Safari/537.36; unicom{version:android@11.0802,desmobile:0};devicetype{deviceBrand:Xiaomi,deviceModel:MI 8}";
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
    marketWater: true,
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
    cloudImageFid: "",
    cloudUploadName: "8648",
    ttxcGarbageWait: 28,
    ttxcGrowMax: 20,
    wostoreMaxDraw: 1
  };
  var isRequest = typeof $request !== "undefined";
  var arg = typeof $argument === "object" && $argument ? $argument : {};
  var bool = (v, d) => v === void 0 || v === null || v === "" ? d : String(v).toLowerCase() === "true";
  var num = (v, d) => Number.isFinite(Number(v)) ? Number(v) : d;
  var CFG = {
    mode: arg.mode || DEFAULTS.mode,
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
    grabCoupon: bool(arg.grabCoupon, DEFAULTS.grabCoupon),
    grabAmount: String(arg.grabAmount || DEFAULTS.grabAmount),
    ahFriday: bool(arg.ahFriday, DEFAULTS.ahFriday),
    ahAmount: String(arg.ahAmount || DEFAULTS.ahAmount),
    queryOnly: bool(arg.queryOnly, DEFAULTS.queryOnly),
    requestNode: String(arg.requestNode || DEFAULTS.requestNode).trim(),
    cloudImageFid: String(arg.cloudImageFid || DEFAULTS.cloudImageFid).trim(),
    cloudUploadName: String(arg.cloudUploadName || DEFAULTS.cloudUploadName).trim(),
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
    if (s.length > 12) return `${s.slice(0, 6)}******${s.slice(-6)}`;
    return s;
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
  function aesCbcB64(text, key, iv, hexThenB64 = false, upperHex = false) {
    const enc = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(String(text)), CryptoJS.enc.Utf8.parse(String(key)), { iv: CryptoJS.enc.Utf8.parse(String(iv)), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    if (!hexThenB64) return enc.ciphertext.toString(CryptoJS.enc.Base64);
    let h = enc.ciphertext.toString(CryptoJS.enc.Hex);
    if (upperHex) h = h.toUpperCase();
    return b64Utf8(h);
  }
  function responseMessage(x) {
    if (!x || typeof x !== "object") return String(x || "\u63A5\u53E3\u8FD4\u56DE\u5F02\u5E38");
    const s = x.meta && typeof x.meta === "object" ? x.meta : x;
    return String(s.message || s.msg || s.desc || s.resultMsg || s.rsp_desc || "\u63A5\u53E3\u8FD4\u56DE\u5F02\u5E38");
  }
  function getHeader(headers, name) {
    const k = Object.keys(headers || {}).find((x) => x.toLowerCase() === name.toLowerCase());
    return k ? headers[k] : "";
  }
  function http(method, url, options = {}) {
    return new Promise((resolve) => {
      const params = { url, timeout: options.timeout || 15e3, headers: options.headers || {}, "auto-redirect": options.redirect !== false, "auto-cookie": options.cookie !== false, alpn: options.alpn || "h2" };
      if (CFG.requestNode) params.node = CFG.requestNode;
      if (options.body !== void 0) params.body = options.body;
      const fn = $httpClient[String(method).toLowerCase()] || $httpClient.get;
      fn(params, (error, response, data) => resolve({ error: error || null, status: response && response.status || 0, headers: response && response.headers || {}, body: typeof data === "string" ? data : "", json: safeJSON(typeof data === "string" ? data : "", {}) }));
    });
  }
  async function captureAccount() {
    const body = parseForm($request.body || "");
    const query = qs($request.url);
    const cookie = getHeader($request.headers, "Cookie");
    const cookieObj = parseForm(cookie.replace(/;\s*/g, "&"));
    const token = String(body.token_online || query.token_online || cookieObj.token_online || "").trim();
    const appId = String(body.appId || query.appId || cookieObj.appId || "").trim();
    if (!token) {
      console.log("[\u4E2D\u56FD\u8054\u901A] \u672A\u5728\u8BF7\u6C42\u4E2D\u627E\u5230 token_online");
      $done({});
      return;
    }
    const list = readJSON(STORE_KEY, []);
    const index = list.findIndex((x) => x.tokenOnline === token || appId && x.appId === appId);
    const item = { tokenOnline: token, appId, updatedAt: dateTime(), mobile: index >= 0 ? list[index].mobile || "" : "" };
    let changed = false;
    if (index < 0) {
      list.push(item);
      changed = true;
    } else {
      changed = list[index].tokenOnline !== token || list[index].appId !== appId;
      list[index] = { ...list[index], ...item };
    }
    writeJSON(STORE_KEY, list);
    console.log(`[\u4E2D\u56FD\u8054\u901A] \u5DF2\u4FDD\u5B58\u8D26\u53F7 ${list.length}\uFF0CToken=${mask(token)}\uFF0CAppId=${mask(appId)}`);
    if (changed) $notification.post("\u4E2D\u56FD\u8054\u901A\u8D26\u53F7\u83B7\u53D6\u6210\u529F", `\u5DF2\u4FDD\u5B58\u7B2C ${index < 0 ? list.length : index + 1} \u4E2A\u8D26\u53F7`, `Token\uFF1A${mask(token)}
AppId\uFF1A${appId ? mask(appId) : "\u672C\u6B21\u8BF7\u6C42\u672A\u643A\u5E26"}
\u5B9A\u65F6\u4EFB\u52A1\u5C06\u81EA\u52A8\u4F7F\u7528\uFF0C\u65E0\u9700\u624B\u586B\u3002`);
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
      else if (r.status >= 400) this.log(`\u8BF7\u6C42 ${url} \u8FD4\u56DE HTTP ${r.status}`);
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
        const i = list.findIndex((x) => x.tokenOnline === this.tokenOnline);
        if (i >= 0) {
          list[i].mobile = this.mobile;
          list[i].appId = this.appId;
          list[i].updatedAt = dateTime();
          writeJSON(STORE_KEY, list);
        }
        this.log(`\u767B\u5F55\u6210\u529F ${mask(this.mobile)}`);
        return true;
      }
      this.log(`\u767B\u5F55\u5931\u8D25[${r.code}]: ${r.msg || ""}`, true);
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
        this.log(`\u6388\u6743\u5931\u8D25\uFF1A${responseMessage(auth)}`);
        return;
      }
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
      if (init.code !== "0000") {
        this.log(`\u901A\u901A\u4E61\u6751\u521D\u59CB\u5316\u5931\u8D25\uFF1A${responseMessage(init)}`);
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
      if (!this.ecsToken) return;
      this.cloudToken = await this.cloudLogin();
      if (!this.cloudToken) {
        this.log("\u4E91\u76D8\u767B\u5F55\u5931\u8D25");
        return;
      }
      const phone = aesCbcB64(this.accountMobile, "yEKmse436lnvTsle", "wNSOYIB1k1DjY5lA");
      const check = await this.postJSON("https://panservice.mail.wo.cn/activity/check/yp/members/eligibility", { phone }, this.cloudHeaders("1001000001"));
      if (String((check.meta || {}).code) === "200" && safeInt((check.result || {}).state) === 0) {
        const c = await this.postJSON("https://panservice.mail.wo.cn/activity/experience/yp/members", { phone, skuCode: "S251222T1F1M3702758", activityCode: "7IO6ren5HVMw3ouGRTepcSoFBM0r86ZGs9+Fjv6Xjv0=", channel: "6", touchpoint: "300300010005" }, this.cloudHeaders("1001000001"));
        this.log(`\u4E91\u76D8\u4F1A\u5458\u4F53\u9A8C\uFF1A${responseMessage(c)}`);
      }
      if (!CFG.queryOnly) {
        const st = await this.cloudSigned("/activity/fragment/status", "activity:fragment:status");
        this.log(`\u4E58\u98CE\u6D3B\u52A8\u788E\u7247\u9636\u6BB5 ${(st.result || {}).fragmentStep || 0}`);
        await this.cloudSigned("/activity/fragment/task/activate", "activity:fragment:activate");
        await this.postJSON("https://panservice.mail.wo.cn/wohome/open/v1/ai/moveFile2Person", { activityId: "Mjg=", fids: ["pNKsm_lDq4EJWsx1rFMP/uVX7f1Gbu4K4uDaFJepfssdrGui4u/poSDp/vKG21xEIiBk//"], taskType: 10, fileType: 2, fileName: "\u4E58\u98CE2026\u7CBE\u5F69\u65F6\u523B-\u96E8\u7231.mp4", directoryId: 0, additionalParams: { aiHeaderSubType: 0 } }, this.cloudHeaders("1001000165"));
        const t1 = await this.cloudSigned("/activity/aiRole/task1/acquire", "activity:acquire:task1");
        this.log(`\u4E58\u98CE task1\uFF1A${responseMessage(t1)}`);
        const times = await this.get("https://panservice.mail.wo.cn/activity/lottery/lottery-times?activityId=Mjg%3D", this.cloudHeaders());
        let n = typeof times.result === "object" ? safeInt(times.result.lotteryTimes || times.result.times || times.result.count) : safeInt(times.result);
        while (n-- > 0) {
          const p = await this.cloudSigned("/activity/lottery", "activity:lottery");
          this.log(`\u4E58\u98CE\u62BD\u5956\uFF1A${(p.result || {}).prizeName || responseMessage(p)}`, !!(p.result || {}).prizeName);
          await sleep(1200);
        }
      }
      await this.cloudClean();
    }
    async cloudClean() {
      const h = this.cloudHeaders();
      const s = await this.postJSON("https://s.pan.wo.cn/wohome/intelligentClean/getScanStateAndResult", { pathLevelList: [{ levelType: "space", levelName: "\u4E2A\u4EBA\u4E91", busId: "0" }] }, h);
      const task = ((s.result || {}).subTaskList || []).find((x) => x.taskId);
      if (!task) {
        this.log("\u4E91\u76D8\u65E0\u91CD\u590D\u6587\u4EF6");
        return;
      }
      const d = await this.postJSON("https://s.pan.wo.cn/wohome/intelligentClean/getCleanData", { pageNum: 1, taskId: task.taskId, type: 3, pageSize: 50 }, h);
      const files = [];
      for (const g of (d.result || {}).fileGroupList || []) (g.fileList || []).slice(1).forEach((x) => x.fileId && files.push({ fileId: x.fileId, spaceType: x.spaceType || "0" }));
      if (files.length && !CFG.queryOnly) {
        const c = await this.postJSON("https://s.pan.wo.cn/wohome/intelligentClean/batchClean", { fileList: files, taskType: 3, taskId: task.taskId }, h);
        this.log(`\u4E91\u76D8\u91CD\u590D\u6E05\u7406\uFF1A${String((c.meta || {}).code) === "200" ? "\u6210\u529F" : "\u5931\u8D25"}\uFF0C${files.length}\u4E2A`);
      } else this.log(`\u4E91\u76D8\u91CD\u590D\u6587\u4EF6\uFF1A${files.length}\u4E2A`);
    }
    async securityContext() {
      const t = await this.get(`https://m.client.10010.com/edop_ng/getTicketByNative?token=${encodeURIComponent(this.ecsToken)}&appId=edop_unicom_3a6cc75a`);
      if (!t.ticket) return false;
      const a = await this.postJSON("https://uca.wo116114.com/api/v1/auth/ticket?product_line=uasp&entry_point=h5&entry_point_id=edop_unicom_3a6cc75a", { productId: "", type: 1, ticket: t.ticket }, { clientType: "uasp_unicom_applet" });
      this.secToken = (a.data || {}).access_token || "";
      if (!this.secToken) return false;
      const j = await this.postJSON("https://uca.wo116114.com/api/v1/auth/getTicket?product_line=uasp&entry_point=h5&entry_point_id=edop_unicom_3a6cc75a", { productId: "91311616", phone: this.accountMobile }, { "auth-sa-token": this.secToken, clientType: "uasp_unicom_applet" });
      this.secTicket = (j.data || {}).ticket || "";
      if (!this.secTicket) return false;
      const base = this.secHeaders(false);
      await this.postJSON("https://m.jf.10010.com/jf-external-application/page/query", { activityId: "s747395186896173056", partnersId: "1702" }, base);
      const s = await this.get("https://m.jf.10010.com/jf-external-application/jftask/getSecretKey", base);
      this.secSecret = (s.data || {}).secretKey || "";
      return !!this.secSecret;
    }
    secHeaders(sign = true) {
      const h = { ticket: decodeURIComponent(this.secTicket || ""), "User-Agent": H5_UA, partnersid: "1702", clienttype: "uasp_unicom_applet", "Content-Type": "application/json", "Origin": "https://m.jf.10010.com" };
      if (sign && this.secSecret) {
        const ts = String(nowMs()), nonce = randomString(8, "0123456789abcdefghijklmnopqrstuvwxyz");
        h["x-request-timestamp"] = ts;
        h["x-request-nonce"] = nonce;
        h["x-request-signature"] = sha256HmacHex(`${nonce}${ts}`, this.secSecret);
      }
      return h;
    }
    async securityTask() {
      this.log("==== \u5B89\u5168\u7BA1\u5BB6 ====");
      if (!await this.securityContext()) {
        this.log("\u5B89\u5168\u7BA1\u5BB6\u767B\u5F55\u5931\u8D25");
        return;
      }
      const info = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/userInfo", {}, this.secHeaders(false));
      if (info.code === "0000") this.log(`\u5B89\u5168\u7BA1\u5BB6\u79EF\u5206\uFF1A${(info.data || {}).availableScore || 0}\uFF0C\u4ECA\u65E5${(info.data || {}).todayEarnScore || 0}`, true);
      if (CFG.queryOnly) return;
      let list = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/taskDetail", {}, this.secHeaders(false));
      for (const t of ((list.data || {}).taskDetail || {}).taskList || []) {
        const name = t.taskName || "", code = t.taskCode || "", done = safeInt(t.finishCount), need = safeInt(t.needCount);
        if (!code || !need) continue;
        if (done >= need) {
          if (t.finishText === "\u5F85\u9886\u53D6") await this.securityClaim(code, name);
          continue;
        }
        if (/新增亲情守护成员|新增宽带绑定|语音提醒|反诈险领取|设置日程提醒/.test(name)) {
          this.log(`\u9700\u624B\u52A8\u5B8C\u6210\uFF1A${name}`);
          continue;
        }
        for (let i = done; i < need; i++) {
          if (name.includes("\u7B7E\u5230")) await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/sign", { taskCode: code }, this.secHeaders());
          else {
            await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/toFinish", { taskCode: code }, this.secHeaders());
            await this.securityAction(name, code);
          }
          await sleep(3e3);
          await this.securityClaim(code, name);
        }
      }
    }
    async securityAction(name, code) {
      const h = { "auth-sa-token": this.secToken, token: this.secToken, "Content-Type": "application/json", clientType: "uasp_unicom_applet" };
      if (name.includes("\u667A\u80FD\u52A9\u624B")) return this.postJSON("https://ims.wo116114.com/api/AiAssistant/autoReply", { history: [], message: "1", promptId: 1e4 }, h);
      if (name.includes("\u67E5\u770B\u5468\u62A5")) return this.postJSON("https://uca.wo116114.com/sjgj/unicomAssistant/uasp/report/v1/weeklySummary?product_line=uasp&entry_point=h5&entry_point_id=wxdefbc1986dc757a6", { productId: "91311616" }, h);
      if (name.includes("\u6D3B\u52A8\u6D4F\u89C8")) return this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/taskFinish", { taskCode: code }, this.secHeaders());
      if (name.includes("\u89D2\u8272\u52A9\u624B\u5BF9\u8BDD")) return this.postJSON("https://ai.wo.cn/web-tongtong/lxzn/chat", { sessionId: `mmrp${randomString(10, "0123456789")}`, requestId: `rqid_mmrp${randomString(10, "0123456789")}`, roleId: 1, message: "\u6211\u6709\u62D6\u5EF6\u75C7\uFF0C\u597D\u591A\u4E8B\u60C5\u4E0D\u60F3\u505A\u3002" }, { Authorization: this.secToken, "Content-Type": "application/json" });
      this.log(`\u5DF2\u89E6\u53D1\u5B89\u5168\u7BA1\u5BB6\u4EFB\u52A1\uFF1A${name}`);
      return true;
    }
    async securityClaim(code, name) {
      const r = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/receive", { taskCode: code }, this.secHeaders());
      this.log(`\u5B89\u5168\u7BA1\u5BB6[${name}]\uFF1A${(r.data || {}).score ? `\u9886\u53D6 ${(r.data || {}).score}` : responseMessage(r)}`, !!(r.data || {}).score);
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
      const shelf = await this.get("https://10010.woread.com.cn/ng_woread_service/rest/basics/recommposdetail/14856", { "accesstoken": this.woreadAccess });
      const books = ((shelf.data || {}).booklist || {}).message || [];
      if (books.length) {
        const b = books[0], card = (((shelf.data || {}).bindinfo || [])[0] || {}).recommposiindex;
        const ch = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/cnt/chalist", { sign: this.woreadEncrypt({ curPage: 1, limit: 30, index: b.cntindex, sort: 0, finishFlag: 1, ...common }) }, { accesstoken: this.woreadAccess });
        const list = ch.list || (ch.data || {}).list || [];
        const c = ((list[0] || {}).charptercontent || [])[0];
        if (c) {
          const p = { readTime: "2", cntIndex: b.cntindex, cntType: "1", catid: "0", pageIndex: "", cardid: card, cntindex: b.cntindex, cnttype: "1", chapterallindex: c.chapterallindex, chapterseno: "1", channelid: "", chapterid: c.chapterid, readtype: 1, isend: "0", ...common };
          await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/history/addReadTime", { sign: this.woreadEncrypt(p) }, { accesstoken: this.woreadAccess });
          this.log("\u9605\u8BFB\u65F6\u957F\u5DF2\u63D0\u4EA4");
        }
      }
      const draw = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/basics/doDraw", { sign: this.woreadEncrypt({ activeindex: "8051", timestamp: compactTime(), phone: this.mobile || "", token: this.woreadToken }) }, { accesstoken: this.woreadAccess });
      this.log(`\u9605\u8BFB\u62BD\u5956\uFF1A${(draw.data || {}).prizedesc || draw.message || "\u672A\u4E2D\u5956"}`, !!(draw.data || {}).prizedesc);
    }
    aitingAes(data, key = "j2K81755sxV12wFx") {
      return aesCbcB64(typeof data === "string" ? data : JSON.stringify(data), key, "16-Bytes--String", true, false);
    }
    async aitingLogin() {
      const login = await this.postJSON("https://10010.woread.com.cn/ng_woread_service/rest/account/login", { sign: this.aitingAes({ tokenOnline: this.aitingAes(this.tokenOnline, "woreadst^&*12345"), phone: this.aitingAes(this.mobile, "woreadst^&*12345"), timestamp: compactTime() }, "woreadst^&*12345") }, { accesstoken: "ODZERTZCMjA1NTg1MTFFNDNFMThDRDYw" });
      this.aitingWoread = (login.data || {}).token;
      if (!this.aitingWoread) return false;
      const imei = randomString(15, "0123456789"), confirm = this.aitingAes(`android${this.mobile}${imei}`), stats = `channelid=28015001&sid=${randomString(20)}&eid=${randomString(20)}&osversion=Android12&clientallid=000000100000000000058.0.2.1225&display=2400_1080&ip=192.168.3.24&nettypename=wifi&version=802&versionname=8.0.2&terminalName=Redmi&terminalType=Redmi_K30_Pro&udid=null&woid=WOA${randomString(6)}${imei.slice(0, 8)}LOT${randomString(4)}LV${randomString(2)}&useraccount=${this.mobile}&userid=${this.mobile}&clientconfirm=${confirm}`;
      this.aitingStats = stats;
      let ts = String(nowMs());
      const appkey = md5(`clientId=android&clientSource=3&source=3&timestamp=${ts}&key=7ZxQ9rT3wE5sB2dF`);
      const jwt = await this.postJSON("https://pcc.woread.com.cn/oauth/client/appkey", { clientSource: "3", clientId: b64Utf8("395DEDE9C1D6FE11B7C9C0D82B353E74"), source: "3", timestamp: ts, sign: appkey }, { "Skip-Authorization-Check": "true", statisticsinfo: stats });
      this.aitingJwt = jwt.key;
      if (!this.aitingJwt) return false;
      const pass = md5(compactTime() + this.mobile + "1");
      const u = await this.get(`https://pcc.woread.com.cn/mainrest/rest/read/user/ulogin/3/${this.mobile}/1/1/0?networktype=3&ua=Redmi+K30+Pro&isencode=false&clientversion=8.0.2&versionname=Android_1_1080x2356&channelid=28015001&userlabelisencode=0&validatecode=&sid=&timestamp=${compactTime()}&passcode=${pass}`, { AuthorizationClient: `Bearer ${this.aitingJwt}`, statisticsinfo: stats });
      const msg = u.message || {};
      this.aitingBizToken = (msg.accountinfo || {}).token || msg.token;
      this.aitingUser = (msg.accountinfo || {}).userid || msg.userid || this.mobile;
      if (!this.aitingBizToken) return false;
      ts = String(nowMs());
      const body = { token: this.aitingBizToken, timestamp: ts, userid: this.aitingUser };
      body.sign = md5(Object.keys(body).sort().map((k) => `${k}=${body[k]}`).join("&") + "&key=woread!@#qwe1234");
      const tk = await this.postJSON("https://pcc.woread.com.cn/activity/rest/unicom/points/getInfoTicket", body, {});
      const url = tk.message || "";
      this.aitingTicket = qs(url).ticket || url;
      this.aitingPage = qs(url).pageid || "s789081246969976832";
      return !!this.aitingTicket;
    }
    aitingHeaders() {
      return { ticket: decodeURIComponent(this.aitingTicket || ""), pageid: this.aitingPage, clienttype: "aiting_ios", partnersid: "1706", "content-type": "application/json;charset=UTF-8", "User-Agent": H5_UA, Origin: "https://m.jf.10010.com" };
    }
    async aitingTask() {
      this.log("==== \u8054\u901A\u7231\u542C ====");
      if (!await this.aitingLogin()) {
        this.log("\u7231\u542C\u767B\u5F55\u5931\u8D25");
        return;
      }
      const h = this.aitingHeaders();
      const info = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/userInfo", {}, h);
      if (info.code === "0000") this.log(`\u7231\u542C\u79EF\u5206\uFF1A${(info.data || {}).availableScore || 0}\uFF0C\u4ECA\u65E5${(info.data || {}).todayEarnScore || 0}`, true);
      const d = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/taskDetail", {}, h);
      const tasks = (((d.data || {}).taskDetail || {}).taskList || []).filter((x) => !String(x.taskName).includes("\u9080\u8BF7"));
      if (CFG.queryOnly) return;
      for (const t of tasks) {
        if (safeInt(t.finish) === 1) continue;
        const path = String(t.taskType) === "4" || String(t.taskName).includes("\u7B7E\u5230") ? "uasptask/sign" : "jftask/toFinish";
        const body = { taskCode: t.taskCode };
        if (path.includes("sign")) body.remindEnabled = "1";
        const r = await this.postJSON(`https://m.jf.10010.com/jf-external-application/${path}`, body, h);
        this.log(`\u7231\u542C[${t.taskName}]\uFF1A${responseMessage(r)}`);
        await sleep(800);
      }
      const pop = await this.postJSON("https://m.jf.10010.com/jf-external-application/jftask/popUp", {}, h);
      if ((pop.data || {}).score) this.log(`\u7231\u542C\u83B7\u5F97 ${(pop.data || {}).score}`, true);
    }
    async wostoreTask() {
      this.log("==== \u6C83\u4E91\u624B\u673A ====");
      if (CFG.queryOnly) {
        this.log("\u67E5\u8BE2\u6A21\u5F0F\u65E0\u72EC\u7ACB\u8D44\u4EA7\u63A5\u53E3");
        return;
      }
      const t = await this.get(`https://m.client.10010.com/edop_ng/getTicketByNative?token=${encodeURIComponent(this.ecsToken)}&appId=edop_unicom_68e8fa69`);
      if (!t.ticket) {
        this.log("\u83B7\u53D6\u5165\u53E3 Ticket \u5931\u8D25");
        return;
      }
      const l = await this.postJSON("https://uphone.wostore.cn/h5api/token-service/getTokenByTicket", { ticket: t.ticket, channel: "ST-Kuaidai001" }, { channel: "ST-Kuaidai001", source: "4", os: "H5" });
      const cloud = l.data;
      if (!cloud) return;
      const h = { "Authorization": cloud, "Content-Type": "application/json" };
      const sign = await this.postJSON("https://h5forphone.wostore.cn/h5forphone/activity/signIn", { accesstoken: cloud }, h);
      this.log(`\u6C83\u4E91\u624B\u673A\u7B7E\u5230\uFF1A${sign.msg || "\u672A\u77E5"}`, true);
      const rewards = await this.postJSON("https://h5forphone.wostore.cn/h5forphone/activity/signInRightList", { accesstoken: cloud }, h);
      for (const x of (rewards.data || {}).goodsList || []) {
        if (x.state === "") {
          const r = await this.postJSON("https://h5forphone.wostore.cn/h5forphone/activity/raffleSignIn", { accesstoken: cloud, activityOrderid: x.activityOrderId, account: "", accountType: "" }, h);
          this.log(`\u9886\u53D6${x.name}\uFF1A${r.msg || "\u672A\u77E5"}`, true);
        }
      }
      for (const code of ["Points_Obtain_2507", "Points_Obtain_2506", "Points_Obtain_2505", "Points_Obtain_2504"]) {
        const a = await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/user/login", { identityType: "cloudPhoneLogin", code: cloud, activityId: "HD2026033000125", device: "device" }, { "X-USR-TOKEN": "" });
        const token = (a.data || {}).user_token;
        if (!token) continue;
        const ah = { "X-USR-TOKEN": token, "Content-Type": "application/json" };
        await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/points/v1/sign", { activityCode: "Points_Sign_2507" }, ah);
        const list = await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/user/task/list", { activityCode: code }, ah);
        for (const task of (list.data || {}).taskList || []) {
          const status = String(task.status || task.taskStatus || task.state || "").toUpperCase();
          if (/UNCLAIMED|CLAIMABLE|COMPLETED|FINISH/.test(status)) await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/user/task/raffle/get", { activityCode: code, taskCode: task.taskCode }, ah);
          else if (!/OBTAINED|RECEIVED|FINISHED|DONE/.test(status)) {
            await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/user/task/logs", { logType: "01", logCode: task.taskCode === "0127-006" ? "012-4" : task.taskCode, logSource: "01", logDetail: task.taskName || "" }, ah);
            await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/user/task/raffle/get", { activityCode: code, taskCode: task.taskCode }, ah);
          }
        }
        let n = safeInt((list.data || {}).rafflesLeftCount || (list.data || {}).raffleLeftCount);
        while (n-- > 0) {
          const p = await this.postJSON("https://uphone.wostore.cn/h5api/activity-service/lottery", { activityCode: code }, ah);
          this.log(`\u6C83\u4E91\u62BD\u5956\uFF1A${(p.data || {}).prizeName || p.msg || "\u672A\u77E5"}`, true);
        }
      }
      const pi = await this.get("https://uphone.wo-adv.cn/bucp/servers/order/user-point/point-info", h);
      if (pi.data) this.log(`\u6C83\u4E91\u624B\u673A\u79EF\u5206\uFF1A${pi.data.balanceScoreNum || pi.data.totalPoint || pi.data.point || 0}`, true);
    }
    regions() {
      const s = (this.cityInfo || []).map((x) => x.proName || "").join(",");
      return { xinjiang: s.includes("\u65B0\u7586"), henan: s.includes("\u6CB3\u5357"), yunnan: s.includes("\u4E91\u5357"), liaoning: s.includes("\u8FBD\u5B81"), anhui: s.includes("\u5B89\u5FBD") };
    }
    async regionalTask() {
      this.log(`==== \u533A\u57DF\u4E13\u533A${CFG.queryOnly ? "\uFF08\u67E5\u8BE2\u6A21\u5F0F\uFF09" : ""} ====`);
      const r = this.regions();
      if (!Object.values(r).some(Boolean)) {
        this.log("\u672A\u8BC6\u522B\u5230\u5DF2\u652F\u6301\u7684\u533A\u57DF\u4E13\u533A");
        return;
      }
      if (r.xinjiang) await this.xinjiangTask();
      if (r.henan) await this.henanTask();
      if (r.yunnan) await this.yunnanTask();
      if (r.liaoning) await this.liaoningTask();
      if (r.anhui && CFG.ahFriday && CFG.ahAmount) {
        if (CFG.queryOnly) this.log(`\u5B89\u5FBD\u8D85\u7EA7\u661F\u671F\u4E94\uFF1A[\u67E5\u8BE2\u6A21\u5F0F] \u76EE\u6807\u9762\u989D${CFG.ahAmount}\u5143\uFF08\u4EC5\u5468\u4E9410\u70B9\u6267\u884C\uFF09`);
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
