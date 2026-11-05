# Weather & Outfit

A static weather forecast and outfit suggester. Search for a city or use your location to see current conditions, the next 12 hours, a 7-day forecast, and clothing suggestions that change with temperature, rain, wind, and UV.

Weather data comes from the [Open-Meteo](https://open-meteo.com/) forecast and geocoding APIs, called directly from the browser. Nothing is stored on a server.

The site is published with GitHub Pages from the workflow in `.github/workflows/pages.yml`.

## Living scenery and characters

Choose Skye, Kai, Men, or Women for seven weather-specific wardrobes. Recommendations follow the selected character's illustrated clothes. Clouds, sun, moon, stars, rain and snow respond to the selected forecast; night colors follow sunrise and sunset. A Motion control pauses scenery and character animation. Device reduced-motion settings are respected, hidden tabs pause animation, and off-screen portraits pause to conserve resources.

Character and animation preferences are saved only in this browser's localStorage. Weather data still comes directly from Open-Meteo; no server-side accounts or storage were added.

The portrait keeps a width-based aspect ratio and forecast controls stay mounted, preserving the mobile scroll fix.

## Checks

Run `node tests/outfit-bands.mjs` for forecast/outfit logic. With Playwright and Chromium installed, `node tests/scroll-stability.cjs` checks scroll behavior and `node tests/weather-scene.cjs` checks character artwork, forecast scenes, motion controls and reduced motion.

