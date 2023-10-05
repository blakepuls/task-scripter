import React, { useEffect, useState } from "react";
import { VscClose } from "react-icons/vsc";

interface ISaveFileModalProps {
  file: string;
  onCancel: () => void;
  onSave: () => void;
  onDontSave: () => void;
}

export default function SaveFileModal({
  file,
  onCancel,
  onDontSave,
  onSave,
}: ISaveFileModalProps) {
  return (
    <div>
      <dialog id="save_files_modal" className="modal">
        <div className="modal-box select-none">
          <h3 className="font-bold text-lg text-left whitespace-break-spaces">
            Do you want to save the changes you made to {file}?
          </h3>
          <p className="py-4 text-left">
            Your changes will be lost if you don't save them.
          </p>
          <form method="dialog" className="flex gap-3 ml-auto justify-end">
            <button className="btn btn-primary" onClick={onSave}>
              Save
            </button>
            <button className="btn" onClick={onDontSave}>
              Don't Save
            </button>
            <button className="btn" onClick={onCancel}>
              Cancel
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
