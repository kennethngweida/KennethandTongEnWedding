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

    openCameraBtn.addEventListener('click', openCamera);
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

    function drawStamp(ctx, w, h) {
        const { date, time } = stampParts();
        const name = (nameInput.value || '').trim();
        const size = Math.round(Math.max(w, h) * 0.028);
        const pad = Math.round(size * 1.1);
        ctx.save();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ff9e3d';
        ctx.shadowColor = 'rgba(255,120,20,0.85)';
        ctx.shadowBlur = size * 0.5;
        ctx.font = `600 ${size}px Montserrat, monospace`;
        ctx.fillText(`${date}  ${time}`, w - pad, h - pad);
        if (name) {
            ctx.font = `600 ${Math.round(size * 0.82)}px Montserrat, monospace`;
            ctx.fillText(name, w - pad, h - pad - size * 1.35);
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
        ctx.filter = 'contrast(1.1) saturate(1.25) sepia(0.14) brightness(1.03)';
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
        ctx.filter = 'none';

        addGrain(ctx, w, h, 0.06);

        const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        const leak = ctx.createLinearGradient(w, 0, w * 0.6, h * 0.4);
        leak.addColorStop(0, 'rgba(255,140,60,0.18)');
        leak.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = leak;
        ctx.fillRect(0, 0, w, h);

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
        sendBtn.disabled = true;
        progress.hidden = false;
        progressBar.style.width = '0';
        const folder = slug(nameInput.value);
        let ok = 0, fail = 0;
        for (let i = 0; i < valid.length; i++) {
            const f = valid[i].file;
            status.textContent = `Uploading ${i + 1} of ${valid.length}…`;
            status.className = 'upload-status show';
            const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error } = await client.storage
                .from(SUPABASE_CONFIG.bucket)
                .upload(path, f, { contentType: f.type || 'image/jpeg', upsert: false });
            if (error) { fail++; console.error(error); } else { ok++; }
            progressBar.style.width = `${Math.round(((i + 1) / valid.length) * 100)}%`;
        }
        sendBtn.disabled = false;
        setTimeout(() => { progress.hidden = true; }, 600);
        if (fail === 0) {
            status.textContent = `Thank you! ${ok} photo${ok > 1 ? 's' : ''} shared with Kenneth & Tong En. 💛`;
            status.className = 'upload-status show success';
            items.forEach(it => URL.revokeObjectURL(it.url));
            items = []; render(); sendBtn.hidden = true; countEl.textContent = '';
        } else {
            status.textContent = `${ok} uploaded, ${fail} didn't go through — please try those again.`;
            status.className = 'upload-status show error';
        }
    });
})();
