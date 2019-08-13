let zesty = Java.type('com.practicaldime.zesty.app.AppProvider');
let completable = Java.type('java.util.concurrent.CompletableFuture');

let app = zesty.provide({});
print('zesty app is configured');

let router = app.router();

let Date = Java.type('java.util.Date');
let DateFormat = Java.type('java.text.SimpleDateFormat');

function now() {
    return new DateFormat("hh:mm:ss a").format(new Date());
}

router.get('/', function (req, res, promise) {
    promise.resolve(completable.runAsync(() => {
        res.send(app.status().concat(" @ ").concat(now()));
    }))
});

router.get('/1', function (req, res, promise) {
    res.send(app.status().concat(" @ ").concat(now()));
    promise.complete();
});

let port = 8080, host = 'localhost';
router.listen(port, host, function(result){
    print(result);
    //tip: $JAVA_HOME/bin/jjs --language=es6 -ot -scripting -J-Djava.class.path=./lib/zesty-router-0.1.1-shaded.jar app.js
});

