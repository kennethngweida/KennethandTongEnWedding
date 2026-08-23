// Guest Photo Upload + Disposable Camera (Supabase Storage)
const SUPABASE_CONFIG = {
    url: 'https://gruwjaiayfvjmjvhmrzq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydXdqYWlheWZ2am1qdmhtcnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMDA4ODcsImV4cCI6MjEwMjg3Njg4N30.t4BO5aGJvwqYZ7ZJDhEOMKWK2BYLksE8iZtHUqQQr2A',
    bucket: 'guest-photos'
};

(function initPhotoUpload() {
    const status = document.getElementById('uploadStatus');
    if (!status) return;

    if (!window.supabase) {
        status.textContent = 'Photo sharing could not load. Please refresh the page.';
        status.className = 'upload-status show error';
        return;
    }

    const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    const dropzone = document.getElementById('dropzone');
    const input = document.getElementById('photoInput');
    const grid = document.getElementById('previewGrid');
    const sendBtn = document.getElementById('uploadBtn');
    const countEl = document.getElementById('uploadCount');
    const progress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const nameInput = document.getElementById('uploaderName');
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per photo
    let items = []; // { file, url, tooLarge }

    function slug(s) {
        return (s || 'guest').trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'guest';
    }

    function requireName() {
        if (nameInput.value.trim()) return true;
        status.textContent = 'Please add your name first so we know who shared these 💛';
        status.className = 'upload-status show error';
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    function refresh() {
        const valid = items.filter(it => !it.tooLarge).length;
        sendBtn.hidden = valid === 0;
        countEl.textContent = valid ? `${valid} photo${valid > 1 ? 's' : ''}` : '';
        status.className = 'upload-status';
        status.textContent = '';
    }

    function render() {
        grid.innerHTML = '';
        items.forEach((it, i) => {
            const cell = document.createElement('div');
            cell.className = 'preview-item' + (it.tooLarge ? ' too-large' : '');
            const img = document.createElement('img');
            img.src = it.url;
            img.alt = '';
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.className = 'preview-remove';
            rm.setAttribute('aria-label', 'Remove photo');
            rm.innerHTML = '&times;';
            rm.addEventListener('click', () => {
                URL.revokeObjectURL(it.url);
                items.splice(i, 1);
                render();
                refresh();
            });
            cell.appendChild(img);
            cell.appendChild(rm);
            grid.appendChild(cell);
        });
    }

    function addFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            items.push({ file, url: URL.createObjectURL(file), tooLarge: file.size > MAX_BYTES });
        });
        render();
        refresh();
    }

    dropzone.addEventListener('click', () => input.click());
    dropzone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });

    ['dragenter', 'dragover'].forEach(ev =>
        dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev =>
        dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', e => {
        if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    // ---- Disposable camera capture ----
    const openCameraBtn = document.getElementById('openCameraBtn');
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const shutter = document.getElementById('cameraShutter');
    const flipBtn = document.getElementById('cameraFlip');
    const closeCam = document.getElementById('cameraClose');
    const camError = document.getElementById('cameraError');
    let stream = null;
    let facing = 'environment';

    // Filters guests can choose — the CSS filter drives both the live preview and the saved photo
    const FILTERS = [
        { name: 'Kodak Gold', filter: 'saturate(1.35) contrast(1.02) brightness(1.05) sepia(0.22)', grain: 0.05, vignette: 0.3, leak: true, halation: 0.28, fade: 0.1 },
        { name: 'Portra', filter: 'saturate(1.08) contrast(0.95) brightness(1.06) sepia(0.1)', grain: 0.04, vignette: 0.25, leak: false, halation: 0.22, fade: 0.13 },
        { name: 'Cinestill', filter: 'saturate(1.15) contrast(1.05) brightness(1.02) hue-rotate(-8deg)', grain: 0.05, vignette: 0.35, leak: false, halation: 0.5, fade: 0.06 },
        { name: 'Disposable', filter: 'contrast(1.1) saturate(1.25) sepia(0.14) brightness(1.03)', grain: 0.07, vignette: 0.4, leak: true, halation: 0.2, fade: 0.05 },
        { name: 'B&W Film', filter: 'grayscale(1) contrast(1.2) brightness(1.02)', grain: 0.09, vignette: 0.4, leak: false, halation: 0.12, fade: 0.09 },
        { name: 'Vintage', filter: 'sepia(0.5) contrast(0.9) saturate(1.05) brightness(1.05)', grain: 0.07, vignette: 0.45, leak: true, halation: 0.15, fade: 0.17 }
    ];
    let selected = FILTERS[0];
    const filtersEl = document.getElementById('cameraFilters');
    FILTERS.forEach(f => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (f === selected ? ' active' : '');
        chip.textContent = f.name;
        chip.addEventListener('click', () => {
            selected = f;
            filtersEl.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            video.style.filter = f.filter;
        });
        filtersEl.appendChild(chip);
    });

    function stopCamera() {
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        video.srcObject = null;
    }

    async function startCamera() {
        stopCamera();
        camError.hidden = true;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            video.srcObject = stream;
            video.style.filter = selected.filter;
            video.play().catch(() => {});
        } catch (err) {
            camError.hidden = false;
            camError.textContent = 'Could not open the camera. Please allow camera access, or use “upload existing photos” instead.';
            console.error(err);
        }
    }

    function openCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('This browser can’t open the camera in-page. Please use “upload existing photos”.');
            return;
        }
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        startCamera();
    }

    function closeCamera() {
        stopCamera();
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }

    openCameraBtn.addEventListener('click', () => {
        if (!requireName()) return;
        if (document.fonts && document.fonts.load) {
            document.fonts.load("40px 'Great Vibes'");
            document.fonts.load("600 30px Montserrat");
        }
        openCamera();
    });
    closeCam.addEventListener('click', closeCamera);
    flipBtn.addEventListener('click', () => {
        facing = facing === 'environment' ? 'user' : 'environment';
        startCamera();
    });

    const pad2 = n => (n < 10 ? '0' + n : '' + n);
    function stampParts() {
        const d = new Date();
        return {
            date: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
            time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
        };
    }

    function addGrain(ctx, w, h, amount) {
        const noise = document.createElement('canvas');
        noise.width = Math.round(w / 2);
        noise.height = Math.round(h / 2);
        const nctx = noise.getContext('2d');
        const id = nctx.createImageData(noise.width, noise.height);
        for (let i = 0; i < id.data.length; i += 4) {
            const v = Math.random() * 255;
            id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
            id.data[i + 3] = 255;
        }
        nctx.putImageData(id, 0, 0);
        ctx.save();
        ctx.globalAlpha = amount;
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(noise, 0, 0, w, h);
        ctx.restore();
    }

    // Lift the blacks toward a warm dark grey — film never has pure black
    function liftBlacks(ctx, w, h, amount) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighten';
        const lv = Math.min(Math.round(amount * 180), 60);
        ctx.fillStyle = `rgb(${Math.min(lv + 5, 66)}, ${lv}, ${Math.max(lv - 5, 0)})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    // Halation — the glow that bleeds around bright areas on film (red on Cinestill)
    function addHalation(ctx, srcCanvas, w, h, amount, name) {
        const hal = document.createElement('canvas');
        hal.width = w; hal.height = h;
        const hctx = hal.getContext('2d');
        hctx.filter = 'brightness(1.1) contrast(6)'; // isolate the highlights
        hctx.drawImage(srcCanvas, 0, 0, w, h);
        hctx.filter = 'none';
        hctx.globalCompositeOperation = 'multiply'; // tint the glow
        hctx.fillStyle = name === 'B&W Film' ? 'rgba(255,255,255,1)'
            : name === 'Cinestill' ? 'rgba(255,45,25,1)' : 'rgba(255,120,55,1)';
        hctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = amount;
        ctx.filter = `blur(${Math.max(w, h) * 0.012}px)`;
        ctx.drawImage(hal, 0, 0, w, h);
        ctx.restore();
        ctx.filter = 'none';
    }

    function drawStamp(ctx, w, h) {
        const { date, time } = stampParts();
        const name = (nameInput.value || '').trim();
        const base = Math.max(w, h);
        const pad = Math.round(base * 0.045);
        ctx.save();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Date + time — warm film date-stamp glow
        const dsSize = Math.round(base * 0.024);
        ctx.font = `600 ${dsSize}px Montserrat, sans-serif`;
        ctx.fillStyle = '#ffb04a';
        ctx.shadowColor = 'rgba(255,120,20,0.9)';
        ctx.shadowBlur = dsSize * 0.6;
        ctx.fillText(`${date}   ${time}`, w - pad, h - pad);

        // Name — elegant script above the stamp, in soft white
        if (name) {
            const nSize = Math.round(base * 0.058);
            ctx.font = `400 ${nSize}px 'Great Vibes', cursive`;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = nSize * 0.3;
            ctx.fillText(name, w - pad, h - pad - dsSize * 1.9);
        }
        ctx.restore();
    }

    function flashEffect() {
        const fl = document.createElement('div');
        fl.className = 'camera-flash fire';
        document.body.appendChild(fl);
        setTimeout(() => fl.remove(), 400);
    }

    shutter.addEventListener('click', () => {
        if (!stream) return;
        const vw = video.videoWidth, vh = video.videoHeight;
        if (!vw || !vh) return;

        const scale = Math.min(1, 1600 / Math.max(vw, vh));
        const w = Math.round(vw * scale), h = Math.round(vh * scale);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.save();
        if (facing === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
        ctx.filter = selected.filter;
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
        ctx.filter = 'none';

        if (selected.fade) liftBlacks(ctx, w, h, selected.fade);
        if (selected.halation) addHalation(ctx, canvas, w, h, selected.halation, selected.name);
        if (selected.grain) addGrain(ctx, w, h, selected.grain);

        if (selected.vignette) {
            const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, `rgba(0,0,0,${selected.vignette})`);
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);
        }

        if (selected.leak) {
            const leak = ctx.createLinearGradient(w, 0, w * 0.6, h * 0.4);
            leak.addColorStop(0, 'rgba(255,140,60,0.18)');
            leak.addColorStop(1, 'rgba(255,140,60,0)');
            ctx.fillStyle = leak;
            ctx.fillRect(0, 0, w, h);
        }

        drawStamp(ctx, w, h);
        flashEffect();

        canvas.toBlob(blob => {
            if (!blob) return;
            const file = new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
            items.push({ file, url: URL.createObjectURL(blob), tooLarge: false });
            render();
            refresh();
        }, 'image/jpeg', 0.9);
    });

    sendBtn.addEventListener('click', async () => {
        const valid = items.filter(it => !it.tooLarge);
        if (!valid.length) return;
        if (!requireName()) return;
        sendBtn.disabled = true;
        progress.hidden = false;
        progressBar.style.width = '0';
        const folder = slug(nameInput.value);
        const now = new Date();
        const datePart = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
        const prefix = `${folder}_${datePart}_`; // e.g. aunt-may_2026-12-05_

        // Continue the numbering from photos this guest already shared today
        let n = 1;
        try {
            const { data: existing } = await client.storage.from(SUPABASE_CONFIG.bucket).list(folder, { limit: 1000 });
            const nums = (existing || [])
                .filter(f => f.name.startsWith(prefix))
                .map(f => parseInt(f.name.slice(prefix.length), 10))
                .filter(x => !isNaN(x));
            if (nums.length) n = Math.max(...nums) + 1;
        } catch (e) { /* if listing isn't allowed, just start at 1 */ }

        let ok = 0, fail = 0;
        for (let i = 0; i < valid.length; i++) {
            const f = valid[i].file;
            status.textContent = `Uploading ${i + 1} of ${valid.length}…`;
            status.className = 'upload-status show';
            const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            let done = false, guard = 0;
            while (!done && guard < 100) {
                const path = `${folder}/${prefix}${n}.${ext}`; // guestname_date_N.jpg
                const { error } = await client.storage
                    .from(SUPABASE_CONFIG.bucket)
                    .upload(path, f, { contentType: f.type || 'image/jpeg', upsert: false });
                if (!error) { ok++; n++; done = true; }
                else if (/exist/i.test(error.message || '') || error.statusCode === '409') { n++; guard++; } // name taken, try next number
                else { fail++; console.error(error); break; }
            }
            if (!done && guard >= 100) fail++;
            progressBar.style.width = `${Math.round(((i + 1) / valid.length) * 100)}%`;
        }
        sendBtn.disabled = false;
        setTimeout(() => { progress.hidden = true; }, 600);
        if (fail === 0) {
            status.textContent = `Thank you! ${ok} photo${ok > 1 ? 's' : ''} shared with Kenneth & Tong En. 💛`;
            status.className = 'upload-status show success';
            items.forEach(it => URL.revokeObjectURL(it.url));
            items = []; render(); sendBtn.hidden = true; countEl.textContent = '';
            loadGuestGallery();
        } else {
            status.textContent = `${ok} uploaded, ${fail} didn't go through — please try those again.`;
            status.className = 'upload-status show error';
        }
    });

    // ---- Guest gallery: display everyone's uploaded photos ----
    const galleryGrid = document.getElementById('guestGalleryGrid');
    const galleryNote = document.getElementById('guestGalleryNote');
    const glBox = document.getElementById('galleryLightbox');
    const glImg = document.getElementById('galleryLightboxImg');
    const glClose = document.getElementById('galleryLightboxClose');
    const IMG_RE = /\.(jpe?g|png|gif|webp|heic)$/i;

    function openGalleryLightbox(url) {
        glImg.src = url;
        glBox.classList.add('open');
        glBox.setAttribute('aria-hidden', 'false');
    }
    function closeGalleryLightbox() {
        glBox.classList.remove('open');
        glBox.setAttribute('aria-hidden', 'true');
        glImg.src = '';
    }
    if (glBox) {
        glBox.addEventListener('click', closeGalleryLightbox);
        glClose.addEventListener('click', closeGalleryLightbox);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGalleryLightbox(); });
    }

    async function loadGuestGallery() {
        if (!galleryGrid) return;
        try {
            const { data: top, error } = await client.storage.from(SUPABASE_CONFIG.bucket).list('', { limit: 1000 });
            if (error) throw error;
            const all = [];
            for (const entry of top) {
                if (entry.id === null) {
                    if (entry.name === '_setup-test') continue; // skip setup test folder
                    const { data: files } = await client.storage.from(SUPABASE_CONFIG.bucket)
                        .list(entry.name, { limit: 1000 });
                    (files || []).forEach(f => {
                        if (f.id && IMG_RE.test(f.name)) all.push({ path: `${entry.name}/${f.name}`, at: f.created_at || '' });
                    });
                } else if (IMG_RE.test(entry.name)) {
                    all.push({ path: entry.name, at: entry.created_at || '' });
                }
            }
            all.sort((a, b) => (b.at || '').localeCompare(a.at || '')); // newest first
            if (!all.length) {
                galleryNote.textContent = 'No photos yet — be the first to share!';
                galleryGrid.innerHTML = '';
                return;
            }
            galleryNote.textContent = `${all.length} photo${all.length > 1 ? 's' : ''} shared so far`;
            galleryGrid.innerHTML = '';
            all.forEach(o => {
                const url = client.storage.from(SUPABASE_CONFIG.bucket).getPublicUrl(o.path).data.publicUrl;
                const cell = document.createElement('div');
                cell.className = 'guest-photo';
                const img = document.createElement('img');
                img.src = url;
                img.loading = 'lazy';
                img.alt = '';
                cell.appendChild(img);
                cell.addEventListener('click', () => openGalleryLightbox(url));
                galleryGrid.appendChild(cell);
            });
        } catch (e) {
            console.error(e);
            galleryNote.textContent = 'The shared photo gallery isn’t switched on yet.';
        }
    }
    loadGuestGallery();
})();
