function getLocalFileUrl(filePath) {
    const cleanPath = String(filePath).startsWith('./') ? String(filePath).slice(2) : String(filePath);
    const parts = cleanPath.split('/').filter(Boolean);
    return './' + parts.map(part => encodeURIComponent(part)).join('/');
}

const themeToggle = document.querySelector('.theme-toggle');
const storedTheme = localStorage.getItem('portfolio-theme');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'dark' ? '#0b1020' : '#f7f8fc');
    }
    if (themeToggle) {
        const isDark = theme === 'dark';
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
        themeToggle.innerHTML = `<span aria-hidden="true">${isDark ? '☀' : '☾'}</span>`;
    }
}

applyTheme(storedTheme || 'light');

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

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
            closeNavigation();
            navToggle.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeNavigation();
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

const viewerDialog = document.getElementById('image-viewer');
const viewerImage = viewerDialog?.querySelector('.image-viewer__image');
const viewerCaption = viewerDialog?.querySelector('.image-viewer__caption span');
const viewerStage = viewerDialog?.querySelector('.image-viewer__stage');
const viewerScaleOutput = viewerDialog?.querySelector('.image-viewer__scale');
const viewerPrevious = viewerDialog?.querySelector('[data-viewer-action="previous"]');
const viewerNext = viewerDialog?.querySelector('[data-viewer-action="next"]');
let viewerItems = [];
let viewerIndex = 0;
let viewerScale = 1;
let viewerOffsetX = 0;
let viewerOffsetY = 0;
let viewerLastFocus = null;
let viewerDrag = null;
let viewerPinchDistance = 0;
let viewerPinchScale = 1;
const viewerMinScale = 1;
const viewerMaxScale = 8;
const viewerScaleStep = 0.5;

function applyViewerTransform() {
    if (!viewerImage || !viewerScaleOutput) return;
    viewerImage.style.transform = `translate3d(${viewerOffsetX}px, ${viewerOffsetY}px, 0) scale(${viewerScale})`;
    viewerScaleOutput.value = `${Math.round(viewerScale * 100)}%`;
    viewerScaleOutput.textContent = `${Math.round(viewerScale * 100)}%`;
    viewerStage?.classList.toggle('is-zoomed', viewerScale > viewerMinScale);
}

function setViewerScale(nextScale) {
    viewerScale = Math.min(viewerMaxScale, Math.max(viewerMinScale, nextScale));
    if (viewerScale === viewerMinScale) {
        viewerOffsetX = 0;
        viewerOffsetY = 0;
    }
    applyViewerTransform();
}

function getViewerBaseSize() {
    if (!viewerImage?.naturalWidth || !viewerImage?.naturalHeight || !viewerStage) return null;
    const availableWidth = Math.max(1, viewerStage.clientWidth - 32);
    const availableHeight = Math.max(1, viewerStage.clientHeight - 32);
    const fitScale = Math.min(1, availableWidth / viewerImage.naturalWidth, availableHeight / viewerImage.naturalHeight);
    const width = viewerImage.naturalWidth * fitScale;
    const height = viewerImage.naturalHeight * fitScale;
    viewerImage.style.width = `${width}px`;
    viewerImage.style.height = `${height}px`;
    return {
        width,
        height,
        availableWidth,
        availableHeight
    };
}

function fitViewerToWidth() {
    const base = getViewerBaseSize();
    if (!base) return;
    viewerScale = Math.min(viewerMaxScale, Math.max(viewerMinScale, base.availableWidth / base.width));
    viewerOffsetX = 0;
    viewerOffsetY = Math.max(0, (base.height * viewerScale - viewerStage.clientHeight) / 2 + 16);
    applyViewerTransform();
}

function initializeViewerImage() {
    const base = getViewerBaseSize();
    if (!base) return;
    const imageRatio = viewerImage.naturalHeight / viewerImage.naturalWidth;
    const stageRatio = base.availableHeight / base.availableWidth;
    if (imageRatio > stageRatio * 1.15) {
        fitViewerToWidth();
    } else {
        resetViewerTransform();
    }
}

function resetViewerTransform() {
    viewerScale = 1;
    viewerOffsetX = 0;
    viewerOffsetY = 0;
    applyViewerTransform();
}

function showViewerItem(index) {
    if (!viewerImage || !viewerItems.length) return;
    viewerIndex = (index + viewerItems.length) % viewerItems.length;
    const item = viewerItems[viewerIndex];
    const caption = item.dataset.viewerCaption || item.querySelector('img')?.alt || 'Изображение проекта';
    viewerImage.src = item.dataset.viewerSrc;
    viewerImage.alt = caption;
    if (viewerCaption) viewerCaption.textContent = caption;
    if (viewerPrevious) viewerPrevious.disabled = viewerItems.length < 2;
    if (viewerNext) viewerNext.disabled = viewerItems.length < 2;
    resetViewerTransform();
    if (viewerImage.complete) requestAnimationFrame(initializeViewerImage);
}

function openImageViewer(trigger) {
    if (!viewerDialog || typeof viewerDialog.showModal !== 'function') {
        window.open(trigger.dataset.viewerSrc, '_blank', 'noopener');
        return;
    }
    const group = trigger.dataset.viewerGroup;
    viewerItems = Array.from(document.querySelectorAll('[data-viewer-src]')).filter(item => item.dataset.viewerGroup === group);
    viewerIndex = Math.max(0, viewerItems.indexOf(trigger));
    viewerLastFocus = trigger;
    showViewerItem(viewerIndex);
    viewerDialog.showModal();
    document.body.classList.add('viewer-open');
    viewerDialog.querySelector('.image-viewer__close')?.focus();
}

