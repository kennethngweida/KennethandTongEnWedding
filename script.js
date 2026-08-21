// Countdown Timer
function updateCountdown() {
    const weddingDate = new Date('2026-12-05T10:30:00').getTime();

    function countDown() {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = days;
        document.getElementById('hours').innerText = hours;
        document.getElementById('minutes').innerText = minutes;
        document.getElementById('seconds').innerText = seconds;

        if (distance < 0) {
            document.querySelector('.countdown').innerHTML = '<h2>The moment is here! 💕</h2><p>Thank you for celebrating with us!</p>';
        }
    }

    countDown();
    setInterval(countDown, 1000);
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
        const isOpen = navMenu.classList.toggle('active');
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close the menu after tapping a link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// Add to Calendar — generates a downloadable .ics file, no server needed
const addToCalendarBtn = document.getElementById('addToCalendar');

if (addToCalendarBtn) {
    addToCalendarBtn.addEventListener('click', function() {
        // ICS text fields must escape commas, semicolons and backslashes
        const esc = (s) => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;');

        const event = {
            title: "Kenneth & Tong En's Wedding",
            // Pinned to Singapore time (UTC+8, no DST) expressed in UTC:
            // 10:30 SGT = 02:30 UTC, 16:00 SGT = 08:00 UTC. Renders correctly in any timezone.
            start: '20261205T023000Z',
            end: '20261205T080000Z',
            location: 'JW Marriott Hotel Singapore South Beach, 30 Beach Road, Singapore 189763',
            description: 'We would be delighted to celebrate our wedding with you. Dress code: Black and Pink.'
        };

        const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Kenneth and Tong En//Wedding//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            'UID:wedding-2026-12-05@kenneth-tongen',
            'DTSTAMP:' + stamp,
            'DTSTART:' + event.start,
            'DTEND:' + event.end,
            'SUMMARY:' + esc(event.title),
            'LOCATION:' + esc(event.location),
            'DESCRIPTION:' + esc(event.description),
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Kenneth-and-TongEn-Wedding.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
}

// Gallery Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const galleryContainer = document.getElementById('galleryContainer');

function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
}

if (lightbox && galleryContainer) {
    // Delegate: gallery photos are added dynamically after fetch
    galleryContainer.addEventListener('click', function(e) {
        const img = e.target.closest('.gallery-item img');
        if (!img) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
    });

    lightbox.addEventListener('click', closeLightbox);
    lightboxClose.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeLightbox();
    });
}

