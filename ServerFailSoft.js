module.exports = class ServerFailSoft extends require('http').ServerResponse {
    constructor(req){
        super(req)
        this.on('pipe', source => {
            source.prependOnceListener('data', () => {
                this.writeHead(source.statusCode || 200, source.headers || {})
            }).once('error', error => {
                if(this.headersSent) return this.emit('error', "Error thrown after data sent to client. Cannot set headers after they're sent.")
                let errorResponse = JSON.stringify({
                    errMsg: error.toString(),
                    errObj: error, // Error Object may be empty
                    versions: process.versions,
                    platform: process.platform,
                    uid: process.getuid(),
                    gid: process.getgid(),
                    groups: process.getgroups()
                }, null, 2) // prettyprint with 2 space indent
                this.writeHead(
                    error.code == 'ENOENT'  ? 404 : // error no entity
                    error.code == 'ENOTDIR' ? 404 : // directory doesnt exist
                    error.code == 'ERANGE'  ? 416 : // range not satisfiable
                    error.code == 'EACCES'  ? 423 : // error no access
                    /* no code ? default: */  500 , /* + headers: */ {
                    'Content-Length': Buffer.byteLength(errorResponse),
                    'Content-Type': 'application/json',
                })
                this.end(errorResponse)
            })
        })
    }
}
