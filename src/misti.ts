import { Runner, Args, UIProvider } from "@ton/blueprint";
import { MistiExecutor } from "./executor";
import { Sym } from "./util";
import { MistiResult, resultToString } from "@nowarp/misti/dist/cli";

/**
 * Outputs the Misti result using the UI provider.
 */
function handleResult(result: MistiResult, ui: UIProvider): void {
  const resultStr = resultToString(result, "plain");
  switch (result.kind) {
    case "warnings":
      ui.write(
        `${Sym.WARN} Misti found ${result.warnings.reduce((acc, out) => acc + out.warnings.length, 0)} warnings:\n${resultStr}`,
      );
      break;
    case "error":
      ui.write(`${Sym.ERR} ${resultStr}`);
      break;
    case "ok":
      ui.write(`${Sym.OK} ${resultStr}`);
      break;
    case "tool":
      ui.write(resultStr);
      break;
  }
}

export const misti: Runner = async (args: Args, ui: UIProvider) => {
  const executor = await MistiExecutor.fromArgs(args, ui);
  if (!executor) {
    return;
  }
  const result = await executor.execute();
  handleResult(result, ui);
};
