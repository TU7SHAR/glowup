/**
 * Blocking inline script injected into <head> so the correct theme is applied
 * BEFORE the first paint. This prevents a flash of the wrong theme (FOUC).
 *
 * Logic mirrors ThemeProvider:
 *   stored "day" / "night"  -> use it
 *   stored "system" / none  -> follow the device (prefers-color-scheme)
 */
export default function ThemeScript() {
  const code = `
(function () {
  try {
    var stored = localStorage.getItem("glowup_theme");
    var theme;
    if (stored === "day" || stored === "night") {
      theme = stored;
    } else {
      theme = window.matchMedia("(prefers-color-scheme: light)").matches
        ? "day"
        : "night";
    }
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme === "day" ? "light" : "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "day" ? "#f7f5f0" : "#0a0a0f");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "night");
  }
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
