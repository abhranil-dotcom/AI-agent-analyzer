## Core CS Fundamentals

### Explain the difference between a HashMap and a TreeMap (or their language equivalents).
Cover O(1) average lookup with no ordering vs O(log n) lookup with sorted-key iteration.

### What is the difference between value types and reference types?
Cover stack vs heap allocation implications and how it affects function-parameter behavior.

### Explain garbage collection and generational GC at a high level.
Cover why most objects die young and how generational collectors exploit that for efficiency.

### What is the difference between an abstract class and an interface, and when would you choose
each?
Cover shared implementation vs pure contract, and multiple-inheritance implications.

## System Design (mainly SDE II+)

### Design a scalable file storage service (conceptually similar to OneDrive).
Cover metadata storage, chunking/deduplication, and consistency trade-offs for concurrent edits.

### Design a real-time chat/collaboration feature (similar to Microsoft Teams).
Cover WebSocket/long-polling trade-offs, message ordering, and presence-indicator design.

### How would you design Azure Blob Storage at a high level?
Cover partitioning, replication strategy, and durability guarantees.

### Explain the trade-offs between strong and eventual consistency in a distributed database.
Cover latency/availability implications and give an example of when eventual consistency is
acceptable.

## Cloud / Azure (for cloud-track candidates)

### What is the difference between Azure Functions and Azure App Service?
Cover event-driven serverless compute vs always-on hosted web apps.

### Explain the shared responsibility model in Azure.
Cover what Microsoft secures (physical infrastructure) vs what the customer configures (identity,
data, network rules).

### What is Azure Active Directory (Entra ID), and what problem does it solve?
Cover centralized identity and access management across cloud services.

## Project / Resume-depth questions

### Walk me through a project on your resume — what was the hardest technical decision, and why
did you make it that way?
Microsoft interviewers commonly spend meaningful time here, looking for genuine reasoning and
awareness of trade-offs (e.g. framework choice, database choice, AI provider choice) rather than
just describing what was built.
