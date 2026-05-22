const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test("GitHub Pages workflow checks out LFS files and deploys the repository root", () => {
  const workflow = read(".github/workflows/pages.yml");
  assert.match(workflow, /on:\s*\n\s*push:\s*\n\s*branches:\s*\[\s*main\s*\]/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /uses:\s*actions\/checkout@v4/);
  assert.match(workflow, /lfs:\s*true/);
  assert.match(workflow, /uses:\s*actions\/configure-pages@v5/);
  assert.match(workflow, /uses:\s*actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /path:\s*\./);
  assert.match(workflow, /uses:\s*actions\/deploy-pages@v4/);
});

test("Pages source disables Jekyll processing", () => {
  assert.ok(exists(".nojekyll"), ".nojekyll should exist in the publish root");
});

test("local material links are built as encoded relative Pages URLs", () => {
  const script = read("script.js");
  const viewer = read("viewer.html");
  assert.match(script, /function getLocalFileUrl\(filePath\)/);
  assert.doesNotMatch(script, /github\.com\/\$\{GITHUB_OWNER\}\/\$\{GITHUB_REPO\}\/blob/);
  assert.match(script, /fileLink\.href = getLocalFileUrl\(file\.path\)/);
  assert.match(viewer, /function getLocalFileUrl\(filePath\)/);
  assert.match(viewer, /fileCard\.href = getLocalFileUrl\(file\.path\)/);
});

test("index includes GitHub Pages SEO and preview metadata", () => {
  const index = read("index.html");
  assert.match(index, /<meta name="description"/);
  assert.match(index, /<meta name="author" content="Аннануров Даниил Петрович"/);
  assert.match(index, /<meta name="robots" content="index, follow"/);
  assert.match(index, /<meta property="og:title"/);
  assert.match(index, /<meta property="og:description"/);
  assert.match(index, /<meta property="og:image" content="https:\/\/daniyarsick\.github\.io\/main_portfolio\/photo\.jpg"/);
  assert.match(index, /<link rel="canonical" href="https:\/\/daniyarsick\.github\.io\/main_portfolio\/"/);
});

test("all HTML entry points declare an existing favicon", () => {
  const htmlFiles = ["index.html", "course1.html", "course2.html", "course3.html", "course4.html", "viewer.html"];
  for (const file of htmlFiles) {
    const html = read(file);
    assert.match(html, /<link rel="icon" href="photo\.jpg">/, `${file} should point at the shared favicon`);
  }
  assert.ok(exists("photo.jpg"), "shared favicon source should exist");
});

test("mobile navigation and focus states are present", () => {
  const css = read("style.css");
  assert.doesNotMatch(css, /\.nav-links\s*\{[^}]*display:\s*none;[^}]*\}/s);
  assert.match(css, /:focus-visible/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test("README documents GitHub Pages deployment and content updates", () => {
  const readme = read("README.md");
  assert.match(readme, /https:\/\/daniyarsick\.github\.io\/main_portfolio\//);
  assert.match(readme, /python generate_index\.py/);
  assert.match(readme, /GitHub Actions/);
  assert.match(readme, /Git LFS/);
});
