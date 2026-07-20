## Core CS Fundamentals

### Explain the four pillars of OOP.
Cover encapsulation, abstraction, inheritance, polymorphism with concrete examples.

### What is the difference between a primary key and a composite key?
Cover single-column uniqueness vs multi-column uniqueness with a short example.

### Explain normalization and why it matters in database design.
Cover redundancy reduction and update-anomaly prevention up to 3NF.

### What is the difference between a process and a thread?
Cover memory isolation and typical use cases for each.

## Java / Backend

### Explain the difference between an interface and an abstract class in Java.
Cover multiple inheritance support and default methods (Java 8+).

### What is exception handling, and why is it important in production systems?
Cover try/catch/finally and graceful degradation — tie to reliability in regulated systems where
errors have real consequences.

### Explain the Spring framework's core concepts (IoC, DI).
Relevant for digital-engineering-track candidates — cover Inversion of Control and Dependency
Injection at a conceptual level.

### What is the difference between `ArrayList` and `LinkedList` in Java?
Cover underlying structure and performance trade-offs for insertion vs random access.

## Databases

### Write a SQL query to find employees who joined in the last 6 months.
Expect a `DATEADD`/`DATE_SUB`-style filter depending on the SQL dialect.

### Explain the difference between clustered and non-clustered indexes.
Cover physical row ordering vs a separate lookup structure.

### What is a transaction, and why is atomicity important in banking/healthcare systems?
Ties directly to Cognizant's BFSI/healthcare focus — cover all-or-nothing execution and why
partial updates are dangerous in financial or medical records.

## Web / Digital

### Explain the difference between REST and GraphQL.
Cover over-fetching/under-fetching trade-offs and typical use cases for each.

### What is the purpose of an API gateway in a microservices architecture?
Cover routing, authentication, and rate-limiting as centralized concerns.

## Healthcare/BFSI Domain (for vertical-specific roles)

### What do you understand by HIPAA, and why does it matter for healthcare IT systems?
Cover patient-data privacy/security requirements at a conceptual level — deep legal knowledge
isn't expected, but awareness of the concept is.

### What is a claims processing system, at a high level?
Cover the basic flow: claim submission, validation, adjudication, and payment/denial — enough to
show conceptual understanding, not domain-expert depth.
