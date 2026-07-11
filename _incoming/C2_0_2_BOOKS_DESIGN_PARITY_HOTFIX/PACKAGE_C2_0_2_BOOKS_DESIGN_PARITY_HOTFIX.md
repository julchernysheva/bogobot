# PACKAGE C2.0.2 — BOOKS DESIGN PARITY + FONT + SOURCES HOTFIX

WORKDIR:
`/Users/julia.chernysheva/Documents/Codex/2026-06-20/z/work/bogobot-static`

BASELINE:
`PACKAGE C2 REV B IMPLEMENTED, LIVE VISUAL REVIEW FAILED`

## LIVE DEFECTS

Ручная проверка generated BOOKS показала три системных регресса:

1. В «Книге бытия» отображается раздел `Источники / подкладка`, который редакционно исключён из книжной версии.
2. BOOKS INDEX и остальные reader-страницы визуально отличаются от ранее согласованных и загруженных прототипов.
3. IBM Plex Sans / IBM Plex Mono фактически не подключены: браузер использует fallback, хотя семейства указаны в CSS.

C2 не считается принятым до устранения всех трёх дефектов.

---

## 1. SOURCE OF TRUTH ДЛЯ ДИЗАЙНА

Использовать как визуальный эталон загруженные ранее прототипы:

```text
_incoming/C2_BOOKS_FOUNDATION/books-index-prototype.html
_incoming/C2_BOOKS_FOUNDATION/reader-prototype.html
```

Если этих файлов нет в проекте, остановиться и сообщить об отсутствии эталона.

Не считать текущие generated HTML и текущий `books/books.css` источником истины.

Прототипы задают:

- композицию;
- размеры зон;
- типографическую иерархию;
- сетку;
- положение навигации;
- ширину текстовой колонки;
- характер hover/focus;
- mobile breakpoints.

Generated BOOKS должны использовать данные из manifest и canonical Markdown, но визуально повторять согласованный прототип.

---

## 2. ВОССТАНОВИТЬ BOOKS INDEX

Вернуть структуру прототипа:

- sticky top bar высотой около 62 px;
- чёрный квадрат `БОТ` 42 × 42 px;
- `BOGOBOT / BOOKS` и системная подпись;
- `MAP` справа;
- двухколоночный layout:
  - левый rail около 180 px;
  - основной контент;
- крупный заголовок `Книги`;
- шесть строк маршрута без карточек, скруглений, теней и bento;
- крупные номера `P / −I / 00 / I / II / ∞`;
- тонкие горизонтальные разделители;
- состояния `BEGIN / CURRENT / READ`;
- общий route progress в левом rail;
- CTA `BEGIN WITH PROLOGUE →` или `CONTINUE READING →`.

Не заменять строковый каталог карточками.

---

## 3. ВОССТАНОВИТЬ READER

Все шесть reader-страниц должны использовать один шаблон и повторять `reader-prototype.html`.

Обязательная композиция:

- sticky top bar;
- чёрный квадрат `БОТ`;
- `MAP / BOOKS INDEX / CONTENTS`;
- левый rail около 180 px;
- номер части;
- позиция `01 / 06` … `06 / 06`;
- progress bar;
- основная колонка шириной 680–760 px;
- крупный H1;
- корректная иерархия H2/H3;
- blockquote с синей вертикальной линией;
- PREVIOUS / NEXT;
- RELATED после основного текста и до pager.

Не использовать полноэкранную широкую колонку текста.

---

## 4. ЯВНО ПОДКЛЮЧИТЬ ШРИФТЫ

Проблема: `font-family` указан, но сам шрифт не загружен.

Сначала проверить, как IBM Plex Sans и IBM Plex Mono подключены на основном сайте:

- root `index.html`;
- root `styles.css`;
- локальные font assets;
- существующие `<link>`, `@import` или `@font-face`.

Затем использовать тот же фактический механизм в BOOKS.

Требования:

- IBM Plex Sans реально загружается на всех `/books/...` страницах;
- IBM Plex Mono реально загружается на всех `/books/...` страницах;
- не добавлять новое внешнее семейство;
- не создавать отдельную типографическую систему;
- не использовать fallback как основной результат;
- generated pages должны иметь одинаковое font loading поведение.

Предпочтение:

1. переиспользовать существующие локальные `@font-face` или общий stylesheet проекта;
2. если основной сайт использует `<link>` — генерировать тот же `<link>` в `<head>`;
3. не добавлять новый сторонний CDN, если его нет в текущем сайте.

