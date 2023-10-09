import { fs } from "@tauri-apps/api";
import FileIcon from "../../../components/FileIcon";
import { useEffect, useRef } from "react";
import { BaseDirectory } from "@tauri-apps/api/path";

interface ICreateItem {
  path: string;
  depth: number;
  creatingItem: string | null;
  setCreatingItem: React.Dispatch<React.SetStateAction<string | null>>;
  itemType: "folder" | "file";
  onItemCreated: () => void;
}

export function CreateItem({
  depth,
  path,
  creatingItem,
  setCreatingItem,
  itemType,
  onItemCreated,
}: ICreateItem) {
  // Render if the current path is the same as the path of the item being created

  if (creatingItem !== path) return null;

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [creatingItem]);

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setCreatingItem(null);
      }
    }

    // Listen for clicks on the document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setCreatingItem]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (itemType === "folder") {
        fs.createDir(`${path}/${e.currentTarget.value}`, {
          recursive: true,
          dir: BaseDirectory.Home,
        });
        setCreatingItem(null);
        onItemCreated();
        return;
      }

      if (itemType === "file") {
        fs.writeFile(`${path}/${e.currentTarget.value}`, "", {
          dir: BaseDirectory.Home,
        });
        setCreatingItem(null);
        onItemCreated();
        return;
      }
    }
  };

  return (
    <div style={{ marginLeft: `${depth * 12}px` }} className="flex gap-1">
      <FileIcon
        className="min-w-[26px] min-h-[26px] "
        name={"itdonotmatter"}
        type={itemType}
        isFolderOpen={false}
      />
      <input
        type="text"
        placeholder={`New ${
          itemType.charAt(0).toUpperCase() + itemType.slice(1)
        }`}
        ref={ref}
        className={`bg-base-300 rounded-l-sm outline-none w-full`}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
