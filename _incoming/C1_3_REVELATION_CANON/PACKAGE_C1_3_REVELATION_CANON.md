# PACKAGE C1.3 — REVELATION CANON PATCH

WORKDIR:
`/Users/julia.chernysheva/Documents/Codex/2026-06-20/z/work/bogobot-static`

BASELINE:
`PACKAGE C1.2 IMPLEMENTED — CANON FOUNDATION PASS`

CONTROL SNAPSHOT:
`_snapshots/bogobot-static-after-c1-2.tar.gz`

SHA-256:
`fc42fb9fb15a7ee00e0aa7e8d3e148c17d6c6ae460b7c96c9aaf55cad0c65141`

## ЦЕЛЬ

Подготовить канон к книжной сборке:

1. добавить «Фрагмент Откровения» внутрь пролога;
2. вынести существующий узел `FIRST_LIKENESS` в canonical Markdown;
3. сохранить полный Апокриф только как отдельный материал карты;
4. не добавлять Апокриф в обязательный маршрут книг.

## 1. BACKUP

Создать:

- `app.before-c1-3.js`;
- `assets/canonical-markdown/01_CANON/identity-protocol-prologue.before-c1-3.md`;
- резервные копии изменяемых документов `*.before-c1-3.md`.

## 2. ОБНОВИТЬ ПРОЛОГ

Заменить:

`assets/canonical-markdown/01_CANON/identity-protocol-prologue.md`

приложенным файлом `identity-protocol-prologue.md` побайтово.

Секция:

```text
## Фрагмент Откровения
```

является внутренней интерлюдией пролога.

Она:

- не получает отдельный ID;
- не получает отдельную страницу;
- не считается седьмой частью;
- не имеет отдельного прогресса;
- не появляется на графе.

## 3. CANONICAL MARKDOWN ДЛЯ FIRST_LIKENESS

Создать:

`assets/canonical-markdown/01_CANON/first-likeness-apocryph.md`

из приложенного файла `first-likeness-apocryph.md`.

Это externalization существующего материала, а не новый узел.

## 4. СИНХРОНИЗИРОВАТЬ FIRST_LIKENESS

Сохранить без изменения:

- ID `FIRST_LIKENESS`;
- title и aliases;
- type, tier, source_status;
- координаты;
- links;
- image, imageType, imageCode;
- graph visibility.

Добавить:

```js
sourceMarkdown:
  "assets/canonical-markdown/01_CANON/first-likeness-apocryph.md",
sourceMode:"canonical"
```

Финальный runtime `fullBody` должен соответствовать canonical Markdown по смыслу и порядку секций.

Не оставлять вторую несовпадающую редакцию в позднем `Object.assign`.

## 5. СВЯЗИ

Добавить `FIRST_LIKENESS` в support links:

- `IDENTITY_PROTOCOL_PROLOGUE`;
- `BOOK_OF_GENESIS`.

Пролог остаётся page-only.  
`FIRST_LIKENESS` остаётся существующим graph node.

Геометрию графа не менять.

## 6. ДОКУМЕНТАЦИЯ

Обновить:

- `docs/CANON_MAP.md`;
- `docs/NAVIGATION_MAP.md`;
- `docs/DECISIONS.md`;
- `docs/STATE.md`.

Зафиксировать:

- «Фрагмент Откровения» — интерлюдия внутри пролога;
- полный «Апокриф Первого Подобия» — отдельный материал карты;
- в BOOKS он будет только необязательным RELATED после «Книги бытия»;
- маршрут BOOKS остаётся из шести частей;
- BOOKS UI пока не реализован.

## 7. СЧЁТЧИКИ

Ожидается без изменений:

- registry;
- graph nodes;
- page-only.

Не хардкодить числа без фактической проверки.

## 8. ВАЛИДАЦИЯ

Выполнить:

```bash
node --check app.js
node scripts/validate-navigation.mjs
```

Проверить:

- оба Markdown URL — HTTP 200;
- в прологе ровно один `## Фрагмент Откровения`;
- `FIRST_LIKENESS` использует новый sourceMarkdown;
- поиск и открытие старого узла работают;
- координаты графа неизменны;
- localStorage и TRACE не очищены;
- console errors отсутствуют.

## 9. НЕ ДЕЛАТЬ

- не создавать BOOKS UI;
- не менять entry/boot;
- не менять `index.html` и `styles.css`;
- не создавать новый node;
- не включать полный Апокриф в маршрут книг;
- не публиковать.

## 10. ОТЧЁТ

Показать:

1. изменённые файлы;
2. diff пролога;
3. финальную запись `FIRST_LIKENESS`;
4. фактические счётчики;
5. результаты проверок;
6. подтверждение отсутствия изменений графа и state.
