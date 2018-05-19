function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (window, document) {
  var Button, Caption, Check, Combo, Control, Desktop, Dialog, Edit, EventHandler, FakeMap, Footer, FormControl, Group, Label, MAX_DLGS, Memo, Progress, Radio, Tabs, TextBox, ZIND_FIRST, createElement, createEvent, createTextNode, ctlMap, isActive, setActive, setRole, setRoleAll;
  ZIND_FIRST = 10000;
  MAX_DLGS = 100;
  createElement = function createElement(tag, parent, cls, html, attrs) {
    var e, k, p, v;
    e = document.createElement(tag);
    e.className = cls;
    if (typeof html === 'string') {
      e.innerHTML = html;
    } else {
      attrs = html;
    }
    if (attrs) {
      for (k in attrs) {
        v = attrs[k];
        if (k === 'css') {
          for (p in v) {
            e.style[p] = v[p];
          }
        } else {
          e.setAttribute(k, v);
        }
      }
    }
    if (parent != null) {
      parent.appendChild(e);
    }
    return e;
  };
  createTextNode = function createTextNode(text, parent) {
    var node;
    node = document.createTextNode(text);
    parent.appendChild(node);
    return node;
  };
  setRole = function setRole(el, role) {
    el.setAttribute('role', role);
  };
  setRoleAll = function setRoleAll(el, role) {
    var e, l, len;
    for (l = 0, len = el.length; l < len; l++) {
      e = el[l];
      setRole(e, role);
    }
  };
  isActive = function isActive(el) {
    return el.classList.contains('wm-active');
  };
  setActive = function setActive(el, active) {
    // IE doesn't support classList.toggle()
    el.classList[active ? 'add' : 'remove']('wm-active');
  };
  createEvent = function createEvent(type) {
    var evt;
    evt = document.createEvent('Event');
    evt.initEvent(type, false, true);
    return evt;
  };
  EventHandler = function () {
    function EventHandler(el1) {
      _classCallCheck(this, EventHandler);

      var self;
      this.el = el1;
      self = this;
      this.list = {};
      this.dispatcher = function (e) {
        var l, len, listener, ref, results;
        ref = self.list[e.type];
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          listener = ref[l];
          results.push(listener.call(self, e));
        }
        return results;
      };
    }

    EventHandler.prototype.on = function on(type, listener) {
      if (!this.list[type]) {
        this.list[type] = [];
        this.el.addEventListener(type, this.dispatcher, false);
      }
      this.list[type].push(listener);
      return this;
    };

    EventHandler.prototype.off = function off(type, listener) {
      var a, index;
      if (this.list[type]) {
        a = this.list[type];
        index = a.indexOf(listener);
        if (index !== -1) {
          a.splice(index, 1);
          if (!a.length) {
            this.list[type] = void 0;
            this.el.removeEventListener(type, this.dispatcher, false);
          }
        }
      }
      return this;
    };

    EventHandler.prototype.trigger = function trigger(event) {
      if (typeof event === 'string') {
        event = createEvent(event);
      }
      this.el.dispatchEvent(event);
      return this;
    };

    return EventHandler;
  }();
  Desktop = function () {
    function Desktop(opts) {
      _classCallCheck(this, Desktop);

      opts = opts || {};
      this.parent = opts.node || document.body;
      this.zindex = opts.owner ? opts.owner.zindex + 1 : 0;
      this.owner = opts.owner;
      this.list = [];
      this.modal = !!(opts.modal || opts.owner);
      this.desktop = null;
      this.overlay = null;
      this.active = true;
    }

    Desktop.prototype._getClientSize = function _getClientSize() {
      var s;
      s = {};
      if (document.body) {
        if (!(this.desktop && this.desktop.parentNode)) {
          this.desktop = createElement('div', this.parent, 'wm-desktop');
        }
        s = typeof window.getComputedStyle === "function" ? window.getComputedStyle(this.desktop) : void 0;
      }
      return {
        width: parseInt(s.width) || window.innerWidth,
        height: parseInt(s.height) || window.innerHeight
      };
    };

    Desktop.prototype._moveElement = function _moveElement(el, x, y) {
      var style;
      style = el.style;
      if (typeof x === 'number') {
        x += 'px';
      }
      if (typeof y === 'number') {
        y += 'px';
      }
      style.left = x;
      style.top = y;
      this._adjustLocation(el);
    };

    Desktop.prototype._resizeElement = function _resizeElement(el, cx, cy) {
      var style;
      style = el.style;
      if (typeof cx === 'number') {
        cx += 'px';
      }
      style.width = cx;
      if (cy != null) {
        if (typeof cy === 'number') {
          cy += 'px';
        }
        style.height = cy;
      }
      this._adjustLocation(el);
    };

    Desktop.prototype._moveToCentre = function _moveToCentre(el) {
      var rect, size, x, y;
      rect = el.getBoundingClientRect();
      size = this._getClientSize();
      x = (size.width - rect.width) / 2 | 0;
      y = (size.height - rect.height) / 2 | 0;
      this._moveElement(el, x, y);
    };

    Desktop.prototype._adjustLocation = function _adjustLocation(el) {
      var rect, size, x, y;
      x = el.offsetLeft;
      y = el.offsetTop;
      rect = el.getBoundingClientRect();
      size = this._getClientSize();
      if (x + rect.width > size.width) {
        x = size.width - rect.width;
      }
      if (x < 0) {
        x = 0;
      }
      if (y + rect.height > size.height) {
        y = size.height - rect.height;
      }
      if (y < 0) {
        y = 0;
      }
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };

    Desktop.prototype.indexOf = function indexOf(dlg) {
      var d, i, l, len, ref;
      ref = this.list;
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        d = ref[i];
        if (d.equals(dlg)) {
          return i;
        }
      }
      return -1;
    };

    Desktop.prototype.newDialog = function newDialog(body, opts) {
      var dlg, el, t, title;
      if (this.list.length >= MAX_DLGS - 1) {
        throw 'Maximum windows exceeded';
      }
      if (this.modal && !this.overlay) {
        this.overlay = createElement('div', this.parent, 'wm-modal', {
          css: {
            zIndex: this._zIndex(0)
          }
        });
      }
      if (!body) {
        return;
      }
      title = (opts != null ? opts.title : void 0) != null ? opts.title : opts;
      if (title == null) {
        title = document.title;
      }
      el = createElement('form', this.parent, 'wm-dlg');
      t = createElement('div', el, 'wm-title');
      createTextNode(title, t);
      createElement('div', el, 'wm-body', body);
      dlg = new Dialog(this, el);
      this.list.push(dlg);
      this._update();
      return dlg;
    };

    Desktop.prototype.destroy = function destroy() {
      var dlg, l, len, ref;
      ref = this.list;
      for (l = 0, len = ref.length; l < len; l++) {
        dlg = ref[l];
        this.parent.removeChild(dlg.el);
      }
      this._destroyInternal();
    };

    Desktop.prototype._deleteDialog = function _deleteDialog(dlg) {
      var index;
      index = this.indexOf(dlg);
      if (index !== -1) {
        this.parent.removeChild(dlg.el);
        this.list.splice(index, 1);
        this._update();
        if (this.list.length === 0) {
          this._destroyInternal();
        }
      }
    };

    Desktop.prototype._destroyInternal = function _destroyInternal() {
      if (this.desktop) {
        this.parent.removeChild(this.desktop);
        this.desktop = null;
      }
      if (this.overlay) {
        this.parent.removeChild(this.overlay);
        this.overlay = null;
      }
    };

    Desktop.prototype._bringToTop = function _bringToTop(dlg, evt) {
      var index;
      index = this.indexOf(dlg);
      if (index !== -1) {
        this.list.push(this.list.splice(index, 1)[0]);
        this._update(evt);
      }
    };

    Desktop.prototype._zIndex = function _zIndex(i) {
      return ZIND_FIRST + this.zindex * MAX_DLGS + i;
    };

    Desktop.prototype._update = function _update(evt) {
      var d, i, l, len, ref, ub;
      this._notifyOwner();
      ub = this.list.length - 1;
      ref = this.list;
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        d = ref[i];
        d._setState(this._zIndex(i + 1), this.active && i >= ub, evt);
      }
    };

    Desktop.prototype._notify = function _notify(child) {
      var active;
      active = child.list.length === 0;
      if (this.active !== active) {
        this.active = active;
        return this._update();
      }
    };

    Desktop.prototype._notifyOwner = function _notifyOwner() {
      if (this.owner) {
        return this.owner._notify(this);
      }
    };

    return Desktop;
  }();
  Caption = function (_EventHandler) {
    _inherits(Caption, _EventHandler);

    function Caption(owner, el) {
      _classCallCheck(this, Caption);

      var dragging, mouseDownHandler, mouseMoveHandler, _mouseUpHandler, offset_x, offset_y, title;

      var _this = _possibleConstructorReturn(this, _EventHandler.call(this, el));

      dragging = false;
      offset_x = 0;
      offset_y = 0;
      title = el.querySelector('.wm-title');
      _this.close = createElement('button', title, 'wm-close', {
        title: 'Close'
      });
      _this.close.addEventListener('click', function () {
        _this.trigger('wm.close');
      }, false);
      mouseDownHandler = function mouseDownHandler(e) {
        var elemRect, titleRect;
        if (e.button === 0 && e.target.isSameNode(title)) {
          titleRect = title.getBoundingClientRect();
          elemRect = el.getBoundingClientRect();
          dragging = true;
          offset_x = elemRect.left - titleRect.left - e.offsetX;
          offset_y = elemRect.top - titleRect.top - e.offsetY;
          document.addEventListener('mousemove', mouseMoveHandler, false);
          document.addEventListener('mouseup', _mouseUpHandler, false);
          e.preventDefault();
        }
      };
      mouseMoveHandler = function mouseMoveHandler(e) {
        if (dragging) {
          owner._moveElement(el, offset_x + e.clientX, offset_y + e.clientY);
          e.preventDefault();
        }
      };
      _mouseUpHandler = function mouseUpHandler() {
        var rect;
        if (dragging) {
          document.removeEventListener('mousemove', mouseMoveHandler, false);
          document.removeEventListener('mouseup', _mouseUpHandler, false);
          rect = el.getBoundingClientRect();
          el.style.left = rect.left + 'px';
          el.style.top = rect.top + 'px';
          dragging = false;
        }
      };
      title.addEventListener('mousedown', mouseDownHandler, false);
      return _this;
    }

    return Caption;
  }(EventHandler);
  Control = function (_EventHandler2) {
    _inherits(Control, _EventHandler2);

    function Control(el, role, outer) {
      _classCallCheck(this, Control);

      var _this2 = _possibleConstructorReturn(this, _EventHandler2.call(this, el));

      (outer || el).classList.add('wm-ctl');
      if (role != null) {
        setRole(el, role);
      }
      return _this2;
    }

    return Control;
  }(EventHandler);
  Label = function (_Control) {
    _inherits(Label, _Control);

    function Label(el) {
      _classCallCheck(this, Label);

      return _possibleConstructorReturn(this, _Control.call(this, el));
    }

    return Label;
  }(Control);
  FormControl = function (_Control2) {
    _inherits(FormControl, _Control2);

    function FormControl(el, role, outer) {
      _classCallCheck(this, FormControl);

      var _this4 = _possibleConstructorReturn(this, _Control2.call(this, el, role, outer));

      el.classList.add('wm-ctl-form');
      Object.defineProperty(_this4, 'value', {
        get: function get() {
          return _this4.el.value;
        },
        set: function set(v) {
          return _this4.el.value = v;
        }
      });
      return _this4;
    }

    return FormControl;
  }(Control);
  Button = function (_FormControl) {
    _inherits(Button, _FormControl);

    function Button(el) {
      _classCallCheck(this, Button);

      var type;

      var _this5 = _possibleConstructorReturn(this, _FormControl.call(this, el, 'button'));

      el.classList.add('wm-btn');
      type = el.getAttribute('type');
      if (!type) {
        if (el.classList.contains('wm-btn-ok')) {
          type = 'submit';
        } else {
          type = 'button';
        }
        el.type = type;
      }
      return _this5;
    }

    return Button;
  }(FormControl);
  Check = function (_FormControl2) {
    _inherits(Check, _FormControl2);

    function Check(el) {
      _classCallCheck(this, Check);

      var _this6 = _possibleConstructorReturn(this, _FormControl2.call(this, el, 'checkbox'));

      el.classList.add('wm-chk');
      Object.defineProperty(_this6, 'checked', {
        get: function get() {
          return _this6.el.checked;
        },
        set: function set(v) {
          return _this6.el.checked = v;
        }
      });
      return _this6;
    }

    return Check;
  }(FormControl);
  Radio = function (_FormControl3) {
    _inherits(Radio, _FormControl3);

    function Radio(el) {
      _classCallCheck(this, Radio);

      var _this7 = _possibleConstructorReturn(this, _FormControl3.call(this, el, 'radio'));

      el.classList.add('wm-radio');
      Object.defineProperty(_this7, 'checked', {
        get: function get() {
          return _this7.el.checked;
        },
        set: function set(v) {
          return _this7.el.checked = v;
        }
      });
      return _this7;
    }

    return Radio;
  }(FormControl);
  Progress = function (_FormControl4) {
    _inherits(Progress, _FormControl4);

    function Progress(el) {
      _classCallCheck(this, Progress);

      var _this8 = _possibleConstructorReturn(this, _FormControl4.call(this, el, 'progressbar'));

      el.classList.add('wm-progress');
      Object.defineProperty(_this8, 'max', {
        get: function get() {
          return _this8.el.max;
        },
        set: function set(v) {
          return _this8.el.max = v;
        }
      });
      return _this8;
    }

    return Progress;
  }(FormControl);
  Combo = function (_FormControl5) {
    _inherits(Combo, _FormControl5);

    function Combo(el) {
      _classCallCheck(this, Combo);

      var old, outer, parent;
      old = el;
      parent = el.parentNode;
      outer = createElement('span', null, 'wm-cmb', old.outerHTML);
      parent.insertBefore(outer, old);
      parent.removeChild(old);
      el = outer.querySelector('select');

      var _this9 = _possibleConstructorReturn(this, _FormControl5.call(this, el, null, outer));

      _this9.outer = outer;
      return _this9;
    }

    return Combo;
  }(FormControl);
  TextBox = function (_FormControl6) {
    _inherits(TextBox, _FormControl6);

    function TextBox(el) {
      _classCallCheck(this, TextBox);

      var _this10 = _possibleConstructorReturn(this, _FormControl6.call(this, el));

      el.classList.add('wm-textbox');
      return _this10;
    }

    return TextBox;
  }(FormControl);
  Edit = function (_TextBox) {
    _inherits(Edit, _TextBox);

    function Edit(el) {
      _classCallCheck(this, Edit);

      var _this11 = _possibleConstructorReturn(this, _TextBox.call(this, el));

      el.classList.add('wm-edit');
      return _this11;
    }

    return Edit;
  }(TextBox);
  Memo = function (_TextBox2) {
    _inherits(Memo, _TextBox2);

    function Memo(el) {
      _classCallCheck(this, Memo);

      var _this12 = _possibleConstructorReturn(this, _TextBox2.call(this, el));

      el.classList.add('wm-memo');
      return _this12;
    }

    return Memo;
  }(TextBox);
  Group = function (_Control3) {
    _inherits(Group, _Control3);

    function Group(el) {
      _classCallCheck(this, Group);

      var _this13 = _possibleConstructorReturn(this, _Control3.call(this, el));

      el.classList.add('wm-grp');
      return _this13;
    }

    return Group;
  }(Control);
  Tabs = function (_Control4) {
    _inherits(Tabs, _Control4);

    function Tabs(el) {
      _classCallCheck(this, Tabs);

      var i, l, len, pages, t, tabs;

      var _this14 = _possibleConstructorReturn(this, _Control4.call(this, el));

      tabs = el.querySelectorAll('.wm-tab>li');
      pages = el.querySelectorAll('.wm-tabpage>li');
      if (!tabs.length) {
        return _possibleConstructorReturn(_this14);
      }
      setRole(el.querySelector('.wm-tab'), 'tablist');
      setRoleAll(tabs, 'tab');
      setRoleAll(pages, 'tabpanel');
      for (i = l = 0, len = tabs.length; l < len; i = ++l) {
        t = tabs[i];
        if (pages[i]) {
          (function (i) {
            t.addEventListener('click', function () {
              var active, j, len1, m, tt;
              for (j = m = 0, len1 = tabs.length; m < len1; j = ++m) {
                tt = tabs[j];
                active = j === i;
                setActive(tabs[j], active);
                setActive(pages[j], active);
              }
            }, false);
          })(i);
        }
      }
      setActive(tabs[0], true);
      if (pages[0]) {
        setActive(pages[0], true);
      }
      return _this14;
    }

    return Tabs;
  }(Control);
  Footer = function (_Control5) {
    _inherits(Footer, _Control5);

    function Footer(el) {
      _classCallCheck(this, Footer);

      return _possibleConstructorReturn(this, _Control5.call(this, el, 'footer'));
    }

    return Footer;
  }(Control);
  ctlMap = {
    '.wm-lbl': Label,
    '.wm-btn,button': Button,
    'input[type=checkbox]': Check,
    'input[type=radio]': Radio,
    'select': Combo,
    'input:not([type]),input[type=text],input[type=password],input[type=email]': Edit,
    'textarea': Memo,
    'fieldset': Group,
    '.wm-tabs': Tabs,
    'progress': Progress,
    '.wm-footer': Footer
  };
  FakeMap = function () {
    function FakeMap() {
      _classCallCheck(this, FakeMap);

      this.lastIndex = 0;
      this.map = {};
      this.attr = 'data-fmap-' + Date.now();
    }

    FakeMap.prototype.get = function get(el) {
      var val;
      val = el.getAttribute(this.attr);
      return val && this.map[val] || null;
    };

    FakeMap.prototype.set = function set(el, value) {
      var val;
      val = el.getAttribute(this.attr);
      if (!val) {
        val = ++this.lastIndex;
        el.setAttribute(this.attr, val);
      }
      this.map[val] = value;
    };

    return FakeMap;
  }();
  Dialog = function () {
    function Dialog(owner, el) {
      var _this16 = this;

      _classCallCheck(this, Dialog);

      var T, body, cls, e, l, len, ref, selector;
      this.owner = owner;
      this.el = el;
      this.active = false;
      this.centre = true;
      this.map = new FakeMap();
      this.onResize = function () {
        _this16._autoMove();
      };
      setRole(el, owner.modal ? 'alertdialog' : 'dialog');
      el.addEventListener('mousedown', function (e) {
        _this16._activate(e);
      }, false);
      new Caption(owner, el).on('wm.close', function () {
        _this16.close();
      });
      body = el.querySelector('.wm-body');
      for (selector in ctlMap) {
        T = ctlMap[selector];
        ref = body.querySelectorAll(selector);
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          cls = new T(e);
          this._accessData(cls.el, cls);
        }
      }
      this._setResizeListener();
      this._autoMove();
      el.classList.add('wm-shown');
    }

    Dialog.prototype.equals = function equals(src) {
      return this.el.isSameNode(src.el);
    };

    Dialog.prototype.close = function close() {
      //           if @trigger 'wm.closing'
      this.owner._deleteDialog(this);
      window.removeEventListener('resize', this.onResize, false);
      return this;
    };

    Dialog.prototype.move = function move(x, y) {
      this.centre = false;
      this._setResizeListener();
      this.owner._moveElement(this.el, x, y);
      return this;
    };

    Dialog.prototype.resize = function resize(cx, cy) {
      this.owner._resizeElement(this.el, cx, cy);
      this._autoMove();
      return this;
    };

    Dialog.prototype.activate = function activate() {
      this._activate();
      return this;
    };

    Dialog.prototype.find = function find(selector) {
      var e;
      e = this.el.querySelector(selector);
      return e && this._accessData(e);
    };

    Dialog.prototype.findAll = function findAll(selector) {
      var c, e, l, len, ref, result;
      result = [];
      ref = this.el.querySelectorAll(selector);
      for (l = 0, len = ref.length; l < len; l++) {
        e = ref[l];
        c = this._accessData(e);
        if (c != null) {
          result.push(c);
        }
      }
      return result;
    };

    Dialog.prototype.bind = function bind(selector, type, listener) {
      this.findAll(selector).forEach(function (c) {
        c.on(type, listener);
      });
      return this;
    };

    Dialog.prototype.unbind = function unbind(selector, type, listener) {
      this.findAll(selector).forEach(function (c) {
        c.off(type, listener);
      });
      return this;
    };

    Dialog.prototype._accessData = function _accessData(el, val) {
      if (val === void 0) {
        return this.map.get(el);
      }
      this.map.set(el, val);
    };

    Dialog.prototype._activate = function _activate(evt) {
      this.owner._bringToTop(this, evt);
    };

    Dialog.prototype._isChildOrSelf = function _isChildOrSelf(src) {
      return this.el.isSameNode(src) || this.el.contains(src);
    };

    Dialog.prototype._setState = function _setState(zi, active, evt) {
      var first;
      if (this.el.style.zIndex !== zi) {
        this.el.style.zIndex = zi;
      }
      if (this.active !== active) {
        this.active = active;
        setActive(this.el, active);
        if (active) {
          if (evt != null) {
            evt.target.focus();
          } else {
            first = this.el.querySelector('.wm-ctl-form');
            if (first != null) {
              first.focus();
            }
          }
        }
      }
    };

    Dialog.prototype._autoMove = function _autoMove() {
      if (this.centre) {
        this.owner._moveToCentre(this.el);
      }
    };

    Dialog.prototype._setResizeListener = function _setResizeListener() {
      if (this.centre) {
        window.addEventListener('resize', this.onResize, false);
      } else {
        window.removeEventListener('resize', this.onResize, false);
      }
    };

    return Dialog;
  }();
  return window.Desktop = Desktop;
})(window, document);