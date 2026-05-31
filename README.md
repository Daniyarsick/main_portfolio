# Портфолио Аннанурова Даниила

Статический сайт-портфолио с учебными материалами по курсам.

Сайт на GitHub Pages: https://daniyarsick.github.io/main_portfolio/

## Обновление материалов

1. Добавить новые файлы в нужную папку курса.
2. Обновить индекс файлов:

```bash
python generate_index.py
```

3. Проверить изменения локально и сделать commit/push в `main`.

## Локальный запуск через Docker

Можно скачать папку проекта или клонировать репозиторий и поднять сайт локально в Docker:

```bash
docker compose up --build
```

После запуска сайт будет доступен по адресу:

```text
http://localhost:8080
```

Остановить контейнер:

```bash
docker compose down
```

Docker-образ использует `nginx:alpine` и раздает статические файлы из корня проекта. Все страницы, стили, скрипты, фото и материалы курсов копируются внутрь контейнера при сборке.

## GitHub Pages

Деплой выполняется через GitHub Actions, а не через стандартный `Deploy from branch`. Это нужно потому, что PDF-файлы хранятся через Git LFS, а GitHub Pages не публикует LFS-файлы напрямую при branch deploy. Workflow делает checkout с `lfs: true` и загружает корень репозитория как Pages artifact.

В настройках репозитория нужно выбрать:

- Settings -> Pages -> Source: `GitHub Actions`
- Branch deploy не использовать для этого сайта
