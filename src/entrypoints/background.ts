import { defineBackground } from "wxt/utils/define-background";
import { startBackground } from "../background/startBackground";

// The service worker (Chrome) or event page (Firefox). All the logic is in
// src/background/; this only starts it.
export default defineBackground(() => {
  startBackground();
});
