import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor


class JobManager:
    def __init__(self, storage):
        self.storage = storage
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="synapse-import")
        self.slots = threading.BoundedSemaphore(4)
        self.cancellations = {}
        self.lock = threading.Lock()

    def submit(self, operation):
        if not self.slots.acquire(blocking=False):
            raise ValueError("Import queue is full. Wait for an import to finish.")
        identifier = str(uuid.uuid4())
        event = threading.Event()
        with self.lock:
            self.cancellations[identifier] = event
        self.storage.set("job:" + identifier, {"id": identifier, "status": "queued", "created": time.time()})

        def work():
            try:
                if event.is_set():
                    raise InterruptedError("Import cancelled")
                self.storage.set("job:" + identifier, {"id": identifier, "status": "running"})
                result = operation(event)
                self.storage.set("job:" + identifier, {"id": identifier, "status": "completed", "result": result})
            except InterruptedError:
                self.storage.set("job:" + identifier, {"id": identifier, "status": "cancelled"})
            except Exception as exc:
                self.storage.set("job:" + identifier, {"id": identifier, "status": "failed", "error": str(exc)[:500]})
            finally:
                with self.lock:
                    self.cancellations.pop(identifier, None)
                self.slots.release()
        self.executor.submit(work)
        return {"id": identifier, "status": "queued"}

    def get(self, identifier):
        return self.storage.get("job:" + identifier)

    def cancel(self, identifier):
        with self.lock:
            event = self.cancellations.get(identifier)
            if event:
                event.set()
            return event is not None

    def close(self):
        with self.lock:
            for event in self.cancellations.values():
                event.set()
        self.executor.shutdown(wait=True, cancel_futures=False)
