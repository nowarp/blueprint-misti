import { Args, UIProvider } from "@ton/blueprint";
import { findCompiles, selectFile } from "@ton/blueprint/dist/utils";
import {
  TactProjectInfo,
  extractProjectInfo,
  argsToStringList,
} from "./blueprint";
import {
  MistiResult,
  runMistiCommand,
  createMistiCommand,
} from "@nowarp/misti/dist/cli";
import { setStdlibPath } from "./stdlibPaths";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Interactively selects one of the Tact projects available in the Blueprint compile wrapper.
 */
async function selectProject(
  ui: UIProvider,
  args: Args,
): Promise<TactProjectInfo | undefined> {
  const result = await selectFile(await findCompiles(), {
    ui,
    hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
    import: false,
  });
  if (!fs.existsSync(result.path)) {
    ui.write(
      [
        `❌ Cannot access ${result.path}`,
        "Please specify path to your contract directly: `yarn blueprint misti path/to/contract.tact`",
      ].join("\n"),
    );
    return undefined;
  }
  const projectInfo = await extractProjectInfo(result.path);
  if (projectInfo === undefined) {
    ui.write(
      [
        `❌ Cannot extract project information from ${result.path}`,
        "Please specify path to your contract directly: `yarn blueprint misti path/to/contract.tact`",
      ].join("\n"),
    );
    return undefined;
  }
  return projectInfo;
}

export class MistiExecutor {
  private constructor(
    private projectName: string,
    private args: string[],
    private ui: UIProvider,
  ) {}
  public static async fromArgs(
    args: Args,
    ui: UIProvider,
  ): Promise<MistiExecutor | undefined> {
    let argsStr = argsToStringList(args).slice(1);
    const command = createMistiCommand();

    let tactPathIsDefined = true;
    const originalArgsStr = [...argsStr];
    try {
      await command.parseAsync(argsStr, { from: "user" });
    } catch (error) {
      tactPathIsDefined = false;
      if (error instanceof Error && error.message.includes('is required')) {
        const tempPath = '/tmp/contract.tact';
        argsStr.push(tempPath);
        await command.parseAsync(argsStr, { from: "user" });
      } else {
        throw error;
      }
    }
    argsStr = originalArgsStr;

    if (tactPathIsDefined) {
      // The path to the Tact configuration or contract is explicitly specified
      // in arguments (e.g. yarn blueprint misti path/to/contract.tact).
      const tactPath = command.args[0];
      const projectName = path.basename(tactPath).split(".")[0];
      return new MistiExecutor(projectName, argsStr, ui);
    }

    // Interactively select the project
    const project = await selectProject(ui, args);
    if (!project) return undefined;
    try {
      const tactPath = this.generateTactConfig(project, ".");
      argsStr.push(tactPath);
      return new MistiExecutor(project.projectName, argsStr, ui);
    } catch {
      ui.write("❌ Cannot create a Tact config in current directory");
      return undefined;
    }
  }

  /**
   * Generates the Tact configuration file based on the Blueprint compilation output.
   *
   * @param outDir Directory to save the generated file
   * @throws If it is not possible to create a path
   * @returns Absolute path to the generated config
   */
  private static generateTactConfig(
    config: TactProjectInfo,
    outDir: string,
  ): string | never {
    const content = JSON.stringify({
      projects: [
        {
          name: config.projectName,
          path: config.target,
          output: path.join(os.tmpdir(), "tact-output"),
          options: config.options,
        },
      ],
    });
    const outPath = path.join(outDir, "tact.config.json");
    fs.writeFileSync(outPath, content);
    return outPath;
  }

  public async execute(): Promise<MistiResult> {
    this.ui.write(`⏳ Checking ${this.projectName}...\n`);
    setStdlibPath(this.args);
    // ! is safe: it could not be undefined in Misti 0.4+
    const result = (await runMistiCommand(this.args))!;
    return result[1];
  }
}
