// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.background = window.scrollY > 50 ?
            'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)';
    }
});

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

        const header = document.createElement('div');
        header.className = 'subject-item folder-header';
        header.onclick = function () { toggleFolder(this); };
        header.innerHTML = `
            <span class="subject-name">${displayName}</span>
            <span class="folder-icon"><i class="fas fa-folder"></i></span>
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
                    subfolderHeader.innerHTML = `<i class="fas fa-folder"></i> ${folderName} <span class="subfolder-count">(${fileCount})</span>`;
                    subfolderHeader.onclick = function(e) { e.stopPropagation(); toggleSubfolder(this); };

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
                    fileLink.href = file.path;
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
    const icon = header.querySelector('i');
    if (content.classList.contains('active')) {
        icon.classList.remove('fa-folder');
        icon.classList.add('fa-folder-open');
    } else {
        icon.classList.remove('fa-folder-open');
        icon.classList.add('fa-folder');
    }
}
