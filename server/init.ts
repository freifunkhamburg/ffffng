import realFs from "fs";
import gracefulFs from "graceful-fs";

import { parseCommandLine } from "./config";

// Use graceful-fs instead of fs also in all libraries to have more robust fs handling.
gracefulFs.gracefulify(realFs);

// Init config by parsing commandline. Afterwards all other imports may happen.
parseCommandLine();
