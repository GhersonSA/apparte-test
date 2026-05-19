import { useEffect, useRef, useState } from "react";

type StageSize = {
  width: number;
  height: number;
};

export function useStageSize() {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<StageSize>({ width: 960, height: 580 });

  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) {
      return;
    }

    const updateSize = () => {
      const nextWidth = Math.max(1, Math.floor(container.clientWidth));
      const isCompactWidth = nextWidth <= 640;
      const computedHeight = Math.floor(nextWidth * 0.62);
      const minHeight = isCompactWidth ? 220 : 360;
      const maxHeight = isCompactWidth ? 420 : 640;
      const nextHeight = Math.max(minHeight, Math.min(maxHeight, computedHeight));

      setStageSize({ width: nextWidth, height: nextHeight });
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return { stageContainerRef, stageSize };
}
