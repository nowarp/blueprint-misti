import { Runner, Args, UIProvider } from "@ton/blueprint";
import { MistiExecutor } from "./executor";
import { Sym } from "./util";
import { Result, resultToString } from "@nowarp/misti/dist/cli";

/**
 * Outputs the Misti result using the UI provider and returns the exit code.
 *
 * Exit codes reference: https://nowarp.io/tools/misti/docs/tutorial/cli#exit-codes
 */
function handleResult(result: Result, ui: UIProvider): number {
  const resultStr = resultToString(result, "plain");
  switch (result.kind) {
    case "warnings":
      ui.write(resultStr);
      return 1;
    case "error":
      ui.write(`${Sym.ERR} ${resultStr}`);
      return 2;
    case "ok":
      ui.write(`${Sym.OK} ${resultStr}`);
      return 0;
    case "tool":
      ui.write(resultStr);
      return 0;
  }
}

export const misti: Runner = async (args: Args, ui: UIProvider) => {
  try {
    const executor = await MistiExecutor.fromArgs(args, ui);
    const result = await executor.execute();
    process.exit(handleResult(result, ui));
  } catch (err) {
    if (err instanceof Error) {
      ui.write(`${Sym.ERR} ${err.message}`);
      return;
    } else {
      ui.write(
        [
          `${Sym.ERR} Unknown error: ${JSON.stringify(err)}`,
          "Please report it: https://github.com/nowarp/blueprint-misti/issues",
        ].join("\n"),
      );
    }
  }
};
