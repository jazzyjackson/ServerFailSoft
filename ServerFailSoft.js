/**
 * @author Colten Jackson
 * ServerFailSoft attaches an error handler to a source stream piped to it.
 * It will pass on the .statusCode and .headers of the source stream once
 * EITHER the first byte is received, or the the end event is received.
 * Source streams should be designed to error sooner rather than later.
 * If an error is received before any bytes are sent, a proper statuscode
 * can be transmitted and informative error object can be sent in whole.
 *
 * If, however, something goes wrong halfway through writing a response,
 * I will still concatenate the JSON error string to whatever bytes were sent.
 * This is not ideal, but probably better than swallowing the error silently.
 */
const http = require('http')
module.exports = class ServerFailSoft extends http.ServerResponse {
    constructor(res){
        super(res)
        this.once('pipe', source => {
            source.prependOnceListener('data', () => {
                this.headersSent || this.writeHead(
                    source.statusCode || 200,
                    source.headers || {}
                )
            }).prependOnceListener('end', () => {
                this.headersSent || this.writeHead(
                    source.statusCode || 200,
                    source.headers || {}
                )
            }).once('error', error => {
                let errorResponse = JSON.stringify({
                    source: source.constructor.name,
                    errMsg: error.toString(),
                    errObj: error, // Error Object may be empty, OK.
                    method: this.connection.parser.incoming.method,
                    url: this.connection.parser.incoming.url,
                    versions: process.versions,
                    platform: process.platform,
                    uid: process.getuid(),
                    gid: process.getgid(),
                    groups: process.getgroups(),
                }, null, 2) // prettyprint with 2 space indent
                this.headersSent || this.writeHead(
                    error.code == 'ENOENT'  ? 404 : // error no entity
                    error.code == 'ENOTDIR' ? 404 : // file is not a directory
                    error.code == 'ERANGE'  ? 416 : // range not satisfiable
                    error.code == 'EACCES'  ? 423 : // error no access (permission)
                    /* no code ? default: */  500 , /* + headers: */ {
                    'Content-Length': Buffer.byteLength(errorResponse),
                    'Content-Type': 'application/json',
                })
                this.end(errorResponse)
            })
        })
    }
}
