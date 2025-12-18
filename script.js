// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add scroll class to navbar
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(15, 23, 42, 0.95)';
        nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
        nav.style.background = 'rgba(15, 23, 42, 0.8)';
        nav.style.boxShadow = 'none';
    }
});

const GITHUB_OWNER = 'Daniyarsick';
const GITHUB_REPO = 'main_portfolio';
const GITHUB_BRANCH = 'main';

function encodePathSegments(path) {
    return String(path)
        .split('/')
        .filter(Boolean)
        .map(seg => encodeURIComponent(seg))
        .join('/');
}

async function githubFetchJson(pathnameWithQuery) {
    const url = `https://api.github.com${pathnameWithQuery}`;
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github+json'
        }
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`GitHub API error ${response.status}: ${text || response.statusText}`);
    }

    return response.json();
}

async function githubListContents(repoPath) {
    const encoded = encodePathSegments(repoPath);
    return githubFetchJson(`/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${encoded}?ref=${encodeURIComponent(GITHUB_BRANCH)}`);
}

function renderSubjectLink(container, courseName, subjectName) {
    const link = document.createElement('a');
    link.href = `viewer.html?path=${encodeURIComponent(courseName)}/${encodeURIComponent(subjectName)}`;
    link.className = 'subject-item';
    link.innerHTML = `
        <span class="subject-name">${subjectName}</span>
        <span class="folder-icon"><i class="fas fa-folder"></i></span>
    `;
    container.appendChild(link);
}

// Render course folders
function renderCourseFolders(courseName) {
    const container = document.getElementById('dynamic-folders');
    if (!container) return;

    // Prefer live repo scan (auto-updating). If that fails, fall back to static fileData.
    (async () => {
        container.innerHTML = '<p class="empty-msg">Загрузка…</p>';

        try {
            const entries = await githubListContents(courseName);
            const dirs = Array.isArray(entries)
                ? entries.filter(e => e && e.type === 'dir' && typeof e.name === 'string')
                : [];

            dirs.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

            container.innerHTML = '';
            dirs.forEach(dir => renderSubjectLink(container, courseName, dir.name));

            if (dirs.length === 0) {
                container.innerHTML = '<p class="empty-msg">Папка пуста</p>';
            }
        } catch (error) {
            // Fallback to pre-generated index if present
            container.innerHTML = '';

            if (typeof fileData !== 'undefined' && fileData[courseName]) {
                const subjects = Object.keys(fileData[courseName]);
                subjects.sort((a, b) => a.localeCompare(b, 'ru'));
                subjects.forEach(subject => renderSubjectLink(container, courseName, subject));
                if (subjects.length === 0) container.innerHTML = '<p class="empty-msg">Папка пуста</p>';
                return;
            }

            container.innerHTML = '<p class="empty-msg">Не удалось загрузить список папок</p>';
            // eslint-disable-next-line no-console
            console.error(error);
        }
    })();
}
