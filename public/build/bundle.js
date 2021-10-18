
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    function changeTheme() {
        const themes = ['theme-green', 'theme-dark', 'theme-light'];

        let currTheme = 0;

        for (let i = 0; i < themes.length; i++) {
            if (document.body.classList.contains(themes[i])) {
                currTheme = i;
                document.body.classList.remove(themes[i]);
            }
        }

        currTheme += 1;
        currTheme %= themes.length;
        setTheme(themes[currTheme]);
    }

    function setTheme(themeName) {
        const themes = ['theme-green', 'theme-dark', 'theme-light'];

        for (let i = 0; i < themes.length; i++) {
            if (document.body.classList.contains(themes[i])) {
                document.body.classList.remove(themes[i]);
            }
        }

        if (themeName && themes.indexOf(themeName) >= 0 && themes.indexOf(themeName) < themes.length) {
            document.body.classList.add(themeName);
            localStorage.setItem('theme', themeName);
        } else if (localStorage.getItem('theme')) {
            document.body.classList.add(localStorage.getItem('theme'));
        } else {
            setTheme('theme-green');
        }
    }

    var theme = {setTheme, changeTheme};

    async function generateWiggle(text, rate, lineCount, lineLength) {
        return new Promise((resolve, _) => {
            let x = Math.PI * 2 *  3/4;
            let output = "";
            let i = 0;

            if (text.length > lineLength) {
                text = text.substring(0, lineLength);
            }

            let radius = Math.round(lineLength / 2) - Math.round(text.length / 2);

            let appendProgressive = () => {
                let iStart = i;
                let maxCount = iStart + 750;
                while (i < maxCount && i < lineCount) {
                    output += ' '.repeat((Math.sin(x) * radius ) + radius) + text + '\n';
                    x += rate;
                    i++;
                }

                if (i < lineCount) {
                    requestAnimationFrame(appendProgressive);
                } else {
                    resolve(output);
                }
            };
            requestAnimationFrame(appendProgressive);
        });
    }

    /* src/App.svelte generated by Svelte v3.44.0 */
    const file = "src/App.svelte";

    // (117:0) {#if error}
    function create_if_block(ctx) {
    	let div;
    	let p;
    	let t;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(/*error*/ ctx[6]);
    			attr_dev(p, "class", "svelte-jbz5gu");
    			add_location(p, file, 118, 1, 4348);
    			attr_dev(div, "id", "error-indicator");
    			attr_dev(div, "class", "svelte-jbz5gu");
    			add_location(div, file, 117, 2, 4251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*error*/ 64) set_data_dev(t, /*error*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fly, { y: 100, duration: 150 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 100, duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(117:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let div8;
    	let div6;
    	let div1;
    	let div0;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let span0;
    	let t8;
    	let div3;
    	let div2;
    	let label1;
    	let t10;
    	let input1;
    	let t11;
    	let span1;
    	let t13;
    	let div5;
    	let div4;
    	let label2;
    	let t15;
    	let input2;
    	let t16;
    	let span2;
    	let t18;
    	let div7;
    	let input3;
    	let t19;
    	let button0;
    	let t20;
    	let t21;
    	let div9;
    	let p1;
    	let t22;
    	let t23;
    	let textarea;
    	let t24;
    	let a;
    	let t26;
    	let button1;
    	let svg;
    	let g0;
    	let rect;
    	let g4;
    	let g3;
    	let g2;
    	let g1;
    	let path;
    	let circle0;
    	let circle1;
    	let circle2;
    	let circle3;
    	let t27;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*error*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Wiggle generator";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Superimpose ascii chacracters on a sine wave :P";
    			t3 = space();
    			div8 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Wiggle rate";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			span0 = element("span");
    			span0.textContent = "Like wavelength";
    			t8 = space();
    			div3 = element("div");
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Line length";
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			span1 = element("span");
    			span1.textContent = "Maximum length of a line";
    			t13 = space();
    			div5 = element("div");
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "Line count";
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			span2 = element("span");
    			span2.textContent = "Number of lines of generated text";
    			t18 = space();
    			div7 = element("div");
    			input3 = element("input");
    			t19 = space();
    			button0 = element("button");
    			t20 = text(/*copyButtonText*/ ctx[5]);
    			t21 = space();
    			div9 = element("div");
    			p1 = element("p");
    			t22 = text(/*output*/ ctx[4]);
    			t23 = space();
    			textarea = element("textarea");
    			t24 = space();
    			a = element("a");
    			a.textContent = "View source code on Github";
    			t26 = space();
    			button1 = element("button");
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			rect = svg_element("rect");
    			g4 = svg_element("g");
    			g3 = svg_element("g");
    			g2 = svg_element("g");
    			g1 = svg_element("g");
    			path = svg_element("path");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			circle3 = svg_element("circle");
    			t27 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h1, "class", "svelte-jbz5gu");
    			add_location(h1, file, 73, 1, 1868);
    			attr_dev(p0, "class", "svelte-jbz5gu");
    			add_location(p0, file, 74, 1, 1895);
    			attr_dev(label0, "for", "wiggle-text");
    			attr_dev(label0, "class", "svelte-jbz5gu");
    			add_location(label0, file, 79, 6, 2079);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "wiggle-rate");
    			attr_dev(input0, "id", "wiggle-rate");
    			attr_dev(input0, "class", "svelte-jbz5gu");
    			add_location(input0, file, 80, 6, 2130);
    			attr_dev(span0, "class", "tooltip svelte-jbz5gu");
    			add_location(span0, file, 81, 6, 2216);
    			attr_dev(div0, "id", "wiggle-rate-wrapper");
    			attr_dev(div0, "class", "wrapper svelte-jbz5gu");
    			add_location(div0, file, 78, 5, 2026);
    			attr_dev(div1, "class", "split svelte-jbz5gu");
    			add_location(div1, file, 77, 4, 2001);
    			attr_dev(label1, "for", "line-length");
    			attr_dev(label1, "class", "svelte-jbz5gu");
    			add_location(label1, file, 86, 6, 2366);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "line-length");
    			attr_dev(input1, "id", "line-length");
    			attr_dev(input1, "class", "svelte-jbz5gu");
    			add_location(input1, file, 87, 6, 2417);
    			attr_dev(span1, "class", "tooltip svelte-jbz5gu");
    			add_location(span1, file, 88, 6, 2503);
    			attr_dev(div2, "id", "line-length-wrapper");
    			attr_dev(div2, "class", "wrapper svelte-jbz5gu");
    			add_location(div2, file, 85, 5, 2313);
    			attr_dev(div3, "class", "split svelte-jbz5gu");
    			add_location(div3, file, 84, 4, 2288);
    			attr_dev(label2, "for", "line-count");
    			attr_dev(label2, "class", "svelte-jbz5gu");
    			add_location(label2, file, 93, 6, 2661);
    			attr_dev(input2, "type", "Text");
    			attr_dev(input2, "name", "line-count");
    			attr_dev(input2, "id", "line-count");
    			attr_dev(input2, "class", "svelte-jbz5gu");
    			add_location(input2, file, 94, 6, 2710);
    			attr_dev(span2, "class", "tooltip svelte-jbz5gu");
    			add_location(span2, file, 95, 6, 2793);
    			attr_dev(div4, "id", "line-count-wrapper");
    			attr_dev(div4, "class", "wrapper svelte-jbz5gu");
    			add_location(div4, file, 92, 5, 2609);
    			attr_dev(div5, "class", "split svelte-jbz5gu");
    			add_location(div5, file, 91, 4, 2584);
    			attr_dev(div6, "class", "row svelte-jbz5gu");
    			add_location(div6, file, 76, 3, 1979);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "name", "wiggle-text");
    			attr_dev(input3, "id", "wiggle-text");
    			attr_dev(input3, "placeholder", "wiggle");
    			attr_dev(input3, "class", "svelte-jbz5gu");
    			add_location(input3, file, 100, 3, 2917);
    			attr_dev(div7, "id", "text-wrapper");
    			attr_dev(div7, "class", "svelte-jbz5gu");
    			add_location(div7, file, 99, 2, 2890);
    			attr_dev(div8, "id", "input-options");
    			attr_dev(div8, "class", "svelte-jbz5gu");
    			add_location(div8, file, 75, 1, 1951);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "name", "button");
    			attr_dev(button0, "id", "copy-button");
    			attr_dev(button0, "class", "svelte-jbz5gu");
    			add_location(button0, file, 103, 1, 3030);
    			attr_dev(p1, "id", "output");
    			attr_dev(p1, "contenteditable", "false");
    			attr_dev(p1, "class", "svelte-jbz5gu");
    			add_location(p1, file, 105, 2, 3160);
    			attr_dev(div9, "id", "output-wrapper");
    			attr_dev(div9, "class", "svelte-jbz5gu");
    			add_location(div9, file, 104, 1, 3132);
    			attr_dev(textarea, "id", "copy-area");
    			attr_dev(textarea, "class", "i-not-exists svelte-jbz5gu");
    			textarea.readOnly = true;
    			textarea.value = /*output*/ ctx[4];
    			add_location(textarea, file, 108, 1, 3223);
    			attr_dev(a, "href", "https://github.com/arj101/wiggle-generator-web");
    			attr_dev(a, "class", "svelte-jbz5gu");
    			add_location(a, file, 109, 1, 3299);
    			attr_dev(main, "class", "svelte-jbz5gu");
    			add_location(main, file, 72, 0, 1860);
    			attr_dev(rect, "fill", "none");
    			attr_dev(rect, "height", "24");
    			attr_dev(rect, "width", "24");
    			attr_dev(rect, "class", "svelte-jbz5gu");
    			add_location(rect, file, 113, 140, 3616);
    			attr_dev(g0, "class", "svelte-jbz5gu");
    			add_location(g0, file, 113, 137, 3613);
    			attr_dev(path, "d", "M12,22C6.49,22,2,17.51,2,12S6.49,2,12,2s10,4.04,10,9c0,3.31-2.69,6-6,6h-1.77c-0.28,0-0.5,0.22-0.5,0.5 c0,0.12,0.05,0.23,0.13,0.33c0.41,0.47,0.64,1.06,0.64,1.67C14.5,20.88,13.38,22,12,22z M12,4c-4.41,0-8,3.59-8,8s3.59,8,8,8 c0.28,0,0.5-0.22,0.5-0.5c0-0.16-0.08-0.28-0.14-0.35c-0.41-0.46-0.63-1.05-0.63-1.65c0-1.38,1.12-2.5,2.5-2.5H16 c2.21,0,4-1.79,4-4C20,7.14,16.41,4,12,4z");
    			attr_dev(path, "class", "svelte-jbz5gu");
    			add_location(path, file, 113, 198, 3674);
    			attr_dev(circle0, "cx", "6.5");
    			attr_dev(circle0, "cy", "11.5");
    			attr_dev(circle0, "r", "1.5");
    			attr_dev(circle0, "class", "svelte-jbz5gu");
    			add_location(circle0, file, 113, 583, 4059);
    			attr_dev(circle1, "cx", "9.5");
    			attr_dev(circle1, "cy", "7.5");
    			attr_dev(circle1, "r", "1.5");
    			attr_dev(circle1, "class", "svelte-jbz5gu");
    			add_location(circle1, file, 113, 619, 4095);
    			attr_dev(circle2, "cx", "14.5");
    			attr_dev(circle2, "cy", "7.5");
    			attr_dev(circle2, "r", "1.5");
    			attr_dev(circle2, "class", "svelte-jbz5gu");
    			add_location(circle2, file, 113, 654, 4130);
    			attr_dev(circle3, "cx", "17.5");
    			attr_dev(circle3, "cy", "11.5");
    			attr_dev(circle3, "r", "1.5");
    			attr_dev(circle3, "class", "svelte-jbz5gu");
    			add_location(circle3, file, 113, 690, 4166);
    			attr_dev(g1, "class", "svelte-jbz5gu");
    			add_location(g1, file, 113, 195, 3671);
    			attr_dev(g2, "class", "svelte-jbz5gu");
    			add_location(g2, file, 113, 192, 3668);
    			attr_dev(g3, "class", "svelte-jbz5gu");
    			add_location(g3, file, 113, 189, 3665);
    			attr_dev(g4, "class", "svelte-jbz5gu");
    			add_location(g4, file, 113, 186, 3662);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "enable-background", "new 0 0 24 24");
    			attr_dev(svg, "height", "24px");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24px");
    			attr_dev(svg, "fill", "#000000");
    			attr_dev(svg, "class", "svelte-jbz5gu");
    			add_location(svg, file, 113, 1, 3477);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "name", "button");
    			attr_dev(button1, "id", "theme-switcher");
    			attr_dev(button1, "class", "svelte-jbz5gu");
    			add_location(button1, file, 112, 0, 3396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			append_dev(main, div8);
    			append_dev(div8, div6);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			set_input_value(input0, /*wiggleRate*/ ctx[1]);
    			append_dev(div0, t6);
    			append_dev(div0, span0);
    			append_dev(div6, t8);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t10);
    			append_dev(div2, input1);
    			set_input_value(input1, /*lineLength*/ ctx[2]);
    			append_dev(div2, t11);
    			append_dev(div2, span1);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t15);
    			append_dev(div4, input2);
    			set_input_value(input2, /*lineCount*/ ctx[3]);
    			append_dev(div4, t16);
    			append_dev(div4, span2);
    			append_dev(div8, t18);
    			append_dev(div8, div7);
    			append_dev(div7, input3);
    			set_input_value(input3, /*text*/ ctx[0]);
    			append_dev(main, t19);
    			append_dev(main, button0);
    			append_dev(button0, t20);
    			append_dev(main, t21);
    			append_dev(main, div9);
    			append_dev(div9, p1);
    			append_dev(p1, t22);
    			append_dev(main, t23);
    			append_dev(main, textarea);
    			append_dev(main, t24);
    			append_dev(main, a);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, svg);
    			append_dev(svg, g0);
    			append_dev(g0, rect);
    			append_dev(svg, g4);
    			append_dev(g4, g3);
    			append_dev(g3, g2);
    			append_dev(g2, g1);
    			append_dev(g1, path);
    			append_dev(g1, circle0);
    			append_dev(g1, circle1);
    			append_dev(g1, circle2);
    			append_dev(g1, circle3);
    			insert_dev(target, t27, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[11]),
    					listen_dev(button0, "click", /*copyOutput*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", theme.changeTheme, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*wiggleRate*/ 2 && input0.value !== /*wiggleRate*/ ctx[1]) {
    				set_input_value(input0, /*wiggleRate*/ ctx[1]);
    			}

    			if (dirty & /*lineLength*/ 4 && input1.value !== /*lineLength*/ ctx[2]) {
    				set_input_value(input1, /*lineLength*/ ctx[2]);
    			}

    			if (dirty & /*lineCount*/ 8) {
    				set_input_value(input2, /*lineCount*/ ctx[3]);
    			}

    			if (dirty & /*text*/ 1 && input3.value !== /*text*/ ctx[0]) {
    				set_input_value(input3, /*text*/ ctx[0]);
    			}

    			if (!current || dirty & /*copyButtonText*/ 32) set_data_dev(t20, /*copyButtonText*/ ctx[5]);
    			if (!current || dirty & /*output*/ 16) set_data_dev(t22, /*output*/ ctx[4]);

    			if (!current || dirty & /*output*/ 16) {
    				prop_dev(textarea, "value", /*output*/ ctx[4]);
    			}

    			if (/*error*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*error*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t27);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isNumber(string) {
    	if (string.length == 0) return false;
    	let periodCounter = 0;

    	for (const c of string.split('')) {
    		if (isNaN(parseInt(c))) {
    			if (c == '.') {
    				if (++periodCounter > 1) return false;
    			} else {
    				return false;
    			}
    		}
    	}

    	return true;
    }

    function instance($$self, $$props, $$invalidate) {
    	let _;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	theme.setTheme();
    	let text = '';
    	let wiggleRate = "0.2";
    	let lineLength = "50";
    	let lineCount = "100";
    	let output = '';
    	let copyButtonText = "Copy text";
    	let error = '';

    	function copyOutput() {
    		const inputElement = document.querySelector("#copy-area");
    		inputElement.select();
    		inputElement.setSelectionRange(0, 9999999); /* For mobile devices */
    		document.execCommand("copy");
    		$$invalidate(5, copyButtonText = "Copied!");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		wiggleRate = this.value;
    		$$invalidate(1, wiggleRate);
    	}

    	function input1_input_handler() {
    		lineLength = this.value;
    		$$invalidate(2, lineLength);
    	}

    	function input2_input_handler() {
    		lineCount = this.value;
    		$$invalidate(3, lineCount);
    	}

    	function input3_input_handler() {
    		text = this.value;
    		$$invalidate(0, text);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		setTheme: theme.setTheme,
    		changeTheme: theme.changeTheme,
    		generateWiggle,
    		text,
    		wiggleRate,
    		lineLength,
    		lineCount,
    		output,
    		copyButtonText,
    		error,
    		isNumber,
    		copyOutput,
    		_
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('wiggleRate' in $$props) $$invalidate(1, wiggleRate = $$props.wiggleRate);
    		if ('lineLength' in $$props) $$invalidate(2, lineLength = $$props.lineLength);
    		if ('lineCount' in $$props) $$invalidate(3, lineCount = $$props.lineCount);
    		if ('output' in $$props) $$invalidate(4, output = $$props.output);
    		if ('copyButtonText' in $$props) $$invalidate(5, copyButtonText = $$props.copyButtonText);
    		if ('error' in $$props) $$invalidate(6, error = $$props.error);
    		if ('_' in $$props) _ = $$props._;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wiggleRate, lineCount, lineLength, text*/ 15) {
    			_ = (async () => {
    				let validatedInput;

    				if (isNumber(wiggleRate) && isNumber(lineCount) && isNumber(lineLength)) {
    					const wiggleRateNum = parseFloat(wiggleRate);
    					const lineCountNum = parseInt(lineCount);
    					const lineLengthNum = parseInt(lineLength);

    					if (lineLengthNum > 1000) {
    						$$invalidate(6, error = "Line length should not be more than 1000 (not optimised, yet!)");
    					} else {
    						validatedInput = {
    							wiggleRateNum,
    							lineCountNum,
    							lineLengthNum
    						};

    						$$invalidate(6, error = '');
    					}
    				} else {
    					if (!isNumber(wiggleRate)) {
    						$$invalidate(6, error = "Wiggle rate is not a valid positive number");
    					} else if (!isNumber(lineCount)) {
    						$$invalidate(6, error = "Line count is not a valid positive number");
    					} else if (!isNumber(lineLength)) {
    						$$invalidate(6, error = "Line length is not a valid positive number");
    					}
    				}

    				if (validatedInput) {
    					$$invalidate(5, copyButtonText = "Copy text");
    					$$invalidate(4, output = await generateWiggle(text ? text : 'wiggle', validatedInput.wiggleRateNum, validatedInput.lineCountNum, validatedInput.lineLengthNum));
    				}
    			})();
    		}
    	};

    	return [
    		text,
    		wiggleRate,
    		lineLength,
    		lineCount,
    		output,
    		copyButtonText,
    		error,
    		copyOutput,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
