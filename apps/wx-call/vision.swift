import AppKit
import Vision

// Local OCR only. No screenshots leave this computer.
func fail(_ message: String) -> Never {
    fputs(message + "\n", stderr)
    exit(1)
}
let args = CommandLine.arguments
guard args.count >= 3, let data = try? Data(contentsOf: URL(fileURLWithPath: args[2])),
      let bitmap = NSBitmapImageRep(data: data),
      let image = bitmap.cgImage else { fail("usage: vision <text|find|state> image [text x y width height]") }
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: image).perform([request])
let observations = request.results ?? []
let rows = observations.compactMap { observation -> (String, CGRect)? in
    guard let text = observation.topCandidates(1).first?.string else { return nil }
    let b = observation.boundingBox
    return (text, CGRect(x: b.minX, y: 1 - b.maxY, width: b.width, height: b.height))
}
func compact(_ text: String) -> String { text.filter { !$0.isWhitespace } }
switch args[1] {
case "text":
    for (text, _) in rows { print(text) }
case "find":
    guard args.count == 8, let x = Double(args[4]), let y = Double(args[5]),
          let w = Double(args[6]), let h = Double(args[7]) else { fail("find requires text and normalized ROI") }
    let region = CGRect(x: x, y: y, width: w, height: h)
    let matches = rows.filter { compact($0.0) == compact(args[3]) && region.contains(CGPoint(x: $0.1.midX, y: $0.1.midY)) }
    guard matches.count == 1 else { fail("Expected one visible exact match for \(args[3]); found \(matches.count)") }
    print("\(matches[0].1.midX),\(matches[0].1.midY)")
case "state":
    // This profile is calibrated for WeChat's 600 × 487 two-person call window.
    let text = rows.map { compact($0.0) }.joined(separator: "\n")
    if text.contains("无应答") || text.contains("未接听") || text.contains("已拒绝") {
        print("unanswered")
    } else if text.contains("对方已接听") || text.contains("通话中") {
        print("connected")
    } else {
        func grayDot(_ x: Double, _ y: Double) -> Bool {
            func color(_ x: Double, _ y: Double) -> NSColor? {
                bitmap.colorAt(x: Int(x / 600 * Double(bitmap.pixelsWide)),
                               y: Int(y / 487 * Double(bitmap.pixelsHigh)))?.usingColorSpace(NSColorSpace.deviceRGB)
            }
            guard let c = color(x, y) else { return false }
            let channels = [c.redComponent, c.greenComponent, c.blueComponent]
            let intensity = channels.reduce(0, +) / 3
            // Require an isolated bright dot, not merely a gray patch in the avatar.
            let darkerNeighbors = [(6.0, 0.0), (-6.0, 0.0), (0.0, 6.0), (0.0, -6.0)].filter { dx, dy in
                guard let n = color(x + dx, y + dy) else { return false }
                return intensity - (n.redComponent + n.greenComponent + n.blueComponent) / 3 > 0.06
            }.count
            return channels.max()! - channels.min()! < 0.06 && channels.min()! > 0.35 && darkerNeighbors >= 3
        }
        let ratio = Double(bitmap.pixelsWide) / Double(bitmap.pixelsHigh)
        let visibleDots = [133.0, 149.0, 165.0].filter { grayDot($0, 189) }.count
        if abs(ratio - 600.0 / 487.0) < 0.01 && text.contains("挂断") && visibleDots >= 2 {
            print("ringing")
        } else {
            // Disappearance of loading dots alone is NOT proof of answering.
            print("unknown")
        }
    }
default: fail("unknown command")
}
