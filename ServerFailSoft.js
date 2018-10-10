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
const { ServerResponse } = require('http')

module.exports = class ServerFailSoft extends ServerResponse {
    constructor(res){
        super(res)
        this.once('pipe', source => {
            /* Getters with defaults for statusCode and headers exist on Transflect, but just in case: */
            if(!source.statusCode) source.statusCode = 200
            if(!source.headers) source.headers = {}
            /* writeHead would be called on first byte, prepend the listener to get to it first! */
            source.prependOnceListener('data', () => {
                this.headersSent || this.writeHead(source.statusCode, source.headers)
            })
            /* make sure status and headers are also transferred if no data is sent */
            source.prependOnceListener('end', () => {
                this.headersSent || this.writeHead(source.statusCode, source.headers)
            })
            /* getuid, getgid, getgroups are gaurded and fallback to undefined on Windows */
            source.once('error', error => {
                /* prepare error response: prettyprint with 2 space indent */
                /* NOTE: errObj may be empty but still carry a message when stringified */
                let errorResponse = JSON.stringify({
                    source:   source.constructor.name,
                    errMsg:   error.toString(),
                    errObj:   error,
                    method:   this.connection.parser.incoming.method,
                    url:      this.connection.parser.incoming.url,
                    versions: process.versions,
                    platform: process.platform,
                    uid:      process.getuid    && process.getuid(),
                    gid:      process.getgid    && process.getgid(),
                    groups:   process.getgroups && process.getgroups()
                }, null, 2) 
                /* this may be extended for custom error codes, but try to stick to standards! */
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
