var fs;
try {
    fs = require('fs');
} catch (error) {
    console.log('trouble with require - ' + error);
}

let Logger = function (flag) {
    var enabled = flag;
    return {
        log: function (str) {
            if (enabled) {
                console.log(str)
            }
        },
        enable: function (val) {
            enabled = val;
        }
    }
}(false);

class Token{

    constructor(type, value){
        this.type = type;
        this.value = value;
    }

    print(){
        return `{type: ${this.type}, value: ${this.value}}`;
    }
}

class Lexer{

    constructor(text){
        this.text = text;
        this.pos = 0;
        this.text_pos = 0;
        this.reading = false;
        this.curr_char = this.text.charAt(this.pos);
    }

    advance(){
        this.pos++;
        this.curr_char = (this.pos > this.text.length - 1)? null : this.text.charAt(this.pos);
    }

    skipWhitespace(){
        while(this.pos != null && this.isWhitespace()){
            this.advance();
        }
    }

    isWhitespace(){
        return /\s/g.test(this.curr_char);
    }

    getNextToken(){
        let start = this.pos, oparen = 0;  

        while(this.curr_char != null){
            if(/\s/g.test(this.curr_char)){
                this.skipWhitespace();
                continue;
            }

            if(!this.reading){
                if(this.curr_char == '@' && this.text.charAt(this.pos + 1) != '@'){
                    this.reading = true;
                    start = this.pos;

                    if(this.text_pos < this.pos){
                        let text_start = this.text_pos;
                        this.text_pos = this.pos;
                        return this.createToken(this.text.substring(text_start, this.pos), 0);
                    }

                    this.advance();
                    continue;
                }
                this.advance()
                continue;           
            }

            if(this.reading){
                let next_char = this.text.charAt(this.pos + 1);
                if(next_char == '{'){
                    this.advance();
                    this.text_pos = this.pos;
                    return this.createToken(this.text.substring(start, this.pos));
                }

                if(this.curr_char == '{'){
                    oparen = this.pos - start;
                    this.advance();
                    continue;
                }

                if(this.curr_char == '}'){
                    this.advance();
                    start = this.text_pos;
                    this.text_pos = this.pos;
                    this.reading = false;
                    return this.createToken(this.text.substring(start, this.pos), oparen);
                }
            }

            this.advance();
        }
        if(this.text_pos < this.pos){
            let text_start = this.text_pos;
            this.text_pos = this.pos;
            return this.createToken(this.text.substring(text_start, this.pos), 0);
        }
        return null;
    }

    createToken(input, oparen){
        if(/\{.+,?.+in.+\}/.test(input)){
            return new Token('FOR_EXPR', input);
        }
        else if(/\{\s?}/.test(input)){
            return new Token('O_CLOSE', input);
        }
        else if(/\{.+?}/.test(input)){
            return new Token('EXPR', input);
        }
        else{
            switch(input.substring(0, oparen)){
                case '@for': {
                    return new Token('O_FOR', input);
                }
                case '@end': {
                    return new Token('O_END', input);
                }
                case '@': {
                    return new Token('O_PROP', input);
                }
                case '@eval': {
                    return new Token('O_EVAL', input);
                }
                case '@set': {
                    return new Token('O_SET', input);
                }
                case '@if': {
                    return new Token('O_IF', input);
                }
                case '@elif': {
                    return new Token('O_ELIF', input);
                }
                case '@else': {
                    return new Token('O_ELSE', input);
                }
                case '@incl': {
                    let payload = input.substring(oparen + 1, input.length  -1);
                    return new Token('INCLUDE', payload);
                }
                default: {
                    return  new Token('MARKUP', input);
                }
            }
        }
    }
}

