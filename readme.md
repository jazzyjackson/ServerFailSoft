# ServerFailSoft
## A Verbose Error-Handling Extension of http.ServerResponse

If you open a stream and pipe it to ServerFailSoft, those bytes are streamed to the client, just as they would with the base class `ServerResponse`.

The first bytes piped to ServerFailSoft will trigger the `.writeHead` function, which will attempt to read `statusCode` and `headers` properties from the source. It also attempts to writeHead from source on the `end` event, in case there wasn't any data.

If the source throws an error (before bytes are sent!), ServerFailSoft will catch it and prepare an informative error response. (Perhaps TOO informative for your tastes if you wish to keep your software versions and stack traces to yourself) - I hope it's clear how to modify the errorresponse object (you can just comment out lines you don't want) to fork this repo and have it suit your tastes.

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
You can run `node examples/staticserver.js` to try this out. If you request a file that doesn't exist, you'll see the ENOENT error code and everything else.

Besides using built in streams, consider writing your own streams and piping them to ServerFailSoft. Here's an example server where PassThrough (like Transform but without the `_transform`) is used to create a pipeline that fails half the time, and compliments your good luck the other half.

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

### Extending

Pull requests accepted, I've started an errorMap.json to assign proper statusCodes (404 for ENOENT, no entity exists, 423 for EACCESS, insufficient permissions, 416 for the error code thrown by handing nonsensical start and end numbers to fs.createReadStream ).

```js
{
    "ENOENT": 404,
    "ENOTDIR": 404,
    "EACCESS": 423,
    "ERR_OUT_OF_RANGE": 416,
}
```