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
  IEditorConfig,
  ITabMeta,
  deleteTempFile,
  getEditorConfig,
  saveTempFile,
  updateEditorConfig,
} from "../../../utils/editor";
import { VscClose } from "react-icons/vsc";
import { ask } from "@tauri-apps/api/dialog";
import SaveFileModal from "../../../components/Modals/SaveFiles";
import FileIcon from "../../../components/FileIcon";
import { useKeybinds } from "../../../context/KeybindsProvider";
import { useHotkeys } from "react-hotkeys-hook";

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
  editorConfig: IEditorConfig;
  setEditorConfig: React.Dispatch<React.SetStateAction<IEditorConfig>>;
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
  editorConfig,
  setEditorConfig,
  content,
}: ITabBar) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const task = window.location.pathname.split("/")[3];
  const { handleKeyPress, addKeybind } = useKeybinds();
  const defaultHotkeySettings = {
    keydown: true,
    keyup: false,
    preventDefault: true,
    enableOnFormTags: true,
  };

  function closeTab(tab: ITabMeta) {
    if (tab.isDirty)
      // @ts-ignore
      document.getElementById("save_files_modal").showModal();
    else removeTab(tab);
  }

  async function removeTab(tab: ITabMeta) {
    deleteTempFile(tab.path);
    setTabs(tabs.filter((t) => t.path !== tab.path));
    setContent("");
    // Stash the closed tab in the backward history.
    const updatedEditorConfig = {
      ...(await getEditorConfig(task)),
      backwardHistory: [...(editorConfig.backwardHistory || []), tab],
    };
    setEditorConfig(updatedEditorConfig);
    await updateEditorConfig(task, updatedEditorConfig);
    goBackward();
  }

  async function saveTab(tab: ITabMeta) {
    const newTabs = tabs.map((t) => {
      if (t.path === tab.path) {
        return { ...t, isDirty: false };
      }
      return t;
    });
    await updateEditorConfig(task, { open_tabs: newTabs });
    await saveTempFile(tab.path, content);
    await deleteTempFile(tab.path);
    setTabs(newTabs);
    setCurTab({ ...tab, isDirty: false });
  }

  async function changeTab(tab: ITabMeta) {
    const pathParts = tab.path.split("/");
    pathParts.pop();
    let curPath = "";
    pathParts.forEach((part) => {
      curPath += `${part}/`;
      setExpandedFolders((prev) =>
        prev.includes(part) ? prev : [...prev, part]
      );
    });

    const updatedEditorConfig = {
      ...(await getEditorConfig(task)),
      backwardHistory: [...(editorConfig.backwardHistory || []), curTab].filter(
        (tab): tab is ITabMeta => !!tab
      ),
      forwardHistory: [], // Clear the forward history when changing tabs
    };
    await updateEditorConfig(task, updatedEditorConfig);
    setEditorConfig(updatedEditorConfig);

    setSelectedTreeTab(tab.path);
    setCurTab(tab);
  }

  async function goBackward() {
    const [lastTab, ...rest] = editorConfig.backwardHistory || [];
    if (lastTab) {
      const updatedEditorConfig = {
        ...editorConfig,
        backwardHistory: rest.filter((tab): tab is ITabMeta => !!tab),
        forwardHistory: [curTab, ...(editorConfig.forwardHistory || [])].filter(
          (tab): tab is ITabMeta => !!tab
        ),
      };
      setEditorConfig(updatedEditorConfig); // Update your state with the new config
      await updateEditorConfig(task, updatedEditorConfig);
      changeTab(lastTab);
    }
  }

  async function goForward() {
    const [nextTab, ...rest] = editorConfig.forwardHistory || [];
    if (nextTab) {
      const updatedEditorConfig = {
        ...editorConfig,
        forwardHistory: rest.filter((tab): tab is ITabMeta => !!tab),
        backwardHistory: [
          curTab,
          ...(editorConfig.backwardHistory || []),
        ].filter((tab): tab is ITabMeta => !!tab),
      };
      setEditorConfig(updatedEditorConfig);
      await updateEditorConfig(task, updatedEditorConfig);
      changeTab(nextTab);
    }
  }

  // ALT + LEFT, go back
  useHotkeys("a", () => goBackward(), defaultHotkeySettings);

  // ALT + RIGHT, go forward
  useHotkeys("d", () => goForward(), defaultHotkeySettings);

  // CTRL + S, save file
  useHotkeys("ctrl+s", () => curTab && saveTab(curTab), defaultHotkeySettings);

  // CTRL + W, close tab
  useHotkeys("ctrl+w", () => curTab && closeTab(curTab), defaultHotkeySettings);

  // CTRL + SHIFT + T, open previously closed tab
  useHotkeys(
    "ctrl+shift+t",
    () => {
      const [lastTab, ...rest] = editorConfig.backwardHistory || [];
      // If lasttab.path is in the open tabs, change to that tab
      if (lastTab && tabs.find((tab) => tab.path === lastTab.path)) {
        changeTab(lastTab);
        return;
      }

      if (lastTab) {
        const updatedEditorConfig = {
          ...editorConfig,
          backwardHistory: rest.filter((tab): tab is ITabMeta => !!tab),
          forwardHistory: [
            curTab,
            ...(editorConfig.forwardHistory || []),
          ].filter((tab): tab is ITabMeta => !!tab),
        };
        setEditorConfig(updatedEditorConfig);
        updateEditorConfig(task, updatedEditorConfig);
        setTabs([...tabs, lastTab]);
        changeTab(lastTab);
      }
    },
    defaultHotkeySettings
  );

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
              removeTab(tab);
            }}
            onSave={() => {
              saveTab(tab);
              removeTab(tab);
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
                  closeTab(tab);
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