let NewNode = function (new_token) {
    
    let token = new_token;
    let nodes = [];

    this.push = function(node){
        nodes.push(node);
    }

    this.token = function(){
        return token;
    }

    this.nodes = function(){
        return nodes;
    }

    this.pluck = function(type){
        let index = /\d+/.test(type)? type: this.find(type);
        return (index > -1)? nodes.splice(index, 1)[0] : null;
    }

    this.find = function(type){
        return nodes.findIndex(e=> e.token().type == type);
    }

    this.replace = function(index, node){
        return nodes.splice(index, 1, node);
    }

    this.splice = function(index, newnodes){
        return nodes.splice.apply(nodes, [index, 1].concat(newnodes));
    }

    this.print = function(indent){
        let str = `node: {type:, ${token.type}, value: ${token.value}}`;
        let sep = indent == undefined? "" : indent;
        if(nodes.length > 0){
            sep = sep.concat("---|");
            nodes.forEach(e=> str = str.concat("\n".concat(sep).concat(e.print(sep))));
        }
        return str;
    }

    this.visit = function(visitor){
        visitor.accept(this);
        if(nodes.length > 0){
            nodes.forEach(e=> e.visit(visitor));
        }
    }
}

class Interpreter{

    constructor(lexer){
        this.lexer = lexer;
        this.curr_token = lexer.getNextToken();
        this.head = new NewNode({type: 'ROOT', value: 'TREE'});
    }

    eat(type){
        console.log(`curr token => {type: ${this.curr_token.type}, value: ${this.curr_token.value}}`);
        if(type == this.curr_token.type){
            this.curr_token = this.lexer.getNextToken();
        }
        else{
            throw Error(`${type} - unexpected token encountered`);
        }
    }

    markup(){
        let token = this.curr_token;
        let markup = new NewNode(token);
        this.eat(token.type);
        return markup;
    }

    end(){
        let token = this.curr_token;
        let end = new NewNode(token);
        this.eat(token.type);

        token = this.curr_token;
        let close = this.close();
        end.push(close);
        return end;
    }

    close(){
        let token = this.curr_token;
        let close = new NewNode(token);
        this.eat(token.type);
        return close;
    }

    expr(){
        let token = this.curr_token;
        let expr = new NewNode(token);
        this.eat(token.type);
        return expr;
    }

    set_expr(){
        let token = this.curr_token;
        let set_prop = new NewNode(token);
        this.eat(token.type);

        let set_expr = this.expr();
        set_prop.push(set_expr);
        return set_prop;
    }

    eval_expr(){
        let token = this.curr_token;
        let eval_cond = new NewNode(token);
        this.eat(token.type);

        let eval_expr = this.expr();
        eval_cond.push(eval_expr);
        return eval_cond;
    }

    prop_expr(){
        let token = this.curr_token;
        let prop_eval = new NewNode(token);
        this.eat(token.type);

        token = this.curr_token;
        let prop_expr = this.expr();
        prop_eval.push(prop_expr);
        return prop_eval;
    }

    for_loop(){
        let token = this.curr_token;
        let for_loop = new NewNode(token);
        this.eat(token.type);

        let for_expr = this.for_expr();
        for_loop.push(for_expr);
        
        token = this.curr_token;
        let for_body = this.for_body(for_loop);
        return for_body;
    }

    for_expr(){
        let token = this.curr_token;
        let for_exp = new NewNode(token);
        this.eat(token.type);
        return for_exp;
    }

    for_body(target){
        let token = this.curr_token;
        token = this.curr_token;
        while(token.type != "O_END"){
            switch(token.type){
                case 'MARKUP': {
                    let markup = this.markup();
                    target.push(markup);
                    break;
                }
                case 'O_FOR': {
                    let for_loop = this.for_loop();
                    target.push(for_loop);
                    break;
                }
                case 'O_IF': {
                    let if_block = this.if_block();
                    target.push(if_block);
                    break;
                }
                case 'O_PROP': {
                    let prop_expr = this.prop_expr();
                    target.push(prop_expr)
                    break;
                }
                case 'O_EVAL': {
                    let eval_expr = this.eval_expr();
                    target.push(eval_expr)
                    break;
                }
                case 'O_SET': {
                    let set_expr = this.set_expr();
                    target.push(set_expr)
                    break;
                }
                case 'INCLUDE': {
                    let include = this.include();
                    target.push(include);
                    break;
                }
                default: {
                    throw Error(`${token.type} - unexpected token encountered`);
                }
            }
            token = this.curr_token;
        }
        //@end reached
        let end = this.end();
        target.push(end);
        return target;
    }

