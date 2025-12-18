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

        // If only local files exist (no external links for this discipline)
        if (hasLocalFiles && !hasExternalLinks) {
            const link = document.createElement('a');
            link.href = `viewer.html?path=${encodeURIComponent(courseName)}/${encodeURIComponent(localKey)}`;
            link.className = 'subject-item';
            link.innerHTML = `
                <span class="subject-name">${displayName}</span>
                <span class="folder-icon"><i class="fas fa-folder"></i></span>
            `;
            container.appendChild(link);
            return;
        }

        // Create expandable folder for disciplines with external links
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

        // Add link to local files if they exist
        if (hasLocalFiles && localKey) {
            const filesLink = document.createElement('a');
            filesLink.href = `viewer.html?path=${encodeURIComponent(courseName)}/${encodeURIComponent(localKey)}`;
            filesLink.className = 'subject-item link-item';
            filesLink.innerHTML = `
                <span class="subject-name">📂 Файлы</span>
                <span class="folder-icon"><i class="fas fa-folder-open"></i></span>
            `;
            linksContainer.appendChild(filesLink);
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
