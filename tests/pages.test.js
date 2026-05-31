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

test("homepage presents a full portfolio structure", () => {
  const index = read("index.html");
  assert.match(index, /href="#featured"/);
  assert.match(index, /href="#archive"/);
  assert.match(index, /id="about"/);
  assert.match(index, /id="directions"/);
  assert.match(index, /id="featured"/);
  assert.match(index, /class="hero-summary"/);
  assert.match(index, /class="hero-stats"/);
  assert.doesNotMatch(index, /id="trajectory"/);
  assert.doesNotMatch(index, /Образовательная траектория/);
});

test("homepage removes collaboration pitch and simplifies about section", () => {
  const index = read("index.html");
  assert.doesNotMatch(index, /Открыт к сотрудничеству, стажировкам и проектной работе/);
  assert.doesNotMatch(index, /Разрабатываю учебные и прикладные цифровые решения/);
  assert.match(index, /Я студент направления ИВТ, работаю с программированием, web-сервисами/);
  assert.match(index, /Сайт устроен как витрина и архив/);
  assert.match(index, /class="about-card"/);
});

test("homepage highlights Android portfolio projects and learning apps", () => {
  const index = read("index.html");
  assert.match(index, /https:\/\/github\.com\/Daniyarsick\/Shopping_List/);
  assert.match(index, /<h3>Shopping List<\/h3>/);
  assert.match(index, /https:\/\/github\.com\/Daniyarsick\/Kotlin_SQLite/);
  assert.match(index, /<h3>Kotlin SQLite<\/h3>/);
  assert.match(index, /Учебные Android-приложения на Kotlin/);
  assert.match(index, /https:\/\/github\.com\/Daniyarsick\/Itproger_App/);
  assert.match(index, /https:\/\/github\.com\/Daniyarsick\/My_First_GIt_Project/);
  assert.match(index, /https:\/\/github\.com\/Daniyarsick\/Country_app/);
});

test("homepage featured work excludes practice and diploma cards and includes UML VKR", () => {
  const index = read("index.html");
  const featuredSection = index.match(/<section id="featured"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(featuredSection, /Преддипломная практика/);
  assert.doesNotMatch(featuredSection, /Дипломная работа/);
  assert.doesNotMatch(featuredSection, /Prog7/);
  assert.match(featuredSection, /https:\/\/github\.com\/Daniyarsick\/UML_VKR/);
  assert.match(featuredSection, /<h3>UML_VKR<\/h3>/);
});

test("homepage featured cards are ordered as UML, Shopping List, Kotlin SQLite, fourth course", () => {
  const index = read("index.html");
  const featuredSection = index.match(/<section id="featured"[\s\S]*?<\/section>/)[0];
  const uml = featuredSection.indexOf("<h3>UML_VKR</h3>");
  const shopping = featuredSection.indexOf("<h3>Shopping List</h3>");
  const sqlite = featuredSection.indexOf("<h3>Kotlin SQLite</h3>");
  const course = featuredSection.indexOf("<h3>4 курс</h3>");
  assert.ok(uml !== -1 && shopping !== -1 && sqlite !== -1 && course !== -1, "all four featured cards should exist");
  assert.ok(uml < shopping, "UML_VKR should come before Shopping List");
  assert.ok(shopping < sqlite, "Shopping List should come before Kotlin SQLite");
  assert.ok(sqlite < course, "Kotlin SQLite should come before 4 курс");
});

test("homepage supports a dark theme toggle", () => {
  const index = read("index.html");
  const css = read("style.css");
  const script = read("script.js");
  assert.match(index, /class="theme-toggle"/);
  assert.match(index, /aria-label="Переключить темную тему"/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /--bg-color:\s*#0f172a/);
  assert.match(script, /portfolio-theme/);
  assert.match(script, /dataset\.theme/);
});

test("homepage includes One UI inspired Material surfaces", () => {
  const css = read("style.css");
  assert.match(css, /--one-ui-blue:\s*#2189ff/);
  assert.match(css, /\.feature-card\.android/);
  assert.match(css, /\.learning-apps/);
  assert.match(css, /\.about-card/);
  assert.match(css, /border-radius:\s*18px/);
  assert.doesNotMatch(css, /gradient orbs?/i);
});

test("homepage hero does not create a large empty gap before about", () => {
  const css = read("style.css");
  assert.doesNotMatch(css, /\.hero\s*\{[^}]*min-height:\s*92vh/is);
  assert.match(css, /\.hero\s*\{[^}]*min-height:\s*auto/is);
});

test("course archive renders visual metadata and highlighted sections", () => {
  const script = read("script.js");
  const css = read("style.css");
  assert.match(script, /getFileTypeSummary/);
  assert.match(script, /getTotalFileCount/);
  assert.match(script, /folder-meta/);
  assert.match(script, /file-type-badges/);
  assert.match(script, /highlight-subjects/);
  assert.match(css, /\.folder-wrapper\.is-highlighted/);
  assert.match(css, /\.type-badge/);
  assert.match(css, /\.folder-count/);
});

test("light theme file badges keep readable contrast", () => {
  const css = read("style.css");
  assert.doesNotMatch(css, /\.type-badge\s*\{[^}]*color:\s*#d1fae5/i);
  assert.match(css, /--type-badge-text:\s*#0f766e/);
  assert.match(css, /--type-badge-strong:\s*#0f172a/);
  assert.match(css, /\.type-badge\s*\{[^}]*color:\s*var\(--type-badge-text\)/is);
  assert.match(css, /\.type-badge strong\s*\{[^}]*color:\s*var\(--type-badge-strong\)/is);
});

test("fourth course includes specification languages repository", () => {
  const links = read("links.js");
  assert.match(links, /"4 курс"\s*:\s*\{/);
  assert.match(links, /"Языки написания спецификаций"\s*:\s*\[/);
  assert.match(links, /https:\/\/github\.com\/Daniyarsick\/UML_VKR/);
});

test("third course practice link points to the current repository", () => {
  const links = read("links.js");
  assert.match(
    links,
    /\{\s*name:\s*"Учебная практика \(3 курс\)",\s*url:\s*"https:\/\/github\.com\/Daniyarsick\/pract6-3-year"/
  );
});

test("visual system uses professional mixed palette and tighter card radii", () => {
  const css = read("style.css");
  assert.match(css, /--primary:\s*#14b8a6/);
  assert.match(css, /--secondary:\s*#f59e0b/);
  assert.match(css, /--surface:/);
  assert.match(css, /border-radius:\s*10px/);
  assert.doesNotMatch(css, /border-radius:\s*20px/);
});
