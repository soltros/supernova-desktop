"""Enable background audio in the generated Capacitor iOS project."""

import plistlib
from pathlib import Path

app = Path(__file__).resolve().parents[1] / "ios" / "App" / "App"
info_path = app / "Info.plist"
info = plistlib.loads(info_path.read_bytes())
modes = info.setdefault("UIBackgroundModes", [])
if "audio" not in modes:
    modes.append("audio")
info_path.write_bytes(plistlib.dumps(info, sort_keys=False))

delegate_path = app / "AppDelegate.swift"
delegate = delegate_path.read_text()
if "import AVFAudio" not in delegate:
    marker = "// Override point for customization after application launch."
    if marker not in delegate:
        raise SystemExit("Capacitor AppDelegate changed. Check the audio setup.")
    delegate = delegate.replace("import UIKit", "import AVFAudio\nimport UIKit", 1)
    delegate = delegate.replace(
        marker,
        """do {
            try AVAudioSession.sharedInstance().setCategory(.playback)
        } catch {
            NSLog("Supernova could not configure the playback audio session: %@", String(describing: error))
        }""",
        1,
    )
    delegate_path.write_text(delegate)
