function doOdd(){
    var list = [1,3,5,7,9];
    var index = list.length - 1;
    return function(){
        return {
            next: function(){
                if(index > 0){
                    return list[index--];
                }
                else{
                    return false;
                }
            },
            reset: function(){
                index = 0;
            }
        }
    }
}

function doEven(){
    var list = [0,2,4,6,8];
    var index = list.length - 1;
    return function(){
        return {
            next: function(){
                if(index >= 0){
                    return list[index--];
                }
                else{
                    return false;
                }
            },
            reset: function(){
                index = 0;
            }
        }
    }
}

function printAll(){
    var evens = doEven();
    var odds = doOdd();
    index = 0
    while(index < 10){
        if(index++ % 2 == 0){
            var val = evens().next();
            console.log(val);
            if(!val) break;
        }
        else{
            var val = odds().next();
            console.log(val);
            if(!val) break;
        }
    }
}

printAll();