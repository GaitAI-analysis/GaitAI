## Network-state awareness

The mobile layer reads network status and subscribes to changes through Capacitor Network. When disconnected, it displays an offline banner explaining that new entries need a connection. It does not create a second local patient database or a durable offline mutation queue.

## Slow-server messaging

The application wraps the shared request helper to track pending work. If a request stays pending while the device appears connected, a delayed message explains that the server may be waking up. When pending work settles, that message is removed.

This is a user-interface explanation for latency, not a live measurement that proves the provider is sleeping. Slow networks and other service failures can produce similar symptoms.

## User expectations

| Situation | What the app can communicate |
|---|---|
| Device offline | Record operations need reconnection |
| Request taking longer than usual | Work remains pending; the server may be waking |
| Request fails | The shared error path handles the failure |
| App restarts | Session persistence does not imply offline record availability |

## Verification priorities

Test airplane mode, connection loss during upload, reconnect after a failed read and a delayed write response. Before resubmitting a create action, establish whether the first request succeeded. A connection banner is not evidence that retries are idempotent or that unsaved entries are durably queued.

Offline-first record editing remains outside the implemented architecture documented here.
