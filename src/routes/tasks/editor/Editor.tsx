import { useEffect, useState } from "react";
import clsx from "clsx";
import { Editor as CodeEditor } from "@monaco-editor/react";
import { fs } from "@tauri-apps/api";
import React, { useRef } from "react";
import { getTask } from "../../../utils/tasks";
import { BaseDirectory } from "@tauri-apps/api/path";
import FileExplorer from "./FileExplorer";
import { createTempFile, getEditorConfig } from "../../../utils/editor";
import { FileEntry } from "@tauri-apps/api/fs";
import { ITab, TabBar, extensionToLanguage } from "./TabBar";

export default function Editor() {
  const [curTab, setCurTab] = useState<ITab | undefined>(undefined);
  const [tabs, setTabs] = useState<ITab[]>([]);

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  function contentChange(value?: string) {
    setTabs(
      tabs.map((tab) => {
        if (tab.file === curTab?.file) {
          tab.content = value;
        }
        return tab;
      })
    );

    if (!curTab) return;

    setCurTab({
      ...curTab,
      content: value,
    });

    // Clear the previous timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Set a new timeout to debounce the file write
    timeoutIdRef.current = setTimeout(() => {
      createTempFile(curTab.file, value || "");
    }, 500);
  }
  async function newEditor() {
    const task = await getTask(window.location.pathname.split("/")[3]);
    const tempConfig = await getEditorConfig(task.name);
    const files = await fs.readDir(`.task-scripter/tasks/${task.name}/temp`, {
      dir: BaseDirectory.Home,
      recursive: true,
    });

    const newTabs: ITab[] = [];
    await extractFiles(files);

    async function extractFiles(files: FileEntry[]) {
      for (const file of files) {
        if (file.children) {
          await extractFiles(file.children);
        } else {
          const content = await fs.readTextFile(file.path);
          newTabs.push({
            name: file.name!,
            file: file.path.replace("temp/", "src/"),
            oldContent: content,
            // saved: true,
            content,
          });
        }
      }
    }

    console.log("HERES THE NEW TABS", newTabs);

    setTabs(newTabs);
    if (tempConfig?.last_tab) {
      setCurTab(newTabs.find((tab) => tab.file === tempConfig?.last_tab));
    }
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
              "rounded-tl-none": curTab?.file === tabs[0]?.file,
            })}
          >
            <CodeEditor
              theme="task-scripter"
              language={extensionToLanguage(curTab?.name.split(".")[1] || "")}
              value={curTab?.content}
              onChange={contentChange}
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
