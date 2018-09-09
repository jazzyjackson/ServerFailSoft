Object.assign(global, {
    ServerFailSoft: require('../ServerFailSoft.js'),
    stream: require('stream'),
    http: require('http'),
    url: require('url'),
    path: require('path'),
    fs: require('fs')
})

http.createServer({
    ServerResponse: ServerFailSoft
}, (req, res) => {
    let {pathname} = url.parse(req.url)
    let filepath = path.join(process.cwd(), pathname)
    fs.createReadStream(filepath).pipe(res)
}).listen(3000)
