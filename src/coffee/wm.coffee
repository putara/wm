do (window, document) ->
    ZIND_FIRST = 10000
    MAX_DLGS = 100

    createElement = (tag, parent, cls, html, attrs) ->
        e = document.createElement tag
        e.className = cls
        if typeof html is 'string'
            e.innerHTML = html
        else
            attrs = html
        if attrs
            for k of attrs
                v = attrs[k]
                if k is 'css'
                    for p of v
                        e.style[p] = v[p]
                else
                    e.setAttribute k, v
        parent.appendChild e if parent?
        return e

    createTextNode = (text, parent) ->
        node = document.createTextNode text
        parent.appendChild node
        return node

    setRole = (el, role) ->
        el.setAttribute 'role', role
        return

    setRoleAll = (el, role) ->
        setRole e, role for e in el
        return

    isActive = (el) ->
        el.classList.contains 'wm-active'

    setActive = (el, active) ->
        # IE doesn't support classList.toggle()
        el.classList[if active then 'add' else 'remove']('wm-active')
        return

    createEvent = (type) ->
        evt = document.createEvent 'Event'
        evt.initEvent type, false, true
        return evt

    class EventHandler
        constructor: (@el) ->
            self = this
            @list = {}
            @dispatcher = (e) ->
                for listener in self.list[e.type]
                    listener.call self, e

        on: (type, listener) ->
            unless @list[type]
                @list[type] = []
                @el.addEventListener type, @dispatcher, false
            @list[type].push listener
            this

        off: (type, listener) ->
            if @list[type]
                a = @list[type]
                index = a.indexOf listener
                if index isnt -1
                    a.splice index, 1
                    unless a.length
                        @list[type] = undefined
                        @el.removeEventListener type, @dispatcher, false
            this

        trigger: (event) ->
            if typeof event is 'string'
                event = createEvent(event)
            @el.dispatchEvent event
            this

    class Desktop
        constructor: (opts) ->
            opts = opts or {}
            @parent = opts.node or document.body
            @zindex = if opts.owner then opts.owner.zindex + 1 else 0
            @owner = opts.owner
            @list = []
            @modal = !!(opts.modal or opts.owner)
            @desktop = null
            @overlay = null
            @active = true

        _getClientSize: () ->
            s = {}
            if document.body
                unless @desktop and @desktop.parentNode
                    @desktop = createElement 'div', @parent, 'wm-desktop'
                s = window.getComputedStyle? @desktop
            return {
                width: parseInt(s.width) or window.innerWidth,
                height: parseInt(s.height) or window.innerHeight
            }

        _moveElement: (el, x, y) ->
            style = el.style
            x += 'px' if typeof x == 'number'
            y += 'px' if typeof y == 'number'
            style.left = x
            style.top = y
            @_adjustLocation el
            return

        _resizeElement: (el, cx, cy) ->
            style = el.style
            cx += 'px' if typeof cx == 'number'
            style.width = cx
            if cy?
                cy += 'px' if typeof cy == 'number'
                style.height = cy
            @_adjustLocation el
            return

        _moveToCentre: (el) ->
            rect = el.getBoundingClientRect()
            size = @_getClientSize()
            x = ((size.width - rect.width) / 2) | 0
            y = ((size.height - rect.height) / 2) | 0
            @_moveElement el, x, y
            return

        _adjustLocation: (el) ->
            x = el.offsetLeft
            y = el.offsetTop
            rect = el.getBoundingClientRect()
            size = @_getClientSize()
            if x + rect.width > size.width
                x = size.width - rect.width
            if x < 0
                x = 0
            if y + rect.height > size.height
                y = size.height - rect.height
            if y < 0
                y = 0
            el.style.left = x + 'px'
            el.style.top  = y + 'px'
            return

        indexOf: (dlg) ->
            for d, i in @list
                if d.equals dlg
                    return i
            return -1

        newDialog: (body, opts) ->
            if @list.length >= (MAX_DLGS - 1)
                throw 'Maximum windows exceeded'
            if @modal and !@overlay
                @overlay = createElement 'div', @parent, 'wm-modal', {
                    css: { zIndex: @_zIndex(0) }
                }
            return unless body
            title = if opts?.title? then opts.title else opts
            unless title?
                title = document.title
            el = createElement 'form', @parent, 'wm-dlg'
            t = createElement 'div', el, 'wm-title'
            createTextNode title, t
            createElement 'div', el, 'wm-body', body
            dlg = new Dialog(this, el)
            @list.push dlg
            @_update()
            return dlg

        destroy: ->
            for dlg in @list
                @parent.removeChild dlg.el
            @_destroyInternal()
            return

        _deleteDialog: (dlg) ->
            index = @indexOf dlg
            if index != -1
                @parent.removeChild dlg.el
                @list.splice index, 1
                @_update()
                if @list.length == 0
                    @_destroyInternal()
            return

        _destroyInternal: ->
            if @desktop
                @parent.removeChild @desktop
                @desktop = null
            if @overlay
                @parent.removeChild @overlay
                @overlay = null
            return

        _bringToTop: (dlg, evt) ->
            index = @indexOf dlg
            if index != -1
                @list.push @list.splice(index, 1)[0]
                @_update evt
            return

        _zIndex: (i) ->
            return ZIND_FIRST + @zindex * MAX_DLGS + i

        _update: (evt) ->
            @_notifyOwner()
            ub = @list.length - 1
            for d, i in @list
                d._setState @_zIndex(i + 1), @active and i >= ub, evt
            return

        _notify: (child) ->
            active = child.list.length == 0
            if @active isnt active
                @active = active
                @_update()

        _notifyOwner: ->
            @owner._notify this if @owner

    class Caption extends EventHandler
        constructor: (owner, el) ->
            super(el)
            dragging = no
            offset_x = 0
            offset_y = 0
            title = el.querySelector '.wm-title'

            @close = createElement 'button', title, 'wm-close', title: 'Close'
            @close.addEventListener 'click', =>
                @trigger 'wm.close'
                return
            , false

            mouseDownHandler = (e) ->
                if e.button is 0 and e.target.isSameNode title
                    titleRect = title.getBoundingClientRect()
                    elemRect = el.getBoundingClientRect()
                    dragging = yes
                    offset_x = elemRect.left - titleRect.left - e.offsetX
                    offset_y = elemRect.top  - titleRect.top  - e.offsetY
                    document.addEventListener 'mousemove', mouseMoveHandler, false
                    document.addEventListener 'mouseup', mouseUpHandler, false
                    e.preventDefault()
                return

            mouseMoveHandler = (e) ->
                if dragging
                    owner._moveElement el, offset_x + e.clientX, offset_y + e.clientY
                    e.preventDefault()
                return

            mouseUpHandler = () ->
                if dragging
                    document.removeEventListener 'mousemove', mouseMoveHandler, false
                    document.removeEventListener 'mouseup', mouseUpHandler, false
                    rect = el.getBoundingClientRect()
                    el.style.left = rect.left + 'px'
                    el.style.top  = rect.top  + 'px'
                    dragging = no
                return

            title.addEventListener 'mousedown', mouseDownHandler, false

    class Control extends EventHandler
        constructor: (el, role, outer) ->
            super(el)
            (outer or el).classList.add 'wm-ctl'
            setRole el, role if role?

    class Label extends Control
        constructor: (el) ->
            super(el)

    class FormControl extends Control
        constructor: (el, role, outer) ->
            super(el, role, outer)
            el.classList.add 'wm-ctl-form'
            Object.defineProperty this, 'value',
                get: => @el.value,
                set: (v) => @el.value = v

    class Button extends FormControl
        constructor: (el) ->
            super(el, 'button')
            el.classList.add 'wm-btn'
            type = el.getAttribute 'type'
            unless type
                if el.classList.contains 'wm-btn-ok'
                    type = 'submit'
                else
                    type = 'button'
                el.type = type

    class Check extends FormControl
        constructor: (el) ->
            super(el, 'checkbox')
            el.classList.add 'wm-chk'
            Object.defineProperty this, 'checked',
                get: => @el.checked,
                set: (v) => @el.checked = v

    class Radio extends FormControl
        constructor: (el) ->
            super(el, 'radio')
            el.classList.add 'wm-radio'
            Object.defineProperty this, 'checked',
                get: => @el.checked,
                set: (v) => @el.checked = v

    class Progress extends FormControl
        constructor: (el) ->
            super(el, 'progressbar')
            el.classList.add 'wm-progress'
            Object.defineProperty this, 'max',
                get: => @el.max,
                set: (v) => @el.max = v

    class Combo extends FormControl
        constructor: (el) ->
            old = el
            parent = el.parentNode
            outer = createElement 'span', null, 'wm-cmb', old.outerHTML
            parent.insertBefore outer, old
            parent.removeChild old
            el = outer.querySelector 'select'
            super(el, null, outer)
            @outer = outer

    class TextBox extends FormControl
        constructor: (el) ->
            super(el)
            el.classList.add 'wm-textbox'

    class Edit extends TextBox
        constructor: (el) ->
            super(el)
            el.classList.add 'wm-edit'

    class Memo extends TextBox
        constructor: (el) ->
            super(el)
            el.classList.add 'wm-memo'

    class Group extends Control
        constructor: (el) ->
            super(el)
            el.classList.add 'wm-grp'

    class Tabs extends Control
        constructor: (el) ->
            super(el)
            tabs = el.querySelectorAll '.wm-tab>li'
            pages = el.querySelectorAll '.wm-tabpage>li'
            return unless tabs.length

            setRole el.querySelector('.wm-tab'), 'tablist'
            setRoleAll tabs, 'tab'
            setRoleAll pages, 'tabpanel'

            for t, i in tabs when pages[i]
                do (i) ->
                    t.addEventListener 'click', ->
                        for tt, j in tabs
                            active = j is i
                            setActive tabs[j], active
                            setActive pages[j], active
                        return
                    , false
                    return

            setActive tabs[0], true
            setActive pages[0], true if pages[0]

    class Footer extends Control
        constructor: (el) ->
            super(el, 'footer')

    ctlMap = {
        '.wm-lbl': Label
        '.wm-btn,button': Button
        'input[type=checkbox]': Check
        'input[type=radio]': Radio
        'select': Combo
        'input:not([type]),input[type=text],input[type=password],input[type=email]': Edit
        'textarea': Memo
        'fieldset': Group
        '.wm-tabs': Tabs
        'progress': Progress
        '.wm-footer': Footer
    }

    class FakeMap
        constructor: ->
            @lastIndex = 0
            @map = {}
            @attr = 'data-fmap-' + Date.now()

        get: (el) ->
            val = el.getAttribute @attr
            (val and @map[val]) or null

        set: (el, value) ->
            val = el.getAttribute @attr
            unless val
                val = ++@lastIndex
                el.setAttribute @attr, val
            @map[val] = value
            return

    class Dialog
        constructor: (owner, el) ->
            @owner = owner
            @el = el
            @active = false
            @centre = true
            @map = new FakeMap()
            @onResize = =>
                @_autoMove()
                return

            setRole el, if owner.modal then 'alertdialog' else 'dialog'

            el.addEventListener 'mousedown', (e) =>
                @_activate e
                return
            , false

            new Caption(owner, el).on 'wm.close', =>
                @close()
                return

            body = el.querySelector '.wm-body'
            for selector of ctlMap
                T = ctlMap[selector]
                for e in body.querySelectorAll selector
                    cls = new T(e)
                    @_accessData cls.el, cls

            @_setResizeListener()
            @_autoMove()
            el.classList.add 'wm-shown'

        equals: (src) ->
            @el.isSameNode src.el

        close: ->
