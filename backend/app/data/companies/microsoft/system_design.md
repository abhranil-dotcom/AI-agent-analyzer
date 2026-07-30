## System Design (SDE II and above)

Microsoft weights system design meaningfully more for SDE II+ loops than for new-grad loops, where
it's usually light or absent. When it appears, interviewers care about structured trade-off
reasoning as much as the final design.

### Design a scalable file storage service (conceptually similar to OneDrive).
Cover metadata storage, chunking/deduplication, and consistency trade-offs for concurrent edits.

### Design a real-time chat/collaboration feature (similar to Microsoft Teams).
Cover WebSocket/long-polling trade-offs, message ordering, and presence-indicator design.

### How would you design Azure Blob Storage at a high level?
Cover partitioning, replication strategy, and durability guarantees.

### Explain the trade-offs between strong and eventual consistency in a distributed database.
Cover latency/availability implications and give an example of when eventual consistency is
acceptable.

### Design a notification/alerting system for an enterprise product (e.g. Teams or Outlook).
Cover fan-out strategy, delivery guarantees, and how you'd avoid notification storms.

### How would you approach designing a feature for high availability across Azure regions?
Cover multi-region replication, failover strategy, and the added complexity/cost trade-off —
interviewers want to see you reason about the trade-off explicitly, not just name the pattern.

### What to emphasize in answers
Microsoft's "growth mindset" culture shows up here too — interviewers respond well to candidates
who think out loud, acknowledge trade-offs and unknowns honestly, and iterate on their design when
pushed, rather than defending a first answer rigidly.