    if_block(){
        let token = this.curr_token;
        let if_block = new NewNode(new Token('IF_BLOCK', ''));
        this.if_expr(if_block);
        
        token = this.curr_token
        while(token.type != 'O_END'){
            token = this.curr_token;
            if(token.type == "O_ELIF"){
                this.elif_expr(if_block);
            }

            token = this.curr_token;
            if(token.type == "O_ELSE"){
                this.else_expr(if_block);
            }
        }

        //@end reached
        let end = this.end()
        if_block.push(end);
        return if_block;
    }

    if_expr(if_block){
        let token = this.curr_token;
        let if_body = new NewNode(token);
        this.eat(token.type);
        
        token = this.curr_token;
        let if_expr = this.expr()
        if_body.push(if_expr);

        this.block_body(if_body);
        if_block.push(if_body);
    }

    elif_expr(if_block){
        let token = this.curr_token;
        let elif_body = new NewNode(token);
        this.eat(token.type);

        token = this.curr_token;
        let elif_expr = this.expr();
        elif_body.push(elif_expr);

        this.block_body(elif_body);
        if_block.push(elif_body);
    }

    else_expr(if_block){
        let token = this.curr_token;
        let else_body = new NewNode(token);
        this.eat(token.type);
        
        token = this.curr_token;
        let close = this.close();
        else_body.push(close);

        this.block_body(else_body);
        if_block.push(else_body);        
    }

    block_body(target){
        let token = this.curr_token;
        token = this.curr_token;
        while(!["O_END",'O_ELIF','O_ELSE'].includes(token.type)){
            switch(token.type){
                case 'MARKUP': {
                    let markup = this.markup();
                    target.push(markup);
                    break;
                }
                case 'O_FOR': {
                    let for_loop = this.for_loop();
                    target.push(for_loop);
                    break;
                }
                case 'O_IF': {
                    let if_block = this.if_block();
                    target.push(if_block);
                    break;
                }
                case 'O_PROP': {
                    let prop_expr = this.prop_expr();
                    target.push(prop_expr)
                    break;
                }
                case 'O_EVAL': {
                    let eval_expr = this.eval_expr();
                    target.push(eval_expr);
                    break;
                }
                case 'O_SET': {
                    let set_expr = this.set_expr();
                    target.push(set_expr)
                    break;
                }
                case 'INCLUDE': {
                    let include = this.include();
                    target.push(include);
                    break;
                }
                default: {
                    throw Error(`${token.type} - unexpected token encountered`);
                }
            }
            token = this.curr_token;
        }
    }

    include(){
        let token = this.curr_token;
        let include = new NewNode(token);
        this.eat(token.type);

        let source = token.value;
        let template = this.loadTemplate(source);
        let parser = new Interpreter(new Lexer(template));
        let node = parser.build();
        include.push(node);
        return include;
    }

    loadTemplate(name) {
        var index;
        if ((index = name.search(/^dom:/)) > -1) {
            return he.decode(document.querySelector(name.substring('dom:'.length)).innerHTML);
        }
        else if ((index = name.search(/^tpl:/)) > -1) {
            return he.decode(document.querySelector(name.substring('tpl:'.length)).innerHTML);
        }
        else if ((index = name.search(/^fs:/)) > -1) {
            return this.loadFsTemplate(name.substring('fs:'.length));
        }
        else {
            return eval(name);
        }
    }
    
