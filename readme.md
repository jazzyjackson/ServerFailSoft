# ServerFailSoft
## A Verbose Error-Handling Extension of http.ServerResponse

If you open a stream and pipe it to ServerFailSoft, those bytes are streamed to the client, just as they would with the base class `ServerResponse`.

The first bytes piped to ServerFailSoft will trigger the `.writeHead` function, which will attempt to read `statusCode` and `headers` properties from the source. It also attempts to writeHead from source on the `end` event, in case there wasn't any data.

If the source throws an error (before bytes are sent!), ServerFailSoft will catch it and prepare an informative error response. (Perhaps TOO informative for your tastes if you wish to keep your software versions to yourself, but I prefer to advertise that my server is up-to-date.)

### Usage
Since Node v9.6.0, http.createServer supports an options argument to override the IncomingMessage and ServerResponse constructed for each request.

```js
http.createServer({
    ServerResponse: ServerFailSoft
}, (req, res) => {
    let {pathname} = url.parse(req.url)
    let filepath = path.join(process.cwd(), pathname)
    fs.createReadStream(filepath).pipe(res)
}).listen(3000)
```
You can run `node examples/staticserver.js` to try this out.

See more details / ideas in the [Transflect](/mixint/Transflect) repository - Transflect is an extension of stream.Transform that allows you to safely open requisite streams to respond to requests while avoiding memory and file descriptor leaks.

An example server where PassThrough (like Transform but without the `_transform`) is used to create a pipeline:

```js
// an example class that fails half the time
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
```
You can run `node examples/luckyserver.js` to try it out.
