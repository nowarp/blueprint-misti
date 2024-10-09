/**
 * Various utilities to work with Blueprint internals and its generated files.
 *
 * @packageDocumentation
 */

import {
  createSourceFile,
  ScriptTarget,
  Node,
  isVariableDeclaration,
  ObjectLiteralExpression,
  isPropertyAssignment,
  StringLiteral,
  Expression,
  forEachChild,
} from "typescript";
import { Args } from "@ton/blueprint";
import { promises as fs } from "fs";
import path from "path";

/**
 * Tact project info parsed from the Blueprint compilation wrapper.
 */
export type TactProjectInfo = {
  projectName: string;
  target: string;
  options: Record<string, unknown>;
};

/**
 * Blueprint generates TypeScript wrappers that define compilation options in
 * the following format:
 *
 * ```typescript
 * import { CompilerConfig } from '@ton/blueprint';
 * export const compile: CompilerConfig = {
 *     lang: 'tact',
 *     target: 'contracts/test1.tact',
 *     options: {
 *         debug: true,
 *     },
 * };
 * ```
 *
 * This function extracts the `target` and `options` values parsing the wrapper file.
 */
async function parseCompileWrapper(
  filePath: string,
): Promise<TactProjectInfo | undefined> {
  const projectName = path.basename(filePath).replace(".compile.ts", "");
  const content = await fs.readFile(filePath, "utf-8");
  const sourceFile = createSourceFile(
    filePath,
    content,
    ScriptTarget.ESNext,
    true,
  );
  let target: string | undefined;
  let options: Record<string, unknown> = {} as Record<string, unknown>;
  function findNodes(node: Node) {
    if (isVariableDeclaration(node) && node.name.getText() === "compile") {
      const initializer = node.initializer as ObjectLiteralExpression;
      for (const property of initializer.properties) {
        if (isPropertyAssignment(property)) {
          if (property.name.getText() === "target") {
            target = (property.initializer as StringLiteral).text;
          }
          if (property.name.getText() === "options") {
            const optionsObj: Record<string, unknown> = {};
            (
              property.initializer as ObjectLiteralExpression
            ).properties.forEach((prop) => {
              if (isPropertyAssignment(prop)) {
                optionsObj[prop.name.getText()] = (
                  prop.initializer as Expression
                ).getText();
              }
            });
            options = optionsObj;
          }
        }
      }
    }
    forEachChild(node, findNodes);
  }
  findNodes(sourceFile);
  return target ? { projectName, target, options } : undefined;
}

/**
 * Extracts an information from the TypeScript wrapper file genreated by Blueprint.
 */
export async function extractProjectInfo(
  blueprintCompilePath: string,
): Promise<TactProjectInfo | undefined> {
  const filePath = path.resolve(__dirname, blueprintCompilePath);
  console.log('Parsing', filePath);
  return parseCompileWrapper(filePath);
}

/**
 * Converts Blueprint arguments to a list of strings.
 */
export function argsToStringList(args: Args): string[] {
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
