import { Runner, Args, UIProvider } from "@ton/blueprint";
import { execSync } from "child_process";

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
  const runCommand = `npx misti ${argsToStringList(args).slice(1).join(" ")}`;
  try {
    const result = execSync(runCommand, { encoding: "utf-8", stdio: "pipe" });
    ui.write(`✅ No errors found:\n${result.trim()}`);
  } catch (e) {
    ui.write(`❌ Misti found some errors:\n${e}`);
  }
};
