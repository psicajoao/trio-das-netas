// ============================================================
//  PERSONAGEM  —  Mimo (recorte da referência original, sem redesenho).
//  Só existe a pose original; as reações são feitas com movimentos (CSS)
//  e pequenos efeitos em código (estrelas, gota de suor). Poses novas
//  podem ser plugadas depois trocando `setPose` (ver README).
// ============================================================
const MOUTH = { x: 0.45, y: 0.66 }; // boca, em fração da imagem

export function createMimo(root, fxLayer) {
  root.innerHTML =
    '<div class="mimo-wrap"><img class="mimo-img" src="assets/mimo.png" alt="Mimo" draggable="false">' +
    '<svg class="drop" viewBox="0 0 20 28" aria-hidden="true"><path d="M10 1 C10 1 1 12 1 18 a9 9 0 0 0 18 0 C19 12 10 1 10 1Z" fill="#6EC6FF" stroke="#24306A" stroke-width="2"/></svg>' +
    '</div>' +
    '<div class="bubble" aria-live="polite"></div>';
  const wrap = root.querySelector('.mimo-wrap');
  const img = root.querySelector('.mimo-img');
  const bubble = root.querySelector('.bubble');
  let timer = null;

  function react(cls, ms) {
    wrap.classList.remove('eat', 'sad', 'cheer');
    void wrap.offsetWidth;
    wrap.classList.add(cls);
    clearTimeout(timer);
    timer = setTimeout(() => wrap.classList.remove(cls), ms);
  }

  return {
    /** Ponto (px de tela) onde a nota "entra" na boca. */
    mouthPoint() {
      const r = img.getBoundingClientRect();
      return { x: r.left + r.width * MOUTH.x, y: r.top + r.height * MOUTH.y };
    },
    say(text) { bubble.textContent = text; },
    eat() { react('eat', 950); },
    sad() { react('sad', 900); },
    cheer() { react('cheer', 1400); },
    /** Gancho para poses futuras (feliz, triste, comendo...). */
    setPose(/* nome */) { /* só a pose original por enquanto */ },

    /** Estrelas saindo da boca + "+N". */
    burst(n, label) {
      const p = this.mouthPoint();
      const scale = Math.max(1, img.getBoundingClientRect().width / 150);
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('div');
        s.className = 'fx-star';
        s.textContent = '★';
        s.style.left = p.x + 'px';
        s.style.top = p.y + 'px';
        const a = (-90 + (i - 2.5) * 34) * (Math.PI / 180);
        s.style.setProperty('--dx', Math.cos(a) * 70 * scale + 'px');
        s.style.setProperty('--dy', Math.sin(a) * 70 * scale + 'px');
        fxLayer.appendChild(s);
        setTimeout(() => s.remove(), 900);
      }
      const t = document.createElement('div');
      t.className = 'fx-plus';
      t.textContent = label;
      t.style.left = p.x + 'px';
      t.style.top = p.y + 'px';
      fxLayer.appendChild(t);
      setTimeout(() => t.remove(), 1100);
    },
  };
}
