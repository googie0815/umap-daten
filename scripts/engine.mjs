// uMap Cloudflare test worker. Adapted from supplied Deno code. Dependencies are bundled; paste the entire file into worker.js.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from3, except, desc) => {
  if (from3 && typeof from3 === "object" || typeof from3 === "function") {
    for (let key of __getOwnPropNames(from3))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from3[key], enumerable: !(desc = __getOwnPropDesc(from3, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// build-deps/node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/util.js"(exports) {
    "use strict";
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    var isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === "undefined");
    };
    exports.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports.getValue = function(v) {
      if (exports.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;
  }
});

// build-deps/node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/validator.js"(exports) {
    "use strict";
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
          i += 2;
          i = readPI(xmlData, i);
          if (i.err) return i;
        } else if (xmlData[i] === "<") {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === "!") {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === "/") {
              closingTag = true;
              i++;
            }
            let tagName = "";
            for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === "<") {
                if (xmlData[i + 1] === "!") {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i + 1] === "?") {
                  i = readPI(xmlData, ++i);
                  if (i.err) return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === "&") {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            }
            if (xmlData[i] === "<") {
              i--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == "?" || xmlData[i] == " ") {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed
      };
    }
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === "x") {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ";")
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ";")
        return -1;
      if (xmlData[i] === "#") {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ";")
          break;
        return -1;
      }
      return i;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports) {
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: function(tagName, val) {
        return val;
      },
      attributeValueProcessor: function(attrName, val) {
        return val;
      },
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: () => false,
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: function(tagName, jPath, attrs) {
        return tagName;
      }
      // skipEmptyListItem: false
    };
    var buildOptions = function(options) {
      return Object.assign({}, defaultOptions, options);
    };
    exports.buildOptions = buildOptions;
    exports.defaultOptions = defaultOptions;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports, module) {
    "use strict";
    var XmlNode = class {
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val) {
        if (key === "__proto__") key = "#__proto__";
        this.child.push({ [key]: val });
      }
      addChild(node) {
        if (node.tagname === "__proto__") node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module.exports = XmlNode;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports, module) {
    var util = require_util();
    function readDocType(xmlData, i) {
      const entities = {};
      if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
        i = i + 9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let exp = "";
        for (; i < xmlData.length; i++) {
          if (xmlData[i] === "<" && !comment) {
            if (hasBody && isEntity(xmlData, i)) {
              i += 7;
              let entityName, val;
              [entityName, val, i] = readEntityExp(xmlData, i + 1);
              if (val.indexOf("&") === -1)
                entities[validateEntityName(entityName)] = {
                  regx: RegExp(`&${entityName};`, "g"),
                  val
                };
            } else if (hasBody && isElement(xmlData, i)) i += 8;
            else if (hasBody && isAttlist(xmlData, i)) i += 8;
            else if (hasBody && isNotation(xmlData, i)) i += 9;
            else if (isComment) comment = true;
            else throw new Error("Invalid DOCTYPE");
            angleBracketsCount++;
            exp = "";
          } else if (xmlData[i] === ">") {
            if (comment) {
              if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                comment = false;
                angleBracketsCount--;
              }
            } else {
              angleBracketsCount--;
            }
            if (angleBracketsCount === 0) {
              break;
            }
          } else if (xmlData[i] === "[") {
            hasBody = true;
          } else {
            exp += xmlData[i];
          }
        }
        if (angleBracketsCount !== 0) {
          throw new Error(`Unclosed DOCTYPE`);
        }
      } else {
        throw new Error(`Invalid Tag instead of DOCTYPE`);
      }
      return { entities, i };
    }
    function readEntityExp(xmlData, i) {
      let entityName = "";
      for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"'); i++) {
        entityName += xmlData[i];
      }
      entityName = entityName.trim();
      if (entityName.indexOf(" ") !== -1) throw new Error("External entites are not supported");
      const startChar = xmlData[i++];
      let val = "";
      for (; i < xmlData.length && xmlData[i] !== startChar; i++) {
        val += xmlData[i];
      }
      return [entityName, val, i];
    }
    function isComment(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "-" && xmlData[i + 3] === "-") return true;
      return false;
    }
    function isEntity(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "N" && xmlData[i + 4] === "T" && xmlData[i + 5] === "I" && xmlData[i + 6] === "T" && xmlData[i + 7] === "Y") return true;
      return false;
    }
    function isElement(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "L" && xmlData[i + 4] === "E" && xmlData[i + 5] === "M" && xmlData[i + 6] === "E" && xmlData[i + 7] === "N" && xmlData[i + 8] === "T") return true;
      return false;
    }
    function isAttlist(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "A" && xmlData[i + 3] === "T" && xmlData[i + 4] === "T" && xmlData[i + 5] === "L" && xmlData[i + 6] === "I" && xmlData[i + 7] === "S" && xmlData[i + 8] === "T") return true;
      return false;
    }
    function isNotation(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "N" && xmlData[i + 3] === "O" && xmlData[i + 4] === "T" && xmlData[i + 5] === "A" && xmlData[i + 6] === "T" && xmlData[i + 7] === "I" && xmlData[i + 8] === "O" && xmlData[i + 9] === "N") return true;
      return false;
    }
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    module.exports = readDocType;
  }
});

// build-deps/node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "build-deps/node_modules/strnum/strnum.js"(exports, module) {
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
    var consider = {
      hex: true,
      // oct: false,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string") return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
      else if (str === "0") return 0;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
      } else if (trimmedStr.search(/[eE]/) !== -1) {
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
        if (notation) {
          if (options.leadingZeros) {
            trimmedStr = (notation[1] || "") + notation[3];
          } else {
            if (notation[2] === "0" && notation[3][0] === ".") {
            } else {
              return str;
            }
          }
          return options.eNotation ? Number(trimmedStr) : str;
        } else {
          return str;
        }
      } else {
        const match = numRegex.exec(trimmedStr);
        if (match) {
          const sign = match[1];
          const leadingZeros = match[2];
          let numTrimmedByZeros = trimZeros(match[3]);
          if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str;
          else if (options.leadingZeros && leadingZeros === str) return 0;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation) return num;
              else return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "") return num;
              else if (numStr === numTrimmedByZeros) return num;
              else if (sign && numStr === "-" + numTrimmedByZeros) return num;
              else return str;
            }
            if (leadingZeros) {
              return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
            } else {
              return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
            }
          }
        } else {
          return str;
        }
      }
    }
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".") numStr = "0";
        else if (numStr[0] === ".") numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".") numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    function parse_int(numStr, base) {
      if (parseInt) return parseInt(numStr, base);
      else if (Number.parseInt) return Number.parseInt(numStr, base);
      else if (window && window.parseInt) return window.parseInt(numStr, base);
      else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
    }
    module.exports = toNumber;
  }
});

// build-deps/node_modules/fast-xml-parser/src/ignoreAttributes.js
var require_ignoreAttributes = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports, module) {
    function getIgnoreAttributesFn(ignoreAttributes) {
      if (typeof ignoreAttributes === "function") {
        return ignoreAttributes;
      }
      if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
          for (const pattern of ignoreAttributes) {
            if (typeof pattern === "string" && attrName === pattern) {
              return true;
            }
            if (pattern instanceof RegExp && pattern.test(attrName)) {
              return true;
            }
          }
        };
      }
      return () => false;
    }
    module.exports = getIgnoreAttributesFn;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports, module) {
    "use strict";
    var util = require_util();
    var xmlNode = require_xmlNode();
    var readDocType = require_DocTypeReader();
    var toNumber = require_strnum();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var OrderedObjParser = class {
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCharCode(Number.parseInt(str, 10)) },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCharCode(Number.parseInt(str, 16)) }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        this.lastEntities[ent] = {
          regex: new RegExp("&" + ent + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if (val.length > 0) {
          if (!escapeEntities) val = this.replaceEntitiesValue(val);
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val;
          } else if (typeof newval !== typeof val || newval !== val) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val.trim();
            if (trimmedVal === val) {
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val;
            }
          }
        }
      }
    }
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue;
          }
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            if (aName === "__proto__") aName = "#__proto__";
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    var parseXml = function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      for (let i = 0; i < xmlData.length; i++) {
        const ch = xmlData[i];
        if (ch === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            let tagData = readTagExp(xmlData, i, false, "?>");
            if (!tagData) throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath);
            }
            i = tagData.closeIndex + 1;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i = endIndex;
          } else if (xmlData.substr(i + 1, 2) === "!D") {
            const result = readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val == void 0) val = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val);
            }
            i = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
                i = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  tagName = this.options.transformTagName(tagName);
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else {
                const childNode = new xmlNode(tagName);
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        } else {
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    };
    function addChild(currentNode, childNode, jPath) {
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode);
      } else {
        currentNode.addChild(childNode);
      }
    }
    var replaceEntitiesValue = function(val) {
      if (this.options.processEntities) {
        for (let entityName in this.docTypeEntities) {
          const entity = this.docTypeEntities[entityName];
          val = val.replace(entity.regx, entity.val);
        }
        for (let entityName in this.lastEntities) {
          const entity = this.lastEntities[entityName];
          val = val.replace(entity.regex, entity.val);
        }
        if (this.options.htmlEntities) {
          for (let entityName in this.htmlEntities) {
            const entity = this.htmlEntities[entityName];
            val = val.replace(entity.regex, entity.val);
          }
        }
        val = val.replace(this.ampEntity.regex, this.ampEntity.val);
      }
      return val;
    };
    function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0) isLeafNode = currentNode.child.length === 0;
        textData = this.parseTextData(
          textData,
          currentNode.tagname,
          jPath,
          false,
          currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          currentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    function isItStopNode(stopNodes, jPath, currentTagName) {
      const allNodesExp = "*." + currentTagName;
      for (const stopNodePath in stopNodes) {
        const stopNodeExp = stopNodes[stopNodePath];
        if (allNodesExp === stopNodeExp || jPath === stopNodeExp) return true;
      }
      return false;
    }
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary) attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i, errMsg) {
      const closingIndex = xmlData.indexOf(str, i);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
      if (!result) return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    function readStopNodeData(xmlData, tagName, i) {
      const startIndex = i;
      let openTagCount = 1;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i),
                  i: closeIndex
                };
              }
            }
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
            i = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i = tagData.closeIndex;
            }
          }
        }
      }
    }
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === "string") {
        const newval = val.trim();
        if (newval === "true") return true;
        else if (newval === "false") return false;
        else return toNumber(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return "";
        }
      }
    }
    module.exports = OrderedObjParser;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports) {
    "use strict";
    function prettify(node, options) {
      return compress(node, options);
    }
    function compress(arr, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0) newJpath = property;
        else newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0) text = tagObj[property];
          else text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);
          if (tagObj[":@"]) {
            assignAttributes(val, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val = val[options.textNodeName];
          } else if (Object.keys(val).length === 0) {
            if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
            else val = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val];
            } else {
              compressedObj[property] = val;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0) compressedObj[options.textNodeName] = text;
      } else if (text !== void 0) compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== ":@") return key;
      }
    }
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    exports.prettify = prettify;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports, module) {
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser2 = class {
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true) validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
        else return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module.exports = XMLParser2;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports, module) {
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    function arrToStr(arr, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if (tagName === void 0) continue;
        let newJPath = "";
        if (jPath.length === 0) newJPath = tagName;
        else newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
          else xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!obj.hasOwnProperty(key)) continue;
        if (key !== ":@") return key;
      }
    }
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!attrMap.hasOwnProperty(attr)) continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
      }
      return false;
    }
    function replaceEntitiesValue(textValue, options) {
      if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
          const entity = options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }
    module.exports = toXml;
  }
});

// build-deps/node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports, module) {
    "use strict";
    var buildFromOrderedJs = require_orderedJs2Xml();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a) {
        return a;
      },
      attributeValueProcessor: function(attrName, a) {
        return a;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0, []).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = "";
      let val = "";
      const jPath = ajPath.join(".");
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val += "";
          } else if (key === this.options.cdataPropName) {
            val += "";
          } else if (key[0] === "?") {
            val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else if (!attr) {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?") val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
          }
        }
      }
      return { attrStr, val };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return " " + attrName;
      } else return " " + attrName + '="' + val + '"';
    };
    function processTextOrObjNode(object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if (val === "") {
        if (key[0] === "?") return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          return this.indentate(level) + `<!--${val}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode) closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        return this.indentate(level) + `<!--${val}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue = this.options.tagValueProcessor(key, val);
        textValue = this.replaceEntitiesValue(textValue);
        if (textValue === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue) {
      if (textValue && textValue.length > 0 && this.options.processEntities) {
        for (let i = 0; i < this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    module.exports = Builder;
  }
});

// build-deps/node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "build-deps/node_modules/fast-xml-parser/src/fxp.js"(exports, module) {
    "use strict";
    var validator = require_validator();
    var XMLParser2 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module.exports = {
      XMLParser: XMLParser2,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// build-deps/node_modules/csv-parse/dist/esm/sync.js
var global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
var inited = false;
function init() {
  inited = true;
  var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }
  revLookup["-".charCodeAt(0)] = 62;
  revLookup["_".charCodeAt(0)] = 63;
}
function toByteArray(b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;
  if (len % 4 > 0) {
    throw new Error("Invalid string. Length must be a multiple of 4");
  }
  placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
  arr = new Arr(len * 3 / 4 - placeHolders);
  l = placeHolders > 0 ? len - 4 : len;
  var L = 0;
  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = tmp >> 16 & 255;
    arr[L++] = tmp >> 8 & 255;
    arr[L++] = tmp & 255;
  }
  if (placeHolders === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[L++] = tmp & 255;
  } else if (placeHolders === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[L++] = tmp >> 8 & 255;
    arr[L++] = tmp & 255;
  }
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
    output.push(tripletToBase64(tmp));
  }
  return output.join("");
}
function fromByteArray(uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3;
  var output = "";
  var parts = [];
  var maxChunkLength = 16383;
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  }
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[tmp << 4 & 63];
    output += "==";
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    output += lookup[tmp >> 10];
    output += lookup[tmp >> 4 & 63];
    output += lookup[tmp << 2 & 63];
    output += "=";
  }
  parts.push(output);
  return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
  }
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
  }
  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);
  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
  }
  e = e << mLen | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
  }
  buffer[offset + i - d] |= s * 128;
}
var toString = {}.toString;
var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == "[object Array]";
};
var INSPECT_MAX_BYTES = 50;
Buffer2.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== void 0 ? global$1.TYPED_ARRAY_SUPPORT : true;
kMaxLength();
function kMaxLength() {
  return Buffer2.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function createBuffer(that, length) {
  if (kMaxLength() < length) {
    throw new RangeError("Invalid typed array length");
  }
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    that = new Uint8Array(length);
    that.__proto__ = Buffer2.prototype;
  } else {
    if (that === null) {
      that = new Buffer2(length);
    }
    that.length = length;
  }
  return that;
}
function Buffer2(arg, encodingOrOffset, length) {
  if (!Buffer2.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer2)) {
    return new Buffer2(arg, encodingOrOffset, length);
  }
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string") {
      throw new Error(
        "If encoding is specified then the first argument must be a string"
      );
    }
    return allocUnsafe(this, arg);
  }
  return from(this, arg, encodingOrOffset, length);
}
Buffer2.poolSize = 8192;
Buffer2._augment = function(arr) {
  arr.__proto__ = Buffer2.prototype;
  return arr;
};
function from(that, value, encodingOrOffset, length) {
  if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length);
  }
  if (typeof value === "string") {
    return fromString(that, value, encodingOrOffset);
  }
  return fromObject(that, value);
}
Buffer2.from = function(value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length);
};
if (Buffer2.TYPED_ARRAY_SUPPORT) {
  Buffer2.prototype.__proto__ = Uint8Array.prototype;
  Buffer2.__proto__ = Uint8Array;
  if (typeof Symbol !== "undefined" && Symbol.species && Buffer2[Symbol.species] === Buffer2) ;
}
function assertSize(size) {
  if (typeof size !== "number") {
    throw new TypeError('"size" argument must be a number');
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative');
  }
}
function alloc(that, size, fill3, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size);
  }
  if (fill3 !== void 0) {
    return typeof encoding === "string" ? createBuffer(that, size).fill(fill3, encoding) : createBuffer(that, size).fill(fill3);
  }
  return createBuffer(that, size);
}
Buffer2.alloc = function(size, fill3, encoding) {
  return alloc(null, size, fill3, encoding);
};
function allocUnsafe(that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer2.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that;
}
Buffer2.allocUnsafe = function(size) {
  return allocUnsafe(null, size);
};
Buffer2.allocUnsafeSlow = function(size) {
  return allocUnsafe(null, size);
};
function fromString(that, string, encoding) {
  if (typeof encoding !== "string" || encoding === "") {
    encoding = "utf8";
  }
  if (!Buffer2.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding');
  }
  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);
  var actual = that.write(string, encoding);
  if (actual !== length) {
    that = that.slice(0, actual);
  }
  return that;
}
function fromArrayLike(that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that;
}
function fromArrayBuffer(that, array, byteOffset, length) {
  array.byteLength;
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError("'offset' is out of bounds");
  }
  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError("'length' is out of bounds");
  }
  if (byteOffset === void 0 && length === void 0) {
    array = new Uint8Array(array);
  } else if (length === void 0) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    that = array;
    that.__proto__ = Buffer2.prototype;
  } else {
    that = fromArrayLike(that, array);
  }
  return that;
}
function fromObject(that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);
    if (that.length === 0) {
      return that;
    }
    obj.copy(that, 0, 0, len);
    return that;
  }
  if (obj) {
    if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
      if (typeof obj.length !== "number" || isnan(obj.length)) {
        return createBuffer(that, 0);
      }
      return fromArrayLike(that, obj);
    }
    if (obj.type === "Buffer" && isArray(obj.data)) {
      return fromArrayLike(that, obj.data);
    }
  }
  throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
}
function checked(length) {
  if (length >= kMaxLength()) {
    throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
  }
  return length | 0;
}
Buffer2.isBuffer = isBuffer;
function internalIsBuffer(b) {
  return !!(b != null && b._isBuffer);
}
Buffer2.compare = function compare(a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError("Arguments must be Buffers");
  }
  if (a === b) return 0;
  var x = a.length;
  var y = b.length;
  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
Buffer2.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case "hex":
    case "utf8":
    case "utf-8":
    case "ascii":
    case "latin1":
    case "binary":
    case "base64":
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return true;
    default:
      return false;
  }
};
Buffer2.concat = function concat(list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }
  if (list.length === 0) {
    return Buffer2.alloc(0);
  }
  var i;
  if (length === void 0) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }
  var buffer = Buffer2.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};
function byteLength(string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length;
  }
  if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength;
  }
  if (typeof string !== "string") {
    string = "" + string;
  }
  var len = string.length;
  if (len === 0) return 0;
  var loweredCase = false;
  for (; ; ) {
    switch (encoding) {
      case "ascii":
      case "latin1":
      case "binary":
        return len;
      case "utf8":
      case "utf-8":
      case void 0:
        return utf8ToBytes(string).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return len * 2;
      case "hex":
        return len >>> 1;
      case "base64":
        return base64ToBytes(string).length;
      default:
        if (loweredCase) return utf8ToBytes(string).length;
        encoding = ("" + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer2.byteLength = byteLength;
function slowToString(encoding, start, end) {
  var loweredCase = false;
  if (start === void 0 || start < 0) {
    start = 0;
  }
  if (start > this.length) {
    return "";
  }
  if (end === void 0 || end > this.length) {
    end = this.length;
  }
  if (end <= 0) {
    return "";
  }
  end >>>= 0;
  start >>>= 0;
  if (end <= start) {
    return "";
  }
  if (!encoding) encoding = "utf8";
  while (true) {
    switch (encoding) {
      case "hex":
        return hexSlice(this, start, end);
      case "utf8":
      case "utf-8":
        return utf8Slice(this, start, end);
      case "ascii":
        return asciiSlice(this, start, end);
      case "latin1":
      case "binary":
        return latin1Slice(this, start, end);
      case "base64":
        return base64Slice(this, start, end);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return utf16leSlice(this, start, end);
      default:
        if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
        encoding = (encoding + "").toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer2.prototype._isBuffer = true;
function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}
Buffer2.prototype.swap16 = function swap16() {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 16-bits");
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this;
};
Buffer2.prototype.swap32 = function swap32() {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 32-bits");
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this;
};
Buffer2.prototype.swap64 = function swap64() {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 64-bits");
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this;
};
Buffer2.prototype.toString = function toString2() {
  var length = this.length | 0;
  if (length === 0) return "";
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};
Buffer2.prototype.equals = function equals(b) {
  if (!internalIsBuffer(b)) throw new TypeError("Argument must be a Buffer");
  if (this === b) return true;
  return Buffer2.compare(this, b) === 0;
};
Buffer2.prototype.inspect = function inspect() {
  var str = "";
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
    if (this.length > max) str += " ... ";
  }
  return "<Buffer " + str + ">";
};
Buffer2.prototype.compare = function compare2(target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError("Argument must be a Buffer");
  }
  if (start === void 0) {
    start = 0;
  }
  if (end === void 0) {
    end = target ? target.length : 0;
  }
  if (thisStart === void 0) {
    thisStart = 0;
  }
  if (thisEnd === void 0) {
    thisEnd = this.length;
  }
  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError("out of range index");
  }
  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }
  if (thisStart >= thisEnd) {
    return -1;
  }
  if (start >= end) {
    return 1;
  }
  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);
  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0) return -1;
  if (typeof byteOffset === "string") {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 2147483647) {
    byteOffset = 2147483647;
  } else if (byteOffset < -2147483648) {
    byteOffset = -2147483648;
  }
  byteOffset = +byteOffset;
  if (isNaN(byteOffset)) {
    byteOffset = dir ? 0 : buffer.length - 1;
  }
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1;
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1;
  }
  if (typeof val === "string") {
    val = Buffer2.from(val, encoding);
  }
  if (internalIsBuffer(val)) {
    if (val.length === 0) {
      return -1;
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === "number") {
    val = val & 255;
    if (Buffer2.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }
  throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;
  if (encoding !== void 0) {
    encoding = String(encoding).toLowerCase();
    if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }
  function read3(buf, i2) {
    if (indexSize === 1) {
      return buf[i2];
    } else {
      return buf.readUInt16BE(i2 * indexSize);
    }
  }
  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read3(arr, i) === read3(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read3(arr, i + j) !== read3(val, j)) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
  }
  return -1;
}
Buffer2.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer2.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer2.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }
  return i;
}
function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function latin1Write(buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length);
}
function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
Buffer2.prototype.write = function write2(string, offset, length, encoding) {
  if (offset === void 0) {
    encoding = "utf8";
    length = this.length;
    offset = 0;
  } else if (length === void 0 && typeof offset === "string") {
    encoding = offset;
    length = this.length;
    offset = 0;
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === void 0) encoding = "utf8";
    } else {
      encoding = length;
      length = void 0;
    }
  } else {
    throw new Error(
      "Buffer.write(string, encoding, offset[, length]) is no longer supported"
    );
  }
  var remaining = this.length - offset;
  if (length === void 0 || length > remaining) length = remaining;
  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError("Attempt to write outside buffer bounds");
  }
  if (!encoding) encoding = "utf8";
  var loweredCase = false;
  for (; ; ) {
    switch (encoding) {
      case "hex":
        return hexWrite(this, string, offset, length);
      case "utf8":
      case "utf-8":
        return utf8Write(this, string, offset, length);
      case "ascii":
        return asciiWrite(this, string, offset, length);
      case "latin1":
      case "binary":
        return latin1Write(this, string, offset, length);
      case "base64":
        return base64Write(this, string, offset, length);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return ucs2Write(this, string, offset, length);
      default:
        if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
        encoding = ("" + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};
Buffer2.prototype.toJSON = function toJSON() {
  return {
    type: "Buffer",
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};
function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf);
  } else {
    return fromByteArray(buf.slice(start, end));
  }
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 192) === 128) {
            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
            if (tempCodePoint > 127) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
            if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
            if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
              codePoint = tempCodePoint;
            }
          }
      }
    }
    if (codePoint === null) {
      codePoint = 65533;
      bytesPerSequence = 1;
    } else if (codePoint > 65535) {
      codePoint -= 65536;
      res.push(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    res.push(codePoint);
    i += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
var MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints);
  }
  var res = "";
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res;
}
function asciiSlice(buf, start, end) {
  var ret = "";
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 127);
  }
  return ret;
}
function latin1Slice(buf, start, end) {
  var ret = "";
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret;
}
function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = "";
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out;
}
function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = "";
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res;
}
Buffer2.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === void 0 ? len : ~~end;
  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }
  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }
  if (end < start) end = start;
  var newBuf;
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer2.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer2(sliceLen, void 0);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }
  return newBuf;
};
function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
  if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
}
Buffer2.prototype.readUIntLE = function readUIntLE(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) checkOffset(offset, byteLength3, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength3 && (mul *= 256)) {
    val += this[offset + i] * mul;
  }
  return val;
};
Buffer2.prototype.readUIntBE = function readUIntBE(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength3, this.length);
  }
  var val = this[offset + --byteLength3];
  var mul = 1;
  while (byteLength3 > 0 && (mul *= 256)) {
    val += this[offset + --byteLength3] * mul;
  }
  return val;
};
Buffer2.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};
Buffer2.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};
Buffer2.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};
Buffer2.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
};
Buffer2.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer2.prototype.readIntLE = function readIntLE(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) checkOffset(offset, byteLength3, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength3 && (mul *= 256)) {
    val += this[offset + i] * mul;
  }
  mul *= 128;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
  return val;
};
Buffer2.prototype.readIntBE = function readIntBE(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) checkOffset(offset, byteLength3, this.length);
  var i = byteLength3;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 256)) {
    val += this[offset + --i] * mul;
  }
  mul *= 128;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
  return val;
};
Buffer2.prototype.readInt8 = function readInt8(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 128)) return this[offset];
  return (255 - this[offset] + 1) * -1;
};
Buffer2.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer2.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer2.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer2.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer2.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4);
};
Buffer2.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4);
};
Buffer2.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8);
};
Buffer2.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8);
};
function checkInt(buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError("Index out of range");
}
Buffer2.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
    checkInt(this, value, offset, byteLength3, maxBytes, 0);
  }
  var mul = 1;
  var i = 0;
  this[offset] = value & 255;
  while (++i < byteLength3 && (mul *= 256)) {
    this[offset + i] = value / mul & 255;
  }
  return offset + byteLength3;
};
Buffer2.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
    checkInt(this, value, offset, byteLength3, maxBytes, 0);
  }
  var i = byteLength3 - 1;
  var mul = 1;
  this[offset + i] = value & 255;
  while (--i >= 0 && (mul *= 256)) {
    this[offset + i] = value / mul & 255;
  }
  return offset + byteLength3;
};
Buffer2.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
  if (!Buffer2.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = value & 255;
  return offset + 1;
};
function objectWriteUInt16(buf, value, offset, littleEndian) {
  if (value < 0) value = 65535 + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
  }
}
Buffer2.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2;
};
Buffer2.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2;
};
function objectWriteUInt32(buf, value, offset, littleEndian) {
  if (value < 0) value = 4294967295 + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
  }
}
Buffer2.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 255;
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4;
};
Buffer2.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4;
};
Buffer2.prototype.writeIntLE = function writeIntLE(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength3 - 1);
    checkInt(this, value, offset, byteLength3, limit - 1, -limit);
  }
  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 255;
  while (++i < byteLength3 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength3;
};
Buffer2.prototype.writeIntBE = function writeIntBE(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength3 - 1);
    checkInt(this, value, offset, byteLength3, limit - 1, -limit);
  }
  var i = byteLength3 - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 255;
  while (--i >= 0 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength3;
};
Buffer2.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
  if (!Buffer2.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 255 + value + 1;
  this[offset] = value & 255;
  return offset + 1;
};
Buffer2.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2;
};
Buffer2.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2;
};
Buffer2.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4;
};
Buffer2.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
  if (value < 0) value = 4294967295 + value + 1;
  if (Buffer2.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4;
};
function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError("Index out of range");
  if (offset < 0) throw new RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}
