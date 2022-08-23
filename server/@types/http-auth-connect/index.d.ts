declare module "http-auth-connect" {
    import { Auth } from "http-auth";
    import { RequestHandler } from "express";

    export default function (auth: Auth): RequestHandler;
}
