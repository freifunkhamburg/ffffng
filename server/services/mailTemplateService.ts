import _ from "lodash";
import deepExtend from "deep-extend";
import {readFileSync, promises as fs} from "graceful-fs";
import moment from "moment";
import {htmlToText} from "nodemailer-html-to-text";

import {config} from "../config";
import Logger from "../logger";
import {editNodeUrl} from "../utils/urlBuilder";
import {Transporter} from "nodemailer";
import {MailData, Mail} from "../types";

const templateBasePath = __dirname + '/../mailTemplates';
const snippetsBasePath = templateBasePath + '/snippets';

const templateFunctions: {
    [key: string]:
        | ((name: string, data: MailData) => string)
        | ((data: MailData) => string)
        | ((href: string, text: string) => string)
        | ((unix: number) => string)
} = {};

function renderSnippet(this: any, name: string, data: MailData): string {
    const snippetFile = snippetsBasePath + '/' + name + '.html';

    return _.template(readFileSync(snippetFile).toString())(deepExtend(
        {},
        this, // parent data
        data,
        templateFunctions
    ));
}

function snippet(name: string): ((this: any, data: MailData) => string) {
    return function (this: any, data: MailData): string {
        return renderSnippet.bind(this)(name, data);
    };
}

function renderLink(href: string, text: string): string {
    // noinspection HtmlUnknownTarget
    return _.template(
        '<a href="<%- href %>#" style="color: #E5287A;"><%- text %></a>'
    )({
        href: href,
        text: text || href
    });
}

function renderHR(): string {
    return '<hr style="border-top: 1px solid #333333; border-left: 0; border-right: 0; border-bottom: 0;" />';
}

function formatDateTime(unix: number): string {
    return moment.unix(unix).locale('de').local().format('DD.MM.YYYY HH:mm');
}

function formatFromNow(unix: number): string {
    return moment.unix(unix).locale('de').fromNow();
}

templateFunctions.header = snippet('header');
templateFunctions.footer = snippet('footer');

templateFunctions.monitoringFooter = snippet('monitoring-footer');

templateFunctions.snippet = renderSnippet;

templateFunctions.link = renderLink;
templateFunctions.hr = renderHR;

templateFunctions.formatDateTime = formatDateTime;
templateFunctions.formatFromNow = formatFromNow;

export function configureTransporter (transporter: Transporter): void {
    transporter.use('compile', htmlToText({
        tables: ['.table']
    }));
}

export async function render(mailOptions: Mail): Promise<{subject: string, body: string}> {
    const templatePathPrefix = templateBasePath + '/' + mailOptions.email;

    const subject = await fs.readFile(templatePathPrefix + '.subject.txt');
    const body = await fs.readFile(templatePathPrefix + '.body.html');

    const data = deepExtend(
        {},
        mailOptions.data,
        {
            community: config.client.community,
            editNodeUrl: editNodeUrl()
        },
        templateFunctions
    );

    try {
        return {
            subject: _.template(subject.toString())(data).trim(),
            body: _.template(body.toString())(data)
        };
    } catch (error) {
        Logger
            .tag('mail', 'template')
            .error('Error rendering template for mail[' + mailOptions.id + ']:', error);
        throw error;
    }
}
