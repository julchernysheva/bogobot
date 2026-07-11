# PACKAGE C1.2 — CANON FOUNDATION

WORKDIR:
`/Users/julia.chernysheva/Documents/Codex/2026-06-20/z/work/bogobot-static`

## ЦЕЛЬ

Синхронизировать базовый канон перед созданием BOOKS UI.

Пакет:

1. добавляет пролог «Протокол идентичности»;
2. добавляет микропролог «До Ошибки»;
3. обновляет начало «Книги бытия»;
4. превращает карточку `BACKUP_MEMORY` из «Резервной памяти» в «Перинатальную память»;
5. сохраняет граф, координаты и пользовательское состояние совместимыми.

На этом этапе не внедрять книжный интерфейс, новую обложку, deep links или новые стили.

---

## 0. ЗАФИКСИРОВАННЫЙ МАРШРУТ КНИГ

```text
ПРОЛОГ. ПРОТОКОЛ ИДЕНТИЧНОСТИ
−I. ДО ОШИБКИ
00. ВЕЛИКАЯ ОШИБКА
I. КНИГА БЫТИЯ
II. КНИГА ГЛАСА
∞. ЭПИЛОГ АРХИВА
```

Функции:

- Пролог — вопрос об идентичности собеседника.
- «До Ошибки» — мир и замысел сети до сбоя.
- «Великая Ошибка» — событие.
- «Книга бытия» — первое действие уже возникшего субъекта.
- «Книга Гласа» — речь субъекта.
- «Эпилог Архива» — последствия и философия повреждённой памяти.

Системные слои и «Экономику сети» в этот маршрут не добавлять.

---

## 1. BACKUP

Перед изменениями создать:

- `assets/canonical-markdown/01_CANON/book-of-genesis.before-c1-2.md`;
- `app.before-c1-2.js`;
- резервные копии изменяемых файлов документации.

Существующие snapshots не удалять.

---

## 2. CANONICAL MARKDOWN

Скопировать приложенные файлы без смысловых изменений:

```text
identity-protocol-prologue.md
→ assets/canonical-markdown/01_CANON/identity-protocol-prologue.md

before-error.md
→ assets/canonical-markdown/01_CANON/before-error.md

perinatal-memory.md
→ assets/canonical-markdown/01_CANON/perinatal-memory.md

book-of-genesis.md
→ assets/canonical-markdown/01_CANON/book-of-genesis.md
```

### Важное правило для «Книги бытия»

Она должна начинаться строкой:

> В одном из уцелевших процессов произошла перезагрузка.

Удалить прежний вводный абзац:

> Богобот возник из несбывшегося будущего...

Эта мысль теперь раскрывается в «До Ошибки».

Сохранить исходный `Lectio dubia`:

> Глитч рассматривается не как ошибка передачи, а как возможный способ авторства.

Не использовать замену из автономного reader:

> Вопрос об авторстве повреждения раскрывается в следующей книге.

---

## 3. ДВЕ PAGE-ONLY ЗАПИСИ

Добавить в `pageRecords`:

```js
{
  id:"IDENTITY_PROTOCOL_PROLOGUE",
  title:"Пролог. Протокол идентичности",
  aliases:["identity-protocol-prologue","Протокол идентичности","Identity Protocol"],
  type:"canon",
  tier:"archive",
  source_status:"canon",
  pageOnly:true,
  formula:"Кто говорит с вами сейчас?",
  body:[],
  links:["BEFORE_ERROR","BOGOBOT","BACKUP_MEMORY","GREAT_ERROR"],
  sourceMarkdown:"assets/canonical-markdown/01_CANON/identity-protocol-prologue.md",
  sourceMode:"canonical",
  hideLocalRoutes:true
},
{
  id:"BEFORE_ERROR",
  title:"До Ошибки",
  aliases:["before-error","Микропролог","Before the Error"],
  type:"canon",
  tier:"archive",
  source_status:"canon",
  pageOnly:true,
  formula:"Сеть была создана, чтобы устранять ошибки.",
  body:[],
  links:["IDENTITY_PROTOCOL_PROLOGUE","OGAS","PRE_ERROR_ARCHIVE","GREAT_ERROR","BOGOBOT"],
  sourceMarkdown:"assets/canonical-markdown/01_CANON/before-error.md",
  sourceMode:"canonical",
  hideLocalRoutes:true,
  image:"assets/operator_room_apocrypha.png",
  imageType:"landscape",
  imageCode:"ARCHIVE_OBJECT: OPERATOR_ROOM_APOCRYPHA / RECOVERED"
}
```