// Photo albums — four scenic views from the Lijiang photoshoot.
// Defined here (not fetched) so the gallery works with or without the Python server.
const ALBUMS = [
    {
        name: '束河古鎮',
        folder: 'photoshoot/1-shuhe',
        cover: '_E9A2990.jpg',
        photos: ['_E9A2965.jpg', '_E9A2980.jpg', '_E9A2983.jpg', '_E9A2985.jpg', '_E9A2986.jpg', '_E9A2989.jpg', '_E9A2990.jpg', '_E9A2994.jpg', '_E9A2999.jpg', '_E9A3000.jpg', '_E9A3004.jpg', '_E9A3008FRAMEpeachlong.jpg', '_E9A3011.jpg', '_E9A3016.jpg', '_E9A3018.jpg', '_E9A3019.jpg', '_E9A3020.jpg', '_E9A3024.jpg', '_E9A3025.jpg', '_E9A3026.jpg', '_E9A3027.jpg', '_E9A3029-2.jpg', '_E9A3030-2.jpg', '_E9A3031-2.jpg', '_E9A3032-2.jpg', '_E9A3034-2.jpg', '_E9A3036-2.jpg', '_E9A3037-2.jpg', '_E9A3038-2.jpg', '_E9A3039-2.jpg']
    },
    {
        name: '玉龍雪山公路',
        folder: 'photoshoot/2-snow-mountain-road',
        cover: '_E9A3106.jpg',
        photos: ['_E9A3076.jpg', '_E9A3078.jpg', '_E9A3079.jpg', '_E9A3086.jpg', '_E9A3087.jpg', '_E9A3093.jpg', '_E9A3094.jpg', '_E9A3099.jpg', '_E9A3103.jpg', '_E9A3106.jpg', '_E9A3107.jpg', '_E9A3109.jpg', '_E9A3116.jpg', '_E9A3117.jpg', '_E9A3118.jpg', '_E9A3120.jpg', '_E9A3130.jpg', '_E9A3134.jpg', '_E9A3135.jpg', '_E9A3140.jpg', '_E9A3141.jpg', '_E9A3143.jpg']
    },
    {
        name: '藍月谷',
        folder: 'photoshoot/3-blue-moon-valley',
        cover: '_E9A3188.jpg',
        photos: ['_E9A3149.jpg', '_E9A3152.jpg', '_E9A3153.jpg', '_E9A3159.jpg', '_E9A3160.jpg', '_E9A3162.jpg', '_E9A3163.jpg', '_E9A3166.jpg', '_E9A3171.jpg', '_E9A3173.jpg', '_E9A3179.jpg', '_E9A3180.jpg', '_E9A3181.jpg', '_E9A3183.jpg', '_E9A3185.jpg', '_E9A3188.jpg', '_E9A3189.jpg', '_E9A3190.jpg', '_E9A3191.jpg', '_E9A3192.jpg', '_E9A3193.jpg', '_E9A3195.jpg', '_E9A3196.jpg', '_E9A3198.jpg', '_E9A3199.jpg', '_E9A3200.jpg', '_E9A3201.jpg', '_E9A3203.jpg', '_E9A3204.jpg', '_E9A3212.jpg', '_E9A3213.jpg', '_E9A3218.jpg', '_E9A3220.jpg', '_E9A3222.jpg', '_E9A3224.jpg', '_E9A3225.jpg']
    },
    {
        name: '雲杉坪',
        folder: 'photoshoot/4-yunshanping',
        cover: '_E9A3231.jpg',
        photos: ['_E9A3231.jpg', '_E9A3234.jpg', '_E9A3235.jpg', '_E9A3236.jpg', '_E9A3237.jpg', '_E9A3238.jpg', '_E9A3243.jpg', '_E9A3244.jpg', '_E9A3249.jpg', '_E9A3250.jpg', '_E9A3252.jpg', '_E9A3254.jpg', '_E9A3258FRAMEPEACHSQUARE.jpg', '_E9A3259.jpg', '_E9A3262.jpg', '_E9A3263.jpg', '_E9A3264.jpg', '_E9A3268.jpg', '_E9A3269.jpg', '_E9A3270.jpg', '_E9A3272.jpg', '_E9A3273.jpg', '_E9A3274.jpg', '_E9A3275.jpg', '_E9A3276.jpg', '_E9A3277.jpg', '_E9A3278.jpg', '_E9A3280.jpg', '_E9A3288.jpg', '_E9A3291.jpg', '_E9A3292.jpg', '_E9A3293copy.jpg', '_E9A3294.jpg', '_E9A3297.jpg', '_E9A3298.jpg', '_E9A3299.jpg', '_E9A3300.jpg', '_E9A3302.jpg', '_E9A3304.jpg', '_E9A328320x16FRAMEFR003.jpg']
    },
];

// Show the four album cover tiles
function renderAlbums() {
    const container = document.getElementById('galleryContainer');
    const note = document.getElementById('galleryNote');
    const back = document.getElementById('albumBack');
    const title = document.getElementById('albumTitle');

    back.hidden = true;
    title.hidden = true;
    note.textContent = 'Select an album to view the photos.';

    container.className = 'gallery-container album-grid';
    container.innerHTML = '';
    ALBUMS.forEach((album, i) => {
        const tile = document.createElement('button');
        tile.className = 'album-tile';
        tile.style.backgroundImage = `url('${album.folder}/${album.cover}')`;
        tile.innerHTML =
            '<span class="album-tile-overlay">' +
                '<span class="album-tile-name">' + album.name + '</span>' +
                '<span class="album-tile-count">' + album.photos.length + ' photos</span>' +
            '</span>';
        tile.addEventListener('click', () => openAlbum(i));
        container.appendChild(tile);
    });
}

