import { fs } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import { Console } from "console";

export interface ITabMeta {
  path: string;
  cursorPosition?: {
    line: number;
    character: number;
  };
  isDirty?: boolean;
}

interface IEditorConfig {
  tab_history?: string[];
  open_tabs?: ITabMeta[];
  active_tab_index?: number | null;
  backwardHistory?: ITabMeta[];
  forwardHistory?: ITabMeta[];
}

// Removes the file from the given path, example src\src\index - Copy - Copy (2).py -> src\src\
function getDirFromFile(path: string) {
  const split = path.split("/");
  split.pop();
  return split.join("/");
}

// Used for creating a temporary file for the editor to use before saving.
export async function createTempFile(path: string, content: string) {
  const task = path
    .split(".task-scripter/tasks/")[1]
    .split(".task")[0]
    .split("/")[0];

  let file = path.split(".task-scripter/tasks/")[1].split("/")[1];
  let tempFile = path.split(task)[1];
  file = `.task-scripter/tasks/${task}/temp/${tempFile}`;

  await fs.createDir(getDirFromFile(file), {
    recursive: true,
    dir: BaseDirectory.Home,
  });

  fs.writeFile(file, content, { dir: BaseDirectory.Home });
}

export async function deleteTempFile(path: string, save?: boolean) {
  const task = path
    .split(".task-scripter/tasks/")[1]
    .split(".task")[0]
    .split("/")[0];

  let file = path.split(".task-scripter/tasks/")[1].replace(`${task}/`, "");
  file = `.task-scripter/tasks/${task}/temp/${file}`;

  // Get the contents of the file
  const content = await fs.readTextFile(file, { dir: BaseDirectory.Home });
  // Save the contents to the original file
  if (save) {
    console.log("Writing");
    fs.writeFile(path, content, { dir: BaseDirectory.Home });
    console.log("Written");
  }
  console.log("deleting");
  // Delete the temp file
  await fs.removeFile(file, { dir: BaseDirectory.Home });
  console.log("deleted");
}

export function getTempFilePath(path: string) {
  const task = path
    .split(".task-scripter/tasks/")[1]
    .split(".task")[0]
    .split("/")[0];

  let file = path.split(".task-scripter/tasks/")[1].replace(`${task}/`, "");
  file = `.task-scripter/tasks/${task}/temp/${file}`;

  return file;
}

// export function getTempFile(path: string) {
//   const task = path
//     .split(".task-scripter/tasks/")[1]
//     .split(".task")[0]
//     .split("/")[0];

//   let file = path.split(".task-scripter/tasks/")[1].split("/")[1];
//   file = `.task-scripter/tasks/${task}/temp/${file}`;

//   // console.log("HEY MAN", path);
//   // console.log("HEY MAN", file);
//   console.log("Reading", path);
//   return fs.readTextFile(path);
//   // return fs.readTextFile(file, { dir: BaseDirectory.Home });
// }

export async function getEditorConfig(task: string) {
  const content = await fs.readTextFile(
    `.task-scripter/tasks/${task}/editor.json`,
    {
      dir: BaseDirectory.Home,
    }
  );

  return JSON.parse(content) as IEditorConfig;
}

export async function updateEditorConfig(task: string, config: IEditorConfig) {
  fs.writeFile(
    `.task-scripter/tasks/${task}/editor.json`,
    JSON.stringify(config, null, 2),
    {
      dir: BaseDirectory.Home,
    }
  );
}
