## Local reminder integration

The Android client includes Capacitor LocalNotifications. A control in the notifications area lets the user enable reminders on the phone. The implementation checks platform permission, requests it when needed and schedules upcoming reminders fetched for the selected profile.

This is local scheduling from retrieved data, not proof of a permanently connected background service or a guaranteed medical alert channel.

## Scheduling behavior

The reviewed mobile layer refreshes a bounded set of upcoming reminders, replacing previous pending schedules during synchronization. Turning the feature off cancels pending local notifications through the plugin. The in-app reminder view remains a separate way to inspect recorded due items.

| Concern | Consequence |
|---|---|
| Permission denied | Phone notifications may be unavailable |
| No recent synchronization | Local schedules can become stale |
| OS battery or scheduling restrictions | Timing may differ from expectations |
| Profile or record changes | Reminder synchronization must be tested |
| Sign-out or account changes | Pending-notification lifecycle requires qualification |

## Privacy and clinical limits

Notification bodies are intended to provide general guidance, but titles come from reminder data. Do not describe the feature as a guarantee that lock-screen content is free of health information. Review device visibility settings and the actual rendered notification before deployment.

Reminder software is not a prescribing system or an emergency service. The documentation does not establish guaranteed delivery or timing. Permission behavior and scheduled-notification lifecycle should be tested on supported Android versions and actual devices.
