var regex = /(@\{(.+?)\})|(@eval\{(.+?)\})|(@set\{(\w+?=.+?)\})|(@if\{(.+?)\})|(@elif\{(.+?)\})|(@else\{\})|(@end\{\})|(@for\{(.+?)\})|(@incl\{(.+?)\})|(@extend\{(.*?)\})|(@block\{(.*?)\})|(@super\{\})|(@slot\{(.*?)\})/g;

class Token {

    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

class Tokenizer {

    constructor(template) {
        this.template = template;
    }

    tokenize() {
        var match;
        var start = 0;
        var stack = [];
        //process
        while ((match = regex.exec(this.template)) != null) {
            var val;
            var matched = match[0];

            var text = this.template.substring(start, match.index);
            if (text.trim().length > 0) {
                console.log('text before next match -> ' + text);
                stack.push({ matched: "", value: text });
            }

            if (matched.startsWith("@{")) {
                //must be an expression
                val = match[2];
                console.log('@{} expr matched -> ' + match[1]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@eval{")) {
                val = match[4];
                console.log('@eval matched -> ' + match[3]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@set{")) {
                val = match[6];
                console.log("@set statement matched -> " + match[5]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@if{")) {
                val = match[8];
                console.log("@if condition matched -> " + match[7]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@elif{")) {
                val = match[10];
                console.log("@elif condition matched -> " + match[9]);
                stack.push({ matched: matched, value: val });
            } else if (matched == "@else{}") {
                val = "";
                console.log("@else condition reached -> " + match[11]);
                stack.push({ matched: matched, value: val });
            } else if (matched == "@end{}") {
                val = "";
                console.log('reached @end of block -> ' + match[12]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@for{")) {
                val = match[14];
                console.log("@for condition matched -> " + match[13]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@incl{")) {
                val = match[16];
                console.log("@incl statement matched -> " + match[15]);
                stack.push({ matched: matched, value: val });
            } else if (matched == "@extend{}") {
                val = "";
                console.log('end of @extend{} directive reached -> ' + match[17]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@extend{")) {
                val = match[18];
                console.log('beginning of @extend{} directive matched -> ' + match[17]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@block{")) {
                val = match[20];
                console.log("@block directive matched -> " + match[19]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@super{")) {
                val = "";
                console.log("@super directive matched -> " + match[21]);
                stack.push({ matched: matched, value: val });
            } else if (matched == "@slot{}") {
                val = "";
                console.log("end of @slot directive reached -> " + match[22]);
                stack.push({ matched: matched, value: val });
            } else if (matched.startsWith("@slot{")) {
                val = match[23];
                console.log("beginning of @slot{} directive matched -> " + match[22]);
                stack.push({ matched: matched, value: val });
            } else {
                throw Error('unexpected token matched -> ' + matched);
            }
            //reset start
            start = regex.lastIndex;
        }
        //get last section
        text = this.template ? this.template.substring(start) : "";
        if (text.trim().length > 0) {
            console.log('text before end of template -> ' + text);
            stack.push({ matched: "", value: text });
        }
        //return
        return stack;
    }
}

//TESTING - REMOVE WHEN DONE
var line1 = "@for{ab in two} do @end @if{x>2} x>2 @elif{x<2} x<2 @else{} value=@{x} @end{} @end{} @set{b=2} @eval{b==2}";
var line2 = "@block{line} line @block{} @incl{simple_html} @slot{line}YES@slot{}";
var tokens = new Tokenizer(line1).tokenize();