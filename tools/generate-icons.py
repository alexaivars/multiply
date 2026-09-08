"""Generate the simple Multiply mark as PNG icons using Python's standard library."""
from pathlib import Path
import struct
import zlib

OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'icons'
OUTPUT.mkdir(parents=True, exist_ok=True)


def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))


def icon(size):
    rows = bytearray()
    background, ink = (35, 79, 67), (246, 245, 239)
    for y in range(size):
        rows.append(0)
        for x in range(size):
            coverage = 0
            for sy in (0.125, 0.375, 0.625, 0.875):
                for sx in (0.125, 0.375, 0.625, 0.875):
                    px, py = (x + sx) / size, (y + sy) / size
                    # Distance to either diagonal segment gives rounded ends.
                    for start, end in (((0.32, 0.32), (0.68, 0.68)), ((0.32, 0.68), (0.68, 0.32))):
                        dx, dy = end[0] - start[0], end[1] - start[1]
                        t = max(0, min(1, ((px-start[0])*dx + (py-start[1])*dy)/(dx*dx+dy*dy)))
                        if (px-start[0]-t*dx)**2 + (py-start[1]-t*dy)**2 <= 0.045**2:
                            coverage += 1
                            break
            rows.extend(round(bg + (fg-bg)*coverage/16) for bg, fg in zip(background, ink))
    header = struct.pack('!IIBBBBB', size, size, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')


for filename, size in [('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)]:
    (OUTPUT / filename).write_bytes(icon(size))
