declare module "http-auth" {
    class Auth {}

    class BasicAuth extends Auth {}
    class BasicAuthOptions {}

    type BasicAuthChecker =
        (username: string, password: string, callback: BasicAuthCheckerCallback) => void
    type BasicAuthCheckerCallback = (result: boolean | Error, customUser?: string) => void

    function basic(options: BasicAuthOptions, checker: BasicAuthChecker): BasicAuth
}
