import {success} from "../utils/resources";
import {version} from "../config";
import {Request, Response} from "express";

export function get (req: Request, res: Response): void {
    success(
        res,
        {
            version
        }
    );
}
