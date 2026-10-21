// Render one PDF page to PNG with system PDFKit (no extra installs).
// Usage: swift pdf_render.swift <in.pdf> <pageIndex0> <dpi> <out.png>
import PDFKit
import AppKit
let a = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: a[1]))!
let page = doc.page(at: Int(a[2])!)!
let scale = CGFloat(Double(a[3])!) / 72.0
let box = page.bounds(for: .mediaBox)
let w = Int(box.width * scale), h = Int(box.height * scale)
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.scaleBy(x: scale, y: scale)
page.draw(with: .mediaBox, to: ctx)
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[4]))
print("wrote", a[4], w, "x", h)
