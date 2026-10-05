// Validation helpers are also kept here so they can be expanded or tested independently.
window.TrueCheckValidation = {
  isSupportedUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch { return false; }
  },
  maxClaimLength: 2000
};
