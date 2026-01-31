# Contributing to Solari

Thank you for your interest in contributing to Solari! This project is open source to allow the community to help improve the best Discord Rich Presence client.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone** your fork locally.
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the app in development mode:
    ```bash
    npm run dev
    ```

## Code Style

-   We use **Vanilla JS** (ES6+) for both Main and Renderer processes.
-   **CSS** is plain (no preprocessors) with a focus on modern CSS variables and flexbox/grid.
-   Keep code readable and comment on complex sections.

## Translations

We welcome new translations!
To add a language:
1.  Go to `src/renderer/locales/`.
2.  Duplicate `en.json`.
3.  Rename it to your locale code (e.g., `es.json`).
4.  Translate the values (do not change keys).
5.  Submit a Pull Request.

## Reporting Bugs

Please check existing issues before ensuring your bug hasn't been reported.
Provide:
-   Solari Version
-   OS Version
-   Steps to reproduce
-   Expected vs Actual behavior

## License

This project is licensed under the **GPL v2.0**.
