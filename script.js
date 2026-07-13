function getLocalFileUrl(filePath) {
    const cleanPath = String(filePath).startsWith('./') ? String(filePath).slice(2) : String(filePath);
    const parts = cleanPath.split('/').filter(Boolean);
    return './' + parts.map(part => encodeURIComponent(part)).join('/');
}

const themeToggle = document.querySelector('.theme-toggle');
const storedTheme = localStorage.getItem('portfolio-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) {
        const isDark = theme === 'dark';
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
        themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
    }
}

applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('portfolio-theme', nextTheme);
        applyTheme(nextTheme);
        updateNavbarBackground();
    });
}

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-links');

function closeNavigation() {
    if (!navToggle || !navMenu) return;
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Открыть меню');
}

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const target = href ? document.querySelector(href) : null;
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            closeNavigation();
        }
    });
});

function updateNavbarBackground() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.background = window.scrollY > 50 ?
            'var(--navbar-bg-scrolled)' : 'var(--navbar-bg)';
    }
}

// Navbar background on scroll
window.addEventListener('scroll', updateNavbarBackground);
updateNavbarBackground();

// Get file icon based on file type
function getFileIcon(type) {
    const icons = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'zip': 'fas fa-file-archive',
        'rar': 'fas fa-file-archive',
        'mp4': 'fas fa-file-video',
        'mp3': 'fas fa-file-audio',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'svg': 'fas fa-file-image',
        'html': 'fas fa-file-code',
        'css': 'fas fa-file-code',
        'js': 'fas fa-file-code',
        'py': 'fab fa-python',
        'java': 'fab fa-java',
        'md': 'fas fa-file-alt',
        'txt': 'fas fa-file-alt'
    };
    return icons[type] || 'fas fa-file';
}

function getTotalFileCount(files) {
    return Array.isArray(files) ? files.length : 0;
}

function getFileTypeSummary(files) {
    const priority = ['pdf', 'docx', 'pptx', 'png', 'jpg', 'zip', 'md'];
    const counts = new Map();

    (files || []).forEach(file => {
        const type = file.type || 'file';
        counts.set(type, (counts.get(type) || 0) + 1);
    });

    const sortedTypes = Array.from(counts.keys()).sort((a, b) => {
        const aIndex = priority.indexOf(a);
        const bIndex = priority.indexOf(b);
        if (aIndex !== -1 || bIndex !== -1) {
            return (aIndex === -1 ? priority.length : aIndex) - (bIndex === -1 ? priority.length : bIndex);
        }
        return a.localeCompare(b);
    });

    return sortedTypes.slice(0, 4).map(type => ({ type, count: counts.get(type) }));
}

function isHighlightedSubject(name) {
    // highlight-subjects: important fourth-year archive sections.
    const highlightSubjects = ['ПредДипломнаяПрактика', 'Курсовая работа', 'Практика'];
    return highlightSubjects.some(item => item.toLowerCase() === String(name).toLowerCase());
}

