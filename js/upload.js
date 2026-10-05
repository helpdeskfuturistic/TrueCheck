(() => {
  const fileInput = document.getElementById("fileInput");
  const fileExtracted = document.getElementById("fileExtracted");
  const fileStatus = document.getElementById("fileStatus");
  const imageInput = document.getElementById("imageInput");
  const imageStatus = document.getElementById("imageStatus");
  if (!fileInput) return;

  const maxBytes = 10 * 1024 * 1024;
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > maxBytes) {
      fileStatus.textContent = "This file exceeds the 10 MB demo limit. Choose a smaller file.";
      fileInput.value = "";
      return;
    }
    if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
      try {
        fileExtracted.value = (await file.text()).slice(0, 2000);
        fileStatus.textContent = `Loaded ${file.name}. Review the text before checking.`;
      } catch {
        fileStatus.textContent = "The file could not be read. Try another file.";
      }
    } else if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      fileStatus.textContent = "PDF selected. PDF text extraction is not connected; add a PDF parser or backend service.";
    } else if (file.type.startsWith("image/")) {
      fileStatus.textContent = "Image selected. Use the Image tab and connect OCR to extract text.";
    } else {
      fileStatus.textContent = "This file type is not supported in the demo. Use TXT, MD, CSV, PDF or an image.";
    }
  });

  if (imageInput) imageInput.addEventListener("change", () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;
    if (file.size > maxBytes) {
      imageStatus.textContent = "This image exceeds the 10 MB demo limit. Choose a smaller image.";
      imageInput.value = "";
      return;
    }
    imageStatus.textContent = `Selected ${file.name}. OCR is not connected; enter or paste the text in the field below.`;
  });
})();