#           if @trigger 'wm.closing'
            @owner._deleteDialog this
            window.removeEventListener 'resize', @onResize, false
            this

        move: (x, y) ->
            @centre = false
            @_setResizeListener()
            @owner._moveElement @el, x, y
            this

        resize: (cx, cy) ->
            @owner._resizeElement @el, cx, cy
            @_autoMove()
            this

        activate: ->
            @_activate()
            this

        find: (selector) ->
            e = @el.querySelector selector
            e and @_accessData e

        findAll: (selector) ->
            result = []
            for e in @el.querySelectorAll selector
                c = @_accessData e
                result.push c if c?
            result

        bind: (selector, type, listener) ->
            @findAll(selector).forEach (c) =>
                c.on type, listener
                return
            this

        unbind: (selector, type, listener) ->
            @findAll(selector).forEach (c) =>
                c.off type, listener
                return
            this

        _accessData: (el, val) ->
            if val == undefined
                return @map.get el
            @map.set el, val
            return

        _activate: (evt) ->
            @owner._bringToTop this, evt
            return

        _isChildOrSelf: (src) ->
            @el.isSameNode(src) or @el.contains(src)

        _setState: (zi, active, evt) ->
            if @el.style.zIndex isnt zi
                @el.style.zIndex = zi
            if @active != active
                @active = active
                setActive @el, active
                if active
                    if evt?
                        evt.target.focus()
                    else
                        first = @el.querySelector('.wm-ctl-form')
                        first.focus() if first?
            return

        _autoMove: () ->
            @owner._moveToCentre @el if @centre
            return

        _setResizeListener: () ->
            if @centre
                window.addEventListener 'resize', @onResize, false
            else
                window.removeEventListener 'resize', @onResize, false
            return

    window.Desktop = Desktop
