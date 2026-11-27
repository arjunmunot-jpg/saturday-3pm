(() => {
  const who = document.documentElement.dataset.for === 'nazneen' ? 'nazneen' : 'zara';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = '../photos/';

  /* ---------------------------------------------------------------- content
     Each try at No makes him send the next entry: a photo, a line, or both. */
  const DATA = {
    zara: {
      name: 'Zara', from: 'Arjun', friend: 'Nirvan', other: 'Nazneen',
      backdrop: P + 'arjun-zara-couple.jpg', backdropAt: '50% 38%',
      frame: (i) => `${P}arjun-wall-${i}.jpg`, avatar: (i) => `${P}arjun-avatar-${i}.jpg`, frames: 8,
      tries: [
        { photo: 1, line: '?' },
        { photo: 2, line: 'Zara.' },
        { photo: 3, line: "It's a Saturday. What else are you doing?" },
        { photo: 4, line: 'Nirvan and I planned a whole thing.' },
        { photo: 5, line: "There's something tomorrow I'm going to beat you at. You should be there for it." },
        { photo: 6, line: 'Saying no counts as forfeiting, by the way.' },
        { photo: 7, line: "That's another loss for you. I'm keeping count." },
        { line: "Okay, I'll go easy on you. Slightly." },
        { line: "Fine. I'll stop asking." },
        { line: 'I lied.' }
      ],
      hint: 'I am going to beat you at it, though.'
    },
    nazneen: {
      name: 'Nazneen', from: 'Nirvan', friend: 'Arjun', other: 'Zara',
      backdrop: P + 'nirvan-nazneen-couple.jpg', backdropAt: '50% 22%',
      frame: (i) => `${P}nirvan-face-${i}.jpg`, avatar: (i) => `${P}nirvan-avatar-${i}.jpg`, frames: 5,
      tries: [
        { photo: 1, line: '?' },
        { line: 'Nazneen.' },
        { photo: 2, line: "It's a Saturday. What else are you doing?" },
        { line: 'Arjun and I planned a whole thing.' },
        { photo: 3, line: "There's something tomorrow we can compete at. Let's put a coffee on the line for who wins." },
        { line: 'Loser buys. So, you.' },
        { photo: 4, line: 'Saying no means you owe me the coffee anyway.' },
        { line: 'Two coffees. Final offer.' },
        { line: "Fine. I'll stop asking." },
        { line: 'I lied.' }
      ],
      hint: "The coffee's still on the line, though."
    }
  };
  const d = DATA[who];
  const AFTER = "There's only yes now. Take your time.";
  const WEAR = "Casual and nice, something you can move in. Not a dress you can't run in.";

  for (let i = 0; i < d.frames; i++) { new Image().src = d.frame(i); new Image().src = d.avatar(i); }

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const texted = (s) => s.toLowerCase().replace(/\.$/, '');   // he texts in lower case

  /* ---------------------------------------------------------------- page */
  const app = document.getElementById('app');
  const backdrop = el('div', 'backdrop');
  const bg = el('img'); bg.src = d.backdrop; bg.alt = `${d.from} and ${d.name}`; bg.style.objectPosition = d.backdropAt;
  backdrop.append(bg);

  const chat = el('div', 'chat');
  const head = el('header', 'chat-head');
  const av = el('img'); av.src = d.avatar(0); av.alt = '';
  const meta = el('div'); const status = el('div', 'status', '');
  meta.append(el('div', 'who', d.from), status); head.append(av, meta);
  const msgs = el('div', 'msgs'); msgs.setAttribute('aria-live', 'polite');
  const reply = el('div', 'reply'); reply.hidden = true;
  const yesBtn = el('button', 'btn btn-yes', 'Yes');
  const noBtn = el('button', 'btn btn-no', 'No');
  yesBtn.type = noBtn.type = 'button';
  noBtn.tabIndex = -1;   // the keyboard is not a way round it
  reply.append(noBtn, yesBtn);
  chat.append(head, msgs, reply);
  app.append(backdrop, chat);

  /* ---------------------------------------------------------------- sending messages, one after another */
  let queue = Promise.resolve(), waiting = 0;
  const pause = (ms) => new Promise(r => setTimeout(r, calm ? 0 : (waiting > 2 ? Math.min(ms, 160) : ms)));
  const toEnd = () => { msgs.scrollTop = msgs.scrollHeight; };

  function bubble(item, mine) {
    let b;
    if (typeof item === 'string') b = el('div', 'msg' + (mine ? ' me' : ''), mine ? item : texted(item));
    else if (item.plan) {
      b = el('div', 'msg plan'); const dl = el('dl', 'plan-list');
      [['When', 'Saturday, 3:00 PM'], ['Pickup', `${d.from} comes to you`], ['Wear', WEAR], ['Plan', 'Not telling you']]
        .forEach(([k, v]) => dl.append(el('dt', '', k), el('dd', '', v)));
      b.append(dl);
    } else {
      b = el('div', 'msg photo'); const im = el('img');
      im.src = d.frame(item.photo); im.alt = `Photo from ${d.from}`; im.addEventListener('load', toEnd);
      b.append(im); av.src = d.avatar(item.photo);
    }
    msgs.append(b); toEnd();
  }
  function send(item, mine) {
    waiting++;
    queue = queue.then(async () => {
      if (!mine) {
        status.textContent = 'typing…';
        await pause(typeof item === 'string' ? Math.min(1100, 420 + item.length * 14) : 750);
        status.textContent = '';
      }
      bubble(item, mine);
      waiting--;
      await pause(220);
    });
    return queue;
  }

  [d.name, { photo: 0 }, 'Are you free tomorrow?', `Double date. You and me, ${d.friend} and ${d.other}.`, "3 PM. I'm picking you up.", "Not telling you what we're doing."]
    .forEach(m => send(m));
  queue.then(() => { reply.hidden = false; toEnd(); live = true; });

  /* ---------------------------------------------------------------- the No button that cannot be pressed */
  let count = 0, lastAt = 0, movingUntil = 0, floated = false, gaveUp = false, answered = false, live = false;

  function floatNo() {
    if (floated) return;
    const r = noBtn.getBoundingClientRect();
    const spacer = el('span', 'no-spacer'); spacer.style.width = r.width + 'px'; spacer.style.height = r.height + 'px';
    noBtn.after(spacer);
    document.body.append(noBtn);
    noBtn.classList.add('floating');
    noBtn.style.left = r.left + 'px'; noBtn.style.top = r.top + 'px';
    noBtn.getBoundingClientRect();   // settle the start position before the first move
    floated = true;
  }

  function evade(px, py) {
    floatNo();
    const pad = 14, W = innerWidth, H = innerHeight, bw = noBtn.offsetWidth, bh = noBtn.offsetHeight;
    const yr = yesBtn.getBoundingClientRect(), cur = noBtn.getBoundingClientRect();
    const hitsYes = (x, y) => !(x > yr.right + 28 || x + bw < yr.left - 28 || y > yr.bottom + 28 || y + bh < yr.top - 28);
    let pick = null;
    for (let i = 0; i < 60; i++) {
      const x = pad + Math.random() * Math.max(1, W - bw - 2 * pad), y = pad + Math.random() * Math.max(1, H - bh - 2 * pad);
      if (hitsYes(x, y)) continue;
      const farFromPointer = px == null || Math.hypot(x + bw / 2 - px, y + bh / 2 - py) > Math.min(W, H) * 0.32;
      const farFromSelf = Math.hypot(x - cur.left, y - cur.top) > 140;
      if (farFromPointer && farFromSelf) { pick = [x, y]; break; }
      pick = pick || [x, y];
    }
    if (!pick) pick = [pad, pad];
    noBtn.style.left = pick[0] + 'px'; noBtn.style.top = pick[1] + 'px';
    movingUntil = performance.now() + 230;
  }

  function attempt(px, py) {
    if (!live || answered || gaveUp) return;
    evade(px, py);
    const now = performance.now();
    if (now - lastAt < 650) return;   // the button always runs, but he does not text faster than this
    lastAt = now;
    const step = d.tries[count++];
    if (step.photo != null) send({ photo: step.photo });
    if (step.line) send(step.line);
    yesBtn.style.transform = `scale(${1 + Math.min(count, 10) * 0.045})`;
    if (count >= d.tries.length) {
      gaveUp = true;
      noBtn.textContent = 'Yes'; noBtn.classList.add('gave-up'); noBtn.tabIndex = 0;
      // it stops running and goes back to where it started, next to the other Yes
      const spacer = document.querySelector('.no-spacer');
      if (spacer) { noBtn.classList.remove('floating'); noBtn.style.left = noBtn.style.top = ''; spacer.replaceWith(noBtn); floated = false; }
      yesBtn.style.transform = '';
      send(AFTER);
    }
  }

  // mouse: run before the cursor arrives
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !live || answered || gaveUp || performance.now() < movingUntil) return;
    const r = noBtn.getBoundingClientRect();
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    if (Math.hypot(dx, dy) < 70) attempt(e.clientX, e.clientY);
  });
  // touch and anything that gets through: cancel the press and run
  noBtn.addEventListener('pointerdown', (e) => { if (gaveUp) return; e.preventDefault(); attempt(e.clientX, e.clientY); });
  noBtn.addEventListener('touchstart', (e) => { if (!gaveUp) e.preventDefault(); }, { passive: false });
  noBtn.addEventListener('click', (e) => { if (gaveUp) { sayYes(); return; } e.preventDefault(); attempt(e.clientX || null, e.clientY || null); });
  noBtn.addEventListener('focus', () => { if (!gaveUp) { noBtn.blur(); attempt(null, null); } });
  noBtn.addEventListener('keydown', (e) => { if (!gaveUp) e.preventDefault(); });
  addEventListener('resize', () => { if (floated && !answered) evade(null, null); });

  function sayYes() {
    if (answered || !live) return;
    answered = true;
    noBtn.remove(); document.querySelector('.no-spacer')?.remove();
    reply.hidden = true;
    send('Yes', true);
    send('Knew it.');
    send({ photo: 0 });
    send("Tomorrow, 3 PM. Be ready, I'm picking you up.");
    send("Wear something casual and nice that you can move in. Not a dress you can't run in.");
    send("Still not telling you what we're doing.");
    if (d.hint) send(d.hint);
    send({ plan: true });
    send(`${d.other} got her own one of these from ${d.friend}.`);
  }
  yesBtn.addEventListener('click', sayYes);
})();
