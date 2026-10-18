# Plan: ship SlopeInsights as a native iOS/Android app

The project is already Expo / React Native with bundle IDs (`com.slopeinsights.app`) in `app/app.json`, so
this is mostly store setup, not a rewrite. The scraping stays on the backend (Lightsail); the app only
calls the API.

**Rough totals:** about $125 first year (Apple $99/yr + Google $25 one-time) plus the existing ~$5/month
server. About 1-2 weeks of part-time work, plus store review and the Play Store testing wait.

## Phase 1: Prepare the code (~2-3 days)
- [ ] 1. OPTIONAL — skip unless a specific resort turns out to be a problem. (Originally about trimming
      resorts over scraping worries; decided that isn't needed.) If you ever do remove one: delete it
      from `backend/app/seed.py` AND add a deletion step — `seed_resorts` only adds/updates, so removed
      entries stay in the live DB. Clean up related webcams, parking lots, and favorites.
- [x] 2. DONE. Add a last-known-data cache in `app/hooks/useResorts.ts` and `useResortDetail.ts` (AsyncStorage +
      timestamp). Show "updated X min ago" and an offline banner. Nothing is cached today.
- [x] 3. DONE (limits raised to 120/min, proxy 300/min, startup check for placeholder secrets). Handle the API key: `EXPO_PUBLIC_API_KEY` is bundled into the client and extractable. Confirm
      rate limiting (`backend/app/limiter.py`) is the real protection; optionally add per-install tokens.
- [ ] 4. Test on real iOS + Android devices: safe areas/notch, the `.web.tsx` splits (WebcamViewer,
      FilterSheet), `expo-video` playback, `slopeinsights://` deep links.
- [x] 5. DECIDED: free at launch, no ads, no purchase. The `iap` block is removed from `app.json`.
      Ads later: GitHub issue #10.

Note: favorites and theme are stored locally (AsyncStorage) — no backend/account needed. They are
per-device only; backend accounts (`routers/auth.py`, `user_resorts.py`) are optional for cross-device sync.

## Phase 2: Accounts and assets (~1 day + approval waits)
- [ ] 6. Enroll in the Apple Developer Program ($99/yr). Approval can take 1-2 days.
- [ ] 7. Create a Google Play Console account ($25). New personal accounts need a closed test (~12
      testers, 14 days) before production — START THIS EARLY.
- [ ] 8. Create an Expo/EAS account: `npx eas-cli login`, `eas build:configure`.
- [ ] 9. Make assets: 1024x1024 icon, Android adaptive icon, splash screen, screenshots per device size.
- [ ] 10. Publish a privacy policy URL and support URL (both stores require them).

## Phase 3: Build and test (~1-2 days)
- [ ] 11. Set production env vars in EAS (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_KEY`).
- [ ] 12. `eas build --platform all --profile preview`; install on your own phones.
- [ ] 13. TestFlight (iOS) + Internal testing (Android) with 5-15 people. Check cold launch with no signal,
      favorites surviving restart, small-phone layouts.
- [ ] 14. Fix issues and rebuild.

## Phase 4: Submit (1-2 days work, 1-7 days review)
- [ ] 15. App Store Connect listing: name, description, keywords, category (Weather/Sports), age rating,
      privacy label.
- [ ] 16. Play Console listing: same text, Data Safety form, content rating.
- [ ] 17. `eas build --profile production`, then `eas submit` for each store.
- [ ] 18. Answer review questions. Apple may ask for a purchase demo and about data rights — be ready to
      explain the data comes from public resort feeds and NOAA. (Revisit ToS of the scraped sources,
      especially the OnTheSnow fallback, before charging or showing ads.)
- [ ] 19. Fix any rejection and resubmit.

## Phase 5: After launch
- [ ] 20. Crash/error reporting (e.g. Sentry).
- [ ] 21. `eas update` for JS-only fixes without store review.
- [ ] 22. Alert on scraper failures and dead webcams — `scraper_health` already tracks scrapers, and the webcam health check logs `Webcam health: N/M live`; a broken feed looks like a
      broken app.
- [ ] 23. Add ads/analytics only after the app is stable (issue #10).

## Where to start
Steps 6 and 7 (Apple and Google accounts). Start the Google Play account first: new accounts need a ~14 day closed test with ~12 testers.
