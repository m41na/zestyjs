class DomModel{

    constructor(data){
        this.data = this.observe(data);
    }

    watch(obj, key){
        let val = obj[key];
        let self = this;

        Object.defineProperty(obj, key, {
            get: function(key){
                return val;
            },
            set: function(newval){
                val = newval;
                self.onChange(obj);
            }
        });
    }

    wrap(obj){
        let self = this;

        class MArray extends Array{

            constructor(arr){
                super();
            }

            pop(){
                super.pop();
                self.onChange(this);
            }

            splice(index, count, newvals){
                let args = [index, count];
                if(newvals) args.concat(newvals);
                Reflect.apply(super.splice, this, args);
                self.onChange(this);
            }
        }

        return MArray.from(obj);
    }

    enhance(obj){
        let self = this;

        Object.defineProperty(obj, 'notify', {
            value: []
        });

        Object.defineProperty(obj, 'observe', {
            value: function (callback) {
                console.log('now observing ', obj);
                obj.notify.push(callback);
            }
        });

        Object.defineProperty(obj, 'ref', {
            value: undefined,
            writable: true
        });

        Object.defineProperty(obj, 'bubble', {
            value: function(){
                self.onChange(obj.ref);
            }
        });
    }

    observe(obj) {
        this.enhance(obj);
        //examine properties
        for (let key in obj) {
            if (key !== 'ref' && obj.hasOwnProperty(key)) {
                this.watch(obj, key);
                //observe nested object values
                let val = obj[key];
                if (this.isObject(val)) {
                    this.observe(val);
                    val.ref = obj;
                    continue;
                }
                
                //observe array container
                if (this.isArray(val)) {
                    let array = this.wrap(val);
                    this.enhance(array);
                    array.ref = obj;
                    //watch for operations affecting length (pop, splice, shift, unshift)
                    obj[key] = array;
                    for (let i = 0; i < val.length; i++) {
                        if (this.isObject(val[i])) {
                            this.observe(val[i]);
                            val[i].ref = array;
                        }
                    }
                }
            }
        }
        return obj;
    }

    onChange(obj){
        console.log('changed detected in ', obj);
        if (obj && obj.notify) {
            if(obj.notify.length > 0){
                obj.notify.forEach(callback => callback());
            }
            else{
                obj.bubble();
            }
        }
    }

    push$(target, value){
        const observable = new DomModel(value);
        target.push(observable.data); 
        observable.data.ref = target;
        this.onChange(target);
    }

    splice$(target, index, count, newvals) {
        if(!newvals){
            throw Error('expecting value to insert with this method');
        }                
        const observable = new DomModel(newvals);
        let args = [index, count].concat(observable.data);
        Reflect.apply(target.splice, this, args);
        observable.data.ref = target;
        self.onChange(this);
    }

    set$(target, key, value){
        const observable = new DomModel(value);
        target[key] = observable.data;
        observable.data.ref = target;
        this.onChange(target);
    }

    delete$(target, key){
        delete target[key];
        this.onChange(target);
    }

    isObject(value) {
        return value && typeof value === 'object' && value.constructor == Object;
    }

    isArray(value) {
        return value && typeof value === 'object' && value.constructor == Array;
    }
}

class DomNode {

    constructor(node){
        this.value = this.create(node);
    }

    static selectorId(){
        let num = 0;
        return function(type){
            return type.concat(num++);
        }
    }
    
    static evalWithContext(expr) {
        return function (ctx) {
            let params = Object.keys(ctx).map(e => { return { param: e, value: ctx[e] } });
            let arg_names = params.map(e => e.param).reduce((acc, curr) => {
                return acc += (", " + curr)
            }, "");
            let arg_values = params.map(e => e.value);
            let function_body = "return function(expr" + arg_names + "){ return " + expr + ";}";
            let callback = new Function(function_body);
            return callback().apply(ctx, [expr].concat(arg_values));
        }
    }

