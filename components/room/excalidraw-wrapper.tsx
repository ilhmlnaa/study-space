"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

type ExcalidrawWrapperProps = {
  initialElements: any[];
  viewModeEnabled: boolean;
  onExcalidrawAPI: (api: any) => void;
  onChange: (elements: readonly any[], appState: any, files: any) => void;
};

export default function ExcalidrawWrapper({
  initialElements,
  viewModeEnabled,
  onExcalidrawAPI,
  onChange,
}: ExcalidrawWrapperProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        excalidrawAPI={onExcalidrawAPI}
        initialData={{
          elements: initialElements,
          appState: {
            collaborators: new Map(),
          },
        }}
        viewModeEnabled={viewModeEnabled}
        onChange={onChange}
      />
    </div>
  );
}