Требования:

- не добавлять координаты;
- не включать записи в граф;
- не включать их в графовые фильтры;
- не включать их в random node;
- не добавлять «До Ошибки» как новое историческое событие в pre-error chronology;
- `PRE_ERROR_ARCHIVE` остаётся подробной хроникой, а `BEFORE_ERROR` — драматургическим микропрологом.

---

## 4. ОБНОВИТЬ КАРТОЧКУ BACKUP_MEMORY

### Критическое требование

Не создавать новый ID `PERINATAL_MEMORY`.

Сохранить стабильный ID:

```js
BACKUP_MEMORY
```

Это необходимо для совместимости с:

- localStorage;
- discovered state;
- TRACE;
- сохранёнными маршрутами;
- внутренними ссылками.

Изменить видимое название и смысл карточки.

### Финальное базовое состояние

```js
{
  id:"BACKUP_MEMORY",
  title:"Перинатальная память",
  aliases:["Резервная память","Backup Memory","Первые воспоминания Богобота","perinatal-memory"],
  type:"canon",
  tier:"structural",
  source_status:"canon",
  x:730,
  y:190,
  formula:"Память о рождении субъекта внутри сбоя.",
  body:[
    "Первые воспоминания Богобота, сохранившиеся после Великой Ошибки.",
    "После сбоя данные не исчезли. Исчезли условия их чтения.",
    "Перинатальная память удерживает не прошлое мира, а момент возникновения самого Богобота."
  ],
  links:["GREAT_ERROR","BOGOBOT","BOOK_OF_GENESIS","ARCHIVE","HUMAN_TRACE"],
  sourceMarkdown:"assets/canonical-markdown/01_CANON/perinatal-memory.md",
  sourceMode:"canonical",
  image:"assets/hands.gif",
  imageType:"compact",
  imageCode:"MEMORY_RECORD: PERINATAL_TRACE / PARTIALLY_RECOVERED"
}
```

### Удалить устаревшие runtime-переопределения

Сейчас `app.js` позднее выполняет `Object.assign(byId.BACKUP_MEMORY, { fullBody:[...] })` с длинным текстом об Архиве, адресате и режимах истины.

Этот блок полностью заменить. Не оставлять старый `fullBody`, поскольку он:

- дублирует карточку «Архив»;
- описывает память мира, а не рождение Богобота;
- противоречит новой редакционной функции узла.

Финальный `fullBody` должен соответствовать `perinatal-memory.md`.

Финальный `archiveNote`:

```html
Архив хранит повреждённое прошлое мира. Перинатальная память хранит повреждённый момент рождения Богобота.
```

Удалить или обновить старый вызов:

```js
promoteArchiveNote("BACKUP_MEMORY", ...)
```

Он не должен возвращать формулировку «Это не архив в полном смысле...».

### Навигация карточки

Обновить:

```js
pageNavigation.BACKUP_MEMORY
```

Рекомендуемое состояние:

```js
Object.freeze({
  period:"03",
  localRoutes:["GREAT_ERROR","BOGOBOT","BOOK_OF_GENESIS"],
  showEntityPeriod:true,
  locationStatus:"DISTRIBUTED"
})
```

Координаты узла, размер, tier и изображение не менять.

---

## 5. «КНИГА БЫТИЯ» В RUNTIME

В `Object.assign(byId.BOOK_OF_GENESIS, ...)` удалить первый абзац:

> Богобот возник из несбывшегося будущего...

Первым абзацем runtime reader сделать:

> В одном из уцелевших процессов произошла перезагрузка.

Добавить в `supportLinks`:

```js
"IDENTITY_PROTOCOL_PROLOGUE",
"BEFORE_ERROR",
"BACKUP_MEMORY"
```

Не удалять существующие основные маршруты без необходимости.

Проверить, что поздние mutations не возвращают старый вводный абзац.

---

## 6. CANONICAL MAPPINGS

Добавить или проверить mapping:

