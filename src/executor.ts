import { Args, UIProvider } from "@ton/blueprint";
import { findCompiles, selectFile } from "@ton/blueprint/dist/utils";
import { Sym } from "./util";
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
): Promise<TactProjectInfo> | never {
  const result = await selectFile(await findCompiles(), {
    ui,
    hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
    import: false,
  });
  if (!fs.existsSync(result.path)) {
    throw new Error(
      [
        `${Sym.ERR} Cannot access ${result.path}`,
        "Please specify path to your contract directly: `yarn blueprint misti path/to/contract.tact`",
      ].join("\n"),
    );
  }
  return await extractProjectInfo(result.name);
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
  ): Promise<MistiExecutor> | never {
    const argsStr = argsToStringList(args).slice(1);

    // Find and remove --blueprint-project argument
    // That's a blueprint-misti argument, not a Misti argument
    let blueprintProjectName: string | undefined;
    const projectIndex = argsStr.indexOf("--blueprint-project");
    if (projectIndex !== -1) {
      if (projectIndex + 1 < argsStr.length) {
        blueprintProjectName = argsStr[projectIndex + 1];
        argsStr.splice(projectIndex, 2); // Remove --blueprint-project and its value
      } else {
        throw new Error("--blueprint-project argument is missing a value");
      }
    }

    // Handle --blueprint-list-projects argument
    const listProjectsIndex = argsStr.indexOf("--blueprint-list-projects");
    if (listProjectsIndex !== -1) {
      const projects = await this.listProjects();
      ui.write(`Available projects:\n${projects.join("\n")}`);
      return new MistiExecutor("", [], ui);
    }

    const command = createMistiCommand();
    await command.parseAsync(argsStr, { from: "user" });
    const tactPathIsDefined = command.args.length > 0;
    if (tactPathIsDefined) {
      // The path to the Tact configuration or contract is explicitly specified
      // in arguments (e.g. yarn blueprint misti path/to/contract.tact).
      const tactPath = command.args[0];
      const projectName = path.basename(tactPath).split(".")[0];
      return new MistiExecutor(projectName, argsStr, ui);
    } else {
      const project = blueprintProjectName
        ? // The user has specified the project name using --blueprint-project
          await extractProjectInfo(blueprintProjectName)
        : // Interactively select the project
          await selectProject(ui, args);
      try {
        const tactPath = this.generateTactConfig(project, ".");
        argsStr.push(tactPath);
        return new MistiExecutor(project.projectName, argsStr, ui);
      } catch {
        throw new Error(`Cannot create a Tact config in current directory`);
      }
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
    const project: any = {
      name: config.projectName,
      path: config.target,
      output: path.join(os.tmpdir(), "tact-output"),
    };
    if (config.options !== undefined) {
      project.options = config.options;
    }
    const content = JSON.stringify({
      projects: [project],
    });
    const outPath = path.join(outDir, "tact.config.json");
    fs.writeFileSync(outPath, content);
    return outPath;
  }

  /**
   * Lists available projects for Misti analysis.
   */
  private static async listProjects(): Promise<string[]> {
    const compiles = await findCompiles();
    return compiles.map((compile) => compile.name);
  }

  public async execute(): Promise<MistiResult> {
    this.ui.write(`${Sym.WAIT} Checking ${this.projectName}...\n`);
    setStdlibPath(this.args);
    return (await runMistiCommand(this.args))[1];
  }
}
