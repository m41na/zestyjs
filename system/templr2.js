let TOKENS = {
    O_EXTEND:   '@extend{\.+\}',
    C_EXTEND:   '@extend{}',
    O_BLOCK:    '@block{\.+\}',
    C_BLOCK:    '@block{}',
    SUPER:      'super{}',
    O_SLOT:     '@slot{\.+\}',
    C_SLOT:     '@slot{}',
    INCLUDE:    '@incl{/.+/}'
};

class Token{

    constructor(type, value){
        this.type = type;
        this.value = value;
    }

    toString(){
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
        let start = this.pos, paren = 0;        
        let reading = false;

        while(this.curr_char != null){
            if(/\s/g.test(this.curr_char)){
                this.skipWhitespace();
                continue;
            }

            if(!this.reading){
                if(this.curr_char == '@' && this.text.charAt(this.pos + 1) != '@'){
                    this.reading = true;
                    start = this.pos;
                    this.text_pos = start;
                    
                    if(this.text_pos < this.pos){
                        let start = this.text_pos;
                        return this.createToken('TEXT', this.input.substring(start, this.pos));
                    }

                    this.advance();
                    continue;
                }                
            }

            if(this.reading){
                if(this.curr_char == '{' && this.text.charAt(this.pos - 1) != '\\'){
                    paren = this.pos - start;
                    this.advance();
                    continue;
                }

                if(this.curr_char == '}' && this.text.charAt(this.pos - 1) != '\\'){
                    this.advance();
                    start = this.text_pos;
                    this.text_pos = this.pos;
                    return this.createToken(this.text.substring(start, this.pos), paren);
                }
            }

            this.advance();
        }
        return null;
    }

    createToken(input, oparen){
        switch(input.substring(0, oparen)){
            case '@extend': {
                if(oparen + 1 == input.length){
                    return new Token('C_EXTEND', '');
                }
                else{
                    return new Token('O_EXTEND', input.substring(oparen + 1, input.length  -1));
                }
            }
            case '@block': {
                if(oparen + 1 == input.length){
                    return new Token('C_BLOCK', '');
                }
                else{
                    return new Token('O_BLOCK', input.substring(oparen + 1, input.length  -1));
                }
            }
            case '@slot': {
                if(oparen + 1 == input.length){
                    return new Token('C_SLOT', '');
                }
                else{
                    return new Token('O_SLOT', input.substring(oparen + 1, input.length - 1));
                }
            }
            case '@super': {
                return new Token('SUPER', '');
            }
            case '@incl': {
                return new Token('INCLUDE', input.substring(oparen + 1, input.length - 1));
            }
            default: {
                throw Error(`'${input}, ${oparen}' - unexpected token encoutered`);
            }
        }
    }
}

//******* testing **********//
var simple_html = [
    "@extend{layout_html}",

    "@block{ title } Simple Layout @block{}",

    "@block{ main }",
    "<div id=\"content\">",
    "@super{}",
    "<p>It's your birthday!!</p>",
    "@slot{wrapped}<p>Sports List</p>@slot{}",
    "</div > ",
    "@block{}",

    "@extend{}"
].join("");

let lexer = new Lexer(simple_html);
let token = null;
while((token = lexer.getNextToken()) != null){
    console.log(token);
}