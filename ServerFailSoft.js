/**
 * @author Colten Jackson
 * Using ServerFailSoft as your http.ServerResponse allows informative errors
 * to be sent to the client when an error is emitted by a stream being piped.
 * 
 * If, however, something goes wrong halfway through writing a response,
 * I will still concatenate the JSON error string to whatever bytes were sent.
 * This is not ideal, but I think its better than swallowing the error silently.
 */
const { ServerResponse } = require('http')
const os = require('os')
const errorMap = require('./errorMap.json')

module.exports = class ServerFailSoft extends ServerResponse {
    constructor(res){
        super(res)
        this.once('pipe', source => {
            source.once('error', error => {
                /* prepare error response: prettyprint with 2 space indent */
                /* error.stack.split() just so lines appear on separate lines when pretty-printed */
                /* NOTE: errObj may be empty but still carry a message when stringified */
                let status = errorMap[ error.code ] || 500
                let errorResponse = JSON.stringify({
                    source:   source.constructor.name,
                    status:   status,
                    errObj:   error,
                    errMesg:  error.toString(),
                    errStack: error.stack.split(os.EOL),
                    method:   this.connection && this.connection.parser.incoming.method,
                    url:      this.connection && this.connection.parser.incoming.url,
                    versions: process.versions,
                    platform: process.platform,
                    uid:      process.getuid    && process.getuid(),
                    gid:      process.getgid    && process.getgid(),
                    groups:   process.getgroups && process.getgroups(),
                }, null, 2) 
                /* this may be extended for custom error codes, but try to stick to standards! */
                this.headersSent || this.writeHead(status, {
                    'Content-Length': Buffer.byteLength(errorResponse),
                    'Content-Type': 'application/json',
                })
                this.writable && this.end(errorResponse)
            })
        })
    }
}
