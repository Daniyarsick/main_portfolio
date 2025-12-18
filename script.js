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

    // Render folder links from fileData (local files)
    if (typeof fileData !== 'undefined' && fileData[courseName]) {
        const subjects = Object.keys(fileData[courseName]).sort();

        subjects.forEach(subject => {
            const link = document.createElement('a');
            link.href = `viewer.html?path=${encodeURIComponent(courseName)}/${encodeURIComponent(subject)}`;
            link.className = 'subject-item';

            link.innerHTML = `
                <span class="subject-name">${subject}</span>
                <span class="folder-icon"><i class="fas fa-folder"></i></span>
            `;

            container.appendChild(link);
        });
    }

    // Render external links from externalLinks (grouped by discipline)
    if (typeof externalLinks !== 'undefined' && externalLinks[courseName]) {
        const disciplines = Object.keys(externalLinks[courseName]).sort();

        disciplines.forEach(discipline => {
            const links = externalLinks[courseName][discipline];

            // Create folder wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'folder-wrapper';

            // Create folder header
            const header = document.createElement('div');
            header.className = 'subject-item folder-header';
            header.onclick = function () { toggleFolder(this); };
            header.innerHTML = `
                <span class="subject-name">${discipline}</span>
                <span class="folder-icon"><i class="fas fa-folder"></i></span>
            `;

            // Create links container
            const linksContainer = document.createElement('div');
            linksContainer.className = 'folder-links';

            links.forEach(item => {
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

            wrapper.appendChild(header);
            wrapper.appendChild(linksContainer);
            container.appendChild(wrapper);
        });
    }
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
