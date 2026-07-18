# AirPods Ear Sensor (Android 4.4 / API 19 build)

A minimal, from-scratch clone of the idea behind
[OpenPods](https://github.com/adolfintel/OpenPods): passively listen for the
BLE "Proximity Pairing" advertisement that AirPods broadcast constantly, and
use it to detect in-ear/in-case status - **no pairing-as-Apple-device, no
root, no L2CAP/AAP protocol needed.**

This is intentionally scoped down to *only* the ear-detection feature, built
against `minSdkVersion 19` so it can actually run on your phone, using the
old `BluetoothAdapter.startLeScan()` API (available since API 18) instead of
the modern `BluetoothLeScanner` (API 21+).

## How it works

1. `AirPodsScanService` starts a classic BLE scan.
2. For every advertisement received, it looks for "Manufacturer Specific
   Data" (AD type `0xFF`) whose company ID is `0x004C` (Apple).
3. `AirPodsAdvertisement.parse()` decodes the fixed fields (model, status
   byte, approximate battery) per the layout documented in the academic
   paper *"Discontinued Privacy: Personal Data Leaks in Apple
   Bluetooth-Low-Energy Continuity Protocols"* (Celosia & Cunche, PoPETS
   2020) and cross-checked against the open-source LibrePods project.
4. `MainActivity` shows you the raw status byte live so **you calibrate
   which bit means "in ear" for your specific AirPods**, since the exact
   bit mapping has been reported to vary slightly by model/firmware and I
   can't verify it against real hardware from here.
5. Once calibrated, ticking "Auto pause/play" makes the service dispatch a
   standard `KEYCODE_MEDIA_PAUSE` / `KEYCODE_MEDIA_PLAY` event through
   `AudioManager` - the same mechanism your headset's physical buttons use,
   so it should work with most music/podcast apps without needing to
   integrate with each one individually.

## How to calibrate (do this first, every time you try a different pod)

1. Install the app (see build steps below), open it, tap **Start
   scanning**, make sure your phone's Bluetooth is on and the AirPods are
   nearby (paired to any device or not - doesn't matter for this).
2. Put both pods in your ears. Note the `status byte` hex value shown.
3. Take just the left pod out. See which of `bit0x02` / `bit0x08` flips.
4. Put it back in, take the right pod out instead. Confirm the same bit
   flips the other value (or a different bit - that's fine, just note it).
5. Select whichever bit actually changes in the radio buttons under
   "Calibration".
6. Enable "Auto pause/play music", play something, then take a pod out and
   confirm it pauses. If it's backwards (pauses when you put it IN your
   ear), tick "Invert".

## Building it

You'll need Android Studio (any reasonably recent version handles old
`minSdkVersion` projects fine) or the command line:

```bash
cd AirPodsEarSensor
./gradlew assembleDebug
# APK will be at app/build/outputs/apk/debug/app-debug.apk
```

Then `adb install app-debug.apk`, or copy the APK to the phone and install
it directly (you'll need to allow "unknown sources" on Android 4.4, found
under Settings > Security).

## Known limitations / things that may need fixing on real hardware

- **Bit mapping is unverified against real AirPods** - that's what the
  calibration screen is for. I built this from published reverse-engineering
  docs, not from testing against your specific pair.
- **BLE stack quality on Android 4.4 devices varies a lot by OEM.** Some
  budget phones from that era had flaky/incomplete BLE support even though
  the API existed. If scanning finds nothing, that's the first thing to
  suspect - try leaving the AirPods case open near the phone, since the
  case itself also broadcasts these messages.
- **Multiple AirPods nearby** (e.g. in a public place) will all show up;
  this build doesn't filter by MAC address yet. If that's a problem for
  you, we can add a "lock to this address" option pretty easily since the
  advertisement's Bluetooth address is already being read.
- **No foreground service / persistent notification** - Android 4.4 doesn't
  require one for background services to keep running the way later
  versions do, but the OS may still kill it under memory pressure. If you
  find it stops scanning after a while, that's the next thing to address
  (e.g. restart on `BOOT_COMPLETED` / a screen-on receiver).
- Battery percentages are approximate per the spec ("have seen >100%") -
  don't rely on them for anything precise.
