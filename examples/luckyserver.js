Object.assign(global, {
    ServerFailSoft: require('../ServerFailSoft.js'),
    stream: require('stream'),
    http: require('http')
})

class CoinFlip extends stream.PassThrough {
    constructor(){super()}

    _flush(done){
        if(Math.random() > 0.5){
            done(null, "Good luck.")
        } else {
            done(new Error("bad luck."))
        }
    }
}

http.createServer({
    ServerResponse: ServerFailSoft
}, (req, res) => {
    req.pipe(new CoinFlip).pipe(res)
}).listen(3000)
