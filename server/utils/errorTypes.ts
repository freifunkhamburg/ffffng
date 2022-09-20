import { HttpStatusCode } from "../shared/utils/http";

// TODO: Replace this by throwing typed errors.
export default {
    badRequest: { code: HttpStatusCode.BAD_REQUEST },
    notFound: { code: HttpStatusCode.NOT_FOUND },
    conflict: { code: HttpStatusCode.CONFLICT },
    internalError: { code: HttpStatusCode.INTERNAL_SERVER_ERROR },
};