    loadFsTemplate(name) {
        var data = fs.readFileSync(name, "utf-8");
        var templ = /<template.*?>([^].*?)<\/template>/.exec(data);
        return templ[1];
    }

    build(){
        while(this.curr_token != null){
            let token = this.curr_token;
            if(token.type == 'O_FOR'){                
                let for_loop = this.for_loop();
                this.head.push(for_loop);
            }
            else if(token.type == 'MARKUP'){
                let markup = this.markup();
                this.head.push(markup);
            }
            else if(token.type == 'O_IF'){
                let if_block = this.if_block();
                this.head.push(if_block);
            }
            else if(token.type == 'O_PROP') {
                let prop_expr = this.prop_expr();
                this.head.push(prop_expr);
            }
            else if(token.type == 'O_EVAL') {
                let eval_expr = this.eval_expr();
                this.head.push(eval_expr);
            }
            else if(token.type == 'O_SET') {
                let set_expr = this.set_expr();
                this.head.push(set_expr);
            }
            else if(token.type == 'INCLUDE'){
                let include = this.include();
                this.head.push(include);
            }
            else{
                throw Error(`${token.type} - unexpected token encountered`);
            }
        }
        return this.head;
    }
}

let Tmpl = {};

Tmpl.objProp = function (path, obj) {
    return path.split(/\.|\[['"]?(.+?)["']?\]/).filter(function (val) {
        return val;
    }).reduce(function (prev, curr) {
        return prev ? prev[curr] : null;
    }, obj);
}

Tmpl.setProp = function (expr) {
    return function (ctx) {
        var parts = expr.split("=");
        var prop = parts[0].trim();
        ctx[prop] = eval(parts[1].trim());
        return prop;
    }
}

Tmpl.resProp = function (expr) {
    return function (ctx) {
        return this.objProp(expr, ctx);
    }.bind(this);
}

