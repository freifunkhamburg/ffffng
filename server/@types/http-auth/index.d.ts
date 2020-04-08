declare module "http-auth" {
    import {RequestHandler} from "express"

    class Auth {}

    class BasicAuth extends Auth {}
    class BasicAuthOptions {}

    type BasicAuthChecker =
        (username: string, password: string, callback: BasicAuthCheckerCallback) => void
    type BasicAuthCheckerCallback = (result: boolean | Error, customUser?: string) => void

    function basic(options: BasicAuthOptions, checker: BasicAuthChecker): BasicAuth
    function connect(auth: Auth): RequestHandler
}
