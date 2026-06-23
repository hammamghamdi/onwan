"use client";

import {
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CropOffset = {
  x: number;
  y: number;
};

type PhotoCropModalProps = {
  file: File;
  title: string;
  zoomLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

const cropAspectRatio = 16 / 9;

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
};

export function PhotoCropModal({
  file,
  title,
  zoomLabel,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: PhotoCropModalProps) {
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<CropOffset | null>(null);
  const [startOffset, setStartOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const cropRef = useRef<HTMLDivElement | null>(null);
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const moveImage = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart || !cropRef.current) return;

    const bounds = cropRef.current.getBoundingClientRect();
    const nextX =
      startOffset.x + ((event.clientX - dragStart.x) / bounds.width) * 100;
    const nextY =
      startOffset.y + ((event.clientY - dragStart.y) / bounds.height) * 100;

    setOffset({
      x: Math.max(-40, Math.min(40, nextX)),
      y: Math.max(-40, Math.min(40, nextY)),
    });
  };

  const createCroppedImage = async () => {
    if (!imageUrl) return;

    const image = await loadImage(imageUrl);
    const outputWidth = 1200;
    const outputHeight = Math.round(outputWidth / cropAspectRatio);
    const baseCropWidth = Math.min(
      image.naturalWidth,
      image.naturalHeight * cropAspectRatio
    );
    const cropWidth = baseCropWidth / zoom;
    const cropHeight = cropWidth / cropAspectRatio;
    const maxX = Math.max(0, (image.naturalWidth - cropWidth) / 2);
    const maxY = Math.max(0, (image.naturalHeight - cropHeight) / 2);
    const sourceX = (image.naturalWidth - cropWidth) / 2 - (offset.x / 40) * maxX;
    const sourceY =
      (image.naturalHeight - cropHeight) / 2 - (offset.y / 40) * maxY;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(
      image,
      Math.max(0, Math.min(image.naturalWidth - cropWidth, sourceX)),
      Math.max(0, Math.min(image.naturalHeight - cropHeight, sourceY)),
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        onConfirm(
          new File([blob], file.name.replace(/\.[^/.]+$/, "-landscape.jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
        );
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-4 text-black shadow-xl">
        <h2 className="mb-3 text-center text-lg font-bold">{title}</h2>

        <div
          ref={cropRef}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragStart({ x: event.clientX, y: event.clientY });
            setStartOffset(offset);
          }}
          onPointerMove={moveImage}
          onPointerUp={() => setDragStart(null)}
          onPointerCancel={() => setDragStart(null)}
          className="relative mb-4 aspect-video touch-none overflow-hidden rounded-2xl bg-gray-100"
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{
                transform: `translate(${offset.x}%, ${offset.y}%) scale(${zoom})`,
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-white/80" />
        </div>

        <label className="mb-4 block text-sm font-bold text-gray-700">
          <span className="mb-2 block">{zoomLabel}</span>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-[#006b4f]"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-black py-3 font-bold text-black"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={createCroppedImage}
            className="rounded-xl bg-[#006b4f] py-3 font-bold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
