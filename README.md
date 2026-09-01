# AI Article Generator

A lightweight front-end app for generating full articles from a topic using an n8n webhook.

## Features

- Topic-based article generation
- Customizable output options:
  - Length
  - Tone
  - Audience
  - Language
- Loading, empty, and error states
- Recent topics list (last 5)
- Copy-to-clipboard and `.txt` download actions

## Project Structure

- `/home/runner/work/article-workflow-automation/article-workflow-automation/index.html` – app layout and UI structure
- `/home/runner/work/article-workflow-automation/article-workflow-automation/styles.css` – styling, layout, and responsive behavior
- `/home/runner/work/article-workflow-automation/article-workflow-automation/script.js` – form handling, webhook call, rendering, and interactions

## Getting Started

1. Clone this repository.
2. Open `/home/runner/work/article-workflow-automation/article-workflow-automation/script.js`.
3. Update `WEBHOOK_URL` with your n8n production webhook endpoint.
4. Open `/home/runner/work/article-workflow-automation/article-workflow-automation/index.html` in your browser.

## Usage

1. Enter a topic.
2. Choose length, tone, audience, and language.
3. Click **Generate Article** (or use `Ctrl/Cmd + Enter`).
4. Review the generated article, then copy or download it.

## Notes

- The app is static and requires no build step.
- The webhook is expected to return JSON with an `article` field.

