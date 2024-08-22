import { Runner, Args, UIProvider } from "@ton/blueprint";
import { runMistiCommand } from "@nowarp/misti/dist/src/cli";
import path from "path";

export const STDLIB_PATH_ARG = "--tact-stdlib-path";

function argsToStringList(args: Args): string[] {
  const argsList: string[] = args._;
  Object.entries(args).forEach(([key, value]) => {
    if (key !== "_" && value !== undefined) {
      if (typeof value === "boolean") {
        argsList.push(key);
      } else {
        argsList.push(key, value.toString());
      }
    }
  });
  return argsList;
}

/**
 * Returns true if there is an explicitly specified path to the Tact stdlib in the list of arguments.
 */
function hasStdlibPath(args: string[]): boolean {
  return args.find((a) => a === STDLIB_PATH_ARG) !== undefined;
}

// TODO: Defined in Misti API since the next version.
export function setTactStdlibPath(): string {
  const stdlib_path_elements = [
    "node_modules",
    "@tact-lang",
    "compiler",
    "stdlib",
  ];
  const distPathPrefix = __dirname.includes("/dist/") ? "../../.." : "../..";
  return path.resolve(__dirname, distPathPrefix, ...stdlib_path_elements);
}

/**
 * Adds STDLIB_PATH_ARG to the list of arguments if not set.
 *
 * This is required to use Tact's stdlib from the `node_modules` of the current
 * blueprint project because it is not included in the `node_modules/@nowarp/misti`.
 */
function setStdlibPath(args: string[]): void {
  if (hasStdlibPath(args)) return;
  args.push(STDLIB_PATH_ARG);
  args.push(setTactStdlibPath());
}

export const misti: Runner = async (args: Args, ui: UIProvider) => {
  ui.write("⏳ Checking the project...\n");
  const argsStr = argsToStringList(args).slice(1);
  setStdlibPath(argsStr);
  const result = await runMistiCommand(argsStr);
  if (result.errorsFound === 0 || result.output === undefined) {
    ui.write(`✅ No errors found`);
  } else {
    ui.write(`❌ Misti found ${result.errorsFound} errors:\n${result.output}`);
  }
};
