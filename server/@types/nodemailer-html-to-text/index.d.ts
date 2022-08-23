declare module "nodemailer-html-to-text" {
    import { PluginFunction } from "nodemailer/lib/mailer";
    import { HtmlToTextOptions } from "html-to-text";

    export function htmlToText(options: HtmlToTextOptions): PluginFunction;
}
