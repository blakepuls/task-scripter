import { useEffect, useState } from "react";
import clsx from "clsx";
import { Editor as CodeEditor } from "@monaco-editor/react";
import { fs } from "@tauri-apps/api";
import React, { useRef } from "react";
import { getTask } from "../../../utils/tasks";
import { BaseDirectory } from "@tauri-apps/api/path";
import FileExplorer from "./FileExplorer";
import {
  ITabMeta,
  createTempFile,
  getEditorConfig,
} from "../../../utils/editor";
import { FileEntry } from "@tauri-apps/api/fs";
import { TabBar, extensionToLanguage } from "./TabBar";

export default function Editor() {
  const [curTab, setCurTab] = useState<ITabMeta | undefined>(undefined);
  const [tabs, setTabs] = useState<ITabMeta[]>([]);
  const [content, setContent] = useState<string>("");
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  function contentChange(value?: string) {
    setTabs(
      tabs.map((tab) => {
        if (tab.path === curTab?.path) {
          tab.isDirty = true;
        }
        return tab;
      })
    );

    if (!curTab) return;

    setCurTab({
      ...curTab,
      isDirty: true,
    });

    // Clear the previous timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Set a new timeout to debounce the file write
    timeoutIdRef.current = setTimeout(() => {
      createTempFile(curTab.path, value || "");
    }, 500);
  }
  async function newEditor() {
    const task = await getTask(window.location.pathname.split("/")[3]);
    const editor = await getEditorConfig(task.name);
    const files = await fs.readDir(`.task-scripter/tasks/${task.name}/temp`, {
      dir: BaseDirectory.Home,
      recursive: true,
    });

    const newTabs: ITabMeta[] = [];
    await extractFiles(files);

    async function extractFiles(files: FileEntry[]) {
      for (const file of files) {
        if (file.children) {
          await extractFiles(file.children);
        } else {
          const content = await fs.readTextFile(file.path);
          newTabs.push({
            path: file.path.replace("temp/", "src/"),
          });
        }
      }
    }

    setTabs(newTabs);
    // if (editor?.last_tab) {
    //   setCurTab(newTabs.find((tab) => tab.file === editor?.last_tab));
    // }
  }

  useEffect(() => {
    newEditor();
  }, []);

  return (
    <div className="flex flex-col h-full w-full ">
      <div className="flex flex-grow w-full h-full bg-base-200 relative ">
        <FileExplorer
          setTabs={setTabs}
          selectedTab={curTab}
          setSelectedTab={setCurTab}
          tabs={tabs}
        />
        <div className="flex-grow flex-col overflow-hidden ">
          <div className="flex-none">
            <TabBar
              curTab={curTab}
              setCurTab={setCurTab}
              setTabs={setTabs}
              tabs={tabs}
            />
          </div>
          <div
            className={clsx("rounded-tl-md h-full overflow-hidden", {
              "rounded-tl-none": curTab?.path === tabs[0]?.path,
            })}
          >
            <CodeEditor
              theme="task-scripter"
              // language={extensionToLanguage(curTab?.name.split(".")[1] || "")}
              value={content}
              onChange={(v) => {
                setContent(v || "");
              }}
              className="rounded-lg "
              options={{
                minimap: {
                  enabled: false,
                },
                fontSize: 18,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