    create(node){
        let obj = {};
        obj['data'] = {};
        obj['methods'] = {};
        obj['parent'] = undefined;
        obj['onchange'] = undefined;
        obj['tagname'] = node.tagName || node.nodeName;
        obj['load'] = function () {
            let objWrap = obj.create();
            if (obj.onchange) {
                obj.data.observe(obj.onchange);
            }
            return objWrap;
        };
        if (node.nodeType === 3) {
            let textVal = node.textContent;
            let expr_regex = /@\{(.+?)\}/g;
            let groups = expr_regex.exec(textVal);
            if (groups != null) {
                obj['create'] = function (expr) {
                    return function () {
                        obj["element"] = node;
                        let evaled = DomNode.evalWithContext(expr)(obj.data);
                        obj.element.textContent = textVal.replace(/(@\{.+?\})/g, evaled);                        
                        //return expanded
                        return obj;
                    };
                }(groups[1]);
                obj['update'] = obj['create'];
                obj['onchange'] = obj['update'];
            }
        }
        else if (node.hasAttributes()) {
            obj.attributes = [];
            var attrs = node.attributes;
            for (var i = attrs.length - 1; i >= 0; i--) {
                var attrName = attrs[i].name;
                var attrVal = attrs[i].value;

                let groups = /@\{(.+?)\}/g.exec(attrVal);
                if (groups != null) {
                    obj['create'].push(function (expr) {
                        return function () {
                            let evaled = DomNode.evalWithContext(expr)(obj.data);
                            if (obj.element.nodeType == 1 && obj.element.hasAttribute(attrName)) {
                                obj.element.setAttribute(attrName, attrVal.replace(/(@\{.+?\})/g, evaled));
                            }
                            //return expanded
                            return obj;
                        }
                    }(groups[1]));
                    obj['update'] = obj['create'];
                    obj['onchange'] = obj['update'];
                }

                if (attrName === 'data-on-for') {
                    node.removeAttribute(attrName);
                    //preserve the markup in template
                    obj['template'] = node.outerHTML;
                    var for_reg = /(.+?)(,\s*(\b.+?))?\s*in\s*(.+)/g;
                    let groups = for_reg.exec(attrVal);
                    if (groups != null) {
                        obj['create'] = function (key, index, items) {
                            return function () {
                                let for_ctx = DomNode.evalWithContext(items)(obj.data);
                                let frag = document.createDocumentFragment();
                                for (var i = 0; i < for_ctx.length; i++) {
                                    let ctx = for_ctx[i];
                                    if (index) {
                                        ctx[index] = i;
                                    }
                                    //create element
                                    let templ = document.createElement('template');
                                    templ.innerHTML = obj.template;
                                    let newElement = templ.content.firstElementChild;
                                    let newObj = new DomNode(newElement).value;
                                    newObj.data = ctx;
                                    newObj.methods = obj.methods;
                                    newObj.parent = obj;
                                    //load newElement
                                    frag.appendChild(newObj.load().element);
                                }
                                obj.element = frag;
                                //return expanded
                                return obj;
                            }
                        }(groups[1], groups[3], groups[4]);
                        obj['update'] = function (key, index, items) {
                            return function () {
                                let old = obj.elids.splice(0, obj.elids.length);
                                let elements = obj.create(key, index, items);
                                //replace elements in the DOM (identified by element keys)
                                let parent;
                                while (old.length > 0) {
                                    let child = document.querySelector(old.splice(0, 1));
                                    parent = child.parentElement;
                                    parent.removeChild(child);
                                }
                                //add new elements
                                parent.appendChild(elements);
                            }
                        }(groups[1], groups[3], groups[4]);
                        obj['onchange'] = obj['update'];
                    }
                    continue;
                }
                if (attrName === 'data-on-show') {
                    node.removeAttribute(attrName);
                    //preserve the markup in template
                    obj['template'] = node.outerHTML;
                    var if_reg = /\{(.+?\s*):\s*(.+?)\}/g;
                    let groups = if_reg.exec(attrVal);
                    if (groups != null) {
                        obj['create'] = function (handler, expr) {
                            return function () {
                                let evaled = DomNode.evalWithContext(expr)(obj.data);
                                if (evaled) {
                                    let frag = document.createDocumentFragment();
                                    //create element
                                    let templ = document.createElement('template');
                                    templ.innerHTML = obj.template;
                                    let newElement = templ.content.firstElementChild;
                                    let newObj = new DomNode(newElement).value;
                                    newObj.data = obj.data;
                                    newObj.methods = obj.methods;
                                    newObj.parent = obj;
                                    frag.appendChild(newObj.load().element);
                                    //invoke handler
                                    newObj.methods[handler].call(newObj, frag.firstElementChild);
                                    //set element value
                                    obj.element = frag;
                                    //return expanded
                                    return obj;
                                }
                            }
                        }(groups[1], groups[2]);
                        obj['update'] = function (handler, expr) {
                            return function () {
                                let evaled = DomNode.evalWithContext(expr)(obj.data);
                                let elid = obj.elids[0];
                                //replace elements in the DOM (identified by element keys)
                                let child = document.querySelector(elid);
                                child.style.display = evaled? '' : 'none';
                            }
                        }(groups[1], groups[2]);
                        obj['onchange'] = obj['update'];
                    }
                    continue;
                }
                if (attrName === 'data-on-if') {
                    node.removeAttribute(attrName);
                    //preserve the markup in template
                    obj['template'] = node.outerHTML;
                    //if-condition
                    var if_reg = /\{(.+?\s*):\s*(.+?)\}/g;
                    let groups = if_reg.exec(attrVal);
                    if (groups != null) {
                        obj['evaluate'] = function(){
                            let evaled = DomNode.evalWithContext(groups[2])(obj.data);
                            return evaled;
                        };
                        obj['create'] = function (handler) {
                            return function () {
                                let evaled = obj.evaluate();
                                if (evaled) {
                                    let frag = document.createDocumentFragment();
                                    //create element
                                    let templ = document.createElement('template');
                                    templ.innerHTML = obj.template;
                                    let newElement = templ.content.firstElementChild;
                                    let newObj = new DomNode(newElement).value;
                                    newObj.data = obj.data;
                                    newObj.methods = obj.methods;
                                    newObj.parent = obj;
                                    frag.appendChild(newObj.load().element);
                                    //invoke handler
                                    newObj.methods[handler].call(newObj, frag.firstElementChild);
                                    //set element value
                                    node.appendChild(frag);
                                }
                                
                                obj["element"] = node;
                                //return expanded
                                return obj;
                            }
                        }(groups[1]);
                        obj['update'] = function (handler, expr) {
                            return function () {
                                let evaled = DomNode.evalWithContext(expr)(obj.data);
                                let elid = obj.elids[0];
                                //replace elements in the DOM (identified by element keys)
                                let child = document.querySelector(elid);
                                child.style.display = evaled? '' : 'none';
                            }
                        }(groups[1], groups[2]);
                        obj['onchange'] = obj['update'];
                    }
                    //mark obj as 'if' condition
                    obj['condition'] = 'start_if';
                    continue;
                }
                if (attrName === 'data-on-elif') {
                    node.removeAttribute(attrName);
                    //preserve the markup in template
                    obj['template'] = node.outerHTML;
                    //elif condition
                    var elif_reg = /\{(.+?\s*):\s*(.+?)\}/g;
                    let groups = elif_reg.exec(attrVal);
                    if (groups != null) {
                        obj['evaluate'] = function(){
                            let evaled = DomNode.evalWithContext(groups[2])(obj.data);
                            return evaled;
                        };
                        obj['create'] = function (handler) {
                            return function () {
                                let evaled = obj.evaluate();
                                if (evaled) {
                                    let frag = document.createDocumentFragment();
                                    //create element
                                    let templ = document.createElement('template');
                                    templ.innerHTML = obj.template;
                                    let newElement = templ.content.firstElementChild;
                                    let newObj = new DomNode(newElement).value;
                                    newObj.data = obj.data;
                                    newObj.methods = obj.methods;
                                    newObj.parent = obj;
                                    frag.appendChild(newObj.load().element);
                                    //invoke handler
                                    obj.methods[handler].call(obj, frag.firstElementChild);
                                    //set element value
                                    obj.element = frag;
                                }
                                else {
                                    obj["element"] = node;
                                }
                                //return expanded
                                return obj;
                            }
                        }(groups[1]);
                    }
                    //mark obj as 'elif' condition
                    obj['condition'] = 'else_if';
                    continue;
                }
                if (attrName === 'data-on-else') {
                    node.removeAttribute(attrName);
                    //preserve the markup in template
                    obj['template'] = node.outerHTML;
                    //else condition
                    obj['evaluate'] = function(){
                        return true;
                    };
                    obj['create'] = function (handler, expr) {
                        return function () {
                            let frag = document.createDocumentFragment();
                            //create element
                            let templ = document.createElement('template');
                            templ.innerHTML = obj.template;
                            let newElement = templ.content.firstElementChild;
                            let newObj = new DomNode(newElement).value;
                            newObj.data = obj.data;
                            newObj.methods = obj.methods;
                            newObj.parent = obj;
                            frag.appendChild(newObj.load().element);
                            //set element value
                            obj.element = frag;
                            //return expanded
                            return obj;
                        }
                    }();
                    //mark obj as 'else' condition
                    obj['condition'] = 'end_if';
                    continue;
                }
                if (attrName === 'data-on-text') {
                    node.removeAttribute(attrName);

                    node.append(`@{${attrVal}}`);
                    obj.element = node;

                    obj['update'] = function (expr) {
                        return function () {
                            let evaled = DomNode.evalWithContext(expr)(obj.data);
                            while (obj.element.hasChildNodes()) {
                                obj.element.removeChild(obj.element.lastChild);
                            }
                            obj.element.append(evaled);
                            //return expanded
                            return obj;
                        }
                    }(attrVal);
                    obj['onchange'] = obj['update'];
                    continue;
                }
                if (attrName === 'data-on-event') {
                    node.removeAttribute(attrName);
                    //preserve the markup in template
                    obj['template'] = node.outerHTML;
                    var event_reg = /(\{(.+?)\s*:\s*(.+?)\})/g;
                    let groups = event_reg.exec(attrVal);
                    if (groups != null) {
                        obj['create'] = function (event, handler) {
                            return function () {
                                let frag = document.createDocumentFragment();
                                //create element
                                let templ = document.createElement('template');
                                templ.innerHTML = obj.template;
                                let newElement = templ.content.firstElementChild;
                                let newObj = new DomNode(newElement).value;
                                newObj.data = obj.data;
                                newObj.methods = obj.methods;
                                newObj.parent = obj;
                                frag.appendChild(newObj.load().element);
                                //set element value
                                obj.element = frag;
                                obj.element.firstElementChild.addEventListener(event, obj.methods[handler]);
                                //return expanded
                                return obj;
                            }
                        }(groups[2], groups[3]);
                        obj['onchange'] = obj['create'];
                    }
                }
                obj.attributes.push({
                    name: attrName,
                    value: attrVal
                });
                continue;
            }
        }
        if (node.hasChildNodes()) {
            let nodeList = node.childNodes;
            obj['children'] = [];
            let child = node.firstChild;
            while (child != null) {
                node.removeChild(child);
                let newChild = new DomNode(child).value;
                obj.children.push(newChild);
                newChild.parent = obj;
                child = node.firstChild;
            }
        }

        //set 'template', 'element' and 'create' values
        if (!obj.template) {
            obj['template'] = node.outerHTML ? node.outerHTML : node.nodeName;
        }
        if (!obj.create) {
            obj['create'] = function () {
                if (obj.template){
                    if(obj.template === '#text'){
                        obj["element"] = node;
                    }
                    else {
                        let templ = document.createElement("template");
                        templ.innerHTML = obj.template;
                        obj.element = templ.content.firstElementChild;
                        if (obj.children && obj.children.length) {
                            for (let i = 0; i < obj.children.length; i++) {
                                let child = obj.children[i];
                                child.data = obj.data;
                                child.methods = obj.methods;
                                child.parent = obj;
                                let objWrap = child.load();
                                obj.element.appendChild(objWrap.element);
                            }
                        }
                    }
                }
                //return expanded
                return obj;
            }
        }
        if (!obj.render) {
            obj['render'] = function () {
                obj["element"] = node;
                return obj;
            }
        }

        //return expanded object
        return obj;
    }
}

