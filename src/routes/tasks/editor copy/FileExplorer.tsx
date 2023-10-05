// FileExplorer.tsx
import React, { memo, useEffect, useState } from "react";
import { ResizableBox, ResizableBoxProps } from "react-resizable";
import "react-resizable/css/styles.css";
import { ITabMeta } from "./TabBar";
import { fs } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import { FileEntry } from "@tauri-apps/api/fs";
import { AiFillFolder, AiFillFolderOpen } from "react-icons/ai";
import py from "../../../assets/py.svg";
import bat from "../../../assets/bat.svg";
import ps from "../../../assets/ps.svg";
import wav from "../../../assets/icons/audio.svg";
import FileIcon from "../../../components/FileIcon";
import { FaChevronDown } from "react-icons/fa";
import { VscCollapseAll, VscNewFile, VscNewFolder } from "react-icons/vsc";
import { AiOutlineCaretLeft } from "react-icons/ai";
import { createTempFile, updateEditorConfig } from "../../../utils/editor";

function normalize(path: string) {
  return path.replace(/\\/g, "/");
}

interface FileExplorerProps {
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  selectedTab?: ITabMeta;
  setSelectedTab: (tab: ITabMeta) => void;
}

const RenderFiles = ({
  paths,
  setSelectedTab,
  tabs,
  setTabs,
}: {
  paths: FileEntry[];
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  setSelectedTab: (tab: ITabMeta) => void;
}) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const openFile = (path: string) => {
    const task = window.location.pathname.split("/")[3];
    // Insert temp into the path string after the task name
    path = path.replace(
      `.task-scripter/tasks/${task}`,
      `.task-scripter/tasks/${task}/temp`
    );
    updateEditorConfig(task, {
      last_tab: path,
    });

    // If the tab already exists, just select it
    const tab = tabs.find((tab) => normalize(tab.file) === normalize(path));
    if (tab) {
      setSelectedTab(tab);
      return;
    }

    // Otherwise, open the file
    fs.readTextFile(path.replace("temp/", ""), {
      dir: BaseDirectory.Home,
    }).then((content) => {
      const name = path.split("/").pop()!;
      setSelectedTab({ name, file: path, content, oldContent: content });
      setTabs((prev) => [
        ...prev,
        {
          name: path.split("/").pop()!,
          file: path,
          content: content,
          oldContent: content,
        },
      ]);
      createTempFile(path, content);
      updateEditorConfig(window.location.pathname.split("/")[3], {
        last_tab: path,
      });
    });
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderName)
        ? prev.filter((name) => name !== folderName)
        : [...prev, folderName]
    );
  };

  return (
    <div className="truncate ">
      {paths.map((path) => (
        <div key={path.name}>
          {path.children ? (
            <>
              <button
                className="flex items-center gap-1"
                onClick={() => toggleFolder(path.name || "Untitled")}
              >
                <FileIcon
                  className="w-6 h-6"
                  name={path.name!}
                  type="folder"
                  isFolderOpen={expandedFolders.includes(
                    path.name || "Untitled"
                  )}
                />
                {path.name}
              </button>
              {expandedFolders.includes(path.name || "Untitled") && (
                <div className="ml-1 border-l-[1px] border-primary px-1">
                  <RenderFiles
                    setTabs={setTabs}
                    tabs={tabs}
                    paths={path.children}
                    setSelectedTab={setSelectedTab}
                  />
                </div>
              )}
            </>
          ) : (
            <button
              className="truncate text-left flex items-center gap-1 hover:bg-base-100 w-full transition duration-3"
              onClick={() => openFile(path.path || "")}
            >
              <FileIcon
                className="w-6 h-6"
                name={path.name?.split(".")[1]!}
                type="file"
              />
              {path.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

interface FileExplorerProps {
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  selectedTab?: ITabMeta;
  setSelectedTab: (tab: ITabMeta) => void;
}

function FileExplorer({
  tabs,
  selectedTab,
  setTabs,
  setSelectedTab,
}: FileExplorerProps) {
  const task = window.location.pathname.split("/")[3];
  const [paths, setPaths] = React.useState<FileEntry[]>([]);
  const resizableProps: ResizableBoxProps = {
    width: 200,
    height: 1000, // Replace with your desired height
    minConstraints: [1, 100],
    maxConstraints: [Infinity, 1000],
    axis: "x",
    className: "file-explorer",
  };

  useEffect(() => {
    fs.readDir(`.task-scripter/tasks/${task}/src`, {
      dir: BaseDirectory.Home,
      recursive: true,
    }).then((rawPaths) => {
      // Sort the paths by folders first, then files, all alphabetically
      rawPaths.sort((a, b) => {
        if (a.children && b.children) {
          return a.name!.localeCompare(b.name!);
        } else if (a.children) {
          return -1;
        } else if (b.children) {
          return 1;
        } else {
          return a.name!.localeCompare(b.name!);
        }
      });
      setPaths(rawPaths);
    });
  }, []);

  function goBack() {
    window.history.back();
  }

  return (
    <ResizableBox {...resizableProps}>
      <div className="bg-base-200 h-screen">
        <section className=" h-11 flex items-center ">
          <button
            onClick={goBack}
            className="hover:text-primary flex items-center transition duration-300"
          >
            <AiOutlineCaretLeft />
            <h1>BACK</h1>
          </button>
          <button className="btn p-1"></button>
        </section>
        <div className="flex items-center py-0">
          <h2 className="font-bold text-primary truncate">
            {task.toUpperCase()}
          </h2>
          <div className="flex gap-1 ml-auto p-1">
            <VscNewFolder className="w-4 h-4" />
            <VscNewFile className="w-4 h-4" />
            <VscCollapseAll className="w-4 h-4" />
          </div>
        </div>
        <section className="flex flex-col ">
          <RenderFiles
            setTabs={setTabs}
            tabs={tabs}
            paths={paths}
            setSelectedTab={setSelectedTab}
          />
        </section>
      </div>
    </ResizableBox>
  );
}

export default memo(FileExplorer);
