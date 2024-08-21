import { Runner, Args, UIProvider } from "@ton/blueprint";
import { createMistiCommand } from "@nowarp/misti/dist/src/cli";

export interface MistiResult {
  code: number;
  output: string;
  error?: string;
}

export async function runMistiCommand(args: string[]): Promise<MistiResult> {
  const command = createMistiCommand();
  const output: string[] = [];
  const errors: string[] = [];
  command.configureOutput({
    writeOut: (str: string) => output.push(str),
    writeErr: (str: string) => errors.push(str),
  });
  try {
    await command.parseAsync(args, { from: "user" });
    return { code: 0, output: output.join("") };
  } catch (err: any) {
    return {
      code: err.exitCode || 1,
      output: output.join(""),
      error: errors.join("") || err.message,
    };
  }
}

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
  ui.setActionPrompt("⏳ Checking the project...\n");
  const argsStr = argsToStringList(args).slice(1);
  await runMistiCommand(argsStr);
};