class DomRender{

    constructor(config){
        this.tree = this.locate(config.template);
        this.tree.data = new DomModel(config.data).data;
        this.tree.methods = config.methods;
        this.$data = this.tree.data;
    }

    locate(target) {
        let node = document.getElementById(target);
        node.remove();
        let nodeObj = new DomNode(node.content.firstElementChild).value;
        console.log(nodeObj);
        return nodeObj;        
    }

    render(obj){
        if (obj.children && obj.children.length) {
            for (let i = 0; i < obj.children.length; i++) {
                let child = obj.children[i];
                child.element = this.render(child);

                if (child.condition) {
                    let options = [child];
                    while (++i < obj.children.length) {
                        let option = obj.children[i];
                        if (option.template === '#text') {
                            continue;
                        }
                        if (!['else_if', 'end_if'].includes(option.condition)) {
                            break;
                        }
                        options.push(obj.children[i]);
                    }
                    //load first match
                    options.find(item => {
                        return item.evaluate();
                    });
                }
                else {
                    let element = child.render().element;
                    obj.element.appendChild(element);
                }
            }
        }
        //return the wrapped element
        return obj.element;
    }

    mount(selector){
        let nodeObj = this.tree.load();
        const element = this.render(nodeObj);
        document.querySelector(selector).replaceWith(element);
    }
}


export { DomModel, DomNode, DomRender};