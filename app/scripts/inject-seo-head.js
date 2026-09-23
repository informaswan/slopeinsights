#!/usr/bin/env node
// Injects SEO/AI-crawler metadata into the built web export's index.html.
//
// Why a post-build script and not app/+html.tsx: that's the documented way
// to customize the root document, but it only takes effect under Expo
// Router's "static" web output. This project builds with the default (SPA)
// output instead — needed for the GitHub Pages deploy's single-index.html +
// 404.html fallback trick — so +html.tsx is silently ignored there and Expo
// ships its own bare template (bare <title>SlopeInsights</title>, and a
// noscript that just says "You need to enable JavaScript to run this app.").
// Run this right after `expo export --platform web`.
'use strict';
const fs = require('fs');
const path = require('path');

const DESCRIPTION =
  'SlopeInsights is a free site that shows real-time ski conditions for Epic and Ikon Pass ' +
  'resorts in one place: snow depth and new snowfall, lift status, weather forecasts, ' +
  'parking, and road and traffic cameras for the drive up.';

const TITLE = 'SlopeInsights — Ski Conditions, Weather, Parking & Road Cameras';

const HEAD_TAGS = `<title>${TITLE}</title>
    <meta name="description" content="${DESCRIPTION}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://slopeinsights.com" />
    <meta property="og:site_name" content="SlopeInsights" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="SlopeInsights" />
    <meta name="twitter:description" content="${DESCRIPTION}" />`;

// Google Analytics 4, only when a measurement id is provided at build time
// (GA_MEASUREMENT_ID, e.g. G-ABC123XYZ). Without one, nothing is added — no tracking.
// GA4's built-in "page changes based on browser history events" measurement covers
// this app's client-side navigation, so no per-route code is needed.
const GA_ID = (process.env.GA_MEASUREMENT_ID || '').trim();
if (GA_ID && !/^G-[A-Z0-9]+$/.test(GA_ID)) {
  console.error(`inject-seo-head: GA_MEASUREMENT_ID "${GA_ID}" doesn't look like a GA4 id (expected G-XXXXXXXXXX).`);
  process.exit(1);
}
const GA_TAGS = GA_ID
  ? `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    </script>`
  : '';

const NOSCRIPT_FALLBACK = `<h1>SlopeInsights</h1><p>${DESCRIPTION}</p>`;

const distPath = path.resolve(__dirname, '../dist/index.html');
let html = fs.readFileSync(distPath, 'utf8');

if (!html.includes('<title>SlopeInsights</title>')) {
  console.error(
    'inject-seo-head: expected placeholder <title>SlopeInsights</title> not found in dist/index.html — ' +
    "Expo's default web template may have changed shape. Check the file by hand before relying on this script."
  );
  process.exit(1);
}
if (!html.includes('You need to enable JavaScript to run this app.')) {
  console.error('inject-seo-head: expected default noscript text not found in dist/index.html — check by hand.');
  process.exit(1);
}

html = html.replace('<title>SlopeInsights</title>', HEAD_TAGS + GA_TAGS);
html = html.replace('You need to enable JavaScript to run this app.', NOSCRIPT_FALLBACK);

fs.writeFileSync(distPath, html);
console.log(`inject-seo-head: wrote title, meta description, Open Graph/Twitter tags, and a real noscript fallback into dist/index.html${GA_ID ? ` (+ Google Analytics ${GA_ID})` : ''}`);
