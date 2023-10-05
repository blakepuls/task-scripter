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
  ITabMeta,
  deleteTempFile,
  getEditorConfig,
  updateEditorConfig,
} from "../../../utils/editor";
import { VscClose } from "react-icons/vsc";
import { ask } from "@tauri-apps/api/dialog";
import SaveFileModal from "../../../components/Modals/SaveFiles";
import FileIcon from "../../../components/FileIcon";

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

interface ITabBar {
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  curTab?: ITabMeta | null;
  setCurTab: React.Dispatch<React.SetStateAction<ITabMeta | null>>;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  setSelectedTreeTab: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTreeTab: string | null;
  expandedFolders: string[];
  setExpandedFolders: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TabBar({
  tabs,
  setTabs,
  curTab,
  setCurTab,
  setContent,
  setSelectedTreeTab,
  selectedTreeTab,
  expandedFolders,
  setExpandedFolders,
  content,
}: ITabBar) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const task = window.location.pathname.split("/")[3];

  async function closeTab(tab: ITabMeta) {
    deleteTempFile(tab.path);
    setTabs(tabs.filter((t) => t.path !== tab.path));
    setContent("");
    // TODO: Add tab history implementation
  }

  async function saveTab(tab: ITabMeta) {
    const newTabs = tabs.map((t) => {
      if (t.path === tab.path) {
        return { ...t, isDirty: false };
      }
      return t;
    });
    setTabs(newTabs);
    await updateEditorConfig(task, { open_tabs: newTabs });
    console.log("Deleting");
    await deleteTempFile(tab.path, true);
  }

  async function changeTab(tab: ITabMeta) {
    // If the folder is not expanded, expand it
    // Open folders to the file
    const pathParts = tab.path.split("/");
    pathParts.pop();
    let curPath = "";
    pathParts.forEach((part) => {
      curPath += `${part}/`;
      setExpandedFolders((prev) =>
        prev.includes(part) ? prev : [...prev, part]
      );
    });

    setSelectedTreeTab(tab.path);
    setCurTab(tab);
  }

  return (
    <div className="flex flex-row items-center bg-base-200 overflow-x-auto overflow-y-hidden tab-scroll min-h-12">
      {tabs?.map((tab, i) => (
        <button
          onMouseEnter={() => setHoveredTab(tab.path)}
          onMouseLeave={() => setHoveredTab(null)}
          onClick={(e) => {
            e.preventDefault();
            changeTab(tab);
          }}
          key={tab.path}
          className={clsx(
            "pl-3 p-1.5 h-12 gap-1 flex flex-row items-center transition duration-300 outline-none max-w-xs",
            {
              "hover:bg-base-300": tab.path !== curTab?.path,
              "bg-base-100": tab.path === curTab?.path,
              "rounded-tl-md": i === 0,
            }
          )}
        >
          <SaveFileModal
            file={"Change this name"}
            onCancel={() => {}}
            onDontSave={() => {
              closeTab(tab);
            }}
            onSave={() => {
              saveTab(tab);
              closeTab(tab);
            }}
          />
          <FileIcon
            className="w-6 h-6"
            name={tab.path.split("/").pop()?.split(".")[1] || ""}
            type={"file"}
          />
          <span className="truncate ml-1 text-lg">
            {tab.path.split("/").pop()}
          </span>
          <div className="w-8 h-4 flex items-center justify-center">
            {tab.isDirty && hoveredTab !== tab.path && (
              <div className="p-1 w-3 h-3 bg-white rounded-full"></div>
            )}
            {hoveredTab === tab.path && (
              <VscClose
                className="hover:bg-base-200 transition-all rounded-md text-3xl w-6 h-6"
                onClick={(e) => {
                  e.preventDefault();
                  if (tab.isDirty)
                    // @ts-ignore
                    document.getElementById("save_files_modal").showModal();
                  else closeTab(tab);
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
