"""Read-only SPIKE 3 hub monitor over BLE. Usage: uv run --with bleak tools/spike_watch.py [seconds]
Prints battery, yaw, and every motor/sensor port. Never touches program slots."""
import asyncio, sys, time
import cobs
from messages import InfoRequest, InfoResponse, DeviceNotificationRequest, DeviceNotification, deserialize
from bleak import BleakScanner, BleakClient

SERVICE = "0000fd02-0000-1000-8000-00805f9b34fb"
RX = "0000fd02-0001-1000-8000-00805f9b34fb"
TX = "0000fd02-0002-1000-8000-00805f9b34fb"
PORTS = "ABCDEF"
MOTOR = {0x30: "medium motor", 0x31: "large motor", 0x41: "small motor"}
SECONDS = float(sys.argv[1]) if len(sys.argv) > 1 else 10


async def main():
    print("Scanning 10 s...", flush=True)
    found = await BleakScanner.discover(timeout=10, return_adv=True)
    hub = next((d for d, a in found.values() if SERVICE in a.service_uuids), None)
    if hub is None:
        names = sorted({d.name for d, _ in found.values() if d.name})
        print("NO HUB FOUND. Named BLE devices seen:", names)
        return
    print("Hub found:", hub.name, hub.address, flush=True)
    async with BleakClient(hub) as client:
        buf = bytearray()
        info = asyncio.get_running_loop().create_future()
        t0 = time.time()

        def on_data(_, data):
            buf.extend(data)
            while 0x02 in buf:  # 0x02 ends a frame; frames may arrive split
                i = buf.index(0x02)
                frame = bytes(buf[: i + 1]); del buf[: i + 1]
                try:
                    msg = deserialize(cobs.unpack(frame))
                except Exception as e:
                    print("decode error:", e); continue
                if isinstance(msg, InfoResponse) and not info.done():
                    info.set_result(msg)
                elif isinstance(msg, DeviceNotification):
                    parts = [f"t={time.time() - t0:5.1f}s"]
                    for name, v in msg.messages:
                        if name == "Battery":
                            parts.append(f"battery={v[1]}%")
                        elif name == "IMU":
                            parts.append(f"yaw={v[3] / 10:+.1f}")  # [INFERENCE] decidegrees
                        elif name == "Motor":
                            parts.append(f"{PORTS[v[1]]}:{MOTOR.get(v[2], hex(v[2]))} pos={v[6]} abs={v[3]} spd={v[5]}")
                        elif name != "5x5":  # 5x5 = hub screen pixels, no port
                            parts.append(f"{PORTS[v[1]]}:{name}")
                    print("  ".join(parts), flush=True)

        await client.start_notify(TX, on_data)
        await client.write_gatt_char(RX, cobs.pack(InfoRequest().serialize()), response=False)
        i = await asyncio.wait_for(info, 5)
        print(f"Firmware {i.firmware_major}.{i.firmware_minor}.{i.firmware_build}", flush=True)
        await client.write_gatt_char(RX, cobs.pack(DeviceNotificationRequest(500).serialize()), response=False)
        await asyncio.sleep(SECONDS)


asyncio.run(main())
