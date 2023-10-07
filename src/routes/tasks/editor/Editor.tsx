import { useEffect, useState } from "react";
import clsx from "clsx";
import { Editor as CodeEditor } from "@monaco-editor/react";
import { fs } from "@tauri-apps/api";
import React, { useRef } from "react";
import { getTask } from "../../../utils/tasks";
import { BaseDirectory } from "@tauri-apps/api/path";
import FileExplorer from "./FileExplorer";
import {
  IEditorConfig,
  ITabMeta,
  createTempFile,
  getEditorConfig,
  getTempFilePath,
  updateEditorConfig,
} from "../../../utils/editor";
import { FileEntry } from "@tauri-apps/api/fs";
import { TabBar, extensionToLanguage } from "./TabBar";
import { HotkeysProvider } from "react-hotkeys-hook";
export default function Editor() {
  const [curTab, setCurTab] = useState<ITabMeta | null>(null); // Explicitly set to null

  const [tabs, setTabs] = useState<ITabMeta[]>([]);
  const [content, setContent] = useState<string>("");
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const task = window.location.pathname.split("/")[3];
  const [selectedTreeTab, setSelectedTreeTab] = useState<string | null>("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [editorConfig, setEditorConfig] = useState<IEditorConfig>({});

  const handleEditorChange = (newValue: string) => {
    setContent(newValue);
    if (curTab) {
      // Update the tab's content and mark it as "dirty"
      setTabs((prevTabs) => {
        return prevTabs.map((tab) => {
          if (tab.path === curTab.path) {
            return { ...tab, isDirty: true };
          }
          return tab;
        });
      });

      // Save the changes to the temporary file
      createTempFile(curTab.path, newValue);
    }
  };

  useEffect(() => {
    getEditorConfig(task).then((config) => {
      setEditorConfig(config);
    });
    async function loadTabs() {
      const editorConfig = await getEditorConfig(task); // Replace with the appropriate task name
      if (editorConfig.open_tabs) {
        setTabs(editorConfig.open_tabs);

        if (typeof editorConfig.active_tab_index !== "undefined") {
          setCurTab(editorConfig.open_tabs[editorConfig.active_tab_index || 0]);
        }
      }
    }
    loadTabs();
  }, []);

  // Update editor config when the tabs change
  useEffect(() => {
    async function promise() {
      const editorConfig = await getEditorConfig(task);

      updateEditorConfig(task, {
        ...editorConfig,
        active_tab_index: tabs.findIndex((t) => t.path === curTab?.path),
        open_tabs: tabs,
      });
    }
    promise();
  }, [tabs]);

  // If the current tab changes, load the content of the new tab
  useEffect(() => {
    // console.log("curTab change");
    async function loadContent() {
      if (curTab) {
        let contentToLoad;
        if (curTab.isDirty) {
          contentToLoad = await fs.readTextFile(getTempFilePath(curTab.path), {
            dir: BaseDirectory.Home,
          });
        } else {
          console.log("Loading from file");
          contentToLoad = await fs.readTextFile(curTab.path, {
            dir: BaseDirectory.Home,
          });
        }
        setContent(contentToLoad);
      }
    }

    loadContent().then(() => {
      // After content has been updated, then update the editor config
      if (curTab) {
        const activeTabIndex = tabs.findIndex((t) => t.path === curTab?.path);
        updateEditorConfig(task, {
          open_tabs: tabs,
          active_tab_index: activeTabIndex === -1 ? null : activeTabIndex,
        });
      }
    });
  }, [curTab]);

  useEffect(() => {
    if (curTab) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        if (curTab.isDirty) {
          fs.writeTextFile(getTempFilePath(curTab.path), content, {
            dir: BaseDirectory.Home,
          });
        }
      }, 50);
    }
  }, [content]);

  return (
    <div className="flex flex-col h-full w-full ">
      <HotkeysProvider>
        <div className="flex flex-grow w-full h-full bg-base-200 relative ">
          <FileExplorer
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            selectedTreeTab={selectedTreeTab}
            setSelectedTreeTab={setSelectedTreeTab}
            setTabs={setTabs}
            curTab={curTab}
            setSelectedTab={setCurTab}
            tabs={tabs}
          />
          <div className="flex-grow flex-col overflow-hidden ">
            <div className="flex-none">
              <TabBar
                editorConfig={editorConfig}
                setEditorConfig={setEditorConfig}
                selectedTreeTab={selectedTreeTab}
                setSelectedTreeTab={setSelectedTreeTab}
                expandedFolders={expandedFolders}
                setExpandedFolders={setExpandedFolders}
                setContent={setContent}
                content={content}
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
                language={"python"}
                value={content}
                onChange={(v) => {
                  handleEditorChange(v || "");
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
      </HotkeysProvider>
    </div>
  );
}