// Show the photos inside one album
function openAlbum(index) {
    const album = ALBUMS[index];
    const container = document.getElementById('galleryContainer');
    const note = document.getElementById('galleryNote');
    const back = document.getElementById('albumBack');
    const title = document.getElementById('albumTitle');

    back.hidden = false;
    title.hidden = false;
    title.textContent = album.name;
    note.textContent = 'Tap a photo to view it full size.';

    container.className = 'gallery-container';
    container.innerHTML = '';
    album.photos.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = `${album.folder}/${file}`;
        img.alt = `${album.name} — photo ${i + 1}`;
        img.loading = 'lazy';

        item.appendChild(img);
        container.appendChild(item);
    });

    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initGallery() {
    const back = document.getElementById('albumBack');
    if (back) {
        back.addEventListener('click', function() {
            renderAlbums();
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    renderAlbums();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCountdown();
    initGallery();

    // Add animation to detail cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.detail-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Guest Photo Upload (Supabase Storage)
// Fill url + anonKey with your Supabase project values to switch this on.
// Until then the whole section stays hidden from guests.
const SUPABASE_CONFIG = {
    url: 'SUPABASE_URL_PLACEHOLDER',
    anonKey: 'SUPABASE_ANON_KEY_PLACEHOLDER',
    bucket: 'guest-photos'
};

(function initPhotoUpload() {
    const section = document.getElementById('share-photos');
    const navItem = document.querySelector('.nav-menu a[href="#share-photos"]');
    if (!section) return;

    const configured =
        !SUPABASE_CONFIG.url.includes('PLACEHOLDER') &&
        !SUPABASE_CONFIG.anonKey.includes('PLACEHOLDER');

    // Hide the feature entirely until Supabase is configured
    if (!configured || !window.supabase) {
        section.style.display = 'none';
        if (navItem && navItem.parentElement) navItem.parentElement.style.display = 'none';
        return;
    }

    const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    const chooseBtn = document.getElementById('choosePhotosBtn');
    const input = document.getElementById('photoInput');
    const list = document.getElementById('uploadList');
    const sendBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('uploadStatus');
    const nameInput = document.getElementById('uploaderName');
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per photo
    let files = [];

    chooseBtn.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
        files = Array.from(input.files || []);
        list.innerHTML = '';
        files.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.size > MAX_BYTES ? `${f.name} (too large — max 25 MB)` : f.name;
            list.appendChild(li);
        });
        sendBtn.hidden = files.length === 0;
        status.className = 'upload-status';
        status.textContent = '';
    });

    function slug(s) {
        return (s || 'guest').trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'guest';
    }

    sendBtn.addEventListener('click', async () => {
        const valid = files.filter(f => f.size <= MAX_BYTES);
        if (!valid.length) {
            status.textContent = 'Please choose photos under 25 MB each.';
            status.className = 'upload-status show error';
            return;
        }
        sendBtn.disabled = true;
        const folder = slug(nameInput.value);
        let ok = 0, fail = 0;
        for (let i = 0; i < valid.length; i++) {
            const f = valid[i];
            status.textContent = `Uploading ${i + 1} of ${valid.length}…`;
            status.className = 'upload-status show';
            const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error } = await client.storage
                .from(SUPABASE_CONFIG.bucket)
                .upload(path, f, { contentType: f.type || 'image/jpeg', upsert: false });
            if (error) { fail++; console.error(error); } else { ok++; }
        }
        sendBtn.disabled = false;
        if (fail === 0) {
            status.textContent = `Thank you! ${ok} photo${ok > 1 ? 's' : ''} shared with Kenneth & Tong En. 💛`;
            status.className = 'upload-status show success';
            files = []; input.value = ''; list.innerHTML = ''; sendBtn.hidden = true;
        } else {
            status.textContent = `${ok} uploaded, ${fail} didn't go through — please try those again.`;
            status.className = 'upload-status show error';
        }
    });
})();

// Console message for developers
console.log('👰 Kenneth & Tong En\'s Wedding Website 💍');
console.log('Date: 5th December 2026');
console.log('Venue: JW Marriott South Beach Road');
