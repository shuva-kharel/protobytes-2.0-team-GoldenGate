// utils/emailTemplates.js
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");

/**
 * Try multiple possible locations so it works whether you're running:
 * - node server.js  (CWD = project root)
 * - node src/server.js (files live under src/)
 */
function resolveTemplatesBase() {
  const candidates = [
    path.resolve(__dirname, "..", "templates"),          // ../templates (if utils/ at root)
    path.resolve(__dirname, "..", "..", "templates"),    // ../../templates (if utils/ under src/utils)
    path.join(process.cwd(), "templates"),               // CWD/templates
    path.resolve(__dirname, "..", "src", "templates"),   // ../src/templates (if utils/ at root)
    path.resolve(__dirname, "..", "..", "src", "templates"), // ../../src/templates (if utils/ under src/utils)
    path.join(process.cwd(), "src", "templates"),        // CWD/src/templates
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  // Return first candidate for error messages; we’ll still fallback safely later.
  return candidates[0];
}

const templatesBase = resolveTemplatesBase();

// --- Debug (optional): uncomment if you want to verify paths ---
// console.log("[emailTemplates] templatesBase =", templatesBase);

function registerPartials(base) {
  const partialsDir = path.join(base, "partials");
  if (fs.existsSync(partialsDir)) {
    fs.readdirSync(partialsDir).forEach((file) => {
      if (!file.endsWith(".hbs")) return;
      const partialName = path.parse(file).name;
      const partialContent = fs.readFileSync(path.join(partialsDir, file), "utf8");
      Handlebars.registerPartial(partialName, partialContent);
    });
  }
}

registerPartials(templatesBase);

// Load layout if present, otherwise fallback to plain HTML wrapper.
const layoutPath = path.join(templatesBase, "layouts", "main.hbs");
let layoutTmpl = null;
if (fs.existsSync(layoutPath)) {
  const layoutSrc = fs.readFileSync(layoutPath, "utf8");
  layoutTmpl = Handlebars.compile(layoutSrc);
} else {
  console.warn(`[emailTemplates] Email layout not found at: ${layoutPath}. Using plain HTML fallback.`);
}

function renderTemplate(templateName, data = {}) {
  const templatePath = path.join(templatesBase, "emails", `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    console.warn(`[emailTemplates] Email template not found at: ${templatePath}. Sending plain text fallback.`);
    const fallback = `
      <pre style="font-family: Menlo, Consolas, monospace">
Title: ${data.title || process.env.APP_NAME || "App"}
---
${JSON.stringify(data, null, 2)}
      </pre>`;
    return fallback;
  }

  const src = fs.readFileSync(templatePath, "utf8");
  const body = Handlebars.compile(src)(data);

  if (layoutTmpl) {
    return layoutTmpl({
      title: data.title || process.env.APP_NAME || "App",
      body,
      year: new Date().getFullYear(),
      appName: process.env.APP_NAME || "App",
    });
  }

  // Plain fallback if no layout
  return `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>${data.title || process.env.APP_NAME || "App"}</title></head>
      <body>${body}</body>
    </html>`;
}

module.exports = { renderTemplate };