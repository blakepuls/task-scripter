import { fs, invoke } from "@tauri-apps/api";
import { ITask } from "../types";
import { BaseDirectory } from "@tauri-apps/api/path";

async function processDirs(
  dirs: any[]
): Promise<{ name: string; path: string }[]> {
  let fileList: { name: string; path: string }[] = [];

  function traverseDir(dir: any) {
    // Skip directories
    if (dir.children) {
      dir.children.forEach((child: any) => traverseDir(child));
      return;
    }
    // Add files
    if (dir.path) {
      const truncatedPath = dir.path.split(".task-scripter/tasks/")[1];
      fileList.push({ name: dir.name, path: truncatedPath });
    }
  }

  dirs.forEach(traverseDir);
  return fileList;
}

export async function getTasks() {
  // Get all tasks via invoking the tauri API
  var tasks = (await invoke("get_tasks")) as ITask[];

  for (let i = 0; i < tasks.length; i++) {
    const dirs = await fs.readDir(`.task-scripter/tasks/${tasks[i].name}/src`, {
      dir: BaseDirectory.Home,
      recursive: true,
    });
    tasks[i].files = await processDirs(dirs);
  }

  return tasks as ITask[];
}

export async function updateTask(task: ITask) {
  await fs.createDir(`.task-scripter/tasks/${task.name}`, {
    dir: BaseDirectory.Home,
    recursive: true,
  });

  await fs.createDir(`.task-scripter/tasks/${task.name}/src`, {
    dir: BaseDirectory.Home,
    recursive: true,
  });

  await fs.writeFile(
    {
      path: `.task-scripter/tasks/${task.name}/task.json`,
      contents: JSON.stringify(task, null, 2),
    },
    {
      dir: BaseDirectory.Home,
    }
  );

  // If index.* doesn't exist, create it
  const indexExists = await fs.exists(
    `.task-scripter/tasks/${task.name}/src/index.${task.language}`,
    {
      dir: BaseDirectory.Home,
    }
  );

  if (!indexExists) {
    await fs.writeFile(
      {
        path: `.task-scripter/tasks/${task.name}/src/index.${task.language}`,
        contents: "",
      },
      {
        dir: BaseDirectory.Home,
      }
    );
  }
}

export async function deleteTask(name: string) {
  await fs.removeDir(`.task-scripter/tasks/${name}`, {
    dir: BaseDirectory.Home,
    recursive: true,
  });
}

export async function getTask(name: string) {
  const taskRaw = await fs.readTextFile(
    `.task-scripter/tasks/${name}/task.json`,
    {
      dir: BaseDirectory.Home,
    }
  );

  const task = JSON.parse(taskRaw) as ITask;

  const dirs = await fs.readDir(`.task-scripter/tasks/${name}/src`, {
    dir: BaseDirectory.Home,
    recursive: true,
  });
  task.files = await processDirs(dirs);

  return task;
}
