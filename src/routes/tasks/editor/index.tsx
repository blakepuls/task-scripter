import { useEffect, useState } from "react";
import {
  AiFillDelete,
  AiFillEdit,
  AiOutlineEdit,
  AiOutlinePlus,
} from "react-icons/ai";
import { FaCode } from "react-icons/fa";
import { HiCodeBracket, HiPencilSquare, HiTrash } from "react-icons/hi2";
import clsx from "clsx";
import { Editor as CodeEditor, loader } from "@monaco-editor/react";
import "./styles.css";
import { ITask } from "../../../types";
import { fs, invoke } from "@tauri-apps/api";

loader.init().then((monaco) => {
  monaco.editor.defineTheme("task-scripter", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0F0F13",
      "editor.foreground": "#D4D4D4",
      "editorCursor.foreground": "#8423d9",
      "editor.lineHighlightBackground": "#0F0F13",
      "editorLineNumber.foreground": "#4d4d4d",
      "editorLineNumber.activeForeground": "#8423d9",
      "editor.selectionBackground": "#8423d9",
    },
  });
});

interface ITab {
  name: string;
  file: string;
  content?: string;
}

interface ITabBar {
  tabs: ITab[];
  curTab?: ITab;
  setCurTab: React.Dispatch<React.SetStateAction<ITab | undefined>>;
}

function TabBar({ tabs, curTab, setCurTab }: ITabBar) {
  return (
    <div className="flex flex-row items-center bg-base-200">
      {tabs?.map((tab, i) => {
        return (
          <button
            className={clsx(
              "p-1 px-2 flex flex-row items-center gap-1 transition duration-300 overflow-x-auto outline-none",
              {
                "hover:bg-base-300": tab.file !== curTab?.file,
                "bg-base-100": tab.file === curTab?.file,
                "rounded-tl-md": i === 0,
              }
            )}
            onClick={() => setCurTab(tab)}
          >
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}

import React, { useRef } from "react";
import { getTask } from "../../../utils/tasks";

interface IFileExplorerProps {
  files: string[];
  curTab?: ITab;
  setCurTab: React.Dispatch<React.SetStateAction<ITab | undefined>>;
}

function FileExplorer({ curTab, files, setCurTab }: IFileExplorerProps) {
  const fileExplorerRef = useRef<HTMLDivElement>(null);
  const [initialX, setInitialX] = useState(0);
  let isResizing = false;

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing = true;
    setInitialX(e.clientX - (fileExplorerRef.current?.offsetWidth || 0));
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", () => {
      isResizing = false;
      document.removeEventListener("mousemove", handleMouseMove);
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing && fileExplorerRef.current) {
      const newWidth = e.clientX - initialX;
      fileExplorerRef.current.style.width = `${newWidth}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-200 relative">
      <div
        ref={fileExplorerRef}
        className="flex flex-col w-60 h-full bg-base-200"
      >
        <div className="flex flex-row items-center bg-base-200">
          <button className="p-1 px-2 flex flex-row items-center gap-1 transition duration-300 overflow-x-auto outline-none">
            <span>main.py</span>
          </button>
        </div>
      </div>
      <div
        className="cursor-ew-resize w-0 h-full bg-transparent absolute right-0 top-0"
        onMouseDown={handleMouseDown}
        style={{ borderRight: "2px solid transparent" }}
      ></div>
    </div>
  );
}

export default function Editor() {
  // Get task from :id param in the url
  // const task = getTask(window.location.pathname.split("/")[3])
  const [curTab, setCurTab] = useState<ITab | undefined>(undefined);
  const [tabs, setTabs] = useState<ITab[]>([]);

  async function newEditor() {
    const task = await getTask(window.location.pathname.split("/")[3]);
    const indexFile = task.files?.find(
      (file) => file.name.split(".")[0] === "index"
    );

    if (!indexFile) return;

    const newTabs = task.files?.map((file) => {
      return {
        name: file.name,
        file: file.path,
      };
    });

    setTabs(newTabs || []);
  }

  useEffect(() => {
    newEditor();
  }, []);

  async function test() {
    console.log();
  }

  return (
    <div className="flex flex-col h-full w-full bg-base-200">
      <TabBar curTab={curTab} setCurTab={setCurTab} tabs={tabs} />
      <div
        className={clsx("flex w-full h-full bg-base-100 relative", {
          "rounded-tl-md overflow-hidden": curTab?.file != tabs[0]?.file,
        })}
      >
        {/* <FileExplorer curTab={curTab} files={[]} setCurTab={setCurTab} /> */}
        <CodeEditor
          theme="task-scripter"
          options={{
            minimap: {
              enabled: false,
            },
            fontSize: 18,
          }}
        />
      </div>
    </div>
  );
}