Tmpl.resExpr = function (expr) {
    return function (ctx) {
        //padd with a space at the end for regex to match
        var exec = expr.concat(' ').replace(/(\w+(\.|\[).*?)\s/g, function (m, p) {
            return this.objProp(p, ctx);
        }.bind(this));
        if (exec.search(/([a-zA-Z_]+?)\s/g) > -1) {
            exec = expr.concat(' ').replace(/([a-zA-Z_]+?)\s/g, function (m, p) {
                var e = this.objProp(p, ctx);
                return this.isNumeric(e) ? e : this.isString(e) ? "'" + e + "'" : e;
            }.bind(this));
        }
        Logger.log('executable expression -> ' + exec);
        return eval(exec);
    }.bind(this);
}

Tmpl.isNumeric = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

Tmpl.isNumber = function (value) {
    return typeof value === 'number' && isFinite(value);
}

Tmpl.isString = function (value) {
    return typeof value === 'string' || value instanceof String;
}

Tmpl.isObject = function (value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

Tmpl.isArray = function (value) {
    return value && Array.isArray(value);
}

Tmpl.isFunction = function (value) {
    return typeof value === 'function';
}

Tmpl.isRegExp = function (value) {
    return value && typeof value === 'object' && value.constructor === RegExp;
}

Tmpl.isError = function (value) {
    return value instanceof Error && typeof value.message !== 'undefined';
}

Tmpl.isDate = function (value) {
    return value instanceof Date;
}

Tmpl.mergeArrays = function (a, b) {
    //in-place merging instead of a.concat(b) which creates new array
    if (a.length > b.length) {
        a.push.apply(a, b);
        return a;
    }
    else {
        b.unshift.apply(b, a);
        return b;
    }
}

Tmpl.forParams = function (expr) {
    var regex_2 = /(\w+?)\s*?in\s*?(\w+?)$/g;
    var regex_3 = /(\w+?)\s*?,?\s*?(\w+?)\s*?in\s*?(\w+?)$/g;
    var match;
    if (!expr.includes(",")) {
        if ((match = regex_2.exec(expr)) != null) {
            return { cursor: match[1], elements: match[2] , key: undefined};
        } else {
            throw Error('seems like \'' + expr + '\' is an invalid @for expression');
        }
    } else {
        if ((match = regex_3.exec(expr)) != null) {
            return { cursor: match[1], elements: match[3], key: match[2] };
        } else {
            throw Error('seems like \'' + expr + '\' is an invalid @for expression');
        }
    }
}

Tmpl.walkTree = function(start){
    var head, tail;
    var marked = [];

    function init(root, depth){
        head = {node: root, next: undefined, id: depth};
        tail = head;

        function walk(node, id){
            let nodes = node.nodes();
            if(nodes.length > 0){
                nodes.forEach(e=> {
                    let next = {node: e, next: undefined, id: id};
                    tail.next = next;
                    tail = next;
                    walk(e, id + 1);
                });
            }
            nodes = null;
        }
        walk(tail.node, depth + 1);
    }

    init(start, 0);
    tail = head;
    return {
        next: function(){
            if(tail.next){
                //console.log(tail.id + " - " + tail.node.token().type);
                tail = tail.next;
                return tail.node;
            }
            else{
                head = null;
                tail = null;
                return null;
            }
        },
        mark: function(pos){
            if(pos){
                marked.push(pos);
            }
            else{
                marked.push(tail);
            }
        },
        jump: function(pos){
            if(pos){
                tail = pos;
            }
            else{
                if(marked.length > 0){
                    tail = marked.pop();
                }
                else{
                    throw Error('there is no marked node to jump to');
                }
            }
        },
        siblings(){
            let list = [];
            let temp = tail, id = tail.id;
            list.push(temp);
            while(temp.next){
                temp = temp.next;
                if(temp.id == id){
                    list.push(temp);
                }
                if(temp.id < id){
                    break;
                }
            }
            return list;
        },
        reset: function(node){
            init(node);
        }
    }
}

//******* testing **********//
var complex_html = [
"<div id=\"app\">",
    "<h3>sports</h3>",
    "<ul id=\"listing\">",
        "@for{sport, index in sports}",
        "<li><span>@eval{index + 1}</span> - @{sport.name}</li>",
        "@end{}",
    "</ul>",
    "",
    "<div>",
        "@if{sports[0].rank == 2}",
        "<p style=\"background-color:green;\">@{sports[0].name}</p>",
        "@else{}",
        "<p style=\"background-color:red;\">@{sports[0].name}</p>",
        "@end{}",
    "</div>",
    "",
    "<ul id=\"listing-1\">",
        "@for{sport, index in sports} @if{(index % 2 ) > 0}",
        "<li style=\"background-color:yellow;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
        "@else{}",
        "<li style=\"background-color:blue;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
        "@end{} @end{}",
    "</ul>",
    "",
    "<ul id=\"listing-3\">",
        "@for{sport, index in sports} @if{(index % 3 ) > 0}",
        "<li style=\"background-color:orange;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
        "@else{}",
        "<li style=\"background-color:indigo;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
        "@end{} @end{}",
    "</ul>",
"</div>"
].join("");

let if_html = [
    "<div>",
    "@set{x = 1} @if{ x > 2 } @{x} greater @elif{x == 3} equal @else{} less @end{}",
    "@eval{x*10}",
    "</div>"
].join("");

let for_html = [
    "<div>",
    "@for{ item, y in list} @{y} - @{item.x} awesome @end{}",
    "@eval{x*10}",
    "</div>"
].join("");

// let lexer = new Lexer(complex_html);
// let token = null;
// while((token = lexer.getNextToken()) != null){
//     console.log(token);
// }

let parser = new Interpreter(new Lexer(complex_html));
let simple = parser.build();
console.log(simple.print());

let treeNav = Tmpl.walkTree(simple);
//let context = {list: [{x:2},{x:4},{x:6},{x:8},{x:10}], x: 1};
let context = {sports: [{name: "rugby"}, {name: "soccer"}, {name: "tennis"}]};

let current;
while((current = treeNav.next()) != null){    
    let token = current.token();
    switch(token.type){
        case 'IF_BLOCK': {
            renderIf(treeNav, context);
            break;
        }
        case 'O_FOR': {
            renderFor(treeNav, context);
            break;
        }
        case 'MARKUP': {
            console.log(token.value);
            break;
        }
        case 'O_SET': {
            Tmpl.setProp(current.nodes()[0].token().value.replace(/\{(.*)}/, "$1"))(context);
            break;
        }
        default: {
            break;
        }
    }
}

function renderNode(treeNav, child, ctx){
    switch(child.token().type){
        case 'O_PROP': {
            let res = Tmpl.resProp(child.nodes()[0].token().value.replace(/\{(.*)}/, "$1"));
            console.log(res(ctx));
            break;
        }
        case 'O_EVAL': {
            let res = Tmpl.resExpr(child.nodes()[0].token().value.replace(/\{(.*)}/, "$1"));
            console.log(res(ctx));
            break;
        }
        case 'O_SET': {
            Tmpl.setProp(child.nodes()[0].token().value.replace(/\{(.*)}/, "$1"), ctx);
            break;
        }
        case 'MARKUP': {
            console.log(child.token().value);
            break;
        }
        case 'IF_BLOCK': {
            renderIf(treeNav, ctx);
            break;
        }
        case 'FOR_LOOP': {
            renderFor(treeNav, ctx);
            break;
        }
        default: {
            break;
        }
    }
}

function renderIf(treeNav, ctx){
    let child = treeNav.next();
    //get direct children
    let siblings = treeNav.siblings();
    //test which condition is true
    let end_if = siblings[siblings.length - 1];
    treeNav.mark(end_if);
    let matched = null;
    let nomatch = null;
    for(let i = 0; i < siblings.length; i++){
        let test = siblings[i].node;
        if(test.token().type == 'O_ELSE'){
            nomatch = siblings[i];
            break;
        }

        let expr = test.nodes()[0].token().value;
        let isTrue = Tmpl.resExpr(expr.replace(/\{(.*)}/, "$1"));
        if(isTrue(ctx)){
            if(!matched){
                matched = siblings[i];
            }
            else{
                throw Error('more than one if condition was successful');
            }
        }
    }

    if(matched){
        treeNav.jump(matched);
        doFor();
    }
    else{
        if(nomatch){
            treeNav.jump(nomatch);
            doFor();
        }
        else{
            treeNav.jump();
        }
    }

    function doFor(){
        child = treeNav.next();
        while(!["O_END", "O_ELIF", "O_ELSE"].includes(child.token().type)){
            if(child.token().type == 'IF_BLOCK'){
                renderIf(treeNav, ctx);
            }
            else if(child.token().type == 'FOR_LOOP'){
                renderFor(treeNav, ctx);
            }
            else{
                renderNode(treeNav, child, ctx);
            }
            child = treeNav.next();
        }
        treeNav.jump();
    }
}

function renderFor(treeNav, context){
    let node = treeNav.next();
    let params = Tmpl.forParams(node.token().value.replace(/\{(.*)}/, "$1"));
    let cursor = params.cursor, elements = context[params.elements], key = params.key;
    var result = [];
    var count = 0;
    for (var index in elements) {
        count++;
        var ctx = {};
        ctx[cursor] = elements[index];
        if (key) ctx[key] = index;        

        if(count < elements.length) treeNav.mark();
        let child = treeNav.next();
        while(child.token().type != 'O_END'){
            renderNode(treeNav, child, ctx);
            child = treeNav.next();
        }
        if(count < elements.length) treeNav.jump();
    }
}
