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
                if(this.curr_char == '{' && this.text.charAt(this.pos - 1) != '\\'){
                    oparen = this.pos - start;
                    this.advance();
                    continue;
                }

                if(this.curr_char == '}' && this.text.charAt(this.pos - 1) != '\\'){
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
        switch(input.substring(0, oparen)){
            case '@extend': {
                let payload = input.substring(oparen + 1, input.length - 1);
                if(payload.trim().length == 0){
                    return new Token('C_EXTEND', '');
                }
                else{
                    return new Token('O_EXTEND', payload);
                }
            }
            case '@block': {
                let payload = input.substring(oparen + 1, input.length - 1);
                if(payload.trim().length == 0){
                    return new Token('C_BLOCK', '');
                }
                else{
                    return new Token('O_BLOCK', payload);
                }
            }
            case '@slot': {
                let payload = input.substring(oparen + 1, input.length - 1);
                if(payload.trim().length == 0){
                    return new Token('C_SLOT', '');
                }
                else{
                    return new Token('O_SLOT', payload);
                }
            }
            case '@super': {
                return new Token('SUPER', '');
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

    this.accept = function(node){
        if(node.token().type == 'O_BLOCK'){
            let slot_index = this.find('O_SLOT');
            if(slot_index > -1){
                let slot_node = this.nodes()[slot_index];  

                let block_name = node.token().value.trim();
                let slot_name = slot_node.token().value.trim();            
                
                if(block_name == slot_name){
                    let super_index = -1;
                    if((super_index = node.find('SUPER')) > -1){
                        node.splice(super_index, slot_node.nodes());
                    }
                    return this.replace(slot_index, node);
                }
            }
        }
        if(nodes.length > 0){
            nodes.forEach(e=> e.accept(node));
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

    slot(){
        let token = this.curr_token;
        let slot = new NewNode(token);
        this.eat(token.type);
        let markup = this.markup();
        slot.push(markup);
        token = this.curr_token;
        let end = new NewNode(token);
        slot.push(end);
        this.eat(token.type);
        return slot;
    }

    super(){
        let token = this.curr_token;
        let node = new NewNode(token);
        this.eat(token.type);
        return node;
    }

    block(){
        let token = this.curr_token;
        let block = new NewNode(token);
        this.eat(token.type);
        token = this.curr_token;
        while(token.type != 'C_BLOCK'){
            switch(token.type){
                case 'MARKUP': {
                    let markup = this.markup();
                    block.push(markup);
                    break;
                }
                case 'SUPER': {
                    let node = this.super();
                    block.push(node);
                    break;
                }
                case 'O_SLOT': {
                    let slot = this.slot();
                    block.push(slot);
                    break;
                }
                case 'INCLUDE': {
                    let include = this.include();
                    block.push(include);
                    break;
                }
                default: {
                    throw Error(`${token.type} - unexpected token encountered`);
                }
            }
            token = this.curr_token;
        }

        let end = new NewNode(token);
        block.push(end);
        this.eat(token.type);
        return block;
    }

    extend(){
        let token = this.curr_token;
        let extend = new NewNode(token);
        this.eat(token.type);
        token = this.curr_token;
        while(token.type != 'C_EXTEND'){
            switch(token.type){
                case 'O_BLOCK': {
                    let block = this.block();
                    extend.push(block);
                    break;
                }
                default: {
                    throw Error(`${token.type} - unexpected token encountered in @extend section`);
                }
            }
            token = this.curr_token;
        }

        let end = new NewNode(token);
        extend.push(end);
        this.eat(token.type);

        //expand the parent template
        let source = extend.token().value;
        let template = this.loadTemplate(source);
        let parser = new Interpreter(new Lexer(template));
        let parent = parser.build();
        //using each @block, visit the parent and replace matching @slot 
        let block = null;
        while((block = extend.pluck('O_BLOCK')) != null){
            parent.accept(block);
        }        
        return parent;
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
            if(token.type == 'O_EXTEND'){                
                let extend = this.extend();
                this.head.push(extend);
                break;
            }
            else if(token.type == 'MARKUP'){
                let markup = this.markup();
                this.head.push(markup);
            }
            else if(token.type == 'O_SLOT'){
                let slot = this.slot();
                this.head.push(slot);
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

//******* testing **********//
var incl_html = [
    "<p>Red</p>",
    "<p>Green</p>"
].join("");

var colors_html = [
    "@extend{simple_html}",

    "@block{ colors }", 
    "<p>Yellow</p>",
    "<p>Blue</p>",
    "@incl{incl_html}",
    "@block{}",

    "@extend{}"
].join("");

var simple_html = [
    "@extend{layout_html}",

    "@block{ title } Simple Layout @block{}",

    "@block{ main }",
    "<div id=\"content\">",
    "@super{}",
    "<p>It's your birthday!!</p>",
    "@slot{colors}<p>Rainbow</p>@slot{}",
    "</div > ",
    "@block{}",

    "@extend{}"
].join("");

var layout_html = [
    "<div id=\"layout\">",

    "<div id=\"title\">@slot{title}Placeholder Title@slot{}</div>",

    "<div id=\"app\">",
    "@slot{ main }",
    "<h3>Messages</h3>",
    "@slot{}",
    "</div>",
    "<div>Mode colors: ",
    "@incl{incl_html}</div>",
    "</div>"
].join("");


let lexer = new Lexer(colors_html);
let token = null;
while((token = lexer.getNextToken()) != null){
    console.log(token);
}

let parser = new Interpreter(new Lexer(colors_html));
let colors = parser.build();
colors.visit({
    accept: function(node){
        if(node.token().type == 'MARKUP'){
            console.log(node.token().value);
        }
    }
});
