// Downloads the diagnostic report (background/diagnostics.js) as a file
// people can attach to an email: Settings, and the safe mode screen.
import { CHROME_MESSAGES } from "../utils/constants";

/** Resolves true once the file is downloading */
export const downloadDiagnosticReport = async () => {
  const result = await chrome.runtime.sendMessage({ type: CHROME_MESSAGES.GET_DIAGNOSTICS }).catch(() => null);
  if (!result?.report) return false;
  const day = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(result.report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `docamatic-diagnostics-${day}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
};