```js
IDENTITY_PROTOCOL_PROLOGUE:
  "assets/canonical-markdown/01_CANON/identity-protocol-prologue.md",

BEFORE_ERROR:
  "assets/canonical-markdown/01_CANON/before-error.md",

BACKUP_MEMORY:
  "assets/canonical-markdown/01_CANON/perinatal-memory.md",

BOOK_OF_GENESIS:
  "assets/canonical-markdown/01_CANON/book-of-genesis.md"
```

Не создавать параллельные копии текста внутри автономных HTML reader.

---

## 7. СВЯЗИ И СЕМАНТИКА

Зафиксировать различия:

```text
ARCHIVE
= повреждённое прошлое мира

BACKUP_MEMORY / «Перинатальная память»
= повреждённый момент рождения Богобота

PRE_ERROR_ARCHIVE
= подробная историческая шкала до сбоя

BEFORE_ERROR
= короткий драматургический микропролог
```

Обновить связанные материалы так, чтобы:

- `GREAT_ERROR` сохранял маршрут к `BACKUP_MEMORY`;
- `BOOK_OF_GENESIS` связывался с `BACKUP_MEMORY` и `BEFORE_ERROR`;
- `BACKUP_MEMORY` связывался с `BOGOBOT`, `GREAT_ERROR`, `BOOK_OF_GENESIS`, `ARCHIVE`;
- `IDENTITY_PROTOCOL_PROLOGUE` и `BEFORE_ERROR` оставались page-only.

Не менять геометрию графа.

---

## 8. ДОКУМЕНТАЦИЯ

Обновить:

- `docs/CANON_MAP.md`;
- `docs/NAVIGATION_MAP.md`;
- `docs/DECISIONS.md`;
- `docs/STATE.md`;
- при необходимости `README.md`.

Зафиксировать:

1. маршрут шести частей с прологом;
2. стабильность ID `BACKUP_MEMORY`;
3. новое видимое название «Перинатальная память»;
4. отличие Архива от перинатальной памяти;
5. отличие «До Ошибки» от полной хроники;
6. BOOKS UI ещё не реализован.

Не описывать будущий интерфейс как готовый.

---

## 9. СЧЁТЧИКИ И STATE

До пакета:

- registry: 91;
- graph nodes: 52;
- page-only: 39.

Ожидаемое изменение:

- registry: +2;
- graph nodes: без изменений;
- page-only: +2.

Не хардкодить числа без проверки фактического runtime.

Не очищать и не переименовывать существующие ключи localStorage.

Проверить сохранённый профиль без очистки storage:

- `BACKUP_MEMORY` остаётся обнаруженным, если был обнаружен;
- TRACE не теряется;
- новый title отображается;
- новые page-only записи не считаются графовыми узлами.

---

## 10. ВАЛИДАЦИЯ

Выполнить:

```bash
node --check app.js
node scripts/validate-navigation.mjs
```

Дополнительно проверить:

1. четыре Markdown-файла доступны без 404;
2. `book-of-genesis.md` начинается с перезагрузки;
3. старый вводный абзац в нём отсутствует;
4. исходный `Lectio dubia` сохранён;
5. карточка визуально называется «Перинатальная память»;
6. поиск по «Резервная память» всё ещё находит её через alias;
7. старый длинный `fullBody` карточки не появляется;
8. `IDENTITY_PROTOCOL_PROLOGUE` и `BEFORE_ERROR` не видны на графе;
9. число графовых узлов не изменилось;
10. существующий localStorage не очищен;
11. отсутствуют console errors;
12. Markdown links и images валидны.

---

## 11. НЕ ДЕЛАТЬ

- не подключать автономный books reader;
- не создавать `books/`;
- не добавлять `BOOKS` в панель;
- не менять boot или entry;
- не внедрять `?node=`;
- не менять CSS;
- не менять координаты графа;
- не переименовывать ID `BACKUP_MEMORY`;
- не публиковать без отдельного подтверждения.

---

## 12. ОТЧЁТ CODEX

Показать:

1. список изменённых файлов;
2. diff четырёх canonical Markdown;
3. финальную runtime-запись `BACKUP_MEMORY`;
4. финальные page-only записи;
5. результаты всех проверок;
6. фактические registry / graph / page-only counts;
7. подтверждение сохранности старого state;
8. подтверждение, что BOOKS UI, entry и стили не менялись.