document.querySelectorAll('[data-viewer-src]').forEach(trigger => {
    trigger.addEventListener('click', () => openImageViewer(trigger));
});

if (viewerDialog && viewerStage) {
    viewerImage?.addEventListener('load', initializeViewerImage);
    viewerDialog.querySelector('.image-viewer__close')?.addEventListener('click', () => viewerDialog.close());
    viewerDialog.querySelector('[data-viewer-action="zoom-in"]')?.addEventListener('click', () => setViewerScale(viewerScale + viewerScaleStep));
    viewerDialog.querySelector('[data-viewer-action="zoom-out"]')?.addEventListener('click', () => setViewerScale(viewerScale - viewerScaleStep));
    viewerDialog.querySelector('[data-viewer-action="reset"]')?.addEventListener('click', resetViewerTransform);
    viewerDialog.querySelector('[data-viewer-action="fit-width"]')?.addEventListener('click', fitViewerToWidth);
    viewerPrevious?.addEventListener('click', () => showViewerItem(viewerIndex - 1));
    viewerNext?.addEventListener('click', () => showViewerItem(viewerIndex + 1));

    viewerDialog.addEventListener('click', event => {
        if (event.target === viewerDialog) viewerDialog.close();
    });

    viewerDialog.addEventListener('close', () => {
        document.body.classList.remove('viewer-open');
        viewerLastFocus?.focus();
        viewerItems = [];
        resetViewerTransform();
    });

    viewerDialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            viewerDialog.close();
            return;
        }
        if (event.key === 'ArrowLeft' && viewerItems.length > 1) showViewerItem(viewerIndex - 1);
        if (event.key === 'ArrowRight' && viewerItems.length > 1) showViewerItem(viewerIndex + 1);
        if (event.key === '+' || event.key === '=') setViewerScale(viewerScale + viewerScaleStep);
        if (event.key === '-' || event.key === '_') setViewerScale(viewerScale - viewerScaleStep);
        if (event.key === '0') resetViewerTransform();
    });

    viewerStage.addEventListener('wheel', event => {
        event.preventDefault();
        setViewerScale(viewerScale + (event.deltaY < 0 ? viewerScaleStep : -viewerScaleStep));
    }, { passive: false });

    viewerStage.addEventListener('dblclick', () => {
        if (viewerScale > viewerMinScale) {
            resetViewerTransform();
        } else {
            fitViewerToWidth();
        }
    });

    viewerStage.addEventListener('pointerdown', event => {
        if (viewerScale <= 1 || event.pointerType === 'touch') return;
        viewerDrag = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            offsetX: viewerOffsetX,
            offsetY: viewerOffsetY
        };
        viewerStage.setPointerCapture(event.pointerId);
        viewerStage.classList.add('is-dragging');
    });

    viewerStage.addEventListener('pointermove', event => {
        if (!viewerDrag || viewerDrag.id !== event.pointerId) return;
        viewerOffsetX = viewerDrag.offsetX + event.clientX - viewerDrag.startX;
        viewerOffsetY = viewerDrag.offsetY + event.clientY - viewerDrag.startY;
        applyViewerTransform();
    });

    function stopViewerDrag(event) {
        if (!viewerDrag || viewerDrag.id !== event.pointerId) return;
        viewerDrag = null;
        viewerStage.classList.remove('is-dragging');
    }

    viewerStage.addEventListener('pointerup', stopViewerDrag);
    viewerStage.addEventListener('pointercancel', stopViewerDrag);

    viewerStage.addEventListener('touchstart', event => {
        if (event.touches.length !== 2) return;
        viewerPinchDistance = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
        viewerPinchScale = viewerScale;
    }, { passive: true });

    viewerStage.addEventListener('touchmove', event => {
        if (event.touches.length !== 2 || !viewerPinchDistance) return;
        event.preventDefault();
        const distance = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
        setViewerScale(viewerPinchScale * distance / viewerPinchDistance);
    }, { passive: false });

    viewerStage.addEventListener('touchend', () => {
        viewerPinchDistance = 0;
    });
}

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

function showCourseState(container, title, message) {
    const state = document.createElement('section');
    state.className = 'course-state';
    const heading = document.createElement('h2');
    const text = document.createElement('p');
    heading.textContent = title;
    text.textContent = message;
    state.append(heading, text);
    container.appendChild(state);
}

// Render course folders dynamically
function renderCourseFolders(courseName) {
    const container = document.getElementById('dynamic-folders');
    if (!container) return;
    container.replaceChildren();

    const hasFileData = typeof fileData !== 'undefined' && Boolean(fileData[courseName]);
    const hasExternalData = typeof externalLinks !== 'undefined' && Boolean(externalLinks[courseName]);
    if (!hasFileData && !hasExternalData) {
        showCourseState(container, 'Материалы не загрузились', 'Обновите страницу. Если ошибка повторится, вернитесь на главную и сообщите о проблеме.');
        return;
    }

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

    if (!sorted.length) {
        showCourseState(container, 'Материалы пока не добавлены', 'Для этого курса нет доступных файлов или внешних ссылок.');
        return;
    }

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
