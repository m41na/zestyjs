function now() {
    return new java.text.SimpleDateFormat("hh:mm:ssa").format(new java.util.Date())
}

print(zesty.status().concat(" @ ").concat(now()));

var app = zesty.provide({
    assets: "www",
    engine: "freemarker"
});

var router = app.router();

router.get('/', function(req, res) {
    res.send(app.status().concat(" @ ").concat(now()));
});

router.get('/hello', function(req, res) {
    res.render('hello', {
        title: 'Hello',
        message: 'You got this!'
    });
});

router.get('/jello', function(req, res) {
    res.render('hello', {
        title: 'Hello',
        message: 'You got this!'
    });
});

router.listen(8080, 'localhost', function() {
    print('Zesty app listening on port 8080!')
});