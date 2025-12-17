(() => {
  const locale = 'ja-JP';
  const sundayFirst = true; // false にすると月曜始まり

  function getById<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`必要な要素が見つかりません: ${id}`);
    return el as T;
  }

  const titleEl = getById<HTMLElement>('title');
  const yearSel = getById<HTMLSelectElement>('yearSelect');
  const monthSel = getById<HTMLSelectElement>('monthSelect');
  const monthPicker = getById<HTMLInputElement>('monthPicker');
  const prevBtn = getById<HTMLButtonElement>('prevBtn');
  const nextBtn = getById<HTMLButtonElement>('nextBtn');
  const weekdaysEl = getById<HTMLElement>('weekdays');
  const daysEl = getById<HTMLElement>('days');

  let viewYear: number;
  let viewMonth: number;

  function init(): void {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    // 年セレクト（例：現在から前後10年）
    const range = 10;
    for (let y = viewYear - range; y <= viewYear + range; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = `${y}年`;
      if (y === viewYear) opt.selected = true;
      yearSel.appendChild(opt);
    }

    // 月セレクト
    for (let i = 0; i < 12; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${i + 1}月`;
      if (i === viewMonth) opt.selected = true;
      monthSel.appendChild(opt);
    }

    // monthPicker 初期値（YYYY-MM）
    monthPicker.value = `${String(viewYear).padStart(4, '0')}-${String(viewMonth + 1).padStart(2, '0')}`;

    // 曜日ヘッダ
    renderWeekdays();

    // イベント
    yearSel.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      viewYear = Number(target.value);
      render();
    });
    monthSel.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      viewMonth = Number(target.value);
      render();
    });
    monthPicker.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const [y, m] = target.value.split('-').map(Number);
      if (!Number.isNaN(y) && !Number.isNaN(m)) {
        viewYear = y;
        viewMonth = m - 1;
        syncSelectors();
        render();
      }
    });
    prevBtn.addEventListener('click', () => { changeMonth(-1); });
    nextBtn.addEventListener('click', () => { changeMonth(1); });

    // 初回描画
    render();
  }

  function syncSelectors(): void {
    yearSel.value = String(viewYear);
    monthSel.value = String(viewMonth);
    monthPicker.value = `${String(viewYear).padStart(4, '0')}-${String(viewMonth + 1).padStart(2, '0')}`;
  }

  function changeMonth(delta: number): void {
    const d = new Date(viewYear, viewMonth + delta, 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    syncSelectors();
    render();
  }

  function renderWeekdays(): void {
    weekdaysEl.innerHTML = '';
    // JS: 0=Sun ... 6=Sat
    const base = sundayFirst ? 0 : 1;
    const names: string[] = [];
    for (let i = 0; i < 7; i++) {
      const dayIdx = (base + i) % 7;
      // 日曜〜土曜 の短縮名
      names.push(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2020, 0, 4 + dayIdx)));
    }
    names.forEach((n) => {
      const el = document.createElement('div');
      el.className = 'day-name';
      el.textContent = n;
      weekdaysEl.appendChild(el);
    });
  }

  function render(): void {
    // タイトル
    const titleStr = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(viewYear, viewMonth, 1));
    titleEl.textContent = titleStr;

    // days grid
    daysEl.innerHTML = '';

    // その月1日の曜日（0=Sun..6=Sat）
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const shift = sundayFirst ? firstDay : (firstDay === 0 ? 6 : firstDay - 1); // 月曜始まりなら調整
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // 前月の末日（空白セルに日付を薄く出したいときに使用可能）
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

    // 合計セル数（6行で十分）
    const totalCells = 42;

    const today = new Date();
    const isTodayMonth = (today.getFullYear() === viewYear && today.getMonth() === viewMonth);
    let dayCounter = 1;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (i < shift) {
        // 前月の残り日（空白表示にするなら .empty クラス追加）
        const d = prevMonthLastDate - (shift - 1 - i);
        cell.textContent = String(d);
        cell.classList.add('muted');
        // cell.classList.add('empty'); // 完全に空にしたければ有効化
      } else if (dayCounter <= daysInMonth) {
        cell.textContent = String(dayCounter);
        // 今日ハイライト
        if (isTodayMonth && dayCounter === today.getDate()) {
          cell.classList.add('today');
        }
        dayCounter++;
      } else {
        // 次月の日
        const d = dayCounter - daysInMonth;
        cell.textContent = String(d);
        cell.classList.add('muted');
        dayCounter++;
      }
      daysEl.appendChild(cell);
    }
  }

  // 初期化呼び出し
  init();
})();
