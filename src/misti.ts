import { Runner, Args, UIProvider } from "@ton/blueprint";
import { runMistiCommand } from "@nowarp/misti/dist/src/cli";

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

export const misti: Runner = async (args: Args, ui: UIProvider) => {
  ui.write("⏳ Checking the project...\n");
  const argsStr = argsToStringList(args).slice(1);
  const result = await runMistiCommand(argsStr);
  if (result.errorsFound === 0 || result.output === undefined) {
    ui.write(`✅ No errors found`);
  } else {
    ui.write(`❌ Misti found ${result.errorsFound} errors:\n${result.output}`);
  }
};
