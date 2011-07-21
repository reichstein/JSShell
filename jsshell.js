// Javascript Shell

(function (global) { 
  "use strict";
  window.addEventListener("load", initialize, false);
  var O = Object;
  var Ogpo = Object.getPrototypeOf;
  var Oie = Object.isExtensible;
  var Op = Object.prototype;
  var Ogopn = Object.getOwnPropertyNames;
  var Ogopd = Object.getOwnPropertyDescriptor;
  var Ohop = Object.prototype.hasOwnProperty;
  var Ots = Object.prototype.toString;
  var N = Node;
  var indirectEval = eval;
  var Js = JSON.stringify;
  var Sss = String.prototype.substring;
  var St = String.prototype.trim;
  var Svo = String.prototype.valueOf;
  var Nvo = Number.prototype.valueOf;
  var Bvo = Boolean.prototype.valueOf;
  var Dvo = Date.prototype.valueOf;
  var Dtis = Date.prototype.toISOString;

  var lineLength = 80;

  function IsObject(v) { return (typeof v == "object") && v !== null; }
  function IsPlainObject(v) { return Ots.call(v) == "[object Object]"; }
  function IsArray(v) { return Ots.call(v) == "[object Array]"; }
  function IsArrayIndex(string) { return string === ("" + (string >> 0)); }
  function GetOwnValue(object, propertyName) {
    var desc = Ogopd(object, propertyName);
    return desc && desc.value;
  }
  function GetValue(object, propertyName) {
    while (object) {
      var desc = Ogopd(object, propertyName);
      if (desc) return desc.value;
      object = Ogpo(object);
    }
  }

  function TypeName(v) {
    var result = typeof(v);
    if (result == "string") return "string#" + v.length;
    if (result != "object") return result;
    if (!v) return "null";
    var ots = Ots.call(v);
    result = Sss.call(ots, 8, ots.length - 1);
    if (result == "Object") {
      var own = true;
      var constructor = GetOwnValue(v, "constructor");
      if (typeof constructor != "function") {
	own = false;
	constructor = GetValue(v, "constructor");
      }
      if (typeof constructor == "function") {
	var constructorName = GetOwnValue(constructor, "name");
	if (own) constructorName += ".prototype";
	if (typeof constructorName == "string") result = constructorName;
      }
    } else {
      switch (result) {
      case "RegExp":
        result += " /" + v.source + "/";
	if (v.global) result += "g";
	if (v.ignoreCase) result += "i";
	if (v.multiline) result += "m";
	break;
      case "Array":
	result += "#" + v.length;
	break;
      case "Number":
	result += "(" + Nvo.call(v) + ")";
	break;
      case "Boolean":
	result += "(" + Bvo.call(v) + ")";
	break;
      case "String":
	result += "(" + shortValueToString(Svo.call(v)) + ")";
	break;
      case "Date":
	result += "(" + Dtis.call(v) + ")";
	break;
      }
      result = "<" + result + ">";
    }
    return result;
  }

  var resultCount = 0;

  function assignAttributes(dst, src) {
    var names = Ogopn(src);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var value = src[name];
      if (IsObject(value)) {
        var prop = dst[name];
	// Copy recursively.
	assignAttributes(prop, value);
      } else if (typeof value == "function") {
	dst.addEventListener(name, value, false);
      } else {
	dst[name] = value;
      }
    }
  }

  function addChild(element, childSpec) {
    if (childSpec == null) return;
    if (IsArray(childSpec)) {
      for (var i = 0; i < childSpec.length; i++) {
	addChild(element, childSpec[i]);
      }
      return;
    }
    if (childSpec instanceof N) {
      element.appendChild(childSpec);
      return;
    }
    childSpec = "" + childSpec;
    element.appendChild(document.createTextNode(childSpec));
  }

  // -------------------------------------------------------------------
  // DOM helper functions.
  function TXT(string) {
    return document.createTextNode(string);
  }
  // |tag| must be a string.
  // |attrs|, if present, must be a non-array, non-DOM object.
  // |children| may be either a DOM Node, DocumentFragment, string or array 
  //    any of any of these.
  function DOM(tag, attrs, children /*...*/) {
    var element = document.createElement(tag);
    var childIndex = 1;
    if (IsPlainObject(attrs)) {
      assignAttributes(element, attrs);
      childIndex++;
    }
    while (childIndex < arguments.length) {
      var child = arguments[childIndex];
      addChild(element, child);
      childIndex++;
    }
    return element;
  }

  function initialize() {
    document.body.appendChild(DOM("h1", {className: "jsshell-headline"},
				  "JSShell"));
    var inputArea = createInput();
    document.body.appendChild(inputArea);
    inputArea.getElementsByTagName("textarea")[0].focus();
  }

  function executeInput(input) {
    var text = St.call(input.value);
    if (text.length == 0) return;
    document.body.insertBefore(DOM("div", {className: "jsshell-inputlog"},
				   text),
			       document.body.lastChild);
    evalblock: {
      try {
        var value = indirectEval(text);
      } catch (exn) {
        reportException(exn);
	break evalblock;
      }
      if (value !== void 0) reportValue(value); 
    }

    input.style.width = null;
    input.style.height = null;
    input.focus();
    input.select();
    input.scrollIntoView();
  }

  function insertHTML(input) {
    var text = input.value;
    var div = document.createElement("div");
    div.innerHTML = text;
    while (div.firstChild) {
      document.body.insertBefore(div.firstChild, document.body.lastChild);
    }
  }

  function insertIFrame(input) {
    var frame = DOM("iframe", {src: 
        "javascript:top.document.getElementById('jsshell-input-id').value"});
    document.body.insertBefore(frame, document.body.lastChild);
    reportValue(frame);
  }

  // Page visible shell-specific namespace exposing 
  // the log function.
  global.shell = { log: reportValue };

  // -------------------------------------------------------------------
  // INPUT

  function createInput() {
    return DOM("div", {className: "jsshell" },
	       DOM("textarea", 
		   { className: "jsshell-input", 
           	     id: "jsshell-input-id",
		     rows: 1,
                     cols: lineLength,
                     wrap: "hard",
                     keypress: inputKeyPress, keyup: inputKeyUp }),
	       DOM("br"),
	       DOM("button", {className: "jsshell-button",
		              type: "button",
		              click: executeButtonClick}, "Execute"),
	       DOM("button", {className: "jsshell-button",
		              type: "button",
		              click: insertHTMLButtonClick }, "Insert HTML"),
	       DOM("button", {className: "jsshell-button",
		              type:"button",
		              click: insertIFrameButtonClick }, 
    		              "Insert iframe"));
  }

  function inputKeyPress(evt) {
    if (evt.keyCode == 10 || (evt.keyCode == 13 && evt.ctrlKey)) {
      // Ctrl+Ret
      executeInput(this);
      evt.preventDefault();
      return;
    }
  }

  function inputKeyUp(evt) {
    // Plain return. Check for lines of input.
    var self = this;
    setTimeout(function(){
		 var text = self.value;
		 var lineCount = 0;
		 var i = 0;
		 var prev = 0;
		 do {
		   lineCount++;
		   i = text.indexOf("\n", i) + 1;
		   if (i > 0) {
  		     if (i - prev > lineLength) {
		       lineCount += ((i - prev) / lineLength) | 0;
		     }
		     prev = i;
		   }
		 } while (i > 0);
		 if (text.length - prev > lineLength) {
		   lineCount += ((text.length - prev) / lineLength) | 0;
		 }
		 if (self.rows != lineCount) self.rows = lineCount;
	       }, 0);
  }

  function executeButtonClick(evt) {
    var input = this.previousSibling.previousSibling;
    executeInput(input);
  }

  function insertHTMLButtonClick(evt) {
    var input = this.previousSibling.previousSibling.previousSibling;
    insertHTML(input);
  }

  function insertIFrameButtonClick(evt) {
    var input = 
        this.previousSibling.previousSibling.previousSibling.previousSibling;
    insertIFrame(input);
  }

  // -------------------------------------------------------------------
  // OUTPUT

  function reportValue(value) {
    var key = "$" + (++resultCount);
    global[key] = value;
    function clean(evt) {
      delete global[key];
      this.parentNode.parentNode.removeChild(this.parentNode);
    }
    document.body.insertBefore(DOM("div", {className:"jsshell-property"}, 
				   DOM("span", { className: "jsshell-remove",
    					         click: clean }, "[x]"),
				   DOM("span", 
				       {className: "jsshell-property-key"}, 
				       key), " = ",
				   displayValue(value)),
			       document.body.lastChild);
  }

  function reportException(value) {
    document.body.insertBefore(DOM("div", "" + value, DOM("br"), 
				   DOM("pre", value.stack)),
			       document.body.lastChild);
  }

  function displayStringCollapsed(v) {
    var slice = Sss.call(v, 0, 72);
    var pretty = Js(slice);
    function expandString(evt) {
      this.removeEventListener("click", expandString, false);
      this.parentNode.parentNode.replaceChild(displayStringExpanded(v),
					      this.parentNode);
    }
    return DOM("span", DOM("span", {className: "jsshell-string"}, pretty), 
	       DOM("span", {className:"jsshell-expand",
		            click: expandString}, "..."));
  }

  function displayStringExpanded(v) {
    var pretty = Js(v);
    function collapseString(evt) {
      this.removeEventListener("click", collapseString, false);
      this.parentNode.parentNode.replaceChild(displayStringCollapsed(v),
					      this.parentNode);
    }
    return DOM("span", DOM("span", {className: "jsshell-string"}, pretty), 
	               " (", DOM("span", { className: "jsshell-collapse",
				           click: collapseString },
				 "collapse"), ")");
  }

  function prettyPrintPrimitive(v) {
    if (typeof v === "string") {
      if (v.length > 72) {
	return displayStringCollapsed(v);
      }
      return Js(v);
    } else {
      return "" + v;
    }
  }

  function displayValue(value) {
    var res;
    if (!IsObject(value)) {
      res = DOM("span", 
		prettyPrintPrimitive(value));
    } else if (IsArray(value)) {
      res = DOM("span", 
		"[", displayObjectCollapsed(value), "]");
    } else {
      res = DOM("span", 
	        "{", displayObjectCollapsed(value), "}");
    }
    res.appendChild(DOM("span", { className: "jsshell-typename" },
			" : ", TypeName(value)));
    return res;
  }

  function shortValueToString(value) {
    switch (typeof value) {
    case "string":
      if (value.length > 10) {
	value = Sss.call(value, 0, 7) + "...";
      }
      return Js(value);
    case "object":    
      if (value !== null) {
	return "<" + typeName(value) + ">";
      }
      // Fallthrough on null.
    case "number":
    case "bool":
      return "" + value;
    case "undefined":
      return "";
    case "function":
      return "<function>";
    default:
      return "<" + (typeof value) + ">";
    }
  }

  function displayObjectCollapsed(object) {
    // TODO: Show a (noninteractive) preview of the first few properties.
    function expand(evt) {
      this.removeEventListener("click", expand, false);
      this.parentElement.replaceChild(displayObject(object), this);
    }
    return DOM("span", {className:"jsshell-expand", click: expand }, "...");
  }

  function displayObject(object) {
    // TODO: Allow progressive display of objects with many properties.
    function collapse(evt) {
      this.removeEventListener(this, collapse, false);
      this.parentNode.parentNode.replaceChild(displayObjectCollapsed(object),
					      this.parentNode);
    }
    var list = DOM("span", {className:"jsshell-value-list"},
		   DOM("span", {className:"jsshell-collapse",
			        click: collapse}, " (collapse) "));
    var proto = Ogpo(object);
    if (proto) {
      list.appendChild(displayPseudoProperty("[[Prototype]]", proto));
    }

    if (!Oie(object)) {
      list.appendChild(displayPseudoProperty("[[Extensibe]]", false));
    }

    var primitiveValue;
    switch (Ots.call(object)) {
    case "[object String]": 
      primitiveValue = Svo.call(object);
      break;
    case "[object Number]":
      primitiveValue = Nvo.call(object);
      break;
    case "[object Boolean]":
      primitiveValue = Bvo.call(object);
      break;
    case "[object Date]":
      primitiveValue = Dvo.call(object);
      break;
    }
    if (primitiveValue !== void 0) {
      list.appendChild(displayPseudoProperty("[[PrimitiveValue]]", 
					     primitiveValue));
    }

    var keys = Ogopn(object);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      list.appendChild(displayProperty(object, key));
    }
    return list;
  }

  function displayPseudoProperty(key, value) {
    return DOM("div", {className:"jsshell-property"},
	       DOM("span", {className:"jsshell-property-key"}, key),
	       " : ",
	       displayValue(value));
  }

  function displayProperty(object, key) {
    var line = DOM("div",{className: "jsshell-property"});
    var keyText = DOM("span", 
		      {className: "jsshell-property-key"}, 
		      key);
    line.appendChild(keyText);
    var desc = Ogopd(object, key);
    var props = [];
    if (desc.enumerable) props.push("enumerable");
    if (desc.configurable) props.push("configurable");
    
    if ("value" in desc) { 
      if (desc.writable) props.push("writable");
      line.appendChild(TXT(" : "));
      line.appendChild(displayValue(desc.value));
    } else {
      var getset = [];
      if (typeof desc.get == "function") { getset.push("get") };
      if (typeof desc.set == "function") { getset.push("set") };
      // TODO
      line.appendChild(TXT("<" + getset.join("/") + ">"));
    }
    keyText.title = props.join(", ");
    return line;
  }

 })(this);
