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

// Render course folders
function renderCourseFolders(courseName) {
    const container = document.getElementById('dynamic-folders');
    if (!container) return;

    // Use pre-generated index in files.js
    if (typeof fileData === 'undefined' || !fileData[courseName]) return;

    const subjects = Object.keys(fileData[courseName]);
    subjects.sort((a, b) => a.localeCompare(b, 'ru'));

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

// Toggle folder expansion
function toggleFolder(header) {
    const content = header.nextElementSibling;
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
