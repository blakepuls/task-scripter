import {
  AiFillDelete,
  AiFillEdit,
  AiOutlineEdit,
  AiOutlinePlus,
} from "react-icons/ai";
import { BsDot } from "react-icons/bs";
import { HiCodeBracket, HiPencilSquare, HiTrash } from "react-icons/hi2";
import clsx from "clsx";
import { loader } from "@monaco-editor/react";
import "./styles.css";
import { ITask } from "../../../types";
import { fs, invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
import py from "../../../assets/py.svg";
import bat from "../../../assets/bat.svg";
import ps from "../../../assets/ps.svg";
import { BaseDirectory } from "@tauri-apps/api/path";
import {
  deleteTempFile,
  getEditorConfig,
  updateEditorConfig,
} from "../../../utils/editor";
import { VscClose } from "react-icons/vsc";
import { ask } from "@tauri-apps/api/dialog";
import SaveFileModal from "../../../components/Modals/SaveFiles";

function debounce(
  func: (...args: any[]) => void,
  wait: number
): (...args: any[]) => void {
  let timeout: NodeJS.Timeout | null;
  return function (...args: any[]) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

function LanguageIcon({ language }: { language: string }) {
  switch (language) {
    case "py":
      return <img src={py} className="w-[1.25rem]" />;
    case "bat":
      return <img src={bat} className="w-[1.25rem]" />;
    case "ps":
      return <img src={ps} className="w-[1.25rem]" />;
    default:
      return <img src={py} className="w-[1.25rem]" />;
  }
}

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

export interface ITabMeta {
  name: string;
  file: string;
  content?: string;
  // saved?: boolean;
  oldContent?: string;
}

interface ITabBar {
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  curTab?: ITabMeta;
  setCurTab: React.Dispatch<React.SetStateAction<ITabMeta | undefined>>;
}

export function TabBar({ tabs, setTabs, curTab, setCurTab }: ITabBar) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const task = window.location.pathname.split("/")[3];

  async function closeTab(tab: ITabMeta) {
    setTabs(tabs.filter((t) => t.file !== tab.file));

    const config = await getEditorConfig(task);
    const updatedTabs =
      config.open_tabs?.filter((t) => t.path !== tab.file) || [];
    updateEditorConfig(task, {
      open_tabs: updatedTabs,
      tab_history: [tab.file, ...(config.tab_history || [])], // Push the closed tab to history
    });

    deleteTempFile(tab.file);
  }

  async function saveAndCloseTab(tab: ITabMeta) {
    setTabs(tabs.filter((t) => t.file !== tab.file));

    fs.writeFile({
      contents: tab.content || "",
      path: tab.file,
    });

    // Delete the temp file
    deleteTempFile(tab.file);
  }

  async function changeTab(tab: ITabMeta) {
    if (!tab.content) {
      const content = await fs.readTextFile(tab.file, {
        dir: BaseDirectory.Home,
      });
      tab.content = content;
    }

    updateEditorConfig(window.location.pathname.split("/")[3], {
      open_tabs: [...tabs, tab.file],
    });
    setCurTab(tab);
    setTabs(tabs.map((t) => (t.file === tab.file ? tab : t)));
  }

  // Whenever the curTab changes, update the editor config to add to the file history
  useEffect(() => {
    promise();

    async function promise() {
      const editor = await getEditorConfig(task);
      if (!curTab) return;
      const history =
        editor.tab_history?.filter((tab) => tab !== curTab.file) || [];
      updateEditorConfig(task, {
        last_tab: curTab.file,
        tab_history: [...history, curTab.file],
      });
    }
  }, [curTab]);

  return (
    <div className="flex flex-row items-center bg-base-200 overflow-x-auto overflow-y-hidden tab-scroll min-h-12">
      {tabs?.map((tab, i) => (
        <button
          onMouseEnter={() => setHoveredTab(tab.file)}
          onMouseLeave={() => setHoveredTab(null)}
          className={clsx(
            "pl-3 p-1.5 h-12 gap-1 flex flex-row items-center transition duration-300 outline-none max-w-xs",
            {
              "hover:bg-base-300": tab.file !== curTab?.file,
              "bg-base-100": tab.file === curTab?.file,
              "rounded-tl-md": i === 0,
            }
          )}
          onClick={() => changeTab(tab)}
        >
          <SaveFileModal
            file={tab.name}
            onCancel={() => {}}
            onDontSave={() => {}}
            onSave={() => saveAndCloseTab(tab)}
          />
          <LanguageIcon language={tab.name.split(".")[1]} />
          <span className="truncate ml-1 text-lg">{tab.name}</span>
          <div className="w-8 h-4 flex items-center justify-center">
            {tab.content !== tab.oldContent && hoveredTab !== tab.file && (
              <div className="p-1 w-3 h-3 bg-white rounded-full"></div>
            )}
            {hoveredTab === tab.file && (
              <VscClose
                className="hover:bg-base-200 transition-all rounded-md text-3xl w-6 h-6"
                onClick={(e) => {
                  e.preventDefault();
                  // @ts-ignore
                  document.getElementById("save_files_modal").showModal();
                }}
              />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export function extensionToLanguage(extension: string) {
  switch (extension) {
    case "py":
      return "python";
    case "bat":
      return "bat";
    case "ps":
      return "powershell";
    default:
      return "python";
  }
}