Buffer2.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};
Buffer2.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};
function writeDouble(buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}
Buffer2.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};
Buffer2.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
};
Buffer2.prototype.copy = function copy(target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;
  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0;
  if (targetStart < 0) {
    throw new RangeError("targetStart out of bounds");
  }
  if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
  if (end < 0) throw new RangeError("sourceEnd out of bounds");
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }
  var len = end - start;
  var i;
  if (this === target && start < targetStart && targetStart < end) {
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1e3 || !Buffer2.TYPED_ARRAY_SUPPORT) {
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }
  return len;
};
Buffer2.prototype.fill = function fill(val, start, end, encoding) {
  if (typeof val === "string") {
    if (typeof start === "string") {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === "string") {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== void 0 && typeof encoding !== "string") {
      throw new TypeError("encoding must be a string");
    }
    if (typeof encoding === "string" && !Buffer2.isEncoding(encoding)) {
      throw new TypeError("Unknown encoding: " + encoding);
    }
  } else if (typeof val === "number") {
    val = val & 255;
  }
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError("Out of range index");
  }
  if (end <= start) {
    return this;
  }
  start = start >>> 0;
  end = end === void 0 ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;
  if (typeof val === "number") {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer2(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }
  return this;
};
var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
function base64clean(str) {
  str = stringtrim(str).replace(INVALID_BASE64_RE, "");
  if (str.length < 2) return "";
  while (str.length % 4 !== 0) {
    str = str + "=";
  }
  return str;
}
function stringtrim(str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, "");
}
function toHex(n) {
  if (n < 16) return "0" + n.toString(16);
  return n.toString(16);
}
function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];
  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1) bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(239, 191, 189);
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0) break;
      bytes.push(
        codePoint >> 6 | 192,
        codePoint & 63 | 128
      );
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0) break;
      bytes.push(
        codePoint >> 12 | 224,
        codePoint >> 6 & 63 | 128,
        codePoint & 63 | 128
      );
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0) break;
      bytes.push(
        codePoint >> 18 | 240,
        codePoint >> 12 & 63 | 128,
        codePoint >> 6 & 63 | 128,
        codePoint & 63 | 128
      );
    } else {
      throw new Error("Invalid code point");
    }
  }
  return bytes;
}
function asciiToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    byteArray.push(str.charCodeAt(i) & 255);
  }
  return byteArray;
}
function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes(str) {
  return toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }
  return i;
}
function isnan(val) {
  return val !== val;
}
function isBuffer(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
}
function isFastBuffer(obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function isSlowBuffer(obj) {
  return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer(obj.slice(0, 0));
}
var CsvError = class _CsvError extends Error {
  constructor(code, message, options, ...contexts) {
    if (Array.isArray(message)) message = message.join(" ").trim();
    super(message);
    if (Error.captureStackTrace !== void 0) {
      Error.captureStackTrace(this, _CsvError);
    }
    this.code = code;
    for (const context of contexts) {
      for (const key in context) {
        const value = context[key];
        this[key] = isBuffer(value) ? value.toString(options.encoding) : value == null ? value : JSON.parse(JSON.stringify(value));
      }
    }
  }
};
var is_object = function(obj) {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
};
var normalize_columns_array = function(columns) {
  const normalizedColumns = [];
  for (let i = 0, l = columns.length; i < l; i++) {
    const column = columns[i];
    if (column === void 0 || column === null || column === false) {
      normalizedColumns[i] = { disabled: true };
    } else if (typeof column === "string" || typeof column === "number") {
      normalizedColumns[i] = { name: `${column}` };
    } else if (is_object(column)) {
      if (typeof column.name !== "string") {
        throw new CsvError("CSV_OPTION_COLUMNS_MISSING_NAME", [
          "Option columns missing name:",
          `property "name" is required at position ${i}`,
          "when column is an object literal"
        ]);
      }
      normalizedColumns[i] = column;
    } else {
      throw new CsvError("CSV_INVALID_COLUMN_DEFINITION", [
        "Invalid column definition:",
        "expect a string or a literal object,",
        `got ${JSON.stringify(column)} at position ${i}`
      ]);
    }
  }
  return normalizedColumns;
};
var ResizeableBuffer = class {
  constructor(size = 100) {
    this.size = size;
    this.length = 0;
    this.buf = Buffer2.allocUnsafe(size);
  }
  prepend(val) {
    if (isBuffer(val)) {
      const length = this.length + val.length;
      if (length >= this.size) {
        this.resize();
        if (length >= this.size) {
          throw Error("INVALID_BUFFER_STATE");
        }
      }
      const buf = this.buf;
      this.buf = Buffer2.allocUnsafe(this.size);
      val.copy(this.buf, 0);
      buf.copy(this.buf, val.length);
      this.length += val.length;
    } else {
      const length = this.length++;
      if (length === this.size) {
        this.resize();
      }
      const buf = this.clone();
      this.buf[0] = val;
      buf.copy(this.buf, 1, 0, length);
    }
  }
  append(val) {
    const length = this.length++;
    if (length === this.size) {
      this.resize();
    }
    this.buf[length] = val;
  }
  clone() {
    return Buffer2.from(this.buf.slice(0, this.length));
  }
  resize() {
    const length = this.length;
    this.size = this.size * 2;
    const buf = Buffer2.allocUnsafe(this.size);
    this.buf.copy(buf, 0, 0, length);
    this.buf = buf;
  }
  toString(encoding) {
    if (encoding) {
      return this.buf.toString(encoding, 0, this.length);
    } else {
      return Uint8Array.prototype.slice.call(this.buf.slice(0, this.length));
    }
  }
  toJSON() {
    return this.toString("utf8");
  }
  reset() {
    this.length = 0;
  }
};
var init_state = function(options) {
  const timchars = [
    // Basic Latin
    32,
    // [Space](https://www.fileformat.info/info/unicode/char/0020/index.htm)
    9,
    // [CHARACTER TABULATION (HT)](https://www.fileformat.info/info/unicode/char/0009/index.htm)
    10,
    // [LINE FEED (LF)](https://www.fileformat.info/info/unicode/char/000a/index.htm)
    13,
    // [CARRIAGE RETURN (CR)](https://www.fileformat.info/info/unicode/char/000d/index.htm)
    12,
    // [FORM FEED (FF)](https://www.fileformat.info/info/unicode/char/000c/index.htm)
    11,
    // [LINE TABULATION (VT)](https://www.fileformat.info/info/unicode/char/000b/index.htm)
    // Latin-1 Supplement
    160,
    // [NO-BREAK SPACE (NBSP)](https://www.fileformat.info/info/unicode/char/00a0/index.htm)
    // Ogham
    5760,
    // [OGHAM SPACE MARK](https://www.fileformat.info/info/unicode/char/1680/index.htm)
    // General Punctuation
    8192,
    // [EN QUAD](https://www.fileformat.info/info/unicode/char/2000/index.htm)
    8193,
    // [EM QUAD](https://www.fileformat.info/info/unicode/char/2001/index.htm)
    8194,
    // [EN SPACE](https://www.fileformat.info/info/unicode/char/2002/index.htm)
    8195,
    // [EM SPACE](https://www.fileformat.info/info/unicode/char/2003/index.htm)
    8196,
    // [THREE-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2004/index.htm)
    8197,
    // [FOUR-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2005/index.htm)
    8198,
    // [SIX-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2006/index.htm)
    8199,
    // [FIGURE SPACE](https://www.fileformat.info/info/unicode/char/2007/index.htm)
    8200,
    // [PUNCTUATION SPACE](https://www.fileformat.info/info/unicode/char/2008/index.htm)
    8201,
    // [THIN SPACE](https://www.fileformat.info/info/unicode/char/2009/index.htm)
    8202,
    // [HAIR SPACE](https://www.fileformat.info/info/unicode/char/200a/index.htm)
    8232,
    // [LINE SEPARATOR](https://www.fileformat.info/info/unicode/char/2028/index.htm)
    8233,
    // [PARAGRAPH SEPARATOR](https://www.fileformat.info/info/unicode/char/2029/index.htm)
    8239,
    // [NARROW NO-BREAK SPACE (NNBSP)](https://www.fileformat.info/info/unicode/char/202f/index.htm)
    8287,
    // [MEDIUM MATHEMATICAL SPACE (MMSP)](https://www.fileformat.info/info/unicode/char/205f/index.htm)
    12288,
    // [IDEOGRAPHIC SPACE](https://www.fileformat.info/info/unicode/char/3000/index.htm)
    65279
    // [ZERO WIDTH NO-BREAK SPACE (BOM)](https://www.fileformat.info/info/unicode/char/feff/index.htm)
  ].reduce((acc, codepoint) => {
    const encoded = Buffer2.from(
      String.fromCharCode(codepoint),
      options.encoding
    );
    if (codepoint !== 63 && encoded.length === 1 && encoded[0] === 63) {
      return acc;
    }
    acc.push(encoded);
    return acc;
  }, []);
  const timcharFirstBytes = new Uint8Array(256);
  for (const t of timchars) timcharFirstBytes[t[0]] = 1;
  return {
    bomSkipped: false,
    bufBytesStart: 0,
    castField: options.cast_function,
    commenting: false,
    delimiterBufPrevious: void 0,
    delimiterDiscovered: false,
    // Current error encountered by a record
    error: void 0,
    enabled: options.from_line === 1,
    escaping: false,
    escapeIsQuote: isBuffer(options.escape) && isBuffer(options.quote) && Buffer2.compare(options.escape, options.quote) === 0,
    // columns can be `false`, `true`, `Array`
    expectedRecordLength: Array.isArray(options.columns) ? options.columns.length : void 0,
    field: new ResizeableBuffer(20),
    firstLineToHeaders: options.cast_first_line_to_header,
    needMoreDataSize: Math.max(
      // Skip if the remaining buffer smaller than comment
      options.comment !== null ? options.comment.length : 0,
      ...options.delimiter ? options.delimiter.map((delimiter) => delimiter.length) : [],
      // Auto discovery of delimiter is limited to 1 character
      options.delimiter_auto ? 1 : 0,
      // Skip if the remaining buffer can be escape sequence
      options.quote !== null ? options.quote.length : 0,
      ...timchars.map((t) => t.length)
    ),
    previousBuf: void 0,
    quoting: false,
    stop: false,
    rawBuffer: new ResizeableBuffer(100),
    record: [],
    recordHasError: false,
    record_length: 0,
    recordDelimiterMaxLength: options.record_delimiter.length === 0 ? 0 : Math.max(...options.record_delimiter.map((v) => v.length)),
    trimChars: [
      Buffer2.from(" ", options.encoding)[0],
      Buffer2.from("	", options.encoding)[0]
    ],
    wasQuoting: false,
    wasRowDelimiter: false,
    timchars,
    timcharFirstBytes
  };
};
var underscore = function(str) {
  return str.replace(/([A-Z])/g, function(_, match) {
    return "_" + match.toLowerCase();
  });
};
var normalize_options = function(opts) {
  const options = {};
  for (const opt in opts) {
    options[underscore(opt)] = opts[opt];
  }
  if (options.encoding === void 0 || options.encoding === true) {
    options.encoding = "utf8";
  } else if (options.encoding === null || options.encoding === false) {
    options.encoding = null;
  } else if (typeof options.encoding !== "string" && options.encoding !== null) {
    throw new CsvError(
      "CSV_INVALID_OPTION_ENCODING",
      [
        "Invalid option encoding:",
        "encoding must be a string or null to return a buffer,",
        `got ${JSON.stringify(options.encoding)}`
      ],
      options
    );
  }
  if (options.bom === void 0 || options.bom === null || options.bom === false) {
    options.bom = false;
  } else if (options.bom !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_BOM",
      [
        "Invalid option bom:",
        "bom must be true,",
        `got ${JSON.stringify(options.bom)}`
      ],
      options
    );
  }
  options.cast_function = null;
  if (options.cast === void 0 || options.cast === null || options.cast === false || options.cast === "") {
    options.cast = void 0;
  } else if (typeof options.cast === "function") {
    options.cast_function = options.cast;
    options.cast = true;
  } else if (options.cast !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_CAST",
      [
        "Invalid option cast:",
        "cast must be true or a function,",
        `got ${JSON.stringify(options.cast)}`
      ],
      options
    );
  }
  if (options.cast_date === void 0 || options.cast_date === null || options.cast_date === false || options.cast_date === "") {
    options.cast_date = false;
  } else if (options.cast_date === true) {
    options.cast_date = function(value) {
      const date = Date.parse(value);
      return !isNaN(date) ? new Date(date) : value;
    };
  } else if (typeof options.cast_date !== "function") {
    throw new CsvError(
      "CSV_INVALID_OPTION_CAST_DATE",
      [
        "Invalid option cast_date:",
        "cast_date must be true or a function,",
        `got ${JSON.stringify(options.cast_date)}`
      ],
      options
    );
  }
  options.cast_first_line_to_header = void 0;
  if (options.columns === true) {
    options.cast_first_line_to_header = void 0;
  } else if (typeof options.columns === "function") {
    options.cast_first_line_to_header = options.columns;
    options.columns = true;
  } else if (Array.isArray(options.columns)) {
    options.columns = normalize_columns_array(options.columns);
  } else if (options.columns === void 0 || options.columns === null || options.columns === false) {
    options.columns = false;
  } else {
    throw new CsvError(
      "CSV_INVALID_OPTION_COLUMNS",
      [
        "Invalid option columns:",
        "expect an array, a function or true,",
        `got ${JSON.stringify(options.columns)}`
      ],
      options
    );
  }
  if (options.group_columns_by_name === void 0 || options.group_columns_by_name === null || options.group_columns_by_name === false) {
    options.group_columns_by_name = false;
  } else if (options.group_columns_by_name !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
      [
        "Invalid option group_columns_by_name:",
        "expect an boolean,",
        `got ${JSON.stringify(options.group_columns_by_name)}`
      ],
      options
    );
  } else if (options.columns === false) {
    throw new CsvError(
      "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
      [
        "Invalid option group_columns_by_name:",
        "the `columns` mode must be activated."
      ],
      options
    );
  }
  if (options.comment === void 0 || options.comment === null || options.comment === false || options.comment === "") {
    options.comment = null;
  } else {
    if (typeof options.comment === "string") {
      options.comment = Buffer2.from(options.comment, options.encoding);
    }
    if (!isBuffer(options.comment)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_COMMENT",
        [
          "Invalid option comment:",
          "comment must be a buffer or a string,",
          `got ${JSON.stringify(options.comment)}`
        ],
        options
      );
    }
  }
  if (options.comment_no_infix === void 0 || options.comment_no_infix === null || options.comment_no_infix === false) {
    options.comment_no_infix = false;
  } else if (options.comment_no_infix !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_COMMENT",
      [
        "Invalid option comment_no_infix:",
        "value must be a boolean,",
        `got ${JSON.stringify(options.comment_no_infix)}`
      ],
      options
    );
  }
  if (options.delimiter_auto === void 0 || options.delimiter_auto === null || options.delimiter_auto === false) {
    options.delimiter_auto = false;
  } else if (options.delimiter_auto === true) {
    options.delimiter_auto = {};
  } else if (!is_object(options.delimiter_auto)) {
    throw new CsvError(
      "CSV_INVALID_OPTION_DELIMITER_AUTO",
      [
        "Invalid option delimiter_auto:",
        "delimiter_auto must be a boolean or a configuration object,",
        `got ${JSON.stringify(options.delimiter_auto)}`
      ],
      options
    );
  }
  if (options.delimiter_auto) {
    if (options.delimiter_auto.preferred === void 0)
      options.delimiter_auto.preferred = {
        [",".charCodeAt(0)]: 1.8,
        ["	".charCodeAt(0)]: 1.8,
        [";".charCodeAt(0)]: 1.6,
        [" ".charCodeAt(0)]: 1.6,
        [":".charCodeAt(0)]: 1.5,
        [".".charCodeAt(0)]: 1.4,
        ["/".charCodeAt(0)]: 1.4
      };
    else if (!is_object(options.delimiter_auto.preferred)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "preferred must be an object,",
          `got ${JSON.stringify(options.delimiter_auto.preferred)}`
        ],
        options
      );
    }
    if (options.delimiter_auto.score === void 0)
      options.delimiter_auto.score = (info, options2) => {
        return (info.total - info.std) * (options2.preferred[info.char_code] || 1);
      };
    else if (typeof options.delimiter_auto.score !== "function") {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "score must be a function,",
          `got ${JSON.stringify(options.delimiter_auto.score)}`
        ],
        options
      );
    }
    if (options.delimiter_auto.size === void 0)
      options.delimiter_auto.size = 2048;
    else if (typeof options.delimiter_auto.size !== "number") {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "size must be a number,",
          `got ${JSON.stringify(options.delimiter_auto.size)}`
        ],
        options
      );
    }
  }
  const delimiter_json = JSON.stringify(options.delimiter);
  if (options.delimiter_auto !== false) {
    options.delimiter = [];
  }
  if (!Array.isArray(options.delimiter)) {
    if (options.delimiter === void 0 || options.delimiter === null || options.delimiter === false) {
      options.delimiter = Buffer2.from(",", options.encoding);
    }
    options.delimiter = [options.delimiter];
  }
  options.delimiter = options.delimiter.map(function(delimiter) {
    if (typeof delimiter === "string") {
      delimiter = Buffer2.from(delimiter, options.encoding);
    }
    if (!isBuffer(delimiter) || delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER",
        [
          "Invalid option delimiter:",
          "delimiter must be a non empty string or buffer or array of string|buffer,",
          `got ${delimiter_json}`
        ],
        options
      );
    }
    return delimiter;
  });
  if (options.escape === void 0 || options.escape === true) {
    options.escape = Buffer2.from('"', options.encoding);
  } else if (typeof options.escape === "string") {
    options.escape = Buffer2.from(options.escape, options.encoding);
  } else if (options.escape === null || options.escape === false) {
    options.escape = null;
  }
  if (options.escape !== null) {
    if (!isBuffer(options.escape)) {
      throw new Error(
        `Invalid Option: escape must be a buffer, a string or a boolean, got ${JSON.stringify(options.escape)}`
      );
    }
  }
  if (options.from === void 0 || options.from === null) {
    options.from = 1;
  } else {
    if (typeof options.from === "string" && /\d+/.test(options.from)) {
      options.from = parseInt(options.from);
    }
    if (Number.isInteger(options.from)) {
      if (options.from < 0) {
        throw new Error(
          `Invalid Option: from must be a positive integer, got ${JSON.stringify(opts.from)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: from must be an integer, got ${JSON.stringify(options.from)}`
      );
    }
  }
  if (options.from_line === void 0 || options.from_line === null) {
    options.from_line = 1;
  } else {
    if (typeof options.from_line === "string" && /\d+/.test(options.from_line)) {
      options.from_line = parseInt(options.from_line);
    }
    if (Number.isInteger(options.from_line)) {
      if (options.from_line <= 0) {
        throw new Error(
          `Invalid Option: from_line must be a positive integer greater than 0, got ${JSON.stringify(opts.from_line)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: from_line must be an integer, got ${JSON.stringify(opts.from_line)}`
      );
    }
  }
  if (options.ignore_last_delimiters === void 0 || options.ignore_last_delimiters === null) {
    options.ignore_last_delimiters = false;
  } else if (typeof options.ignore_last_delimiters === "number") {
    options.ignore_last_delimiters = Math.floor(options.ignore_last_delimiters);
    if (options.ignore_last_delimiters === 0) {
      options.ignore_last_delimiters = false;
    }
  } else if (typeof options.ignore_last_delimiters !== "boolean") {
    throw new CsvError(
      "CSV_INVALID_OPTION_IGNORE_LAST_DELIMITERS",
      [
        "Invalid option `ignore_last_delimiters`:",
        "the value must be a boolean value or an integer,",
        `got ${JSON.stringify(options.ignore_last_delimiters)}`
      ],
      options
    );
  }
  if (options.ignore_last_delimiters === true && options.columns === false) {
    throw new CsvError(
      "CSV_IGNORE_LAST_DELIMITERS_REQUIRES_COLUMNS",
      [
        "The option `ignore_last_delimiters`",
        "requires the activation of the `columns` option"
      ],
      options
    );
  }
  if (options.info === void 0 || options.info === null || options.info === false) {
    options.info = false;
  } else if (options.info !== true) {
    throw new Error(
      `Invalid Option: info must be true, got ${JSON.stringify(options.info)}`
    );
  }
  if (options.max_record_size === void 0 || options.max_record_size === null || options.max_record_size === false) {
    options.max_record_size = 0;
  } else if (Number.isInteger(options.max_record_size) && options.max_record_size >= 0) ;
  else if (typeof options.max_record_size === "string" && /\d+/.test(options.max_record_size)) {
    options.max_record_size = parseInt(options.max_record_size);
  } else {
    throw new Error(
      `Invalid Option: max_record_size must be a positive integer, got ${JSON.stringify(options.max_record_size)}`
    );
  }
  if (options.objname === void 0 || options.objname === null || options.objname === false) {
    options.objname = void 0;
  } else if (isBuffer(options.objname)) {
    if (options.objname.length === 0) {
      throw new Error(`Invalid Option: objname must be a non empty buffer`);
    }
    if (options.encoding === null) ;
    else {
      options.objname = options.objname.toString(options.encoding);
    }
  } else if (typeof options.objname === "string") {
    if (options.objname.length === 0) {
      throw new Error(`Invalid Option: objname must be a non empty string`);
    }
  } else if (typeof options.objname === "number") ;
  else {
    throw new Error(
      `Invalid Option: objname must be a string or a buffer, got ${options.objname}`
    );
  }
  if (options.objname !== void 0) {
    if (typeof options.objname === "number") {
      if (options.columns !== false) {
        throw Error(
          "Invalid Option: objname index cannot be combined with columns or be defined as a field"
        );
      }
    } else {
      if (options.columns === false) {
        throw Error(
          "Invalid Option: objname field must be combined with columns or be defined as an index"
        );
      }
    }
  }
  if (options.on_record === void 0 || options.on_record === null) {
    options.on_record = void 0;
  } else if (typeof options.on_record !== "function") {
    throw new CsvError(
      "CSV_INVALID_OPTION_ON_RECORD",
      [
        "Invalid option `on_record`:",
        "expect a function,",
        `got ${JSON.stringify(options.on_record)}`
      ],
      options
    );
  }
  if (options.on_skip !== void 0 && options.on_skip !== null && typeof options.on_skip !== "function") {
    throw new Error(
      `Invalid Option: on_skip must be a function, got ${JSON.stringify(options.on_skip)}`
    );
  }
  if (options.quote === null || options.quote === false || options.quote === "") {
    options.quote = null;
  } else {
    if (options.quote === void 0 || options.quote === true) {
      options.quote = Buffer2.from('"', options.encoding);
    } else if (typeof options.quote === "string") {
      options.quote = Buffer2.from(options.quote, options.encoding);
    }
    if (!isBuffer(options.quote)) {
      throw new Error(
        `Invalid Option: quote must be a buffer or a string, got ${JSON.stringify(options.quote)}`
      );
    }
  }
  if (options.raw === void 0 || options.raw === null || options.raw === false) {
    options.raw = false;
  } else if (options.raw !== true) {
    throw new Error(
      `Invalid Option: raw must be true, got ${JSON.stringify(options.raw)}`
    );
  }
  if (options.record_delimiter === void 0) {
    options.record_delimiter = [];
  } else if (typeof options.record_delimiter === "string" || isBuffer(options.record_delimiter)) {
    if (options.record_delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a non empty string or buffer,",
          `got ${JSON.stringify(options.record_delimiter)}`
        ],
        options
      );
    }
    options.record_delimiter = [options.record_delimiter];
  } else if (!Array.isArray(options.record_delimiter)) {
    throw new CsvError(
      "CSV_INVALID_OPTION_RECORD_DELIMITER",
      [
        "Invalid option `record_delimiter`:",
        "value must be a string, a buffer or array of string|buffer,",
        `got ${JSON.stringify(options.record_delimiter)}`
      ],
      options
    );
  }
  options.record_delimiter = options.record_delimiter.map(function(rd, i) {
    if (typeof rd !== "string" && !isBuffer(rd)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a string, a buffer or array of string|buffer",
          `at index ${i},`,
          `got ${JSON.stringify(rd)}`
        ],
        options
      );
    } else if (rd.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a non empty string or buffer",
          `at index ${i},`,
          `got ${JSON.stringify(rd)}`
        ],
        options
      );
    }
    if (typeof rd === "string") {
      rd = Buffer2.from(rd, options.encoding);
    }
    return rd;
  });
  if (typeof options.relax_column_count === "boolean") ;
  else if (options.relax_column_count === void 0 || options.relax_column_count === null) {
    options.relax_column_count = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count must be a boolean, got ${JSON.stringify(options.relax_column_count)}`
    );
  }
  if (typeof options.relax_column_count_less === "boolean") ;
  else if (options.relax_column_count_less === void 0 || options.relax_column_count_less === null) {
    options.relax_column_count_less = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count_less must be a boolean, got ${JSON.stringify(options.relax_column_count_less)}`
    );
  }
  if (typeof options.relax_column_count_more === "boolean") ;
  else if (options.relax_column_count_more === void 0 || options.relax_column_count_more === null) {
    options.relax_column_count_more = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count_more must be a boolean, got ${JSON.stringify(options.relax_column_count_more)}`
    );
  }
  if (typeof options.relax_quotes === "boolean") ;
  else if (options.relax_quotes === void 0 || options.relax_quotes === null) {
    options.relax_quotes = false;
  } else {
    throw new Error(
      `Invalid Option: relax_quotes must be a boolean, got ${JSON.stringify(options.relax_quotes)}`
    );
  }
  if (typeof options.skip_empty_lines === "boolean") ;
  else if (options.skip_empty_lines === void 0 || options.skip_empty_lines === null) {
    options.skip_empty_lines = false;
  } else {
    throw new Error(
      `Invalid Option: skip_empty_lines must be a boolean, got ${JSON.stringify(options.skip_empty_lines)}`
    );
  }
  if (typeof options.skip_records_with_empty_values === "boolean") ;
  else if (options.skip_records_with_empty_values === void 0 || options.skip_records_with_empty_values === null) {
    options.skip_records_with_empty_values = false;
  } else {
    throw new Error(
      `Invalid Option: skip_records_with_empty_values must be a boolean, got ${JSON.stringify(options.skip_records_with_empty_values)}`
    );
  }
  if (typeof options.skip_records_with_error === "boolean") ;
  else if (options.skip_records_with_error === void 0 || options.skip_records_with_error === null) {
    options.skip_records_with_error = false;
  } else {
    throw new Error(
      `Invalid Option: skip_records_with_error must be a boolean, got ${JSON.stringify(options.skip_records_with_error)}`
    );
  }
  if (options.rtrim === void 0 || options.rtrim === null || options.rtrim === false) {
    options.rtrim = false;
  } else if (options.rtrim !== true) {
    throw new Error(
      `Invalid Option: rtrim must be a boolean, got ${JSON.stringify(options.rtrim)}`
    );
  }
  if (options.ltrim === void 0 || options.ltrim === null || options.ltrim === false) {
    options.ltrim = false;
  } else if (options.ltrim !== true) {
    throw new Error(
      `Invalid Option: ltrim must be a boolean, got ${JSON.stringify(options.ltrim)}`
    );
  }
  if (options.trim === void 0 || options.trim === null || options.trim === false) {
    options.trim = false;
  } else if (options.trim !== true) {
    throw new Error(
      `Invalid Option: trim must be a boolean, got ${JSON.stringify(options.trim)}`
    );
  }
  if (options.trim === true && opts.ltrim !== false) {
    options.ltrim = true;
  } else if (options.ltrim !== true) {
    options.ltrim = false;
  }
  if (options.trim === true && opts.rtrim !== false) {
    options.rtrim = true;
  } else if (options.rtrim !== true) {
    options.rtrim = false;
  }
  if (options.to === void 0 || options.to === null) {
    options.to = -1;
  } else if (options.to !== -1) {
    if (typeof options.to === "string" && /\d+/.test(options.to)) {
      options.to = parseInt(options.to);
    }
    if (Number.isInteger(options.to)) {
      if (options.to <= 0) {
        throw new Error(
          `Invalid Option: to must be a positive integer greater than 0, got ${JSON.stringify(opts.to)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: to must be an integer, got ${JSON.stringify(opts.to)}`
      );
    }
  }
  if (options.to_line === void 0 || options.to_line === null) {
    options.to_line = -1;
  } else if (options.to_line !== -1) {
    if (typeof options.to_line === "string" && /\d+/.test(options.to_line)) {
      options.to_line = parseInt(options.to_line);
    }
    if (Number.isInteger(options.to_line)) {
      if (options.to_line <= 0) {
        throw new Error(
          `Invalid Option: to_line must be a positive integer greater than 0, got ${JSON.stringify(opts.to_line)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: to_line must be an integer, got ${JSON.stringify(opts.to_line)}`
      );
    }
  }
  return options;
};
var delimiter_discover = function(records, options) {
  if (!options) {
    ({ delimiter_auto: options } = normalize_options({ delimiter_auto: true }));
  }
  if (typeof records === "string") {
    records = Buffer2.from(records);
  }
  if (isBuffer(records)) {
    records = ((data) => {
      const records2 = [];
      const parser = transform({ delimiter: [] });
      const push = (record) => records2.push(record);
      const close = () => {
      };
      const error = parser.parse(data, true, push, close);
      if (error !== void 0) throw error;
      return records2;
    })(records);
  }
  const info = Array(127).fill().map(() => ({ lines: [] }));
  records.map(([record], line) => {
    for (let i = 0, l = record.length; i < l; i++) {
      const code = record.charCodeAt(i);
      if (info[code].lines[line] === void 0) info[code].lines[line] = 0;
      info[code].lines[line]++;
    }
  });
  info.map((info2, i) => {
    info2.char_code = i;
    info2.std = std(info2.lines);
    info2.total = info2.lines.reduce((acc, val) => acc + val, 0);
    info2.preferred = !!options.preferred[i];
    info2.score = options.score(info2, options);
  });
  const result = info.reduce(
    (acc, info2) => acc.score > info2.score ? acc : info2,
    {}
  );
  return String.fromCharCode(result.char_code);
};
var std = function(array) {
  const n = array.length;
  if (n === 0) return 0;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
};
var isRecordEmpty = function(record) {
  return record.every(
    (field) => field == null || field.toString && field.toString().trim() === ""
  );
};
var cr = 13;
var nl = 10;
var boms = {
  // Note, the following are equals:
  // Buffer.from("\ufeff")
  // Buffer.from([239, 187, 191])
  // Buffer.from('EFBBBF', 'hex')
  utf8: Buffer2.from([239, 187, 191]),
  // Note, the following are equals:
  // Buffer.from "\ufeff", 'utf16le
  // Buffer.from([255, 254])
  utf16le: Buffer2.from([255, 254])
};
var transform = function(original_options = {}) {
  const info = {
    bytes: 0,
    bytes_records: 0,
    comment_lines: 0,
    empty_lines: 0,
    invalid_field_length: 0,
    lines: 1,
    records: 0
  };
  const options = normalize_options(original_options);
  return {
    info,
    original_options,
    options,
    state: init_state(options),
    __needMoreData: function(i, bufLen, end) {
      if (end) return false;
      const { encoding, escape, quote } = this.options;
      const { quoting, needMoreDataSize, recordDelimiterMaxLength } = this.state;
      const numOfCharLeft = bufLen - i - 1;
      const requiredLength = Math.max(
        needMoreDataSize,
        // Skip if the remaining buffer smaller than record delimiter
        // If "record_delimiter" is yet to be discovered:
        // 1. It is equals to `[]` and "recordDelimiterMaxLength" equals `0`
        // 2. We set the length to windows line ending in the current encoding
        // Note, that encoding is known from user or bom discovery at that point
        // recordDelimiterMaxLength,
        recordDelimiterMaxLength === 0 ? Buffer2.from("\r\n", encoding).length : recordDelimiterMaxLength,
        // Skip if remaining buffer can be an escaped quote
        quoting ? (escape === null ? 0 : escape.length) + quote.length : 0,
        // Skip if remaining buffer can be record delimiter following the closing quote
        quoting ? quote.length + recordDelimiterMaxLength : 0
      );
      return numOfCharLeft < requiredLength;
    },
    // Central parser implementation
    parse: function(nextBuf, end, push, close) {
      const {
        bom,
        comment_no_infix,
        delimiter_auto,
        encoding,
        from_line,
        ltrim,
        max_record_size,
        raw,
        relax_quotes,
        rtrim,
        skip_empty_lines,
        to,
        to_line
      } = this.options;
      let { comment, escape, quote, record_delimiter } = this.options;
      const {
        bomSkipped,
        delimiterDiscovered,
        delimiterBufPrevious,
        rawBuffer,
        escapeIsQuote
      } = this.state;
      if (!delimiterDiscovered && delimiter_auto) {
        let delimiterBuf;
        if (delimiterBufPrevious === void 0) {
          delimiterBuf = nextBuf;
        } else if (delimiterBufPrevious !== void 0 && nextBuf === void 0) {
          delimiterBuf = delimiterBufPrevious;
        } else {
          delimiterBuf = Buffer2.concat([delimiterBufPrevious, nextBuf]);
        }
        nextBuf = void 0;
        if (end || delimiterBuf.length > delimiter_auto.size) {
          this.options.delimiter = [
            Buffer2.from(
              delimiter_discover(delimiterBuf, this.options.delimiter_auto)
            )
          ];
          this.state.previousBuf = delimiterBuf;
          this.state.delimiterBufPrevious = void 0;
          this.state.delimiterDiscovered = true;
        } else {
          this.state.delimiterBufPrevious = delimiterBuf;
          return;
        }
      }
      const { previousBuf } = this.state;
      let buf;
      if (previousBuf === void 0) {
        if (nextBuf === void 0) {
          close();
          return;
        } else {
          buf = nextBuf;
        }
      } else if (previousBuf !== void 0 && nextBuf === void 0) {
        buf = previousBuf;
      } else {
        buf = Buffer2.concat([previousBuf, nextBuf]);
      }
      if (bomSkipped === false) {
        if (bom === false) {
          this.state.bomSkipped = true;
        } else if (buf.length < 3) {
          if (end === false) {
            this.state.previousBuf = buf;
            return;
          }
        } else {
          for (const encoding2 in boms) {
            if (boms[encoding2].compare(buf, 0, boms[encoding2].length) === 0) {
              const bomLength = boms[encoding2].length;
              this.state.bufBytesStart += bomLength;
              buf = buf.slice(bomLength);
              const options2 = normalize_options({
                ...this.original_options,
                encoding: encoding2
              });
              for (const key in options2) {
                this.options[key] = options2[key];
              }
              ({ comment, escape, quote } = this.options);
              break;
            }
          }
          this.state.bomSkipped = true;
        }
      }
      const bufLen = buf.length;
      let pos;
      for (pos = 0; pos < bufLen; pos++) {
        if (this.__needMoreData(pos, bufLen, end)) {
          break;
        }
        if (this.state.wasRowDelimiter === true) {
          this.info.lines++;
          this.state.wasRowDelimiter = false;
        }
        if (to_line !== -1 && this.info.lines > to_line) {
          this.state.stop = true;
          close();
          return;
        }
        if (this.state.quoting === false && record_delimiter.length === 0) {
          const record_delimiterCount = this.__autoDiscoverRecordDelimiter(
            buf,
            pos
          );
          if (record_delimiterCount) {
            record_delimiter = this.options.record_delimiter;
          }
        }
        const chr = buf[pos];
        if (raw === true) {
          rawBuffer.append(chr);
        }
        if ((chr === cr || chr === nl) && this.state.wasRowDelimiter === false) {
          this.state.wasRowDelimiter = true;
        }
        if (this.state.escaping === true) {
          this.state.escaping = false;
        } else {
          if (escape !== null && this.state.quoting === true && this.__isEscape(buf, pos, chr) && pos + escape.length < bufLen) {
            if (escapeIsQuote) {
              if (this.__isQuote(buf, pos + escape.length)) {
                this.state.escaping = true;
                pos += escape.length - 1;
                continue;
              }
            } else {
              this.state.escaping = true;
              pos += escape.length - 1;
              continue;
            }
          }
          if (this.state.commenting === false && this.__isQuote(buf, pos)) {
            if (this.state.quoting === true) {
              const nextChr = buf[pos + quote.length];
              const isNextChrTrimable = rtrim && this.__isCharTrimable(buf, pos + quote.length);
              const isNextChrComment = comment !== null && this.__compareBytes(comment, buf, pos + quote.length, nextChr);
              const isNextChrDelimiter = this.__isDelimiter(
                buf,
                pos + quote.length,
                nextChr
              );
              const isNextChrRecordDelimiter = record_delimiter.length === 0 ? this.__autoDiscoverRecordDelimiter(buf, pos + quote.length) : this.__isRecordDelimiter(nextChr, buf, pos + quote.length);
              if (escape !== null && this.__isEscape(buf, pos, chr) && this.__isQuote(buf, pos + escape.length)) {
                pos += escape.length - 1;
              } else if (!nextChr || isNextChrDelimiter || isNextChrRecordDelimiter || isNextChrComment || isNextChrTrimable) {
                this.state.quoting = false;
                this.state.wasQuoting = true;
                pos += quote.length - 1;
                continue;
              } else if (relax_quotes === false) {
                const err = this.__error(
                  new CsvError(
                    "CSV_INVALID_CLOSING_QUOTE",
                    [
                      "Invalid Closing Quote:",
                      `got "${String.fromCharCode(nextChr)}"`,
                      `at line ${this.info.lines}`,
                      "instead of delimiter, record delimiter, trimable character",
                      "(if activated) or comment"
                    ],
                    this.options,
                    this.__infoField()
                  )
                );
                if (err !== void 0) return err;
              } else {
                this.state.quoting = false;
                this.state.wasQuoting = true;
                this.state.field.prepend(quote);
                pos += quote.length - 1;
              }
            } else {
              if (this.state.field.length !== 0) {
                if (relax_quotes === false) {
                  const info2 = this.__infoField();
                  const bom2 = Object.keys(boms).map(
                    (b) => boms[b].equals(this.state.field.toString()) ? b : false
                  ).filter(Boolean)[0];
                  const err = this.__error(
                    new CsvError(
                      "INVALID_OPENING_QUOTE",
                      [
                        "Invalid Opening Quote:",
                        `a quote is found on field ${JSON.stringify(info2.column)} at line ${info2.lines}, value is ${JSON.stringify(this.state.field.toString(encoding))}`,
                        bom2 ? `(${bom2} bom)` : void 0
                      ],
                      this.options,
                      info2,
                      {
                        field: this.state.field
                      }
                    )
                  );
                  if (err !== void 0) return err;
                }
              } else {
                this.state.quoting = true;
                pos += quote.length - 1;
                continue;
              }
            }
          }
          if (this.state.quoting === false) {
            const recordDelimiterLength = this.__isRecordDelimiter(
              chr,
              buf,
              pos
            );
            if (recordDelimiterLength !== 0) {
              const skipCommentLine = this.state.commenting && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0;
              if (skipCommentLine) {
                this.info.comment_lines++;
              } else {
                if (this.state.enabled === false && this.info.lines + (this.state.wasRowDelimiter === true ? 1 : 0) >= from_line) {
                  this.state.enabled = true;
                  this.__resetField();
                  this.__resetRecord();
                  pos += recordDelimiterLength - 1;
                  continue;
                }
                if (skip_empty_lines === true && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0) {
                  this.info.empty_lines++;
                  pos += recordDelimiterLength - 1;
                  continue;
                }
                this.info.bytes = this.state.bufBytesStart + pos;
                const errField = this.__onField();
                if (errField !== void 0) return errField;
                this.info.bytes = this.state.bufBytesStart + pos + recordDelimiterLength;
                const errRecord = this.__onRecord(push);
                if (errRecord !== void 0) return errRecord;
                if (to !== -1 && this.info.records >= to) {
                  this.state.stop = true;
                  close();
                  return;
                }
              }
              this.state.commenting = false;
              pos += recordDelimiterLength - 1;
              continue;
            }
            if (this.state.commenting) {
              continue;
            }
            if (comment !== null && (comment_no_infix === false || this.state.record.length === 0 && this.state.field.length === 0)) {
              const commentCount = this.__compareBytes(comment, buf, pos, chr);
              if (commentCount !== 0) {
                this.state.commenting = true;
                continue;
              }
            }
            const delimiterLength = this.__isDelimiter(buf, pos, chr);
            if (delimiterLength !== 0) {
              this.info.bytes = this.state.bufBytesStart + pos;
              const errField = this.__onField();
              if (errField !== void 0) return errField;
              pos += delimiterLength - 1;
              continue;
            }
          }
        }
        if (this.state.commenting === false) {
          if (max_record_size !== 0 && this.state.record_length + this.state.field.length > max_record_size) {
            return this.__error(
              new CsvError(
                "CSV_MAX_RECORD_SIZE",
                [
                  "Max Record Size:",
                  "record exceed the maximum number of tolerated bytes",
                  `of ${max_record_size}`,
                  `at line ${this.info.lines}`
                ],
                this.options,
                this.__infoField()
              )
            );
          }
        }
        const lappend = ltrim === false || this.state.quoting === true || this.state.field.length !== 0 || !this.__isCharTrimable(buf, pos);
        const rappend = rtrim === false || this.state.wasQuoting === false;
        if (lappend === true && rappend === true) {
          this.state.field.append(chr);
        } else if (rtrim === true && !this.__isCharTrimable(buf, pos)) {
          return this.__error(
            new CsvError(
              "CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE",
              [
                "Invalid Closing Quote:",
                "found non trimable byte after quote",
                `at line ${this.info.lines}`
              ],
              this.options,
              this.__infoField()
            )
          );
        } else {
          if (lappend === false) {
            pos += this.__isCharTrimable(buf, pos) - 1;
          }
          continue;
        }
      }
      if (end === true) {
        if (this.state.quoting === true) {
          const err = this.__error(
            new CsvError(
              "CSV_QUOTE_NOT_CLOSED",
              [
                "Quote Not Closed:",
                `the parsing is finished with an opening quote at line ${this.info.lines}`
              ],
              this.options,
              this.__infoField()
            )
          );
          if (err !== void 0) return err;
        } else {
          if (this.state.wasQuoting === true || this.state.record.length !== 0 || this.state.field.length !== 0) {
            this.info.bytes = this.state.bufBytesStart + pos;
            const errField = this.__onField();
            if (errField !== void 0) return errField;
            const errRecord = this.__onRecord(push);
            if (errRecord !== void 0) return errRecord;
          } else if (this.state.wasRowDelimiter === true) {
            this.info.empty_lines++;
          } else if (this.state.commenting === true) {
            this.info.comment_lines++;
          }
        }
      } else {
        this.state.bufBytesStart += pos;
        this.state.previousBuf = buf.slice(pos);
      }
      if (this.state.wasRowDelimiter === true) {
        this.info.lines++;
        this.state.wasRowDelimiter = false;
      }
    },
    __onRecord: function(push) {
      const {
        columns,
        group_columns_by_name,
        encoding,
        info: info2,
        from: from3,
        relax_column_count,
        relax_column_count_less,
        relax_column_count_more,
        raw,
        skip_records_with_empty_values
      } = this.options;
      const { enabled, record } = this.state;
      if (enabled === false) {
        return this.__resetRecord();
      }
      const recordLength = record.length;
      if (columns === true) {
        if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
          this.__resetRecord();
          return;
        }
        return this.__firstLineToColumns(record);
      }
      if (columns === false && this.info.records === 0) {
        this.state.expectedRecordLength = recordLength;
      }
      if (recordLength !== this.state.expectedRecordLength) {
        const err = columns === false ? new CsvError(
          "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH",
          [
            "Invalid Record Length:",
            `expect ${this.state.expectedRecordLength},`,
            `got ${recordLength} on line ${this.info.lines}`
          ],
          this.options,
          this.__infoField(),
          {
            record
          }
        ) : new CsvError(
          "CSV_RECORD_INCONSISTENT_COLUMNS",
          [
            "Invalid Record Length:",
            `columns length is ${columns.length},`,
            // rename columns
            `got ${recordLength} on line ${this.info.lines}`
          ],
          this.options,
          this.__infoField(),
          {
            record
          }
        );
        if (relax_column_count === true || relax_column_count_less === true && recordLength < this.state.expectedRecordLength || relax_column_count_more === true && recordLength > this.state.expectedRecordLength) {
          this.info.invalid_field_length++;
          this.state.error = err;
        } else {
          const finalErr = this.__error(err);
          if (finalErr) return finalErr;
        }
      }
      if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
        this.__resetRecord();
        return;
      }
      if (this.state.recordHasError === true) {
        this.__resetRecord();
        this.state.recordHasError = false;
        return;
      }
      this.info.records++;
      if (from3 === 1 || this.info.records >= from3) {
        const { objname } = this.options;
        if (columns !== false) {
          const obj = {};
          for (let i = 0, l = record.length; i < l; i++) {
            if (columns[i] === void 0 || columns[i].disabled) continue;
            if (group_columns_by_name === true && Object.hasOwn(obj, columns[i].name)) {
              if (Array.isArray(obj[columns[i].name])) {
                obj[columns[i].name] = obj[columns[i].name].concat(record[i]);
              } else {
                obj[columns[i].name] = [obj[columns[i].name], record[i]];
              }
            } else {
              Object.defineProperty(obj, columns[i].name, {
                value: record[i],
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
          }
          if (raw === true || info2 === true) {
            const extRecord = Object.assign(
              { record: obj },
              raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
              info2 === true ? { info: this.__infoRecord() } : {}
            );
            const err = this.__push(
              objname === void 0 ? extRecord : [obj[objname], extRecord],
              push
            );
            if (err) {
              return err;
            }
          } else {
            const err = this.__push(
              objname === void 0 ? obj : [obj[objname], obj],
              push
            );
            if (err) {
              return err;
            }
          }
        } else {
          if (raw === true || info2 === true) {
            const extRecord = Object.assign(
              { record },
              raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
              info2 === true ? { info: this.__infoRecord() } : {}
            );
            const err = this.__push(
              objname === void 0 ? extRecord : [record[objname], extRecord],
              push
            );
            if (err) {
              return err;
            }
          } else {
            const err = this.__push(
              objname === void 0 ? record : [record[objname], record],
              push
            );
            if (err) {
              return err;
            }
          }
        }
      }
      this.__resetRecord();
    },
    __firstLineToColumns: function(record) {
      const { firstLineToHeaders } = this.state;
      try {
        const headers = firstLineToHeaders === void 0 ? record : firstLineToHeaders.call(null, record);
        if (!Array.isArray(headers)) {
          return this.__error(
            new CsvError(
              "CSV_INVALID_COLUMN_MAPPING",
              [
                "Invalid Column Mapping:",
                "expect an array from column function,",
                `got ${JSON.stringify(headers)}`
              ],
              this.options,
              this.__infoField(),
              {
                headers
              }
            )
          );
        }
        const normalizedHeaders = normalize_columns_array(headers);
        this.state.expectedRecordLength = normalizedHeaders.length;
        this.options.columns = normalizedHeaders;
        this.__resetRecord();
        return;
      } catch (err) {
        return err;
      }
    },
    __resetRecord: function() {
      if (this.options.raw === true) {
        this.state.rawBuffer.reset();
      }
      this.state.error = void 0;
      this.state.record = [];
      this.state.record_length = 0;
    },
    __onField: function() {
      const { cast, encoding, rtrim, max_record_size } = this.options;
      const { enabled, wasQuoting } = this.state;
      if (enabled === false) {
        return this.__resetField();
      }
      let field = this.state.field.toString(encoding);
      if (rtrim === true && wasQuoting === false) {
        field = field.trimRight();
      }
      if (cast === true) {
        const [err, f] = this.__cast(field);
        if (err !== void 0) return err;
        field = f;
      }
      this.state.record.push(field);
      if (max_record_size !== 0 && typeof field === "string") {
        this.state.record_length += field.length;
      }
      this.__resetField();
    },
    __resetField: function() {
      this.state.field.reset();
      this.state.wasQuoting = false;
    },
    __push: function(record, push) {
      const { on_record } = this.options;
      if (on_record !== void 0) {
        const info2 = this.__infoRecord();
        try {
          record = on_record.call(null, record, info2);
        } catch (err) {
          return err;
        }
        if (record === void 0 || record === null) {
          return;
        }
      }
      this.info.bytes_records += this.info.bytes;
      push(record);
    },
    // Return a tuple with the error and the casted value
    __cast: function(field) {
      const { columns, relax_column_count } = this.options;
      const isColumns = Array.isArray(columns);
      if (isColumns === true && relax_column_count && this.options.columns.length <= this.state.record.length) {
        return [void 0, void 0];
      }
      if (this.state.castField !== null) {
        try {
          const info2 = this.__infoField();
          return [void 0, this.state.castField.call(null, field, info2)];
        } catch (err) {
          return [err];
        }
      }
      if (this.__isFloat(field)) {
        return [void 0, parseFloat(field)];
      } else if (this.options.cast_date !== false) {
        const info2 = this.__infoField();
        return [void 0, this.options.cast_date.call(null, field, info2)];
      }
      return [void 0, field];
    },
    __compareBytes: function(sourceBuf, targetBuf, targetPos, firstByte) {
      if (sourceBuf[0] !== firstByte) return 0;
      const sourceLength = sourceBuf.length;
      for (let i = 1; i < sourceLength; i++) {
        if (sourceBuf[i] !== targetBuf[targetPos + i]) return 0;
      }
      return sourceLength;
    },
    // Helper to test if a character is trimable
    __isCharTrimable: function(buf, pos) {
      const { timchars, timcharFirstBytes } = this.state;
      const first = buf[pos];
      if (first === void 0 || timcharFirstBytes[first] === 0) return 0;
      loop1: for (let i = 0; i < timchars.length; i++) {
        const timchar = timchars[i];
        for (let j = 0; j < timchar.length; j++) {
          if (timchar[j] !== buf[pos + j]) continue loop1;
        }
        return timchar.length;
      }
      return 0;
    },
    __isDelimiter: function(buf, pos, chr) {
      const { delimiter, ignore_last_delimiters } = this.options;
      if (ignore_last_delimiters === true && this.state.record.length === this.options.columns.length - 1) {
        return 0;
      } else if (ignore_last_delimiters !== false && typeof ignore_last_delimiters === "number" && this.state.record.length === ignore_last_delimiters - 1) {
        return 0;
      }
      loop1: for (let i = 0; i < delimiter.length; i++) {
        const del = delimiter[i];
        if (del[0] === chr) {
          for (let j = 1; j < del.length; j++) {
            if (del[j] !== buf[pos + j]) continue loop1;
          }
          return del.length;
        }
      }
      return 0;
    },
    __isEscape: function(buf, pos, chr) {
      const { escape } = this.options;
      if (escape === null) return false;
      const l = escape.length;
      if (escape[0] === chr) {
        for (let i = 0; i < l; i++) {
          if (escape[i] !== buf[pos + i]) {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    __isFloat: function(value) {
      return value - parseFloat(value) + 1 >= 0;
    },
    // Keep it in case we implement the `cast_int` option
    // __isInt(value){
    //   // return Number.isInteger(parseInt(value))
    //   // return !isNaN( parseInt( obj ) );
    //   return /^(\-|\+)?[1-9][0-9]*$/.test(value)
    // }
    __isQuote: function(buf, pos) {
      const { quote } = this.options;
      if (quote === null) return false;
      const l = quote.length;
      for (let i = 0; i < l; i++) {
        if (quote[i] !== buf[pos + i]) {
          return false;
        }
      }
      return true;
    },
    __isRecordDelimiter: function(chr, buf, pos) {
      const { record_delimiter } = this.options;
      const recordDelimiterLength = record_delimiter.length;
      loop1: for (let i = 0; i < recordDelimiterLength; i++) {
        const rd = record_delimiter[i];
        const rdLength = rd.length;
        if (rd[0] !== chr) {
          continue;
        }
        for (let j = 1; j < rdLength; j++) {
          if (rd[j] !== buf[pos + j]) {
            continue loop1;
          }
        }
        return rd.length;
      }
      return 0;
    },
    __autoDiscoverRecordDelimiter: function(buf, pos) {
      const { encoding } = this.options;
      const rds = [
        // Important, the windows line ending must be before mac os 9
        Buffer2.from("\r\n", encoding),
        Buffer2.from("\n", encoding),
        Buffer2.from("\r", encoding)
      ];
      loop: for (let i = 0; i < rds.length; i++) {
        const l = rds[i].length;
        for (let j = 0; j < l; j++) {
          if (rds[i][j] !== buf[pos + j]) {
            continue loop;
          }
        }
        this.options.record_delimiter.push(rds[i]);
        this.state.recordDelimiterMaxLength = rds[i].length;
        return rds[i].length;
      }
      return 0;
    },
    __error: function(msg) {
      const { encoding, raw, skip_records_with_error } = this.options;
      const err = typeof msg === "string" ? new Error(msg) : msg;
      if (skip_records_with_error) {
        this.state.recordHasError = true;
        if (this.options.on_skip !== void 0) {
          try {
            this.options.on_skip(
              err,
              raw ? this.state.rawBuffer.toString(encoding) : void 0
            );
          } catch (err2) {
            return err2;
          }
        }
        return void 0;
      } else {
        return err;
      }
    },
    __infoDataSet: function() {
      return {
        ...this.info,
        columns: this.options.columns
      };
    },
    __infoRecord: function() {
      const { columns, raw, encoding } = this.options;
      return {
        ...this.__infoDataSet(),
        bytes_records: this.info.bytes,
        error: this.state.error,
        header: columns === true,
        index: this.state.record.length,
        raw: raw ? this.state.rawBuffer.toString(encoding) : void 0
      };
    },
    __infoField: function() {
      const { columns } = this.options;
      const isColumns = Array.isArray(columns);
      const bytes_records = this.info.bytes_records;
      return {
        ...this.__infoRecord(),
        bytes_records,
        column: isColumns === true ? columns.length > this.state.record.length ? columns[this.state.record.length].name : null : this.state.record.length,
        quoting: this.state.wasQuoting
      };
    }
  };
};
var parse = function(data, opts = {}) {
  if (typeof data === "string") {
    data = Buffer2.from(data);
  }
  const records = opts && opts.objname ? /* @__PURE__ */ Object.create(null) : [];
  const parser = transform(opts);
  const push = (record) => {
    if (parser.options.objname === void 0) records.push(record);
    else {
      records[record[0]] = record[1];
    }
  };
  const close = () => {
  };
  const error = parser.parse(data, true, push, close);
  if (error !== void 0) throw error;
  return records;
};

// build-deps/node_modules/csv-stringify/dist/esm/sync.js
var global$12 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
var lookup2 = [];
var revLookup2 = [];
var Arr2 = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
var inited2 = false;
function init2() {
  inited2 = true;
  var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup2[i] = code[i];
    revLookup2[code.charCodeAt(i)] = i;
  }
  revLookup2["-".charCodeAt(0)] = 62;
  revLookup2["_".charCodeAt(0)] = 63;
}
function toByteArray2(b64) {
  if (!inited2) {
    init2();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;
  if (len % 4 > 0) {
    throw new Error("Invalid string. Length must be a multiple of 4");
  }
  placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
  arr = new Arr2(len * 3 / 4 - placeHolders);
  l = placeHolders > 0 ? len - 4 : len;
  var L = 0;
  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = revLookup2[b64.charCodeAt(i)] << 18 | revLookup2[b64.charCodeAt(i + 1)] << 12 | revLookup2[b64.charCodeAt(i + 2)] << 6 | revLookup2[b64.charCodeAt(i + 3)];
    arr[L++] = tmp >> 16 & 255;
    arr[L++] = tmp >> 8 & 255;
    arr[L++] = tmp & 255;
  }
  if (placeHolders === 2) {
    tmp = revLookup2[b64.charCodeAt(i)] << 2 | revLookup2[b64.charCodeAt(i + 1)] >> 4;
    arr[L++] = tmp & 255;
  } else if (placeHolders === 1) {
    tmp = revLookup2[b64.charCodeAt(i)] << 10 | revLookup2[b64.charCodeAt(i + 1)] << 4 | revLookup2[b64.charCodeAt(i + 2)] >> 2;
    arr[L++] = tmp >> 8 & 255;
    arr[L++] = tmp & 255;
  }
  return arr;
}
function tripletToBase642(num) {
  return lookup2[num >> 18 & 63] + lookup2[num >> 12 & 63] + lookup2[num >> 6 & 63] + lookup2[num & 63];
}
function encodeChunk2(uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
    output.push(tripletToBase642(tmp));
  }
  return output.join("");
}
function fromByteArray2(uint8) {
  if (!inited2) {
    init2();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3;
  var output = "";
  var parts = [];
  var maxChunkLength = 16383;
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk2(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  }
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup2[tmp >> 2];
    output += lookup2[tmp << 4 & 63];
    output += "==";
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    output += lookup2[tmp >> 10];
    output += lookup2[tmp >> 4 & 63];
    output += lookup2[tmp << 2 & 63];
    output += "=";
  }
  parts.push(output);
  return parts.join("");
}
function read2(buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
  }
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
  }
  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write3(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);
  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
  }
  e = e << mLen | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
  }
  buffer[offset + i - d] |= s * 128;
}
var toString3 = {}.toString;
var isArray2 = Array.isArray || function(arr) {
  return toString3.call(arr) == "[object Array]";
};
var INSPECT_MAX_BYTES2 = 50;
Buffer3.TYPED_ARRAY_SUPPORT = global$12.TYPED_ARRAY_SUPPORT !== void 0 ? global$12.TYPED_ARRAY_SUPPORT : true;
kMaxLength2();
function kMaxLength2() {
  return Buffer3.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function createBuffer2(that, length) {
  if (kMaxLength2() < length) {
    throw new RangeError("Invalid typed array length");
  }
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    that = new Uint8Array(length);
    that.__proto__ = Buffer3.prototype;
  } else {
    if (that === null) {
      that = new Buffer3(length);
    }
    that.length = length;
  }
  return that;
}
function Buffer3(arg, encodingOrOffset, length) {
  if (!Buffer3.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer3)) {
    return new Buffer3(arg, encodingOrOffset, length);
  }
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string") {
      throw new Error(
        "If encoding is specified then the first argument must be a string"
      );
    }
    return allocUnsafe2(this, arg);
  }
  return from2(this, arg, encodingOrOffset, length);
}
Buffer3.poolSize = 8192;
Buffer3._augment = function(arr) {
  arr.__proto__ = Buffer3.prototype;
  return arr;
};
function from2(that, value, encodingOrOffset, length) {
  if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
    return fromArrayBuffer2(that, value, encodingOrOffset, length);
  }
  if (typeof value === "string") {
    return fromString2(that, value, encodingOrOffset);
  }
  return fromObject2(that, value);
}
Buffer3.from = function(value, encodingOrOffset, length) {
  return from2(null, value, encodingOrOffset, length);
};
if (Buffer3.TYPED_ARRAY_SUPPORT) {
  Buffer3.prototype.__proto__ = Uint8Array.prototype;
  Buffer3.__proto__ = Uint8Array;
  if (typeof Symbol !== "undefined" && Symbol.species && Buffer3[Symbol.species] === Buffer3) ;
}
function assertSize2(size) {
  if (typeof size !== "number") {
    throw new TypeError('"size" argument must be a number');
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative');
  }
}
function alloc2(that, size, fill3, encoding) {
  assertSize2(size);
  if (size <= 0) {
    return createBuffer2(that, size);
  }
  if (fill3 !== void 0) {
    return typeof encoding === "string" ? createBuffer2(that, size).fill(fill3, encoding) : createBuffer2(that, size).fill(fill3);
  }
  return createBuffer2(that, size);
}
Buffer3.alloc = function(size, fill3, encoding) {
  return alloc2(null, size, fill3, encoding);
};
function allocUnsafe2(that, size) {
  assertSize2(size);
  that = createBuffer2(that, size < 0 ? 0 : checked2(size) | 0);
  if (!Buffer3.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that;
}
Buffer3.allocUnsafe = function(size) {
  return allocUnsafe2(null, size);
};
Buffer3.allocUnsafeSlow = function(size) {
  return allocUnsafe2(null, size);
};
function fromString2(that, string, encoding) {
  if (typeof encoding !== "string" || encoding === "") {
    encoding = "utf8";
  }
  if (!Buffer3.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding');
  }
  var length = byteLength2(string, encoding) | 0;
  that = createBuffer2(that, length);
  var actual = that.write(string, encoding);
  if (actual !== length) {
    that = that.slice(0, actual);
  }
  return that;
}
function fromArrayLike2(that, array) {
  var length = array.length < 0 ? 0 : checked2(array.length) | 0;
  that = createBuffer2(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that;
}
function fromArrayBuffer2(that, array, byteOffset, length) {
  array.byteLength;
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError("'offset' is out of bounds");
  }
  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError("'length' is out of bounds");
  }
  if (byteOffset === void 0 && length === void 0) {
    array = new Uint8Array(array);
  } else if (length === void 0) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    that = array;
    that.__proto__ = Buffer3.prototype;
  } else {
    that = fromArrayLike2(that, array);
  }
  return that;
}
function fromObject2(that, obj) {
  if (internalIsBuffer2(obj)) {
    var len = checked2(obj.length) | 0;
    that = createBuffer2(that, len);
    if (that.length === 0) {
      return that;
    }
    obj.copy(that, 0, 0, len);
    return that;
  }
  if (obj) {
    if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
      if (typeof obj.length !== "number" || isnan2(obj.length)) {
        return createBuffer2(that, 0);
      }
      return fromArrayLike2(that, obj);
    }
    if (obj.type === "Buffer" && isArray2(obj.data)) {
      return fromArrayLike2(that, obj.data);
    }
  }
  throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
}
function checked2(length) {
  if (length >= kMaxLength2()) {
    throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength2().toString(16) + " bytes");
  }
  return length | 0;
}
Buffer3.isBuffer = isBuffer2;
function internalIsBuffer2(b) {
  return !!(b != null && b._isBuffer);
}
Buffer3.compare = function compare3(a, b) {
  if (!internalIsBuffer2(a) || !internalIsBuffer2(b)) {
    throw new TypeError("Arguments must be Buffers");
  }
  if (a === b) return 0;
  var x = a.length;
  var y = b.length;
  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
Buffer3.isEncoding = function isEncoding2(encoding) {
  switch (String(encoding).toLowerCase()) {
    case "hex":
    case "utf8":
    case "utf-8":
    case "ascii":
    case "latin1":
    case "binary":
    case "base64":
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return true;
    default:
      return false;
  }
};
Buffer3.concat = function concat2(list, length) {
  if (!isArray2(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }
  if (list.length === 0) {
    return Buffer3.alloc(0);
  }
  var i;
  if (length === void 0) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }
  var buffer = Buffer3.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer2(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};
function byteLength2(string, encoding) {
  if (internalIsBuffer2(string)) {
    return string.length;
  }
  if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength;
  }
  if (typeof string !== "string") {
    string = "" + string;
  }
  var len = string.length;
  if (len === 0) return 0;
  var loweredCase = false;
  for (; ; ) {
    switch (encoding) {
      case "ascii":
      case "latin1":
      case "binary":
        return len;
      case "utf8":
      case "utf-8":
      case void 0:
        return utf8ToBytes2(string).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return len * 2;
      case "hex":
        return len >>> 1;
      case "base64":
        return base64ToBytes2(string).length;
      default:
        if (loweredCase) return utf8ToBytes2(string).length;
        encoding = ("" + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer3.byteLength = byteLength2;
function slowToString2(encoding, start, end) {
  var loweredCase = false;
  if (start === void 0 || start < 0) {
    start = 0;
  }
  if (start > this.length) {
    return "";
  }
  if (end === void 0 || end > this.length) {
    end = this.length;
  }
  if (end <= 0) {
    return "";
  }
  end >>>= 0;
  start >>>= 0;
  if (end <= start) {
    return "";
  }
  if (!encoding) encoding = "utf8";
  while (true) {
    switch (encoding) {
      case "hex":
        return hexSlice2(this, start, end);
      case "utf8":
      case "utf-8":
        return utf8Slice2(this, start, end);
      case "ascii":
        return asciiSlice2(this, start, end);
      case "latin1":
      case "binary":
        return latin1Slice2(this, start, end);
      case "base64":
        return base64Slice2(this, start, end);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return utf16leSlice2(this, start, end);
      default:
        if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
        encoding = (encoding + "").toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer3.prototype._isBuffer = true;
function swap2(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}
Buffer3.prototype.swap16 = function swap162() {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 16-bits");
  }
  for (var i = 0; i < len; i += 2) {
    swap2(this, i, i + 1);
  }
  return this;
};
Buffer3.prototype.swap32 = function swap322() {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 32-bits");
  }
  for (var i = 0; i < len; i += 4) {
    swap2(this, i, i + 3);
    swap2(this, i + 1, i + 2);
  }
  return this;
};
Buffer3.prototype.swap64 = function swap642() {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 64-bits");
  }
  for (var i = 0; i < len; i += 8) {
    swap2(this, i, i + 7);
    swap2(this, i + 1, i + 6);
    swap2(this, i + 2, i + 5);
    swap2(this, i + 3, i + 4);
  }
  return this;
};
Buffer3.prototype.toString = function toString4() {
  var length = this.length | 0;
  if (length === 0) return "";
  if (arguments.length === 0) return utf8Slice2(this, 0, length);
  return slowToString2.apply(this, arguments);
};
Buffer3.prototype.equals = function equals2(b) {
  if (!internalIsBuffer2(b)) throw new TypeError("Argument must be a Buffer");
  if (this === b) return true;
  return Buffer3.compare(this, b) === 0;
};
Buffer3.prototype.inspect = function inspect2() {
  var str = "";
  var max = INSPECT_MAX_BYTES2;
  if (this.length > 0) {
    str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
    if (this.length > max) str += " ... ";
  }
  return "<Buffer " + str + ">";
};
Buffer3.prototype.compare = function compare4(target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer2(target)) {
    throw new TypeError("Argument must be a Buffer");
  }
  if (start === void 0) {
    start = 0;
  }
  if (end === void 0) {
    end = target ? target.length : 0;
  }
  if (thisStart === void 0) {
    thisStart = 0;
  }
  if (thisEnd === void 0) {
    thisEnd = this.length;
  }
  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError("out of range index");
  }
  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }
  if (thisStart >= thisEnd) {
    return -1;
  }
  if (start >= end) {
    return 1;
  }
  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);
  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
function bidirectionalIndexOf2(buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0) return -1;
  if (typeof byteOffset === "string") {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 2147483647) {
    byteOffset = 2147483647;
  } else if (byteOffset < -2147483648) {
    byteOffset = -2147483648;
  }
  byteOffset = +byteOffset;
  if (isNaN(byteOffset)) {
    byteOffset = dir ? 0 : buffer.length - 1;
  }
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1;
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1;
  }
  if (typeof val === "string") {
    val = Buffer3.from(val, encoding);
  }
  if (internalIsBuffer2(val)) {
    if (val.length === 0) {
      return -1;
    }
    return arrayIndexOf2(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === "number") {
    val = val & 255;
    if (Buffer3.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }
    return arrayIndexOf2(buffer, [val], byteOffset, encoding, dir);
  }
  throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf2(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;
  if (encoding !== void 0) {
    encoding = String(encoding).toLowerCase();
    if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }
  function read3(buf, i2) {
    if (indexSize === 1) {
      return buf[i2];
    } else {
      return buf.readUInt16BE(i2 * indexSize);
    }
  }
  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read3(arr, i) === read3(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read3(arr, i + j) !== read3(val, j)) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
  }
  return -1;
}
Buffer3.prototype.includes = function includes2(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer3.prototype.indexOf = function indexOf2(val, byteOffset, encoding) {
  return bidirectionalIndexOf2(this, val, byteOffset, encoding, true);
};
Buffer3.prototype.lastIndexOf = function lastIndexOf2(val, byteOffset, encoding) {
  return bidirectionalIndexOf2(this, val, byteOffset, encoding, false);
};
function hexWrite2(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }
  return i;
}
function utf8Write2(buf, string, offset, length) {
  return blitBuffer2(utf8ToBytes2(string, buf.length - offset), buf, offset, length);
}
function asciiWrite2(buf, string, offset, length) {
  return blitBuffer2(asciiToBytes2(string), buf, offset, length);
}
function latin1Write2(buf, string, offset, length) {
  return asciiWrite2(buf, string, offset, length);
}
function base64Write2(buf, string, offset, length) {
  return blitBuffer2(base64ToBytes2(string), buf, offset, length);
}
function ucs2Write2(buf, string, offset, length) {
  return blitBuffer2(utf16leToBytes2(string, buf.length - offset), buf, offset, length);
}
Buffer3.prototype.write = function write4(string, offset, length, encoding) {
  if (offset === void 0) {
    encoding = "utf8";
    length = this.length;
    offset = 0;
  } else if (length === void 0 && typeof offset === "string") {
    encoding = offset;
    length = this.length;
    offset = 0;
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === void 0) encoding = "utf8";
    } else {
      encoding = length;
      length = void 0;
    }
  } else {
    throw new Error(
      "Buffer.write(string, encoding, offset[, length]) is no longer supported"
    );
  }
  var remaining = this.length - offset;
  if (length === void 0 || length > remaining) length = remaining;
  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError("Attempt to write outside buffer bounds");
  }
  if (!encoding) encoding = "utf8";
  var loweredCase = false;
  for (; ; ) {
    switch (encoding) {
      case "hex":
        return hexWrite2(this, string, offset, length);
      case "utf8":
      case "utf-8":
        return utf8Write2(this, string, offset, length);
      case "ascii":
        return asciiWrite2(this, string, offset, length);
      case "latin1":
      case "binary":
        return latin1Write2(this, string, offset, length);
      case "base64":
        return base64Write2(this, string, offset, length);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return ucs2Write2(this, string, offset, length);
      default:
        if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
        encoding = ("" + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};
Buffer3.prototype.toJSON = function toJSON2() {
  return {
    type: "Buffer",
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};
function base64Slice2(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray2(buf);
  } else {
    return fromByteArray2(buf.slice(start, end));
  }
}
function utf8Slice2(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 192) === 128) {
            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
            if (tempCodePoint > 127) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
            if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
            if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
              codePoint = tempCodePoint;
            }
          }
      }
    }
    if (codePoint === null) {
      codePoint = 65533;
      bytesPerSequence = 1;
    } else if (codePoint > 65535) {
      codePoint -= 65536;
      res.push(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    res.push(codePoint);
    i += bytesPerSequence;
  }
  return decodeCodePointsArray2(res);
}
var MAX_ARGUMENTS_LENGTH2 = 4096;
function decodeCodePointsArray2(codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH2) {
    return String.fromCharCode.apply(String, codePoints);
  }
  var res = "";
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH2)
    );
  }
  return res;
}
function asciiSlice2(buf, start, end) {
  var ret = "";
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 127);
  }
  return ret;
}
function latin1Slice2(buf, start, end) {
  var ret = "";
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret;
}
function hexSlice2(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = "";
  for (var i = start; i < end; ++i) {
    out += toHex2(buf[i]);
  }
  return out;
}
function utf16leSlice2(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = "";
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res;
}
Buffer3.prototype.slice = function slice2(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === void 0 ? len : ~~end;
  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }
  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }
  if (end < start) end = start;
  var newBuf;
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer3.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer3(sliceLen, void 0);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }
  return newBuf;
};
function checkOffset2(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
  if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
}
Buffer3.prototype.readUIntLE = function readUIntLE2(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) checkOffset2(offset, byteLength3, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength3 && (mul *= 256)) {
    val += this[offset + i] * mul;
  }
  return val;
};
Buffer3.prototype.readUIntBE = function readUIntBE2(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) {
    checkOffset2(offset, byteLength3, this.length);
  }
  var val = this[offset + --byteLength3];
  var mul = 1;
  while (byteLength3 > 0 && (mul *= 256)) {
    val += this[offset + --byteLength3] * mul;
  }
  return val;
};
Buffer3.prototype.readUInt8 = function readUInt82(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 1, this.length);
  return this[offset];
};
Buffer3.prototype.readUInt16LE = function readUInt16LE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};
Buffer3.prototype.readUInt16BE = function readUInt16BE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};
Buffer3.prototype.readUInt32LE = function readUInt32LE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
};
Buffer3.prototype.readUInt32BE = function readUInt32BE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 4, this.length);
  return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer3.prototype.readIntLE = function readIntLE2(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) checkOffset2(offset, byteLength3, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength3 && (mul *= 256)) {
    val += this[offset + i] * mul;
  }
  mul *= 128;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
  return val;
};
Buffer3.prototype.readIntBE = function readIntBE2(offset, byteLength3, noAssert) {
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) checkOffset2(offset, byteLength3, this.length);
  var i = byteLength3;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 256)) {
    val += this[offset + --i] * mul;
  }
  mul *= 128;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
  return val;
};
Buffer3.prototype.readInt8 = function readInt82(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 1, this.length);
  if (!(this[offset] & 128)) return this[offset];
  return (255 - this[offset] + 1) * -1;
};
Buffer3.prototype.readInt16LE = function readInt16LE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer3.prototype.readInt16BE = function readInt16BE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer3.prototype.readInt32LE = function readInt32LE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer3.prototype.readInt32BE = function readInt32BE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer3.prototype.readFloatLE = function readFloatLE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 4, this.length);
  return read2(this, offset, true, 23, 4);
};
Buffer3.prototype.readFloatBE = function readFloatBE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 4, this.length);
  return read2(this, offset, false, 23, 4);
};
Buffer3.prototype.readDoubleLE = function readDoubleLE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 8, this.length);
  return read2(this, offset, true, 52, 8);
};
Buffer3.prototype.readDoubleBE = function readDoubleBE2(offset, noAssert) {
  if (!noAssert) checkOffset2(offset, 8, this.length);
  return read2(this, offset, false, 52, 8);
};
function checkInt2(buf, value, offset, ext, max, min) {
  if (!internalIsBuffer2(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError("Index out of range");
}
Buffer3.prototype.writeUIntLE = function writeUIntLE2(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
    checkInt2(this, value, offset, byteLength3, maxBytes, 0);
  }
  var mul = 1;
  var i = 0;
  this[offset] = value & 255;
  while (++i < byteLength3 && (mul *= 256)) {
    this[offset + i] = value / mul & 255;
  }
  return offset + byteLength3;
};
Buffer3.prototype.writeUIntBE = function writeUIntBE2(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength3 = byteLength3 | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
    checkInt2(this, value, offset, byteLength3, maxBytes, 0);
  }
  var i = byteLength3 - 1;
  var mul = 1;
  this[offset + i] = value & 255;
  while (--i >= 0 && (mul *= 256)) {
    this[offset + i] = value / mul & 255;
  }
  return offset + byteLength3;
};
Buffer3.prototype.writeUInt8 = function writeUInt82(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 1, 255, 0);
  if (!Buffer3.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = value & 255;
  return offset + 1;
};
function objectWriteUInt162(buf, value, offset, littleEndian) {
  if (value < 0) value = 65535 + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
  }
}
Buffer3.prototype.writeUInt16LE = function writeUInt16LE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 2, 65535, 0);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
  } else {
    objectWriteUInt162(this, value, offset, true);
  }
  return offset + 2;
};
Buffer3.prototype.writeUInt16BE = function writeUInt16BE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 2, 65535, 0);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
  } else {
    objectWriteUInt162(this, value, offset, false);
  }
  return offset + 2;
};
function objectWriteUInt322(buf, value, offset, littleEndian) {
  if (value < 0) value = 4294967295 + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
  }
}
Buffer3.prototype.writeUInt32LE = function writeUInt32LE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 4, 4294967295, 0);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 255;
  } else {
    objectWriteUInt322(this, value, offset, true);
  }
  return offset + 4;
};
Buffer3.prototype.writeUInt32BE = function writeUInt32BE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 4, 4294967295, 0);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
  } else {
    objectWriteUInt322(this, value, offset, false);
  }
  return offset + 4;
};
Buffer3.prototype.writeIntLE = function writeIntLE2(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength3 - 1);
    checkInt2(this, value, offset, byteLength3, limit - 1, -limit);
  }
  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 255;
  while (++i < byteLength3 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength3;
};
Buffer3.prototype.writeIntBE = function writeIntBE2(value, offset, byteLength3, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength3 - 1);
    checkInt2(this, value, offset, byteLength3, limit - 1, -limit);
  }
  var i = byteLength3 - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 255;
  while (--i >= 0 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength3;
};
Buffer3.prototype.writeInt8 = function writeInt82(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 1, 127, -128);
  if (!Buffer3.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 255 + value + 1;
  this[offset] = value & 255;
  return offset + 1;
};
Buffer3.prototype.writeInt16LE = function writeInt16LE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 2, 32767, -32768);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
  } else {
    objectWriteUInt162(this, value, offset, true);
  }
  return offset + 2;
};
Buffer3.prototype.writeInt16BE = function writeInt16BE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 2, 32767, -32768);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
  } else {
    objectWriteUInt162(this, value, offset, false);
  }
  return offset + 2;
};
Buffer3.prototype.writeInt32LE = function writeInt32LE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 4, 2147483647, -2147483648);
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
  } else {
    objectWriteUInt322(this, value, offset, true);
  }
  return offset + 4;
};
Buffer3.prototype.writeInt32BE = function writeInt32BE2(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt2(this, value, offset, 4, 2147483647, -2147483648);
  if (value < 0) value = 4294967295 + value + 1;
  if (Buffer3.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
  } else {
    objectWriteUInt322(this, value, offset, false);
  }
  return offset + 4;
};
function checkIEEE7542(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError("Index out of range");
  if (offset < 0) throw new RangeError("Index out of range");
}
function writeFloat2(buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE7542(buf, value, offset, 4);
  }
  write3(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}
Buffer3.prototype.writeFloatLE = function writeFloatLE2(value, offset, noAssert) {
  return writeFloat2(this, value, offset, true, noAssert);
};
Buffer3.prototype.writeFloatBE = function writeFloatBE2(value, offset, noAssert) {
  return writeFloat2(this, value, offset, false, noAssert);
};
function writeDouble2(buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE7542(buf, value, offset, 8);
  }
  write3(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}
Buffer3.prototype.writeDoubleLE = function writeDoubleLE2(value, offset, noAssert) {
  return writeDouble2(this, value, offset, true, noAssert);
};
Buffer3.prototype.writeDoubleBE = function writeDoubleBE2(value, offset, noAssert) {
  return writeDouble2(this, value, offset, false, noAssert);
};
Buffer3.prototype.copy = function copy2(target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;
  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0;
  if (targetStart < 0) {
    throw new RangeError("targetStart out of bounds");
  }
  if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
  if (end < 0) throw new RangeError("sourceEnd out of bounds");
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }
  var len = end - start;
  var i;
  if (this === target && start < targetStart && targetStart < end) {
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1e3 || !Buffer3.TYPED_ARRAY_SUPPORT) {
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }
  return len;
};
Buffer3.prototype.fill = function fill2(val, start, end, encoding) {
  if (typeof val === "string") {
    if (typeof start === "string") {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === "string") {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== void 0 && typeof encoding !== "string") {
      throw new TypeError("encoding must be a string");
    }
    if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
      throw new TypeError("Unknown encoding: " + encoding);
    }
  } else if (typeof val === "number") {
    val = val & 255;
  }
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError("Out of range index");
  }
  if (end <= start) {
    return this;
  }
  start = start >>> 0;
  end = end === void 0 ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;
  if (typeof val === "number") {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer2(val) ? val : utf8ToBytes2(new Buffer3(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }
  return this;
};
var INVALID_BASE64_RE2 = /[^+\/0-9A-Za-z-_]/g;
function base64clean2(str) {
  str = stringtrim2(str).replace(INVALID_BASE64_RE2, "");
  if (str.length < 2) return "";
  while (str.length % 4 !== 0) {
    str = str + "=";
  }
  return str;
}
function stringtrim2(str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, "");
}
function toHex2(n) {
  if (n < 16) return "0" + n.toString(16);
  return n.toString(16);
}
function utf8ToBytes2(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];
  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1) bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(239, 191, 189);
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0) break;
      bytes.push(
        codePoint >> 6 | 192,
        codePoint & 63 | 128
      );
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0) break;
      bytes.push(
        codePoint >> 12 | 224,
        codePoint >> 6 & 63 | 128,
        codePoint & 63 | 128
      );
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0) break;
      bytes.push(
        codePoint >> 18 | 240,
        codePoint >> 12 & 63 | 128,
        codePoint >> 6 & 63 | 128,
        codePoint & 63 | 128
      );
    } else {
      throw new Error("Invalid code point");
    }
  }
  return bytes;
}
function asciiToBytes2(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    byteArray.push(str.charCodeAt(i) & 255);
  }
  return byteArray;
}
function utf16leToBytes2(str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes2(str) {
  return toByteArray2(base64clean2(str));
}
function blitBuffer2(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }
  return i;
}
function isnan2(val) {
  return val !== val;
}
function isBuffer2(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer2(obj) || isSlowBuffer2(obj));
}
function isFastBuffer2(obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function isSlowBuffer2(obj) {
  return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer2(obj.slice(0, 0));
}
var charCodeOfDot = ".".charCodeAt(0);
var reEscapeChar = /\\(\\)?/g;
var rePropName = RegExp(
  // Match anything that isn't a dot or bracket.
  `[^.[\\]]+|\\[(?:([^"'][^[]*)|(["'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2)\\]|(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))`,
  "g"
);
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;
var getTag = function(value) {
  return Object.prototype.toString.call(value);
};
var isSymbol = function(value) {
  const type = typeof value;
  return type === "symbol" || type === "object" && value && getTag(value) === "[object Symbol]";
};
var isKey = function(value, object) {
  if (Array.isArray(value)) {
    return false;
  }
  const type = typeof value;
  if (type === "number" || type === "symbol" || type === "boolean" || !value || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
};
var stringToPath = function(string) {
  const result = [];
  if (string.charCodeAt(0) === charCodeOfDot) {
    result.push("");
  }
  string.replace(rePropName, function(match, expression, quote, subString) {
    let key = match;
    if (quote) {
      key = subString.replace(reEscapeChar, "$1");
    } else if (expression) {
      key = expression.trim();
    }
    result.push(key);
  });
  return result;
};
var castPath = function(value, object) {
  if (Array.isArray(value)) {
    return value;
  } else {
    return isKey(value, object) ? [value] : stringToPath(value);
  }
};
var toKey = function(value) {
  if (typeof value === "string" || isSymbol(value)) return value;
  const result = `${value}`;
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
};
var get = function(object, path) {
  path = castPath(path, object);
  let index = 0;
  const length = path.length;
  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return index && index === length ? object : void 0;
};
var is_object2 = function(obj) {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
};
var normalize_columns = function(columns) {
  if (columns === void 0 || columns === null) {
    return [void 0, void 0];
  }
  if (typeof columns !== "object") {
    return [Error('Invalid option "columns": expect an array or an object')];
  }
  if (!Array.isArray(columns)) {
    const newcolumns = [];
    for (const k in columns) {
      newcolumns.push({
        key: k,
        header: columns[k]
      });
    }
    columns = newcolumns;
  } else {
    const newcolumns = [];
    for (const column of columns) {
      if (typeof column === "string") {
        newcolumns.push({
          key: column,
          header: column
        });
      } else if (typeof column === "object" && column !== null && !Array.isArray(column)) {
        if (!column.key) {
          return [
            Error('Invalid column definition: property "key" is required')
          ];
        }
        if (column.header === void 0) {
          column.header = column.key;
        }
        newcolumns.push(column);
      } else {
        return [
          Error("Invalid column definition: expect a string or an object")
        ];
      }
    }
    columns = newcolumns;
  }
  return [void 0, columns];
};
var CsvError2 = class _CsvError extends Error {
  constructor(code, message, ...contexts) {
    if (Array.isArray(message)) message = message.join(" ");
    super(message);
    if (Error.captureStackTrace !== void 0) {
      Error.captureStackTrace(this, _CsvError);
    }
    this.code = code;
    for (const context of contexts) {
      for (const key in context) {
        const value = context[key];
        this[key] = isBuffer2(value) ? value.toString() : value == null ? value : JSON.parse(JSON.stringify(value));
      }
    }
  }
};
var underscore2 = function(str) {
  return str.replace(/([A-Z])/g, function(_, match) {
    return "_" + match.toLowerCase();
  });
};
var normalize_options2 = function(opts) {
  const options = {};
  for (const opt in opts) {
    options[underscore2(opt)] = opts[opt];
  }
  if (options.bom === void 0 || options.bom === null || options.bom === false) {
    options.bom = false;
  } else if (options.bom !== true) {
    return [
      new CsvError2("CSV_OPTION_BOOLEAN_INVALID_TYPE", [
        "option `bom` is optional and must be a boolean value,",
        `got ${JSON.stringify(options.bom)}`
      ])
    ];
  }
  if (options.delimiter === void 0 || options.delimiter === null) {
    options.delimiter = ",";
  } else if (isBuffer2(options.delimiter)) {
    options.delimiter = options.delimiter.toString();
  } else if (typeof options.delimiter !== "string") {
    return [
      new CsvError2("CSV_OPTION_DELIMITER_INVALID_TYPE", [
        "option `delimiter` must be a buffer or a string,",
        `got ${JSON.stringify(options.delimiter)}`
      ])
    ];
  }
  if (options.quote === void 0 || options.quote === null) {
    options.quote = '"';
  } else if (options.quote === true) {
    options.quote = '"';
  } else if (options.quote === false) {
    options.quote = "";
  } else if (isBuffer2(options.quote)) {
    options.quote = options.quote.toString();
  } else if (typeof options.quote !== "string") {
    return [
      new CsvError2("CSV_OPTION_QUOTE_INVALID_TYPE", [
        "option `quote` must be a boolean, a buffer or a string,",
        `got ${JSON.stringify(options.quote)}`
      ])
    ];
  }
  if (options.quoted === void 0 || options.quoted === null) {
    options.quoted = false;
  }
  if (options.escape_formulas === void 0 || options.escape_formulas === null) {
    options.escape_formulas = false;
  } else if (typeof options.escape_formulas !== "boolean") {
    return [
      new CsvError2("CSV_OPTION_ESCAPE_FORMULAS_INVALID_TYPE", [
        "option `escape_formulas` must be a boolean,",
        `got ${JSON.stringify(options.escape_formulas)}`
      ])
    ];
  }
  if (options.quoted_empty === void 0 || options.quoted_empty === null) {
    options.quoted_empty = void 0;
  }
  if (options.quoted_match === void 0 || options.quoted_match === null || options.quoted_match === false) {
    options.quoted_match = null;
  } else if (!Array.isArray(options.quoted_match)) {
    options.quoted_match = [options.quoted_match];
  }
  if (options.quoted_match) {
    for (const quoted_match of options.quoted_match) {
      const isString = typeof quoted_match === "string";
      const isRegExp = quoted_match instanceof RegExp;
      if (!isString && !isRegExp) {
        return [
          new CsvError2("CSV_OPTION_QUOTED_MATCH", [
            "option `quoted_match` must be a string or a regex,",
            `got ${JSON.stringify(options.quoted_match)}`
          ])
        ];
      }
    }
  }
  if (options.quoted_string === void 0 || options.quoted_string === null) {
    options.quoted_string = false;
  }
  if (options.eof === void 0 || options.eof === null) {
    options.eof = true;
  }
  if (options.escape === void 0 || options.escape === null) {
    options.escape = '"';
  } else if (isBuffer2(options.escape)) {
    options.escape = options.escape.toString();
  } else if (typeof options.escape !== "string") {
    return [
      Error(
        `Invalid Option: escape must be a buffer or a string, got ${JSON.stringify(options.escape)}`
      )
    ];
  }
  if (options.escape.length > 1) {
    return [
      Error(
        `Invalid Option: escape must be one character, got ${options.escape.length} characters`
      )
    ];
  }
  if (options.header === void 0 || options.header === null || options.header === false) {
    options.header = false;
  } else if (options.header !== true) {
    throw new CsvError2(
      "CSV_INVALID_OPTION_HEADER",
      [
        "option `header` is expected to be a boolean,",
        `got ${JSON.stringify(options.header)}`
      ],
      options
    );
  }
  if (options.header_as_comment === void 0 || options.header_as_comment === null || options.header_as_comment === false) {
    options.header_as_comment = false;
  } else if (options.header_as_comment === true) {
    options.header_as_comment = "#";
  } else if (isBuffer2(options.header_as_comment)) {
    options.header_as_comment = options.header_as_comment.toString();
  } else if (typeof options.header_as_comment !== "string") {
    throw new CsvError2(
      "CSV_INVALID_OPTION_HEADER_AS_COMMENT",
      [
        "option `header_as_comment` must be a boolean, a string or a buffer,",
        `got ${JSON.stringify(options.header_as_comment)}`
      ],
      options
    );
  }
  const [errColumns, columns] = normalize_columns(options.columns);
  if (errColumns !== void 0) return [errColumns];
  options.columns = columns;
  if (options.quoted === void 0 || options.quoted === null) {
    options.quoted = false;
  }
  if (options.cast === void 0 || options.cast === null) {
    options.cast = {};
  }
  if (options.cast.bigint === void 0 || options.cast.bigint === null) {
    options.cast.bigint = (value) => "" + value;
  }
  if (options.cast.boolean === void 0 || options.cast.boolean === null) {
    options.cast.boolean = (value) => value ? "1" : "";
  }
  if (options.cast.date === void 0 || options.cast.date === null) {
    options.cast.date = (value) => "" + value.getTime();
  }
  if (options.cast.number === void 0 || options.cast.number === null) {
    options.cast.number = (value) => "" + value;
  }
  if (options.cast.object === void 0 || options.cast.object === null) {
    options.cast.object = (value) => JSON.stringify(value);
  }
  if (options.cast.string === void 0 || options.cast.string === null) {
    options.cast.string = function(value) {
      return value;
    };
  }
  if (options.on_record !== void 0 && typeof options.on_record !== "function") {
    return [Error(`Invalid Option: "on_record" must be a function.`)];
  }
  if (options.quote_record_delimiter === void 0 || options.quote_record_delimiter === null) {
    options.quote_record_delimiter = !options.record_delimiter;
  } else if (typeof options.quote_record_delimiter !== "boolean") {
    return [
      new CsvError2("CSV_OPTION_QUOTE_RECORD_DELIMITER_INVALID_TYPE", [
        "option `quote_record_delimiter` must be a boolean,",
        `got ${JSON.stringify(options.quote_record_delimiter)}`
      ])
    ];
  }
  if (options.record_delimiter === void 0 || options.record_delimiter === null) {
    options.record_delimiter = "\n";
  } else if (isBuffer2(options.record_delimiter)) {
    options.record_delimiter = options.record_delimiter.toString();
  } else if (typeof options.record_delimiter !== "string") {
    return [
      Error(
        `Invalid Option: record_delimiter must be a buffer or a string, got ${JSON.stringify(options.record_delimiter)}`
      )
    ];
  }
  switch (options.record_delimiter) {
    case "unix":
      options.record_delimiter = "\n";
      break;
    case "mac":
      options.record_delimiter = "\r";
      break;
    case "windows":
      options.record_delimiter = "\r\n";
      break;
    case "ascii":
      options.record_delimiter = "";
      break;
    case "unicode":
      options.record_delimiter = "\u2028";
      break;
  }
  return [void 0, options];
};
var bom_utf8 = Buffer3.from([239, 187, 191]);
var emits_separator = function(value, separators) {
  return separators.some(
    (separator) => separator.length !== 0 && (value.indexOf(separator) !== -1 || separator.length > 1 && (value + separator).indexOf(separator) < value.length)
  );
};
var matches_quoted_match = function(value, quoted_match) {
  if (!quoted_match) return false;
  return quoted_match.some(
    (pattern) => typeof pattern === "string" ? value.indexOf(pattern) !== -1 : value.search(pattern) !== -1
  );
};
var stringifier = function(options, state, info) {
  return {
    options,
    state,
    info,
    __transform: function(chunk, push) {
      if (!Array.isArray(chunk) && typeof chunk !== "object") {
        return Error(
          `Invalid Record: expect an array or an object, got ${JSON.stringify(chunk)}`
        );
      }
      if (this.info.records === 0) {
        if (Array.isArray(chunk)) {
          if (this.options.header === true && this.options.columns === void 0) {
            return Error(
              "Undiscoverable Columns: header option requires column option or object records"
            );
          }
        } else if (this.options.columns === void 0) {
          const [err2, columns] = normalize_columns(Object.keys(chunk));
          if (err2) return;
          this.options.columns = columns;
        }
      }
      if (this.info.records === 0) {
        this.bom(push);
        const err2 = this.headers(push);
        if (err2) return err2;
      }
      try {
        if (this.options.on_record) {
          this.options.on_record(chunk, this.info.records);
        }
      } catch (err2) {
        return err2;
      }
      let err, chunk_string;
      if (this.options.eof) {
        [err, chunk_string] = this.stringify(chunk);
        if (err) return err;
        if (chunk_string === void 0) {
          return;
        } else {
          chunk_string = chunk_string + this.options.record_delimiter;
        }
      } else {
        [err, chunk_string] = this.stringify(chunk);
        if (err) return err;
        if (chunk_string === void 0) {
          return;
        } else {
          if (this.options.header || this.info.records) {
            chunk_string = this.options.record_delimiter + chunk_string;
          }
        }
      }
      this.info.records++;
      push(chunk_string);
    },
    stringify: function(chunk, chunkIsHeader = false) {
      if (typeof chunk !== "object") {
        return [void 0, chunk];
      }
      const { columns } = this.options;
      const record = [];
      if (Array.isArray(chunk)) {
        const length = columns ? Math.min(chunk.length, columns.length) : chunk.length;
        for (let i = 0; i < length; i++) {
          const field = chunk[i];
          const [err, value] = this.__cast(field, {
            index: i,
            column: i,
            records: this.info.records,
            header: chunkIsHeader
          });
          if (err) return [err];
          record[i] = [value, field];
        }
      } else {
        for (let i = 0; i < columns.length; i++) {
          const field = get(chunk, columns[i].key);
          const [err, value] = this.__cast(field, {
            index: i,
            column: columns[i].key,
            records: this.info.records,
            header: chunkIsHeader
          });
          if (err) return [err];
          record[i] = [value, field];
        }
      }
      let csvrecord = "";
      for (let i = 0; i < record.length; i++) {
        let options2, err;
        let [value, field] = record[i];
        if (typeof value === "string") {
          options2 = this.options;
        } else if (is_object2(value)) {
          options2 = { ...value };
          value = options2.value;
          delete options2.value;
          if (typeof value !== "string" && value !== void 0 && value !== null) {
            if (err)
              return [
                Error(
                  `Invalid Casting Value: returned value must return a string, null or undefined, got ${JSON.stringify(value)}`
                )
              ];
          }
          options2 = { ...this.options, ...options2 };
          [err, options2] = normalize_options2(options2);
          if (err !== void 0) {
            return [err];
          }
        } else if (value === void 0 || value === null) {
          options2 = this.options;
        } else {
          return [
            Error(
              `Invalid Casting Value: returned value must return a string, an object, null or undefined, got ${JSON.stringify(value)}`
            )
          ];
        }
        const {
          delimiter,
          escape,
          quote,
          quoted,
          quoted_empty,
          quoted_string,
          quoted_match,
          record_delimiter,
          quote_record_delimiter,
          escape_formulas
        } = options2;
        if ("" === value && "" === field) {
          const quotedMatch = matches_quoted_match(value, quoted_match);
          const shouldQuote = quotedMatch || true === quoted_empty || true === quoted_string && false !== quoted_empty;
          if (shouldQuote === true) {
            value = quote + value + quote;
          }
          csvrecord += value;
        } else if (value) {
          if (typeof value !== "string") {
            return [
              Error(
                `Formatter must return a string, null or undefined, got ${JSON.stringify(value)}`
              )
            ];
          }
          const containsdelimiter = emits_separator(value, [delimiter]);
          const containsQuote = quote !== "" && value.indexOf(quote) >= 0;
          const containsEscape = value.indexOf(escape) >= 0 && escape !== quote;
          const containsRecordDelimiter = emits_separator(value, [
            record_delimiter,
            ...quote_record_delimiter === false ? [] : ["\n", "\r"]
          ]);
          const quotedString = quoted_string && typeof field === "string";
          const quotedMatch = matches_quoted_match(value, quoted_match);
          if (escape_formulas) {
            switch (value[0]) {
              case "-":
                if (typeof field === "number" || typeof field === "bigint") {
                  break;
                }
                value = `'${value}`;
                break;
              case "=":
              case "+":
              case "@":
              case "	":
              case "\r":
              case "\uFF1D":
              // Unicode '='
              case "\uFF0B":
              // Unicode '+'
              case "\uFF0D":
              // Unicode '-'
              case "\uFF20":
                value = `'${value}`;
                break;
            }
          }
          const shouldQuote = containsQuote === true || containsdelimiter || containsRecordDelimiter || quoted || quotedString || quotedMatch;
          if (shouldQuote === true && containsEscape === true) {
            value = value.replaceAll(escape, () => escape + escape);
          }
          if (containsQuote === true) {
            value = value.replaceAll(quote, () => escape + quote);
          }
          if (shouldQuote === true) {
            value = quote + value + quote;
          }
          csvrecord += value;
        } else if (quoted_empty === true || field === "" && quoted_string === true && quoted_empty !== false) {
          csvrecord += quote + quote;
        }
        if (i !== record.length - 1) {
          csvrecord += delimiter;
        }
      }
      return [void 0, csvrecord];
    },
    bom: function(push) {
      if (this.options.bom !== true) {
        return;
      }
      push(bom_utf8);
    },
    headers: function(push) {
      if (this.options.header === false) {
        return;
      }
      if (this.options.columns === void 0) {
        return;
      }
      let err;
      let headers = this.options.columns.map((column) => column.header);
      if (this.options.eof) {
        [err, headers] = this.stringify(headers, true);
        headers += this.options.record_delimiter;
      } else {
        [err, headers] = this.stringify(headers, true);
      }
      if (err) return err;
      if (this.options.header_as_comment) {
        headers = this.options.header_as_comment + " " + headers;
      }
      push(headers);
    },
    __cast: function(value, context) {
      const type = typeof value;
      try {
        if (type === "string") {
          return [void 0, this.options.cast.string(value, context)];
        } else if (type === "bigint") {
          return [void 0, this.options.cast.bigint(value, context)];
        } else if (type === "number") {
          return [void 0, this.options.cast.number(value, context)];
        } else if (type === "boolean") {
          return [void 0, this.options.cast.boolean(value, context)];
        } else if (value instanceof Date) {
          return [void 0, this.options.cast.date(value, context)];
        } else if (type === "object" && value !== null) {
          return [void 0, this.options.cast.object(value, context)];
        } else if (value === null && this.options.cast.null !== void 0) {
          return [void 0, this.options.cast.null(value, context)];
        } else if (value === void 0 && this.options.cast.undefined !== void 0) {
          return [void 0, this.options.cast.undefined(value, context)];
        } else {
          return [void 0, value];
        }
      } catch (err) {
        return [err];
      }
    }
  };
};
var stringify = function(records, opts = {}) {
  const data = [];
  const [err, options] = normalize_options2(opts);
  if (err !== void 0) throw err;
  const state = {
    stop: false
  };
  const info = {
    records: 0
  };
  const api = stringifier(options, state, info);
  for (const record of records) {
    const err2 = api.__transform(record, function(record2) {
      data.push(record2);
    });
    if (err2 !== void 0) throw err2;
  }
  if (data.length === 0) {
    api.bom((d) => {
      data.push(d);
    });
    const err2 = api.headers((headers) => {
      data.push(headers);
    });
    if (err2 !== void 0) throw err2;
  }
  return data.join("");
};

// worker-source.ts
var import_fxp = __toESM(require_fxp());
function parse2(text, options) {
  return parse(text, { columns: options?.skipFirstRow ?? false, bom: true });
}
function stringify2(rows, options) {
  return stringify(rows, { columns: options.columns, header: true, record_delimiter: "\r\n" });
}
var CSV_SOURCE = "https://api.mobidata-bw.de/geoserver/MobiData-BW/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MobiData-BW%3Aroadworks&maxFeatures=20000&outputFormat=csv";
var GEOJSON_SOURCE = "https://api.mobidata-bw.de/datasets/traffic/roadworks/roadworks_geojson.json";
var DATEX_SOURCE = "https://api.mobidata-bw.de/datasets/traffic/roadworks/roadworks_svzbw.datex2.xml";
var FILTER_LANDKREIS_SIGMARINGEN = true;
var COUNTY_NAME = "Landkreis Sigmaringen";
var COUNTY_GEOJSON_SOURCE = "https://raw.githubusercontent.com/googie0815/umap-icons/main/landkreis-sigmaringen.geojson";
var COLOR_CONSTRUCTION = "#EEAD2D";
var COLOR_ROAD_CLOSED = "#E6391D";
var ICON_ZOOM_FACTOR = 1.08;
var ICON_VERSION = "6";
var ENDPOINT_MATCH_TOLERANCE_M = 40;
var AOA_MATCH_TOLERANCE_M = 30;
var HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300"
};
var DATEX_CACHE_MS = 5 * 60 * 1e3;
var COUNTY_CACHE_MS = 24 * 60 * 60 * 1e3;
var COMBINED_ICON_CACHE_TTL = 60 * 60 * 1e3;
var datexCache = null;
var countyCache = null;
var combinedIconCache = /* @__PURE__ */ new Map();
function asArray(value) {
  if (value === void 0 || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
function xmlText(value) {
  if (value === void 0 || value === null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.length ? xmlText(value[0]) : "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object" && value["#text"] !== void 0) {
    return String(
      value["#text"]
    );
  }
  return "";
}
function findFirst(node, key) {
  if (node === void 0 || node === null) {
    return void 0;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirst(
        item,
        key
      );
      if (found !== void 0) {
        return found;
      }
    }
    return void 0;
  }
  if (typeof node !== "object") {
    return void 0;
  }
  if (Object.prototype.hasOwnProperty.call(
    node,
    key
  )) {
    return node[key];
  }
  for (const [
    childKey,
    child
  ] of Object.entries(node)) {
    if (childKey.startsWith("@_")) {
      continue;
    }
    const found = findFirst(
      child,
      key
    );
    if (found !== void 0) {
      return found;
    }
  }
  return void 0;
}
function numberValue(value) {
  const text = xmlText(value);
  if (!text) {
    return null;
  }
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}
function normalizeKeyText(value) {
  return (value || "").toLocaleLowerCase(
    "de-DE"
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function typeDe(value) {
  return {
    CONSTRUCTION: "Baustelle",
    ROAD_CLOSED: "Vollsperrung"
  }[value ?? ""] ?? value ?? "";
}
function directionDe(value) {
  return {
    ONE_DIRECTION: "eine Richtung",
    BOTH_DIRECTIONS: "beide Richtungen"
  }[value ?? ""] ?? value ?? "";
}
function lineColor(type) {
  return type === "ROAD_CLOSED" ? COLOR_ROAD_CLOSED : COLOR_CONSTRUCTION;
}
function dateParts(value) {
  if (!value) {
    return {
      date: "",
      datetime: ""
    };
  }
  const d = new Date(value);
  if (Number.isNaN(
    d.getTime()
  )) {
    return {
      date: "",
      datetime: ""
    };
  }
  const parts = new Intl.DateTimeFormat(
    "de-DE",
    {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }
  ).formatToParts(d);
  const p = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }
  const date = `${p.day}.${p.month}.${p.year}`;
  return {
    date,
    datetime: `${date} ${p.hour}:${p.minute}`
  };
}
function dateOnly(value) {
  if (!value) {
    return "";
  }
  const d = new Date(value);
  if (Number.isNaN(
    d.getTime()
  )) {
    return "";
  }
  return new Intl.DateTimeFormat(
    "de-DE",
    {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    }
  ).format(d);
}
function dateTimeShort(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(d);
}
function timeOnly(value) {
  if (!value) return "";
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}
function findAll(node, key) {
  const result = [];
  if (node === void 0 || node === null) return result;
  if (Array.isArray(node)) {
    for (const item of node) result.push(...findAll(item, key));
    return result;
  }
  if (typeof node !== "object") return result;
  if (Object.prototype.hasOwnProperty.call(node, key)) {
    const value = node[key];
    if (Array.isArray(value)) result.push(...value);
    else result.push(value);
  }
  for (const [childKey, child] of Object.entries(node)) {
    if (childKey === key || childKey.startsWith("@_")) continue;
    result.push(...findAll(child, key));
  }
  return result;
}
function germanDays(values) {
  const labels = {
    monday: "Mo",
    tuesday: "Di",
    wednesday: "Mi",
    thursday: "Do",
    friday: "Fr",
    saturday: "Sa",
    sunday: "So"
  };
  const order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const days = [...new Set(values.map((v) => v.toLocaleLowerCase().trim()).filter(Boolean))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (days.length === 7 && order.every((d, i) => days[i] === d)) return "t\xE4glich";
  if (days.length === 5 && order.slice(0, 5).every((d, i) => days[i] === d)) return "Mo\u2013Fr";
  if (days.length === 2 && days[0] === "saturday" && days[1] === "sunday") return "Sa\u2013So";
  return days.map((d) => labels[d] ?? d).join(", ");
}
function formatPeriodRange(startRaw, endRaw) {
  const startDate = dateOnly(startRaw);
  const endDate = dateOnly(endRaw);
  const startDT = dateTimeShort(startRaw);
  const endDT = dateTimeShort(endRaw);
  if (startDate && endDate && startDate === endDate) {
    const st = startDT.split(", ").pop() ?? "";
    const et = endDT.split(", ").pop() ?? "";
    if (st && et) return `${startDate} ${st}\u2013${et} Uhr`;
  }
  if (startDate && endDate) return `${startDT} \u2013 ${endDT} Uhr`;
  return startDT || endDT || "";
}
function validityDetails(validity) {
  if (!validity) return "";
  const specification = findFirst(validity, "validityTimeSpecification");
  if (!specification) return "";
  const details = [];
  for (const period of asArray(specification?.validPeriod)) {
    const parts = [];
    const startRaw = xmlText(findFirst(period, "startOfPeriod"));
    const endRaw = xmlText(findFirst(period, "endOfPeriod"));
    const range = formatPeriodRange(startRaw, endRaw);
    if (range) parts.push(range);
    const timeTexts = [];
    for (const recurring of findAll(period, "recurringTimePeriodOfDay")) {
      const start = timeOnly(xmlText(findFirst(recurring, "startTimeOfPeriod")));
      const end = timeOnly(xmlText(findFirst(recurring, "endTimeOfPeriod")));
      if (start && end) timeTexts.push(`${start}\u2013${end} Uhr`);
    }
    const days = germanDays(
      findAll(period, "applicableDay").map(xmlText).filter(Boolean)
    );
    const uniqueTimes = [...new Set(timeTexts)];
    if (uniqueTimes.length) parts.push(`${days || "t\xE4glich"} ${uniqueTimes.join(", ")}`);
    else if (days) parts.push(days);
    const combined = parts.filter(Boolean).join(", ");
    if (combined) details.push(combined);
  }
  for (const exception of asArray(specification?.exceptionPeriod)) {
    const range = formatPeriodRange(
      xmlText(findFirst(exception, "startOfPeriod")),
      xmlText(findFirst(exception, "endOfPeriod"))
    );
    if (range) details.push(`Ausnahme: ${range}`);
  }
  return [...new Set(details)].join("; ");
}
function prettifyRoadText(value) {
  if (!value) {
    return "";
  }
  return value.replace(
    /([A-Za-zÄÖÜäöüß])([ABKL]\d{1,4})\b/g,
    "$1 $2"
  ).replace(
    /\s{2,}/g,
    " "
  ).trim();
}
function translatedWorkFallback(subjectType, workType) {
  const subject = subjectType.trim().toLocaleLowerCase();
  const work = workType.trim().toLocaleLowerCase();
  if (subject === "bridge" && work === "repairwork") return "Br\xFCckeninstandsetzung";
  if (subject === "bridge") return "Br\xFCckenarbeiten";
  if (subject === "buriedcables") return "Leitungsarbeiten";
  if (subject === "levelcrossing") return "Arbeiten am Bahn\xFCbergang";
  if (subject === "tunnel") return "Tunnelarbeiten";
  if (subject === "junction") return "Arbeiten am Knotenpunkt";
  if (subject === "road" && work === "repairwork") return "Instandsetzungsarbeiten an der Stra\xDFe";
  if (work === "repairwork") return "Instandsetzungsarbeiten";
  if (work === "constructionwork") return "Bauarbeiten";
  if (work === "maintenancework") return "Unterhaltungsarbeiten";
  if (subject === "road") return "Stra\xDFenarbeiten";
  return "";
}
function resolveMeasure(recordMeasure, overallMeasure, record, kind) {
  const direct = (recordMeasure || overallMeasure || "").trim();
  if (direct && !/^sonstiges$/i.test(direct)) return direct;
  const subjectType = xmlText(findFirst(record, "subjectTypeOfWorks"));
  const workType = kind === "MaintenanceWorks" ? xmlText(findFirst(record, "roadMaintenanceType")) : xmlText(findFirst(record, "constructionWorkType"));
  return translatedWorkFallback(subjectType, workType) || direct;
}
function extractPolygons(node) {
  if (!node) {
    return [];
  }
  if (node.type === "FeatureCollection") {
    const result = [];
    for (const feature of node.features ?? []) {
      result.push(
        ...extractPolygons(
          feature
        )
      );
    }
    return result;
  }
  if (node.type === "Feature") {
    return extractPolygons(
      node.geometry
    );
  }
  if (node.type === "Polygon" && Array.isArray(
    node.coordinates
  )) {
    return [
      node.coordinates
    ];
  }
  if (node.type === "MultiPolygon" && Array.isArray(
    node.coordinates
  )) {
    return node.coordinates;
  }
  if (node.type === "GeometryCollection") {
    const result = [];
    for (const geometry of node.geometries ?? []) {
      result.push(
        ...extractPolygons(
          geometry
        )
      );
    }
    return result;
  }
  return [];
}
function calculateCountyBBox(polygons) {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const point of ring) {
        if (!Array.isArray(point) || point.length < 2) {
          continue;
        }
        const lon = Number(point[0]);
        const lat = Number(point[1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
          continue;
        }
        west = Math.min(
          west,
          lon
        );
        east = Math.max(
          east,
          lon
        );
        south = Math.min(
          south,
          lat
        );
        north = Math.max(
          north,
          lat
        );
      }
    }
  }
  if (!Number.isFinite(west) || !Number.isFinite(south) || !Number.isFinite(east) || !Number.isFinite(north)) {
    throw new Error(
      "Landkreis-Grenze enth\xE4lt keine g\xFCltigen Koordinaten."
    );
  }
  return {
    west,
    south,
    east,
    north
  };
}
async function getCountyBoundary() {
  const now = Date.now();
  if (countyCache && countyCache.expires > now) {
    return countyCache.boundary;
  }
  const response = await fetch(
    COUNTY_GEOJSON_SOURCE,
    {
      headers: {
        "user-agent": "uMap-roadworks-proxy/1.0",
        "accept": "application/geo+json, application/json"
      }
    }
  );
  if (!response.ok) {
    throw new Error(
      `Landkreis-Grenze GitHub: HTTP ${response.status}`
    );
  }
  const geojson = await response.json();
  const polygons = extractPolygons(
    geojson
  );
  if (polygons.length === 0) {
    throw new Error(
      "landkreis-sigmaringen.geojson enth\xE4lt kein Polygon."
    );
  }
  const boundary = {
    polygons,
    bbox: calculateCountyBBox(
      polygons
    )
  };
  countyCache = {
    expires: now + COUNTY_CACHE_MS,
    boundary
  };
  return boundary;
}
function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const crosses = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (crosses) {
      inside = !inside;
    }
  }
  return inside;
}
function pointInPolygon(point, polygon) {
  if (polygon.length === 0) {
    return false;
  }
  if (!pointInRing(
    point,
    polygon[0]
  )) {
    return false;
  }
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(
      point,
      polygon[i]
    )) {
      return false;
    }
  }
  return true;
}
function pointInCounty(point, boundary) {
  for (const polygon of boundary.polygons) {
    if (pointInPolygon(
      point,
      polygon
    )) {
      return true;
    }
  }
  return false;
}
function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function pointOnSegment(a, b, p) {
  const epsilon = 1e-10;
  if (Math.abs(
    orientation(
      a,
      b,
      p
    )
  ) > epsilon) {
    return false;
  }
  return p[0] >= Math.min(
    a[0],
    b[0]
  ) - epsilon && p[0] <= Math.max(
    a[0],
    b[0]
  ) + epsilon && p[1] >= Math.min(
    a[1],
    b[1]
  ) - epsilon && p[1] <= Math.max(
    a[1],
    b[1]
  ) + epsilon;
}
function segmentsIntersect(a, b, c, d) {
  const epsilon = 1e-10;
  const o1 = orientation(
    a,
    b,
    c
  );
  const o2 = orientation(
    a,
    b,
    d
  );
  const o3 = orientation(
    c,
    d,
    a
  );
  const o4 = orientation(
    c,
    d,
    b
  );
  if ((o1 > epsilon && o2 < -epsilon || o1 < -epsilon && o2 > epsilon) && (o3 > epsilon && o4 < -epsilon || o3 < -epsilon && o4 > epsilon)) {
    return true;
  }
  if (Math.abs(o1) <= epsilon && pointOnSegment(
    a,
    b,
    c
  )) {
    return true;
  }
  if (Math.abs(o2) <= epsilon && pointOnSegment(
    a,
    b,
    d
  )) {
    return true;
  }
  if (Math.abs(o3) <= epsilon && pointOnSegment(
    c,
    d,
    a
  )) {
    return true;
  }
  if (Math.abs(o4) <= epsilon && pointOnSegment(
    c,
    d,
    b
  )) {
    return true;
  }
  return false;
}
function lineBBox(line) {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const point of line) {
    west = Math.min(
      west,
      point[0]
    );
    east = Math.max(
      east,
      point[0]
    );
    south = Math.min(
      south,
      point[1]
    );
    north = Math.max(
      north,
      point[1]
    );
  }
  return {
    west,
    south,
    east,
    north
  };
}
function bboxIntersects(a, b) {
  return !(a.east < b.west || a.west > b.east || a.north < b.south || a.south > b.north);
}
function lineIntersectsCounty(line, boundary) {
  if (line.length === 0) {
    return false;
  }
  if (!bboxIntersects(
    lineBBox(line),
    boundary.bbox
  )) {
    return false;
  }
  for (const point of line) {
    if (pointInCounty(
      point,
      boundary
    )) {
      return true;
    }
  }
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    for (const polygon of boundary.polygons) {
      for (const ring of polygon) {
        for (let j = 0; j < ring.length; j++) {
          const c = ring[j];
          const d = ring[(j + 1) % ring.length];
          if (segmentsIntersect(
            a,
            b,
            c,
            d
          )) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
function distanceMeters(a, b) {
  const earthRadius = 6371e3;
  const toRad = (degrees) => degrees * Math.PI / 180;
  const lat1 = toRad(
    a[1]
  );
  const lat2 = toRad(
    b[1]
  );
  const deltaLat = toRad(
    b[1] - a[1]
  );
  const deltaLon = toRad(
    b[0] - a[0]
  );
  const h = Math.sin(
    deltaLat / 2
  ) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(
    deltaLon / 2
  ) ** 2;
  return earthRadius * 2 * Math.atan2(
    Math.sqrt(h),
    Math.sqrt(
      1 - h
    )
  );
}
function enrichProperties(properties = {}) {
  const start = dateParts(
    properties.starttime
  );
  const end = dateParts(
    properties.endtime
  );
  return {
    ...properties,
    type_de: typeDe(
      properties.type
    ),
    direction_de: directionDe(
      properties.direction
    ),
    startdate: start.date,
    enddate: end.date,
    startdatetime: start.datetime,
    enddatetime: end.datetime
  };
}
function endpoints(geometry) {
  if (!geometry) {
    return null;
  }
  if (geometry.type === "LineString" && Array.isArray(
    geometry.coordinates
  ) && geometry.coordinates.length >= 2) {
    const line = geometry.coordinates;
    return [
      line[0],
      line[line.length - 1]
    ];
  }
  if (geometry.type === "MultiLineString" && Array.isArray(
    geometry.coordinates
  )) {
    const lines = geometry.coordinates.filter(
      (line) => Array.isArray(line) && line.length > 0
    );
    if (!lines.length) {
      return null;
    }
    const first = lines[0];
    const last = lines[lines.length - 1];
    return [
      first[0],
      last[last.length - 1]
    ];
  }
  return null;
}
function iconPath(type) {
  return type === "ROAD_CLOSED" ? "/icons/road-closed.svg" : "/icons/construction.svg";
}
function buildIconUrl(origin, type) {
  return `${origin}${iconPath(type)}?v=${ICON_VERSION}`;
}
function endpointFeature(original, pointCoordinate, position, origin) {
  const props = enrichProperties(
    original.properties
  );
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: pointCoordinate
    },
    properties: {
      ...props,
      name: `${props.type_de || "Baustelle"} \u2013 ${position === "start" ? "Anfang" : "Ende"}`,
      _umap_options: {
        iconUrl: buildIconUrl(
          origin,
          props.type
        ),
        iconClass: "Raw"
      }
    }
  };
}
async function geoJsonResponse(req) {
  const upstream = await fetch(
    GEOJSON_SOURCE,
    {
      headers: {
        "user-agent": "uMap-roadworks-proxy/1.0"
      }
    }
  );
  if (!upstream.ok) {
    throw new Error(
      `MobiData GeoJSON: ${upstream.status}`
    );
  }
  const data = await upstream.json();
  const origin = new URL(
    req.url
  ).origin;
  const features = [];
  for (const feature of data.features ?? []) {
    features.push({
      ...feature,
      properties: enrichProperties(
        feature.properties
      )
    });
    const ends = endpoints(
      feature.geometry
    );
    if (!ends) {
      continue;
    }
    features.push(
      endpointFeature(
        feature,
        ends[0],
        "start",
        origin
      )
    );
    if (ends[0][0] !== ends[1][0] || ends[0][1] !== ends[1][1]) {
      features.push(
        endpointFeature(
          feature,
          ends[1],
          "end",
          origin
        )
      );
    }
  }
  return new Response(
    JSON.stringify(
      {
        type: "FeatureCollection",
        features
      }
    ),
    {
      headers: {
        ...HEADERS,
        "content-type": "application/geo+json; charset=utf-8"
      }
    }
  );
}
async function csvResponse() {
  const upstream = await fetch(
    CSV_SOURCE,
    {
      headers: {
        "user-agent": "uMap-roadworks-proxy/1.0"
      }
    }
  );
  if (!upstream.ok) {
    throw new Error(
      `MobiData CSV: ${upstream.status}`
    );
  }
  const text = await upstream.text();
  const rows = parse2(
    text,
    {
      skipFirstRow: true
    }
  );
  const enriched = rows.map(
    (row) => enrichProperties(
      row
    )
  );
  if (enriched.length === 0) {
    return new Response(
      "",
      {
        headers: {
          ...HEADERS,
          "content-type": "text/csv; charset=utf-8"
        }
      }
    );
  }
  return new Response(
    stringify2(
      enriched,
      {
        columns: Object.keys(
          enriched[0]
        )
      }
    ),
    {
      headers: {
        ...HEADERS,
        "content-type": "text/csv; charset=utf-8"
      }
    }
  );
}
function commentsByType(node) {
  const result = {};
  for (const item of asArray(
    node?.generalPublicComment
  )) {
    const comment = xmlText(
      findFirst(
        item?.comment,
        "value"
      )
    );
    const commentType = xmlText(
      findFirst(
        item?.commentExtension,
        "commentType2"
      )
    );
    if (!comment) {
      continue;
    }
    const key = commentType || "comment";
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(
      comment
    );
  }
  return result;
}
function firstComment(comments, key) {
  return comments[key]?.[0] ?? "";
}
function coordinatesFromPosList(value) {
  const text = xmlText(value).trim();
  if (!text) {
    return [];
  }
  const values = text.split(/\s+/).map(Number).filter(
    Number.isFinite
  );
  const result = [];
  for (let i = 0; i + 1 < values.length; i += 2) {
    const latitude = values[i];
    const longitude = values[i + 1];
    result.push(
      [
        longitude,
        latitude
      ]
    );
  }
  return result;
}
function readAoaPoint(point) {
  if (!point) {
    return {
      corridor: "",
      corridorDisplay: "",
      distance: null,
      display: ""
    };
  }
  const fromReferent = findFirst(
    point,
    "fromReferent"
  );
  const towardsReferent = findFirst(
    point,
    "towardsReferent"
  );
  const fromId = xmlText(
    findFirst(
      fromReferent,
      "referentIdentifier"
    )
  );
  const towardsId = xmlText(
    findFirst(
      towardsReferent,
      "referentIdentifier"
    )
  );
  const distance = numberValue(
    findFirst(
      point,
      "distanceAlong"
    )
  );
  const corridor = `${fromId}${towardsId}`;
  const corridorDisplay = [fromId, towardsId].filter(Boolean).join(" \u2192 ");
  return {
    corridor,
    corridorDisplay,
    distance,
    display: corridorDisplay ? distance !== null ? `${corridorDisplay} / ${Math.round(distance)} m` : corridorDisplay : ""
  };
}
function formatLength(value) {
  return value === null ? "" : `${Math.round(value)} m`;
}
function formatWidth(value) {
  return value === null ? "" : `${value.toFixed(2).replace(
    ".",
    ","
  )} m`;
}
function formatSpeed(value) {
  return value === null ? "" : `${Math.round(value)} km/h`;
}
function formatWeight(value) {
  if (value === null) return "";
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
  return `${text} t`;
}
function groupMinimum(phases, selector) {
  const values = phases.map(selector).filter((value) => value !== null && Number.isFinite(value));
  return values.length ? Math.min(...values) : null;
}
function groupValidityDetails(phases) {
  return [...new Set(phases.map((phase) => phase.validityDetails).filter(Boolean))].join("; ");
}
function latestVersionTime(phases) {
  let latestRaw = "";
  let latestTime = -Infinity;
  for (const phase of phases) {
    const raw = phase.versionTimeRaw;
    const time = new Date(raw).getTime();
    if (raw && !Number.isNaN(time) && time > latestTime) {
      latestRaw = raw;
      latestTime = time;
    }
  }
  return latestRaw ? `${dateTimeShort(latestRaw)} Uhr` : "";
}
function recordType(record) {
  return xmlText(
    record?.["@_type"] ?? record?.["@_xsi:type"]
  );
}
function recordId(record) {
  return xmlText(
    record?.["@_id"]
  );
}
function recordIsExpired(record, now) {
  const endRaw = xmlText(
    findFirst(
      record?.validity,
      "overallEndTime"
    )
  );
  if (!endRaw) {
    return false;
  }
  const endTime = new Date(
    endRaw
  ).getTime();
  return !Number.isNaN(
    endTime
  ) && endTime < now;
}
function sameCoordinate(a, b) {
  const tolerance = 1e-5;
  return Math.abs(
    a[0] - b[0]
  ) <= tolerance && Math.abs(
    a[1] - b[1]
  ) <= tolerance;
}
function aoaPointMatches(a, b) {
  if (!a.corridor || !b.corridor || a.corridor !== b.corridor) {
    return false;
  }
  if (a.distance === null || b.distance === null) {
    return false;
  }
  return Math.abs(
    a.distance - b.distance
  ) <= AOA_MATCH_TOLERANCE_M;
}
function sameAoaSection(a, b) {
  const direct = aoaPointMatches(
    a.fromAoa,
    b.fromAoa
  ) && aoaPointMatches(
    a.toAoa,
    b.toAoa
  );
  const reverse = aoaPointMatches(
    a.fromAoa,
    b.toAoa
  ) && aoaPointMatches(
    a.toAoa,
    b.fromAoa
  );
  return direct || reverse;
}
function oppositeAoaSection(a, b) {
  return aoaPointMatches(
    a.fromAoa,
    b.toAoa
  ) && aoaPointMatches(
    a.toAoa,
    b.fromAoa
  );
}
function endpointRelation(a, b) {
  if (a.lineCoordinates.length < 2 || b.lineCoordinates.length < 2) {
    return null;
  }
  const aStart = a.lineCoordinates[0];
  const aEnd = a.lineCoordinates[a.lineCoordinates.length - 1];
  const bStart = b.lineCoordinates[0];
  const bEnd = b.lineCoordinates[b.lineCoordinates.length - 1];
  const directStart = distanceMeters(
    aStart,
    bStart
  );
  const directEnd = distanceMeters(
    aEnd,
    bEnd
  );
  if (directStart <= ENDPOINT_MATCH_TOLERANCE_M && directEnd <= ENDPOINT_MATCH_TOLERANCE_M) {
    return "same";
  }
  const oppositeStart = distanceMeters(
    aStart,
    bEnd
  );
  const oppositeEnd = distanceMeters(
    aEnd,
    bStart
  );
  if (oppositeStart <= ENDPOINT_MATCH_TOLERANCE_M && oppositeEnd <= ENDPOINT_MATCH_TOLERANCE_M) {
    return "opposite";
  }
  return null;
}
function samePhysicalSection(a, b) {
  if (sameAoaSection(
    a,
    b
  )) {
    return true;
  }
  return endpointRelation(
    a,
    b
  ) !== null;
}
function phasesAreOpposite(a, b) {
  if (oppositeAoaSection(
    a,
    b
  )) {
    return true;
  }
  return endpointRelation(
    a,
    b
  ) === "opposite";
}
function hasOppositeDirection(phases) {
  if (phases.length < 2) {
    return false;
  }
  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      if (phasesAreOpposite(
        phases[i],
        phases[j]
      )) {
        return true;
      }
    }
  }
  return false;
}
function keyNumber(value, digits = 2) {
  return value === null ? "" : value.toFixed(
    digits
  );
}
function phaseBaseKey(phase) {
  return [
    normalizeKeyText(
      phase.situationId
    ),
    normalizeKeyText(
      phase.roadNumber
    ),
    normalizeKeyText(
      phase.phaseName
    ),
    normalizeKeyText(
      phase.measure
    ),
    phase.type,
    keyNumber(
      phase.width,
      2
    ),
    keyNumber(
      phase.lanesRestricted,
      0
    ),
    keyNumber(
      phase.lanesOriginal,
      0
    ),
    keyNumber(
      phase.speed,
      0
    ),
    phase.validFrom,
    phase.validUntil
  ].join("|");
}
function groupDatexPhases(phases) {
  const buckets = /* @__PURE__ */ new Map();
  for (const phase of phases) {
    const key = phaseBaseKey(
      phase
    );
    if (!buckets.has(
      key
    )) {
      buckets.set(
        key,
        []
      );
    }
    const groups = buckets.get(
      key
    );
    let matchingGroup = null;
    for (const group of groups) {
      const matches = group.some(
        (existingPhase) => samePhysicalSection(
          existingPhase,
          phase
        )
      );
      if (matches) {
        matchingGroup = group;
        break;
      }
    }
    if (matchingGroup) {
      matchingGroup.push(
        phase
      );
    } else {
      groups.push(
        [
          phase
        ]
      );
    }
  }
  const result = [];
  for (const groups of buckets.values()) {
    result.push(
      ...groups
    );
  }
  return result;
}
function representativePhase(phases) {
  let best = phases[0];
  for (const phase of phases) {
    if (phase.lineCoordinates.length > best.lineCoordinates.length) {
      best = phase;
    }
  }
  return best;
}
function displayDirection(phases) {
  if (hasOppositeDirection(
    phases
  )) {
    return "beide Richtungen";
  }
  const direction = prettifyRoadText(
    phases[0].direction
  );
  if (direction) {
    return direction;
  }
  return "";
}
function mergedAoaRange(phases) {
  const points = [];
  for (const phase of phases) {
    if (phase.fromAoa.corridor) {
      points.push(
        phase.fromAoa
      );
    }
    if (phase.toAoa.corridor) {
      points.push(
        phase.toAoa
      );
    }
  }
  if (points.length === 0) {
    return "";
  }
  const corridors = [
    ...new Set(
      points.map(
        (point) => point.corridor
      ).filter(Boolean)
    )
  ];
  if (corridors.length === 1) {
    const distances = points.map(
      (point) => point.distance
    ).filter(
      (value) => value !== null
    );
    const corridorDisplay = points.find(
      (point) => point.corridor === corridors[0] && point.corridorDisplay
    )?.corridorDisplay || corridors[0];
    if (distances.length === 0) {
      return corridorDisplay;
    }
    const minimum = Math.round(
      Math.min(
        ...distances
      )
    );
    const maximum = Math.round(
      Math.max(
        ...distances
      )
    );
    if (minimum === maximum) {
      return `${corridorDisplay} / ${minimum} m`;
    }
    return `${corridorDisplay} / ${minimum}\u2013${maximum} m`;
  }
  const displays = [
    ...new Set(
      points.map(
        (point) => point.display
      ).filter(Boolean)
    )
  ];
  return displays.join(
    " \u2194 "
  );
}
function singleDirectionAoa(phase) {
  const from3 = phase.fromAoa;
  const to = phase.toAoa;
  if (from3.corridor && to.corridor && from3.corridor === to.corridor && from3.distance !== null && to.distance !== null) {
    return `${from3.corridorDisplay || from3.corridor} / ${Math.round(from3.distance)} \u2192 ${Math.round(to.distance)} m`;
  }
  if (from3.display && to.display) {
    return `${from3.display} \u2192 ${to.display}`;
  }
  return from3.display || to.display || "";
}
function displayAoa(phases) {
  if (hasOppositeDirection(
    phases
  )) {
    return mergedAoaRange(
      phases
    );
  }
  return singleDirectionAoa(
    phases[0]
  );
}
function popupTitle(phase) {
  let title = phase.overallName || phase.phaseName || `${phase.roadNumber} Baustelle`;
  const measure = phase.measure.trim();
  if (measure && title.toLocaleLowerCase(
    "de-DE"
  ).endsWith(
    measure.toLocaleLowerCase(
      "de-DE"
    )
  )) {
    title = title.slice(
      0,
      title.length - measure.length
    ).trim();
  }
  return prettifyRoadText(
    title
  );
}
function popupLine(label, value) {
  if (!value) {
    return "";
  }
  return `**${label}:** ${value}`;
}
function popupDescription(phases) {
  const phase = phases[0];
  const lanes = phase.lanesRestricted !== null && phase.lanesOriginal !== null ? `${Math.round(phase.lanesRestricted)} von ${Math.round(phase.lanesOriginal)}` : "";
  const height = groupMinimum(phases, (item) => item.height);
  const maxVehicleWeight = groupMinimum(phases, (item) => item.maxVehicleWeight);
  const timeDetails = groupValidityDetails(phases);
  const lastChanged = latestVersionTime(phases);
  const lines = [];
  if (phase.phaseName) {
    lines.push(`**${phase.phaseName}**`);
    lines.push("");
  }
  lines.push(popupLine("Ma\xDFnahme", phase.measure));
  lines.push(popupLine("Art der Ma\xDFnahme", typeDe(phase.type)));
  lines.push(popupLine("Richtung", displayDirection(phases)));
  lines.push(popupLine("L\xE4nge", formatLength(phase.length)));
  lines.push(popupLine("Durchfahrtsbreite", formatWidth(phase.width)));
  lines.push(popupLine("Durchfahrtsh\xF6he", formatWidth(height)));
  lines.push(popupLine("Max. Fahrzeuggewicht", formatWeight(maxVehicleWeight)));
  lines.push(popupLine("Spursperrung", lanes));
  lines.push(popupLine("H\xF6chstgeschwindigkeit", formatSpeed(phase.speed)));
  const aoa = displayAoa(phases);
  if (aoa) {
    lines.push("");
    lines.push("### GROSSRAUM- UND SCHWERTRANSPORTE");
    lines.push("");
    lines.push(popupLine("AoA/Station", aoa));
  }
  lines.push("");
  lines.push(popupLine("G\xFCltig ab", phase.validFrom));
  lines.push(popupLine("G\xFCltig bis", phase.validUntil));
  if (timeDetails) {
    lines.push(
      popupLine(
        phase.type === "ROAD_CLOSED" ? "Sperrzeiten" : "G\xFCltigkeitszeiten",
        timeDetails
      )
    );
  }
  if (lastChanged) {
    lines.push("");
    lines.push(popupLine("Letzte \xC4nderung", lastChanged));
  }
  const cleaned = [];
  for (const line of lines) {
    if (line === "" && (cleaned.length === 0 || cleaned[cleaned.length - 1] === "")) continue;
    cleaned.push(line);
  }
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === "") cleaned.pop();
  return cleaned.join("\n");
}
function datexProperties(phases) {
  const phase = phases[0];
  const lanes = phase.lanesRestricted !== null && phase.lanesOriginal !== null ? `${Math.round(phase.lanesRestricted)} von ${Math.round(phase.lanesOriginal)}` : "";
  const height = groupMinimum(phases, (item) => item.height);
  const maxVehicleWeight = groupMinimum(phases, (item) => item.maxVehicleWeight);
  const timeDetails = groupValidityDetails(phases);
  const lastChanged = latestVersionTime(phases);
  return {
    name: popupTitle(phase),
    description: popupDescription(phases),
    bezeichnung: phase.phaseName,
    massnahme: phase.measure,
    strasse: phase.roadNumber,
    richtung: displayDirection(phases),
    laenge: formatLength(phase.length),
    durchfahrtsbreite: formatWidth(phase.width),
    durchfahrtshoehe: formatWidth(height),
    max_fahrzeuggewicht: formatWeight(maxVehicleWeight),
    spursperrung: lanes,
    hoechstgeschwindigkeit: formatSpeed(phase.speed),
    aoa_station: displayAoa(phases),
    aoa_von: phase.fromAoa.display,
    aoa_nach: phase.toAoa.display,
    gueltig_ab: phase.validFrom,
    gueltig_bis: phase.validUntil,
    zeitliche_gueltigkeit: timeDetails,
    sperrzeiten: phase.type === "ROAD_CLOSED" ? timeDetails : "",
    gueltigkeitszeiten: phase.type !== "ROAD_CLOSED" ? timeDetails : "",
    letzte_aenderung: lastChanged,
    art: typeDe(phase.type)
  };
}
function datexEndpointFeature(properties, pointCoordinate, origin, type) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: pointCoordinate
    },
    properties: {
      ...properties,
      _umap_options: {
        iconUrl: buildIconUrl(
          origin,
          type
        ),
        iconClass: "Raw"
      }
    }
  };
}
async function buildDatexGeoJson(origin) {
  let countyBoundary = null;
  if (FILTER_LANDKREIS_SIGMARINGEN) {
    countyBoundary = await getCountyBoundary();
  }
  const upstream = await fetch(
    DATEX_SOURCE,
    {
      headers: {
        "user-agent": "uMap-roadworks-proxy/1.0"
      }
    }
  );
  if (!upstream.ok) {
    throw new Error(
      `MobiData DATEX II: ${upstream.status}`
    );
  }
  const xml = await upstream.text();
  const parser = new import_fxp.XMLParser(
    {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true,
      trimValues: true,
      parseTagValue: false,
      parseAttributeValue: false
    }
  );
  const parsed = parser.parse(
    xml
  );
  const situations = asArray(
    parsed?.d2LogicalModel?.payloadPublication?.situation
  );
  const now = Date.now();
  const allPhases = [];
  for (const situation of situations) {
    const situationId = xmlText(
      situation?.["@_id"]
    );
    const records = asArray(
      situation?.situationRecord
    );
    const closedRecordIds = /* @__PURE__ */ new Set();
    for (const record of records) {
      if (recordType(
        record
      ) !== "RoadOrCarriagewayOrLaneManagement") {
        continue;
      }
      const managementType = xmlText(
        findFirst(
          record,
          "roadOrCarriagewayOrLaneManagementType"
        )
      );
      if (managementType !== "roadClosed") {
        continue;
      }
      const managedCause = findFirst(
        record,
        "managedCause"
      );
      const targetId = xmlText(
        managedCause?.["@_id"]
      );
      if (targetId) {
        closedRecordIds.add(
          targetId
        );
      }
      const managementId = recordId(
        record
      );
      if (managementId.toLocaleLowerCase().endsWith(
        "-sperrung"
      )) {
        closedRecordIds.add(
          managementId.slice(
            0,
            -"-sperrung".length
          )
        );
      }
    }
    const overallSituation = findFirst(
      situation?.situationExtension,
      "overallSituation"
    );
    const overallComments = commentsByType(
      overallSituation ?? {}
    );
    const overallName = firstComment(
      overallComments,
      "roadworksName"
    );
    const overallMeasure = firstComment(
      overallComments,
      "roadworksType"
    );
    const overallStartRaw = xmlText(
      findFirst(
        overallSituation,
        "overallStartTime"
      )
    );
    const overallEndRaw = xmlText(
      findFirst(
        overallSituation,
        "overallEndTime"
      )
    );
    for (const record of records) {
      const kind = recordType(
        record
      );
      if (kind !== "MaintenanceWorks" && kind !== "ConstructionWorks") {
        continue;
      }
      if (recordIsExpired(
        record,
        now
      )) {
        continue;
      }
      const currentRecordId = recordId(
        record
      );
      const comments = commentsByType(
        record
      );
      const phaseName = firstComment(
        comments,
        "roadworksName"
      );
      const measure = resolveMeasure(
        firstComment(
          comments,
          "roadworksType"
        ),
        overallMeasure,
        record,
        kind
      );
      const lineCoordinates = coordinatesFromPosList(
        findFirst(
          record,
          "posList"
        )
      );
      if (lineCoordinates.length < 2) {
        continue;
      }
      const roadNumber = xmlText(
        findFirst(
          record,
          "roadNumber"
        )
      );
      const roadName = findFirst(
        record,
        "roadName"
      );
      const direction = xmlText(
        findFirst(
          roadName,
          "value"
        )
      );
      const length = numberValue(
        findFirst(
          record,
          "lengthAffected"
        )
      );
      const width = numberValue(
        findFirst(
          record?.impact,
          "residualRoadWidth"
        )
      );
      const height = numberValue(
        findFirst(
          record?.impact,
          "residualHeight"
        )
      );
      const maxVehicleWeight = numberValue(
        findFirst(
          record?.impact,
          "maxVehicleWeight"
        )
      );
      const lanesRestricted = numberValue(
        findFirst(
          record?.impact,
          "numberOfLanesRestricted"
        )
      );
      const lanesOriginal = numberValue(
        findFirst(
          record?.impact,
          "originalNumberOfLanes"
        )
      );
      const speed = numberValue(
        findFirst(
          record,
          "mainSpeedLimit"
        )
      );
      const fromAoa = readAoaPoint(
        findFirst(
          record,
          "fromPoint"
        )
      );
      const toAoa = readAoaPoint(
        findFirst(
          record,
          "toPoint"
        )
      );
      const recordStartRaw = xmlText(
        findFirst(
          record?.validity,
          "overallStartTime"
        )
      );
      const recordEndRaw = xmlText(
        findFirst(
          record?.validity,
          "overallEndTime"
        )
      );
      const validFrom = dateOnly(
        overallStartRaw || recordStartRaw
      );
      const validUntil = dateOnly(
        overallEndRaw || recordEndRaw
      );
      const detailedValidity = validityDetails(
        record?.validity
      );
      const versionTimeRaw = xmlText(
        findFirst(
          record,
          "situationRecordVersionTime"
        )
      );
      const isClosed = closedRecordIds.has(
        currentRecordId
      ) || /vollsperrung/i.test(
        phaseName
      ) || /vollsperrung/i.test(
        measure
      );
      allPhases.push({
        situationId,
        recordId: currentRecordId,
        type: isClosed ? "ROAD_CLOSED" : "CONSTRUCTION",
        lineCoordinates,
        roadNumber,
        phaseName,
        overallName,
        measure,
        direction,
        length,
        width,
        height,
        maxVehicleWeight,
        lanesRestricted,
        lanesOriginal,
        speed,
        fromAoa,
        toAoa,
        validFrom,
        validUntil,
        validityDetails: detailedValidity,
        versionTimeRaw
      });
    }
  }
  let filteredOut = 0;
  const phases = !FILTER_LANDKREIS_SIGMARINGEN ? allPhases : allPhases.filter(
    (phase) => {
      const inside = lineIntersectsCounty(
        phase.lineCoordinates,
        countyBoundary
      );
      if (!inside) {
        filteredOut++;
      }
      return inside;
    }
  );
  const groups = groupDatexPhases(
    phases
  );
  const features = [];
  let mergedGroups = 0;
  let mergedRecords = 0;
  for (const groupedPhases of groups) {
    const phase = representativePhase(
      groupedPhases
    );
    if (groupedPhases.length > 1) {
      mergedRecords += groupedPhases.length - 1;
    }
    if (hasOppositeDirection(
      groupedPhases
    )) {
      mergedGroups++;
    }
    const properties = datexProperties(
      groupedPhases
    );
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: phase.lineCoordinates
      },
      properties: {
        ...properties,
        _umap_options: {
          color: lineColor(
            phase.type
          )
        }
      }
    });
    const firstPoint = phase.lineCoordinates[0];
    features.push(
      datexEndpointFeature(
        properties,
        firstPoint,
        origin,
        phase.type
      )
    );
    const lastPoint = phase.lineCoordinates[phase.lineCoordinates.length - 1];
    if (!sameCoordinate(
      firstPoint,
      lastPoint
    )) {
      features.push(
        datexEndpointFeature(
          properties,
          lastPoint,
          origin,
          phase.type
        )
      );
    }
  }
  return {
    type: "FeatureCollection",
    features,
    metadata: {
      source: "MobiData BW / BEMaS DATEX II",
      generated: (/* @__PURE__ */ new Date()).toISOString(),
      situations: situations.length,
      raw_phases: allPhases.length,
      county_filter: {
        enabled: FILTER_LANDKREIS_SIGMARINGEN,
        county: COUNTY_NAME,
        boundary_source: COUNTY_GEOJSON_SOURCE,
        phases_inside_or_crossing: phases.length,
        phases_filtered_out: filteredOut
      },
      grouping: {
        method: "Situation + Fachdaten + AoA/Endpunkt-Toleranz",
        endpoint_tolerance_m: ENDPOINT_MATCH_TOLERANCE_M,
        aoa_tolerance_m: AOA_MATCH_TOLERANCE_M,
        grouped_phases: groups.length,
        merged_records: mergedRecords,
        merged_opposite_directions: mergedGroups
      },
      features: features.length,
      colors: {
        ROAD_CLOSED: COLOR_ROAD_CLOSED,
        CONSTRUCTION: COLOR_CONSTRUCTION
      },
      icon_zoom: ICON_ZOOM_FACTOR
    }
  };
}
async function datexGeoJsonResponse(req) {
  const origin = new URL(
    req.url
  ).origin;
  const now = Date.now();
  if (datexCache && datexCache.origin === origin && datexCache.expires > now) {
    return new Response(
      datexCache.body,
      {
        headers: {
          ...HEADERS,
          "content-type": "application/geo+json; charset=utf-8",
          "x-cache": "HIT"
        }
      }
    );
  }
  const geojson = await buildDatexGeoJson(
    origin
  );
  const body = JSON.stringify(
    geojson
  );
  datexCache = {
    origin,
    expires: now + DATEX_CACHE_MS,
    body
  };
  return new Response(
    body,
    {
      headers: {
        ...HEADERS,
        "content-type": "application/geo+json; charset=utf-8",
        "x-cache": "MISS"
      }
    }
  );
}
var VZ250_FILE = "VZ_250.svg";
var VZ123_FILE = "VZ_123.svg";
var ICON_GITHUB_BASE = "https://raw.githubusercontent.com/googie0815/umap-icons/main";
var COMBINED_ICON_DEFAULT_LAYOUT = "horizontal";
var COMBINED_ICON_DEFAULT_GAP = 8;
var COMBINED_ICON_CANVAS_SIZE = 120;
var COMBINED_ICON_CANVAS_PADDING = 6;
function iconSourceUrl(filename) {
  return `${ICON_GITHUB_BASE}/${encodeURIComponent(filename)}`;
}
function isValidSvgFilename(filename) {
  return /^[A-Za-z0-9_.-]+\.svg$/i.test(filename);
}
function normalizeCombinedLayout(value) {
  return value === "vertical" ? "vertical" : "horizontal";
}
function normalizeGap(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return COMBINED_ICON_DEFAULT_GAP;
  }
  return Math.max(
    0,
    Math.min(
      40,
      Math.round(parsed)
    )
  );
}
function normalizeScales(value, expectedLength) {
  const rawValues = (value ?? "").split(",").map(
    (item) => item.trim()
  ).filter(Boolean);
  const result = [];
  for (let i = 0; i < expectedLength; i++) {
    const parsed = Number(
      rawValues[i] ?? "1"
    );
    if (!Number.isFinite(parsed)) {
      result.push(1);
      continue;
    }
    result.push(
      Math.max(
        0.2,
        Math.min(
          1.5,
          parsed
        )
      )
    );
  }
  return result;
}
function stripSvgMetadata(svg) {
  return svg.replace(
    /<metadata\b[\s\S]*?<\/metadata>\s*/gi,
    ""
  ).replace(
    /<\?xml[\s\S]*?\?>\s*/gi,
    ""
  ).trim();
}
function attributeNumber(svgTag, attribute) {
  const match = svgTag.match(
    new RegExp(
      `${attribute}\\s*=\\s*["']([^"']+)["']`,
      "i"
    )
  );
  if (!match) {
    return null;
  }
  const value = Number(
    String(match[1]).replace(
      /px$/i,
      ""
    )
  );
  return Number.isFinite(value) ? value : null;
}
function extractSvgNamespaces(svgTag) {
  const result = {};
  for (const match of svgTag.matchAll(
    /\s(xmlns(?::[A-Za-z_][\w.-]*)?)\s*=\s*["']([^"']+)["']/g
  )) {
    result[match[1]] = match[2];
  }
  return result;
}
function parseSvg(svg) {
  const openTagMatch = svg.match(
    /<svg\b[^>]*>/i
  );
  const closeTagMatch = svg.match(
    /<\/svg>\s*$/i
  );
  if (!openTagMatch || !closeTagMatch) {
    throw new Error(
      "Ung\xFCltiges SVG: <svg>-Tag nicht gefunden."
    );
  }
  const openTag = openTagMatch[0];
  const viewBoxMatch = openTag.match(
    /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i
  );
  let minX = 0;
  let minY = 0;
  let width = attributeNumber(
    openTag,
    "width"
  );
  let height = attributeNumber(
    openTag,
    "height"
  );
  if (viewBoxMatch) {
    minX = Number(viewBoxMatch[1]);
    minY = Number(viewBoxMatch[2]);
    width = Number(viewBoxMatch[3]);
    height = Number(viewBoxMatch[4]);
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(
      "SVG ohne brauchbare width/height bzw. viewBox-Angabe."
    );
  }
  const start = openTagMatch.index + openTag.length;
  const end = closeTagMatch.index;
  const content = svg.slice(
    start,
    end
  );
  return {
    minX,
    minY,
    width,
    height,
    content,
    namespaces: extractSvgNamespaces(
      openTag
    )
  };
}
function prefixSvgIds(svgContent, prefix) {
  return svgContent.replace(
    /id=(["'])([^"']+)\1/g,
    (_match, quote, id) => `id=${quote}${prefix}${id}${quote}`
  ).replace(
    /url\(#([^\)]+)\)/g,
    (_match, id) => `url(#${prefix}${id})`
  ).replace(
    /href=(["'])#([^"']+)\1/g,
    (_match, quote, id) => `href=${quote}#${prefix}${id}${quote}`
  ).replace(
    /xlink:href=(["'])#([^"']+)\1/g,
    (_match, quote, id) => `xlink:href=${quote}#${prefix}${id}${quote}`
  ).replace(
    /\bclass=(["'])([^"']+)\1/g,
    (_match, quote, classes) => `class=${quote}${classes}${quote}`
  );
}
function zoomSvgContent(svg, factor = ICON_ZOOM_FACTOR) {
  const match = svg.match(
    /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i
  );
  if (!match) {
    return svg;
  }
  const minX = Number(
    match[1]
  );
  const minY = Number(
    match[2]
  );
  const width = Number(
    match[3]
  );
  const height = Number(
    match[4]
  );
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || factor <= 1) {
    return svg;
  }
  const newWidth = width / factor;
  const newHeight = height / factor;
  const newMinX = minX + (width - newWidth) / 2;
  const newMinY = minY + (height - newHeight) / 2;
  const format = (value) => value.toFixed(4).replace(
    /\.?0+$/,
    ""
  );
  const newViewBox = `viewBox="${format(newMinX)} ${format(newMinY)} ${format(newWidth)} ${format(newHeight)}"`;
  return svg.replace(
    match[0],
    newViewBox
  );
}
async function loadGithubSvg(filename) {
  if (!isValidSvgFilename(
    filename
  )) {
    throw new Error(
      `Ung\xFCltiger SVG-Dateiname: ${filename}`
    );
  }
  const upstream = await fetch(
    iconSourceUrl(
      filename
    ),
    {
      redirect: "follow",
      headers: {
        "user-agent": "uMap-roadworks-proxy/1.0"
      }
    }
  );
  if (!upstream.ok) {
    throw new Error(
      `Verkehrszeichen ${filename} konnte nicht geladen werden: ${upstream.status}`
    );
  }
  const originalSvg = await upstream.text();
  return stripSvgMetadata(
    originalSvg
  );
}
async function trafficSignResponse(filename) {
  const originalSvg = await loadGithubSvg(
    filename
  );
  const enlargedSvg = zoomSvgContent(
    originalSvg
  );
  return new Response(
    enlargedSvg,
    {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=86400",
        "content-type": "image/svg+xml; charset=utf-8"
      }
    }
  );
}
async function buildCombinedIcon(filenames, layout, gap, scales) {
  if (filenames.length < 1 || filenames.length > 3) {
    throw new Error(
      "Es k\xF6nnen 1 bis 3 SVG-Symbole kombiniert werden."
    );
  }
  for (const filename of filenames) {
    if (!isValidSvgFilename(
      filename
    )) {
      throw new Error(
        `Ung\xFCltiger SVG-Dateiname: ${filename}`
      );
    }
  }
  const cacheKey = JSON.stringify({
    filenames,
    layout,
    gap,
    scales
  });
  const now = Date.now();
  const cached = combinedIconCache.get(
    cacheKey
  );
  if (cached && cached.expires > now) {
    return cached.svg;
  }
  const sourceSvgs = await Promise.all(
    filenames.map(
      (filename) => loadGithubSvg(
        filename
      )
    )
  );
  const parsedSvgs = sourceSvgs.map(
    (svg) => parseSvg(svg)
  );
  const outerSize = COMBINED_ICON_CANVAS_SIZE;
  const outerPadding = COMBINED_ICON_CANVAS_PADDING;
  const innerGap = Math.max(
    0,
    Math.min(
      16,
      gap
    )
  );
  const slotWidth = layout === "vertical" ? outerSize - 2 * outerPadding : (outerSize - 2 * outerPadding - (parsedSvgs.length - 1) * innerGap) / parsedSvgs.length;
  const slotHeight = layout === "vertical" ? (outerSize - 2 * outerPadding - (parsedSvgs.length - 1) * innerGap) / parsedSvgs.length : outerSize - 2 * outerPadding;
  const combinedNamespaces = {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink"
  };
  for (const parsed of parsedSvgs) {
    for (const [
      key,
      value
    ] of Object.entries(
      parsed.namespaces
    )) {
      if (!combinedNamespaces[key]) {
        combinedNamespaces[key] = value;
      }
    }
  }
  const namespaceAttributes = Object.entries(
    combinedNamespaces
  ).map(
    ([
      key,
      value
    ]) => `${key}="${value}"`
  ).join("\n  ");
  const groups = parsedSvgs.map(
    (parsed, index) => {
      const slotX = layout === "vertical" ? outerPadding : outerPadding + index * (slotWidth + innerGap);
      const slotY = layout === "vertical" ? outerPadding + index * (slotHeight + innerGap) : outerPadding;
      const baseScale = Math.min(
        slotWidth / parsed.width,
        slotHeight / parsed.height
      );
      const relativeScale = scales[index] ?? 1;
      const scale = baseScale * relativeScale;
      const renderedWidth = parsed.width * scale;
      const renderedHeight = parsed.height * scale;
      const translateX = slotX + (slotWidth - renderedWidth) / 2 - parsed.minX * scale;
      const translateY = slotY + (slotHeight - renderedHeight) / 2 - parsed.minY * scale;
      const prefixedContent = prefixSvgIds(
        parsed.content,
        `icon${index}_`
      );
      return `
  <g transform="translate(${translateX} ${translateY}) scale(${scale})">
${prefixedContent}
  </g>`.trimEnd();
    }
  ).join("\n");
  const combinedSvg = `
<svg
  ${namespaceAttributes}
  width="${outerSize}"
  height="${outerSize}"
  viewBox="0 0 ${outerSize} ${outerSize}"
  preserveAspectRatio="xMidYMid meet"
  shape-rendering="geometricPrecision"
  text-rendering="geometricPrecision"
>
${groups}
</svg>`.trim();
  combinedIconCache.set(
    cacheKey,
    {
      svg: combinedSvg,
      expires: now + COMBINED_ICON_CACHE_TTL
    }
  );
  return combinedSvg;
}
async function combinedIconResponse(url) {
  const iconsParameter = url.searchParams.get("icons") ?? "";
  const filenames = iconsParameter.split(",").map(
    (value) => value.trim()
  ).filter(Boolean);
  if (filenames.length === 0) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: "Parameter 'icons' fehlt. Beispiel: ?icons=VZ_262_20t.svg,VZ_263_8t.svg&scales=1,0.7"
        },
        null,
        2
      ),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      }
    );
  }
  const layout = normalizeCombinedLayout(
    url.searchParams.get(
      "layout"
    )
  );
  const gap = normalizeGap(
    url.searchParams.get(
      "gap"
    )
  );
  const scales = normalizeScales(
    url.searchParams.get(
      "scales"
    ),
    filenames.length
  );
  try {
    const svg = await buildCombinedIcon(
      filenames,
      layout,
      gap,
      scales
    );
    return new Response(
      svg,
      {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=3600",
          "access-control-allow-origin": "*"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      }
    );
  }
}
var handleRequest = (async (req) => {
  const url = new URL(
    req.url
  );
  try {
    if (url.pathname === "/roadworks-datex.geojson") {
      return await datexGeoJsonResponse(
        req
      );
    }
    if (url.pathname === "/roadworks.geojson") {
      return await geoJsonResponse(
        req
      );
    }
    if (url.pathname === "/roadworks.csv") {
      return await csvResponse();
    }
    if (url.pathname === "/icons/road-closed.svg") {
      return await trafficSignResponse(
        VZ250_FILE
      );
    }
    if (url.pathname === "/icons/construction.svg") {
      return await trafficSignResponse(
        VZ123_FILE
      );
    }
    if (url.pathname === "/icons/combine.svg") {
      return await combinedIconResponse(
        url
      );
    }
    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: "MobiData-BW / DATEX II \u2192 uMap",
          filter: {
            enabled: FILTER_LANDKREIS_SIGMARINGEN,
            county: COUNTY_NAME,
            method: "eigene GeoJSON-Landkreisgrenze / Schnittpr\xFCfung",
            boundary: COUNTY_GEOJSON_SOURCE
          },
          grouping: {
            method: "Situation + AoA + geografische Endpunkte",
            endpoint_tolerance_m: ENDPOINT_MATCH_TOLERANCE_M,
            aoa_tolerance_m: AOA_MATCH_TOLERANCE_M
          },
          urls: {
            csv: "/roadworks.csv",
            geojson: "/roadworks.geojson",
            datex_geojson: "/roadworks-datex.geojson",
            vz250: "/icons/road-closed.svg",
            vz123: "/icons/construction.svg",
            combined_example_horizontal: `/icons/combine.svg?icons=VZ_262_20t.svg,VZ_263_8t.svg&layout=${COMBINED_ICON_DEFAULT_LAYOUT}`,
            combined_example_vertical: "/icons/combine.svg?icons=VZ_262_20t.svg,VZ_263_8t.svg&layout=vertical",
            combined_example_scaled: "/icons/combine.svg?icons=VZ_253.svg,Zusatzzeichen_1053-33_7_5t.svg&layout=vertical&scales=1,0.7"
          },
          combined_icons: {
            enabled: true,
            max_icons: 3,
            layouts: [
              "horizontal",
              "vertical"
            ],
            default_layout: COMBINED_ICON_DEFAULT_LAYOUT,
            default_gap: COMBINED_ICON_DEFAULT_GAP,
            scales_parameter: "Kommagetrennte Faktoren, z. B. scales=1,0.7"
          },
          styles: {
            Vollsperrung: COLOR_ROAD_CLOSED,
            Baustelle: COLOR_CONSTRUCTION,
            icon_zoom: ICON_ZOOM_FACTOR
          }
        },
        null,
        2
      ),
      {
        headers: {
          ...HEADERS,
          "content-type": "application/json; charset=utf-8"
        }
      }
    );
  } catch (error) {
    console.error(
      error
    );
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(
            error
          ),
          stack: error instanceof Error ? error.stack : ""
        },
        null,
        2
      ),
      {
        status: 502,
        headers: {
          ...HEADERS,
          "content-type": "application/json; charset=utf-8"
        }
      }
    );
  }
});
var worker_source_default = {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS" } });
    if (!["GET", "HEAD"].includes(req.method)) return new Response("Method not allowed", { status: 405, headers: { "Allow": "GET, HEAD, OPTIONS", "Access-Control-Allow-Origin": "*" } });
    const url = new URL(req.url);
    const isData = ["/roadworks-datex.geojson", "/roadworks.geojson", "/roadworks.csv"].includes(url.pathname);
    const isIcon = ["/icons/construction.svg", "/icons/road-closed.svg", "/icons/combine.svg"].includes(url.pathname);
    const cacheable = isData || isIcon;
    const keyUrl = new URL(url);
    keyUrl.searchParams.delete("v");
    keyUrl.searchParams.sort();
    const key = new Request(keyUrl.toString());
    const cache = typeof caches !== "undefined" ? caches.default : void 0;
    if (cacheable && cache) {
      const hit = await cache.match(key);
      if (hit) {
        const headers2 = new Headers(hit.headers);
        headers2.set("x-edge-cache", "HIT");
        return new Response(req.method === "HEAD" ? null : hit.body, { status: hit.status, headers: headers2 });
      }
    }
    const response = await handleRequest(new Request(req, { method: "GET" }));
    const headers = new Headers(response.headers);
    if (cacheable && response.ok) headers.set("Cache-Control", isData ? "public, max-age=300" : "public, max-age=3600");
    headers.set("x-edge-cache", "MISS");
    const result = new Response(response.body, { status: response.status, headers });
    if (cacheable && result.ok && cache) ctx.waitUntil(cache.put(key, result.clone()));
    return req.method === "HEAD" ? new Response(null, { status: result.status, headers: result.headers }) : result;
  }
};
export {
  worker_source_default as default
};
