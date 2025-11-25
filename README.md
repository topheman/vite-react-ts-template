# vite-react-ts-template

This is a starter template for frontend projects. It includes a robust set of features I've been using in my own [projects](https://topheman.github.io/me/).

## Features

- **Modern frontend stack**:
  - React 19 (with react-compiler)
  - Vite 7
  - TypeScript 5.9
  - Tailwind CSS 4
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint with:
  - Prettier configured as a plugin
  - Better Tailwind CSS integration
  - Testing Library integration
  - Import plugin
- **Format on save**
- **Git hooks**: Husky / Lint-staged
  - Pre-commit hook to run linting, type checking and tests

## Getting started

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the project
- `npm run preview`: Preview the project
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint errors
- `npm run test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run typecheck`: Run type checking

## Deploy

This template is configured to deploy to GitHub Pages when you push to the `master` branch.

To enable this, on GitHub, in your repository settings, go to "Pages" and switch to "GitHub Actions" as the source.

You can customize the deployment by editing the [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) file.
