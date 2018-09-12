/**
---
author: Colten Jackson
license: Continuity
version: 2.1.0
...
**/

module.exports = class ServerFailSoft extends require('http').ServerResponse {
    constructor(req){
        super(req)
        this.on('pipe', source => {
            source.prependOnceListener('data', () => {
                this.writeHead(source.statusCode || 200, source.headers || {})
            }).once('error', error => {
                let errorResponse = JSON.stringify({
                    source: source.constructor.name,
                    errMsg: error.toString(),
                    errObj: error, // Error Object may be empty, OK.
                    // url: source.source.url,
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
                // the statuscode and proper JSON response can only occur if you emit
                // an error before writing any bytes. So it's not ideal to
                this.end(errorResponse)
            })
        })
    }
}
