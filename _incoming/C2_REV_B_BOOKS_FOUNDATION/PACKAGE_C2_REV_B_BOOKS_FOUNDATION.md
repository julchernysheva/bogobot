# PACKAGE C2 REV B — BOOKS FOUNDATION

WORKDIR:
`/Users/julia.chernysheva/Documents/Codex/2026-06-20/z/work/bogobot-static`

REQUIRED BASELINE:
`PACKAGE C1.3 IMPLEMENTED — REVELATION CANON PASS`

## ЦЕЛЬ

Создать production-ready раздел BOOKS:

- BOOKS INDEX;
- единый reader;
- статическую генерацию из canonical Markdown;
- общий CSS и JS;
- прогресс чтения;
- шесть частей;
- внутренний «Фрагмент Откровения» в прологе;
- необязательный RELATED на `FIRST_LIKENESS` после «Книги бытия».

Полный Апокриф в BOOKS не включать.

## 1. BASELINE CHECK

Перед работой проверить:

- пролог содержит `## Фрагмент Откровения`;
- `FIRST_LIKENESS` использует canonical Markdown;
- C1.3 validators проходят;
- registry/graph/page-only соответствуют отчёту C1.3.

При расхождении остановиться.

## 2. СТРУКТУРА

Создать:

```text
books/
  index.html
  books.css
  books.js
  manifest.json
  prologue/index.html
  before-error/index.html
  great-error/index.html
  genesis/index.html
  voice/index.html
  epilogue/index.html

scripts/
  build-books.mjs
  validate-books.mjs
```

Все HTML в `books/` — generated output.

## 3. MANIFEST

Создать `books/manifest.json` на основе:

`books-manifest.proposed.json`

Маршрут строго:

```text
P → −I → 00 → I → II → ∞
```

Не добавлять `FIRST_LIKENESS` как route item.

## 4. BUILD

`build-books.mjs` должен читать canonical Markdown и генерировать index + 6 reader pages.

Поддержать:

- frontmatter removal;
- H1 extraction;
- stable anchors;
- paragraphs;
- strong/emphasis;
- code/fenced code;
- blockquotes;
- lists;
- horizontal rules;
- tables;
- wiki links;
- HTML escaping;
- deterministic output;
- source SHA-256 metadata.

## 5. ФРАГМЕНТ ОТКРОВЕНИЯ

На странице пролога секция:

```text
## Фрагмент Откровения
```

рендерится внутри того же документа.

Оформить как архивную интерлюдию:

- mono/glitch voice;
- source/status metadata;
- без отдельного pager item;
- без отдельного progress record;
- без отдельного BOOKS INDEX row.

## 6. RELATED ПОСЛЕ «КНИГИ БЫТИЯ»

После основного текста и до PREVIOUS/NEXT вывести:

```text
ДОПОЛНИТЕЛЬНОЕ ЧТЕНИЕ
Апокриф Первого Подобия
Ранняя версия манифеста Богобота
```

В C2 это не ссылка:

```html
<span
  class="book-related-node"
  data-node-id="FIRST_LIKENESS"
>
```

Требования:

- не иметь `href`;
- не открывать главную карту;
- не влиять на progress;
- не вставлять полный текст Апокрифа;
- сохранить `data-node-id` для C3.

## 7. WIKI LINKS

До C3 wiki links рендерятся как текстовые crossrefs без ложного href:

```html
<span class="book-crossref" data-wiki-slug="slug">Label</span>
```

## 8. INDEX И READER

BOOKS INDEX:

- 6 строк;
- BEGIN/CURRENT/READ;
- route progress;
- BEGIN WITH PROLOGUE / CONTINUE READING;
- без карточек.

Reader:

- MAP;
- BOOKS INDEX;
- CONTENTS;
- номер части;
- позиция 01/06–06/06;
- CANONICAL TEXT;
- одна текстовая колонка;
- PREVIOUS/NEXT;
- reading + route progress.

## 9. PROGRESS

Использовать существующий ключ:

```text
bogobot.books.route.v1
```

Не сбрасывать старые данные.

«Фрагмент Откровения» не получает отдельной записи.

`FIRST_LIKENESS` не получает отдельной записи и не влияет на завершение маршрута.

## 10. ASSETS И CSS

- один `books.css`;
- один `books.js`;
- только существующие assets;
- никаких base64/data URI;
- никаких копий изображений;
- reduced-motion;
- focus-visible;
- mobile controls минимум 44px;
- print rules.

## 11. VALIDATOR

Проверять:

- ровно 6 route items;
- порядок P/−I/00/I/II/∞;
- все sources существуют;
- generated pages существуют;
- source SHA совпадает;
- нет data URI и inline style blocks;
- нет route item `FIRST_LIKENESS`;
- на genesis есть ровно один `data-node-id="FIRST_LIKENESS"`;
- related элемент не имеет href;
- пролог содержит `fragment-otkroveniya`;
- PREVIOUS/NEXT корректны;
- generated output детерминирован.

## 12. PACKAGE.JSON

Добавить:

```json
{
  "build:books": "node scripts/build-books.mjs",
  "validate:books": "node scripts/validate-books.mjs"
}
```

Существующие scripts не удалять.

## 13. ДОКУМЕНТАЦИЯ

Обновить README и docs:

- BOOKS = 6 частей;
- «Фрагмент Откровения» = интерлюдия пролога;
- `FIRST_LIKENESS` = optional related node;
- deep links будут реализованы в C3;
- entry и карта пока не интегрированы.

## 14. ПРОВЕРКИ

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

Проверить desktop/mobile и старый progress без очистки localStorage.

## 15. НЕ ДЕЛАТЬ

- не менять `app.js`;
- не менять root `index.html`;
- не менять основной `styles.css`;
- не менять canonical Markdown;
- не менять entry/boot;
- не добавлять BOOKS в карту;
- не реализовывать deep links;
- не включать полный Апокриф в BOOKS;
- не публиковать.

## 16. ОТЧЁТ

Показать:

1. созданные/изменённые файлы;
2. manifest;
3. 6-item route;
4. результаты build/validator;
5. genesis RELATED markup;
6. подтверждение, что полного Апокрифа в generated books нет;
7. desktop/mobile checks;
8. сохранность старого progress;
9. подтверждение, что map/entry/canonical Markdown не менялись.
