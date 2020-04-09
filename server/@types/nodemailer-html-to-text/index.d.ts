declare module "nodemailer-html-to-text" {
    import {PluginFunction} from "nodemailer/lib/mailer";

    export function htmlToText(options: HtmlToTextOptions): PluginFunction;
}
