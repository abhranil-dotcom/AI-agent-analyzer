## Core CS Fundamentals

### Analyze the time and space complexity of a given algorithm.
Amazon interviewers expect precise Big-O analysis for every solution you write, not just a
correct answer.

### Explain the difference between a HashMap and a ConcurrentHashMap.
Cover thread-safety mechanisms (segment/bucket-level locking in ConcurrentHashMap) and when
thread-safety is actually needed vs unnecessary overhead.

### What is the difference between multithreading and multiprocessing, and when would you choose
each in a backend service?
Cover shared-memory concurrency vs process isolation trade-offs.

### Explain how a hash table resolves collisions.
Cover chaining vs open addressing, and how load factor affects performance.

## System Design (for SDE II and above)

### Design a URL shortening service.
Cover ID generation strategy, database choice, and how you'd handle scale (caching, read
replicas).

### Design a rate limiter for an API.
Cover algorithms like token bucket or sliding window, and where you'd place it in the
architecture (API gateway vs application layer).

### Design a notification system that can send millions of notifications reliably.
Cover queueing, retry/backoff strategy, and idempotency to avoid duplicate sends.

### How would you design AWS S3 or a similar object storage system at a high level?
Cover durability guarantees, partitioning/sharding strategy, and consistency trade-offs.

## AWS / Cloud (for AWS-facing roles)

### Explain the difference between EC2 and Lambda, and when you'd choose each.
Cover always-on vs event-driven compute, and cold-start considerations for Lambda.

### What is eventual consistency, and where does it show up in distributed systems?
Cover trade-offs against strong consistency and real examples (e.g. DynamoDB's consistency
models).

### Explain how you'd design for high availability across multiple AWS regions.
Cover multi-region replication, failover strategy, and the added complexity/cost trade-off.

## Behavioral-technical hybrid

### Explain how your Resume Analyzer / LangChain-based project's architecture works, and what
trade-offs you made.
Amazon interviewers often ask candidates to defend real project architecture decisions in depth
— be ready to explain why you chose specific components (e.g. FastAPI, LangChain, Azure OpenAI)
over alternatives.