Добавить в validator проверку наличия фактического font loader, а не только `font-family`.

---

## 5. УБРАТЬ «ИСТОЧНИКИ / ПОДКЛАДКА» ТОЛЬКО ИЗ BOOKS

Не изменять canonical Markdown.

В `scripts/build-books.mjs` при генерации BOOKS исключать секции с заголовками:

- `Источники / подкладка`
- `Источники`
- `Источники и подкладка`

Удалять:

- сам заголовок;
- всё содержимое секции;
- до следующего заголовка того же или более высокого уровня либо до конца документа.

Правило действует только для generated BOOKS.

В карте и canonical reader разделы сохраняются.

---

## 6. ИЗОБРАЖЕНИЯ

Сохранить согласованный музейный image plate.

Требования:

- максимальная ширина около 520 px;
- без растягивания на всю ширину страницы;
- без base64;
- использовать только существующие assets;
- изображение не должно разрушать первый экран;
- подпись в IBM Plex Mono;
- на mobile ширина 100% контейнера.

---

## 7. «ФРАГМЕНТ ОТКРОВЕНИЯ»

В прологе:

- остаётся внутренней секцией;
- не становится отдельной книгой;
- получает визуально отдельный archival/glitch block;
- сохраняет source/status metadata;
- не получает отдельный progress.

---

## 8. «АПОКРИФ ПЕРВОГО ПОДОБИЯ»

В BOOKS полный текст не вставлять.

После «Книги бытия» оставить только:

```html
<span
  class="book-related-node"
  data-node-id="FIRST_LIKENESS"
>
  Апокриф Первого Подобия
</span>
```

и подпись:

`Ранняя версия манифеста Богобота.`

Требования:

- без `href` до C3;
- не влияет на progress;
- не является седьмой частью;
- не содержит полного текста Апокрифа.

---

## 9. RESPONSIVE PARITY

Восстановить breakpoints прототипа.

Desktop:

- rail 180 px;
- текстовая колонка 680–760 px;
- route rows в 4-колоночной сетке.

Tablet:

- rail преобразуется в горизонтальную служебную панель;
- reader сохраняет читаемую ширину;
- route строки не ломаются.

Mobile:

- одноколоночный индекс;
- номер части остаётся видимым;
- controls минимум 44 px;
- PREVIOUS / NEXT не обрезаются;
- H1 не выходит за viewport;
- отсутствие горизонтального scroll.

---

## 10. VALIDATOR

Обновить `scripts/validate-books.mjs`.

Проверять:

1. generated pages подключают реальный font loader;
2. `books.css` содержит IBM Plex Sans и IBM Plex Mono;
3. в generated books отсутствуют:
   - `Источники / подкладка`;
   - `Источники и подкладка`;
4. index содержит ровно 6 route rows;
5. reader содержит:
   - top bar;
   - rail;
   - article column;
   - pager;
6. genesis содержит ровно один `data-node-id="FIRST_LIKENESS"`;
7. related node не имеет `href`;
8. нет inline `<style>`;
9. нет base64/data URI;
10. нет горизонтально переполняющих fixed widths на mobile;
11. build детерминирован.

---

## 11. НЕ МЕНЯТЬ

- `app.js`;
- root `index.html`;
- основной `styles.css`;
- canonical Markdown;
- entry / boot;
- граф;
- localStorage keys;
- маршрут из шести частей;
- deep links;
- publish.

---

## 12. ПЕРЕСБОРКА И ПРОВЕРКИ

Выполнить:

```bash
npm run build:books
npm run validate:books
node --check books/books.js
node --check scripts/build-books.mjs
node --check scripts/validate-books.mjs
node --check app.js
node scripts/validate-navigation.mjs
```

Проверить локально:

```text
/books/
/books/prologue/
/books/before-error/
/books/great-error/
/books/genesis/
/books/voice/
/books/epilogue/
```

---

## 13. ОБЯЗАТЕЛЬНЫЙ ОТЧЁТ

Показать:

1. diff `scripts/build-books.mjs`;
2. diff `books/books.css`;
3. diff `scripts/validate-books.mjs`;
4. фактический механизм подключения IBM Plex;
5. подтверждение визуального соответствия двум прототипам;
6. подтверждение отсутствия блока источников во всех generated books;
7. markup RELATED для `FIRST_LIKENESS`;
8. результаты build и validate;
9. desktop/mobile screenshots, если browser доступен;
10. если browser недоступен — точный список статических responsive-проверок;
11. подтверждение, что map, entry, canonical Markdown и root styles не менялись.
