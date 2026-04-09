# Preview Capture Setup Guide

This guide explains how to configure screenshot capture for the AI iteration feature on different deployment platforms.

## Overview

The AI iteration feature allows the AI to capture screenshots of your website preview to make visual improvements. This requires a headless browser service to render and capture the page.

## Railway Deployment (Recommended)

For Railway and other containerized platforms, we recommend using **Browserless.io** - a hosted headless browser service that requires no heavy browser binaries.

### Option 1: Browserless.io (Recommended for Railway)

1. Sign up at [browserless.io](https://www.browserless.io/)
2. Get your API token from the dashboard
3. Add the environment variable to Railway:
   ```
   BROWSERLESS_TOKEN=your_token_here
   ```

**Pricing**: Browserless offers a generous free tier (6 hours/month) and affordable paid plans.

### Option 2: External Screenshot API

If you prefer not to use Browserless, you can use a screenshot API service:

1. Sign up at [screenshotapi.net](https://screenshotapi.net/) or similar
2. Get your API key
3. Add the environment variable:
   ```
   SCREENSHOT_API_KEY=your_key_here
   ```

### Option 3: Self-Hosted Browserless on Railway

You can also deploy Browserless yourself on Railway:

1. Create a new service from the Browserless Docker image:
   ```
   ghcr.io/browserless/chromium:latest
   ```
2. Set environment variables:
   ```
   PORT=3000
   TOKEN=your_secret_token
   ```
3. Add the internal Railway URL to your main app:
   ```
   BROWSERLESS_TOKEN=your_secret_token
   BROWSERLESS_URL=your-browserless-service.railway.app
   ```

## Local Development

For local development, Playwright will be used automatically (no additional setup needed if you already have it installed).

```bash
# Playwright browsers will be used automatically
# Make sure you have the browsers installed:
npx playwright install chromium
```

## Environment Variables Reference

| Variable | Required For | Description |
|----------|--------------|-------------|
| `BROWSERLESS_TOKEN` | Browserless.io | Your Browserless.io API token |
| `BROWSERLESS_URL` | Self-hosted | Custom Browserless URL (optional) |
| `SCREENSHOT_API_KEY` | External API | API key for screenshot service |
| `PLAYWRIGHT_CHROMIUM_PATH` | Local dev | Path to Chromium executable |
| `PLAYWRIGHT_BROWSERS_PATH` | Local dev | Path to Playwright browsers |

## Priority Order

The system will use the first available capture method in this order:

1. **Browserless.io** (if `BROWSERLESS_TOKEN` is set) - Best for Railway
2. **External Screenshot API** (if `SCREENSHOT_API_KEY` is set) - Alternative cloud option
3. **Local Playwright** (fallback) - For local development only

## Troubleshooting

### "No browser available" error on Railway
- Make sure you've set `BROWSERLESS_TOKEN` or `SCREENSHOT_API_KEY`
- Playwright with full Chromium won't work on Railway without significant configuration

### Screenshots are blank or timeout
- Ensure your preview URL is publicly accessible
- Check that your deployment is actually running
- Try increasing the `delayMs` parameter for slower-loading pages

### Browserless connection errors
- Verify your token is correct
- Check Browserless.io status page
- Ensure you're using the correct WebSocket endpoint

## Alternative: Skip Server-Side Capture

If you don't want to use any external service, you can modify the implementation to use client-side capture from the WebContainer preview. This would require:

1. Adding a client-side screenshot API endpoint
2. Capturing from the preview iframe in the browser
3. Uploading directly from the client to Convex

This approach has limitations (can't capture when user is offline, CORS issues) but requires no external services.