// Render course folders dynamically
function renderCourseFolders(courseName) {
    const container = document.getElementById('dynamic-folders');
    if (!container) return;

    // Normalize string for comparison (trim, normalize unicode, collapse whitespace)
    function normalize(s) {
        return s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
    }

    // Build a map of normalized name -> { displayName, hasLocalFiles, hasExternalLinks, localKey, externalKey }
    const disciplineMap = new Map();

    // From fileData (local folders)
    if (typeof fileData !== 'undefined' && fileData[courseName]) {
        Object.keys(fileData[courseName]).forEach(key => {
            const norm = normalize(key);
            if (!disciplineMap.has(norm)) {
                disciplineMap.set(norm, { displayName: key, hasLocalFiles: true, localKey: key, externalKey: null });
            } else {
                const entry = disciplineMap.get(norm);
                entry.hasLocalFiles = true;
                entry.localKey = key;
            }
        });
    }

    // From externalLinks
    if (typeof externalLinks !== 'undefined' && externalLinks[courseName]) {
        Object.keys(externalLinks[courseName]).forEach(key => {
            const norm = normalize(key);
            if (!disciplineMap.has(norm)) {
                disciplineMap.set(norm, { displayName: key, hasLocalFiles: false, hasExternalLinks: true, localKey: null, externalKey: key });
            } else {
                const entry = disciplineMap.get(norm);
                entry.hasExternalLinks = true;
                entry.externalKey = key;
            }
        });
    }

    // Sort by display name and render
    const sorted = Array.from(disciplineMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru'));

    sorted.forEach(discipline => {
        const { displayName, hasLocalFiles, hasExternalLinks, localKey, externalKey } = discipline;

        // Create expandable folder for all disciplines
        const wrapper = document.createElement('div');
        wrapper.className = 'folder-wrapper';
        if (courseName === '4 курс' && isHighlightedSubject(displayName)) {
            wrapper.classList.add('is-highlighted');
        }

        const localFiles = hasLocalFiles && localKey ? fileData[courseName][localKey] : [];
        const fileCount = getTotalFileCount(localFiles);
        const typeSummary = getFileTypeSummary(localFiles);
        const externalCount = hasExternalLinks && externalKey ? externalLinks[courseName][externalKey].length : 0;
        const badgesMarkup = typeSummary.map(item =>
            `<span class="type-badge">${item.type}<strong>${item.count}</strong></span>`
        ).join('');

        const header = document.createElement('div');
        header.className = 'subject-item folder-header';
        header.tabIndex = 0;
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'false');
        header.onclick = function () { toggleFolder(this); };
        header.onkeydown = function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFolder(this);
            }
        };
        header.innerHTML = `
            <span class="folder-title">
                <span class="subject-name">${displayName}</span>
                <span class="folder-meta">
                    <span class="folder-count">${fileCount} файлов</span>
                    ${externalCount ? `<span class="folder-count">${externalCount} ссылок</span>` : ''}
                </span>
            </span>
            <span class="folder-actions">
                <span class="file-type-badges">${badgesMarkup}</span>
                <span class="folder-icon"><i class="fas fa-folder"></i></span>
            </span>
        `;

        const linksContainer = document.createElement('div');
        linksContainer.className = 'folder-links';

        // Add local files if they exist, grouped by subfolders (hierarchical)
        if (hasLocalFiles && localKey) {
            const files = fileData[courseName][localKey];

            // Build a tree structure for folders
            function buildFolderTree(files) {
                const tree = { folders: {}, files: [] };
                
                files.forEach(file => {
                    const pathParts = file.path.split('/');
                    // Remove ./course/subject from beginning and filename from end
                    const subParts = pathParts.slice(3, -1); // folders only
                    
                    if (subParts.length === 0) {
                        // Root file
                        tree.files.push(file);
                    } else {
                        // Navigate/create folder structure
                        let current = tree;
                        subParts.forEach((folderName, idx) => {
                            if (!current.folders[folderName]) {
                                current.folders[folderName] = { folders: {}, files: [] };
                            }
                            current = current.folders[folderName];
                        });
                        current.files.push(file);
                    }
                });
                
                return tree;
            }

            function renderTree(tree, container, depth = 0) {
                // Render folders first (sorted)
                Object.keys(tree.folders).sort((a, b) => a.localeCompare(b, 'ru')).forEach(folderName => {
                    const folder = tree.folders[folderName];
                    const fileCount = countFiles(folder);
                    
                    const subfolderWrapper = document.createElement('div');
                    subfolderWrapper.className = 'subfolder-wrapper';
                    subfolderWrapper.style.marginLeft = (depth * 0.5) + 'rem';

                    const subfolderHeader = document.createElement('div');
                    subfolderHeader.className = 'subfolder-header';
                    subfolderHeader.tabIndex = 0;
                    subfolderHeader.setAttribute('role', 'button');
                    subfolderHeader.setAttribute('aria-expanded', 'false');
                    subfolderHeader.innerHTML = `<i class="fas fa-folder"></i> ${folderName} <span class="subfolder-count">(${fileCount})</span>`;
                    subfolderHeader.onclick = function(e) { e.stopPropagation(); toggleSubfolder(this); };
                    subfolderHeader.onkeydown = function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSubfolder(this);
                        }
                    };

                    const subfolderContent = document.createElement('div');
                    subfolderContent.className = 'subfolder-content';

                    // Recursively render nested folders and files
                    renderTree(folder, subfolderContent, depth + 1);

                    subfolderWrapper.appendChild(subfolderHeader);
                    subfolderWrapper.appendChild(subfolderContent);
                    container.appendChild(subfolderWrapper);
                });

                // Render files in this folder
                tree.files.forEach(file => {
                    const fileLink = document.createElement('a');
                    fileLink.href = getLocalFileUrl(file.path);
                    fileLink.className = 'subject-item link-item subfolder-file';
                    fileLink.target = '_blank';
                    fileLink.style.marginLeft = (depth * 0.5) + 'rem';
                    const iconClass = getFileIcon(file.type);
                    fileLink.innerHTML = `
                        <span class="subject-name">${file.name}</span>
                        <span class="folder-icon"><i class="${iconClass}"></i></span>
                    `;
                    container.appendChild(fileLink);
                });
            }

            function countFiles(folder) {
                let count = folder.files.length;
                Object.values(folder.folders).forEach(subfolder => {
                    count += countFiles(subfolder);
                });
                return count;
            }

            const tree = buildFolderTree(files);
            renderTree(tree, linksContainer);
        }

        // Add external links
        if (hasExternalLinks && externalKey) {
            externalLinks[courseName][externalKey].forEach(item => {
                const link = document.createElement('a');
                link.href = item.url;
                link.className = 'subject-item link-item';
                link.target = '_blank';
                link.innerHTML = `
                    <span class="subject-name">${item.name}</span>
                    <span class="folder-icon"><i class="${item.icon}"></i></span>
                `;
                linksContainer.appendChild(link);
            });
        }

        wrapper.appendChild(header);
        wrapper.appendChild(linksContainer);
        container.appendChild(wrapper);
    });
}

// Toggle folder expansion
function toggleFolder(header) {
    const wrapper = header.closest('.folder-wrapper');
    const content = wrapper.querySelector('.folder-links');
    content.classList.toggle('active');
    header.setAttribute('aria-expanded', content.classList.contains('active') ? 'true' : 'false');
    const icon = header.querySelector('.folder-icon i');
    if (content.classList.contains('active')) {
        icon.classList.remove('fa-folder');
        icon.classList.add('fa-folder-open');
    } else {
        icon.classList.remove('fa-folder-open');
        icon.classList.add('fa-folder');
    }
}

// Toggle subfolder expansion
function toggleSubfolder(header) {
    const wrapper = header.closest('.subfolder-wrapper');
    const content = wrapper.querySelector('.subfolder-content');
    content.classList.toggle('active');
    header.setAttribute('aria-expanded', content.classList.contains('active') ? 'true' : 'false');
    const icon = header.querySelector('i');
    if (content.classList.contains('active')) {
        icon.classList.remove('fa-folder');
        icon.classList.add('fa-folder-open');
    } else {
        icon.classList.remove('fa-folder-open');
        icon.classList.add('fa-folder');
    }
}
