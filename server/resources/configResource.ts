import {success} from "../utils/resources";
import {config} from "../config";
import {Request, Response} from "express";

export function get (req: Request, res: Response): void {
    success(
        res,
        config.client
    );
}
