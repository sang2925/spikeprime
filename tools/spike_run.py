"""Upload a SPIKE 3 Python file to a slot, run it, print its console output.
Usage: uv run --with bleak tools/spike_run.py <slot 0-19> <program.py> [max_seconds]
       uv run --with bleak tools/spike_run.py <slot 0-19> clear     (erase that slot only)
OVERWRITES the program in that slot."""
import asyncio, sys
import cobs
from crc import crc
from messages import (InfoRequest, InfoResponse, ClearSlotRequest, ClearSlotResponse,
                      StartFileUploadRequest, StartFileUploadResponse, TransferChunkRequest,
                      TransferChunkResponse, ProgramFlowRequest, ProgramFlowResponse,
                      ProgramFlowNotification, ConsoleNotification, deserialize)
from bleak import BleakScanner, BleakClient

SERVICE = "0000fd02-0000-1000-8000-00805f9b34fb"
RX = "0000fd02-0001-1000-8000-00805f9b34fb"
TX = "0000fd02-0002-1000-8000-00805f9b34fb"
slot, path = int(sys.argv[1]), sys.argv[2]
limit = float(sys.argv[3]) if len(sys.argv) > 3 else 30
program = None if path == "clear" else open(path, "rb").read()


async def main():
    hub = await BleakScanner.find_device_by_filter(lambda d, a: SERVICE in a.service_uuids, timeout=10)
    if hub is None:
        sys.exit("NO HUB FOUND")
    async with BleakClient(hub) as client:
        buf = bytearray()
        waiting = {}
        done = asyncio.Event()

        def on_data(_, data):
            buf.extend(data)
            while 0x02 in buf:
                i = buf.index(0x02)
                frame = bytes(buf[: i + 1]); del buf[: i + 1]
                try:
                    msg = deserialize(cobs.unpack(frame))
                except Exception:
                    continue
                if isinstance(msg, ConsoleNotification):
                    print(msg.text, end="", flush=True)
                elif isinstance(msg, ProgramFlowNotification) and msg.stop:
                    done.set()
                fut = waiting.pop(msg.ID, None)
                if fut and not fut.done():
                    fut.set_result(msg)

        await client.start_notify(TX, on_data)
        info = None

        async def request(msg, resp):
            fut = asyncio.get_running_loop().create_future()
            waiting[resp.ID] = fut
            frame = cobs.pack(msg.serialize())
            size = info.max_packet_size if info else len(frame)
            for i in range(0, len(frame), size):
                await client.write_gatt_char(RX, frame[i : i + size], response=False)
            return await asyncio.wait_for(fut, 5)

        info = await request(InfoRequest(), InfoResponse)
        cleared = await request(ClearSlotRequest(slot), ClearSlotResponse)
        if program is None:
            print(f"slot {slot} clear:", "ok" if cleared.success else "nothing to clear / refused")
            return
        if not (await request(StartFileUploadRequest("program.py", slot, crc(program)), StartFileUploadResponse)).success:
            sys.exit("upload refused")
        running = 0
        for i in range(0, len(program), info.max_chunk_size):
            chunk = program[i : i + info.max_chunk_size]
            running = crc(chunk, running)
            if not (await request(TransferChunkRequest(running, chunk), TransferChunkResponse)).success:
                sys.exit("chunk failed")
        if not (await request(ProgramFlowRequest(stop=False, slot=slot), ProgramFlowResponse)).success:
            sys.exit("start failed")
        print(f"--- running slot {slot} ---", flush=True)
        try:
            await asyncio.wait_for(done.wait(), limit)
            print("--- program finished ---")
        except asyncio.TimeoutError:
            await request(ProgramFlowRequest(stop=True, slot=slot), ProgramFlowResponse)
            print("--- stopped after time limit ---")


asyncio.run(main())
