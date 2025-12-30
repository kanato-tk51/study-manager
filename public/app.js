(() => {
  const locale = 'ja-JP';
  const sundayFirst = true;
  const titleEl = document.getElementById('title');
  const yearSel = document.getElementById('yearSelect');
  const monthSel = document.getElementById('monthSelect');
  const monthPicker = document.getElementById('monthPicker');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const weekdaysEl = document.getElementById('weekdays');
  const daysEl = document.getElementById('days');
  if (!titleEl || !yearSel || !monthSel || !monthPicker || !prevBtn || !nextBtn || !weekdaysEl || !daysEl) {
    throw new Error('必要な要素が見つかりません');
  }
  let viewYear;
  let viewMonth;
  function init() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    const range = 10;
    for (let y = viewYear - range; y <= viewYear + range; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = `${y}年`;
      if (y === viewYear) opt.selected = true;
      yearSel.appendChild(opt);
    }
    const monthNames = [];
    for (let m = 0; m < 12; m++) {
      monthNames.push(new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, m, 1)));
    }
    monthNames.forEach((name, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${i + 1}月`;
      if (i === viewMonth) opt.selected = true;
      monthSel.appendChild(opt);
    });
    monthPicker.value = `${String(viewYear).padStart(4, '0')}-${String(viewMonth + 1).padStart(2, '0')}`;
    renderWeekdays();
    yearSel.addEventListener('change', (e) => {
      const target = e.target;
      viewYear = Number(target.value);
      render();
    });
    monthSel.addEventListener('change', (e) => {
      const target = e.target;
      viewMonth = Number(target.value);
      render();
    });
    monthPicker.addEventListener('change', (e) => {
      const target = e.target;
      const [y, m] = target.value.split('-').map(Number);
      if (!Number.isNaN(y) && !Number.isNaN(m)) {
        viewYear = y;
        viewMonth = m - 1;
        syncSelectors();
        render();
      }
    });
    prevBtn.addEventListener('click', () => {
      changeMonth(-1);
    });
    nextBtn.addEventListener('click', () => {
      changeMonth(1);
    });
    render();
  }
  function syncSelectors() {
    yearSel.value = String(viewYear);
    monthSel.value = String(viewMonth);
    monthPicker.value = `${String(viewYear).padStart(4, '0')}-${String(viewMonth + 1).padStart(2, '0')}`;
  }
  function changeMonth(delta) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    syncSelectors();
    render();
  }
  function renderWeekdays() {
    weekdaysEl.innerHTML = '';
    const base = sundayFirst ? 0 : 1;
    const names = [];
    for (let i = 0; i < 7; i++) {
      const dayIdx = (base + i) % 7;
      names.push(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2020, 0, 4 + dayIdx)));
    }
    names.forEach((n) => {
      const el = document.createElement('div');
      el.className = 'day-name';
      el.textContent = n;
      weekdaysEl.appendChild(el);
    });
  }
  function render() {
    const titleStr = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(viewYear, viewMonth, 1));
    titleEl.textContent = titleStr;
    daysEl.innerHTML = '';
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const shift = sundayFirst ? firstDay : (firstDay === 0 ? 6 : firstDay - 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    const totalCells = 42;
    const today = new Date();
    const isTodayMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
    let dayCounter = 1;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (i < shift) {
        const d = prevMonthLastDate - (shift - 1 - i);
        cell.textContent = String(d);
        cell.classList.add('muted');
      } else if (dayCounter <= daysInMonth) {
        cell.textContent = String(dayCounter);
        if (isTodayMonth && dayCounter === today.getDate()) {
          cell.classList.add('today');
        }
        dayCounter++;
      } else {
        const d = dayCounter - daysInMonth;
        cell.textContent = String(d);
        cell.classList.add('muted');
        dayCounter++;
      }
      daysEl.appendChild(cell);
    }
  }
  init();
})();
