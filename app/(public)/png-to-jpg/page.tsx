"use client";

import { useState, useEffect } from "react";
import styles from "./PngToJpgPage.module.css";

type ConverterConfig = {
  label: string;
  inputMime: string; // required input type
  outputMime: string; // output type
  downloadExt: string; // download extension
};

export default function PngToJpgPage() {
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // 🔥 Converter list with proper validation
  const converters: ConverterConfig[] = [
    { label: "JPG to PNG", inputMime: "image/jpeg", outputMime: "image/png", downloadExt: "png" },
    { label: "PNG to JPG", inputMime: "image/png", outputMime: "image/jpeg", downloadExt: "jpg" },
    { label: "HEIC to JPG", inputMime: "image/heic", outputMime: "image/jpeg", downloadExt: "jpg" },
    { label: "WebP to JPEG", inputMime: "image/webp", outputMime: "image/jpeg", downloadExt: "jpg" },
    { label: "Word to JPEG", inputMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", outputMime: "image/jpeg", downloadExt: "jpg" },
    { label: "JPEG to Word", inputMime: "image/jpeg", outputMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", downloadExt: "docx" },
  ];

  const [activeIndex, setActiveIndex] = useState(1); // default: PNG to JPG
  const activeConverter = converters[activeIndex];

  // Snackbar auto hide
  useEffect(() => {
    if (snackbar) {
      const timer = setTimeout(() => setSnackbar(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  // Generic converter
  const convertFile = (file: File) => {
    if (file.type !== activeConverter.inputMime) {
      setOutputUrl(null);
      setSnackbar(`❌ Please upload a valid ${activeConverter.inputMime} file for ${activeConverter.label}`);
      return;
    }

    // Special cases (Word <-> JPEG) need server/extra libs
    if (
      activeConverter.label === "Word to JPEG" ||
      activeConverter.label === "JPEG to Word"
    ) {
      setOutputUrl(null);
      setSnackbar("⚠ This conversion requires backend support. Not supported in browser.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // White background for JPEG
          if (activeConverter.outputMime === "image/jpeg") {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL(activeConverter.outputMime, 0.9);
          setOutputUrl(dataUrl);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // File input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) convertFile(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) convertFile(file);
  };

  const handleClear = () => {
    setOutputUrl(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 🔥 All converters shown on top */}
        <div className={styles.converterTabs}>
          {converters.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                setOutputUrl(null);
                setError(null);
              }}
              className={`${styles.tabBtn} ${activeIndex === index ? styles.activeTab : ""
                }`}
            >
              {item.label}
            </button>
          ))}
          <button>More...</button>
        </div>

        {/* Active Heading */}
        <h1 className={styles.heading}>{activeConverter.label}</h1>

        {/* Action buttons */}
        <div className={styles.actions}>
          <label htmlFor="fileUpload" className={styles.uploadBtn}>
            ⬆ Upload Files
          </label>
          <input
            id="fileUpload"
            type="file"
            accept={activeConverter.inputMime}
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
          <button onClick={handleClear} className={styles.clearBtn}>
            ✖ Clear Queue
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragActive : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Drop Your {activeConverter.inputMime} File Here</p>
        </div>

        {/* Snackbar */}
        {snackbar && <div className={styles.snackbar}>{snackbar}</div>}

        {/* Preview */}
        {outputUrl && (
          <div className={styles.previewWrapper}>
            <h2>Converted Preview:</h2>

            <div className={styles.previewContainer}>
              <img src={outputUrl} alt="Converted File" className={styles.previewImg} />
              <button onClick={handleClear} className={styles.crossBtn}>✖</button>
            </div>

            <a
              href={outputUrl}
              download={`converted.${activeConverter.downloadExt}`}
              className={styles.downloadBtn}
            >
              ⬇ Download {activeConverter.downloadExt.toUpperCase()}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
