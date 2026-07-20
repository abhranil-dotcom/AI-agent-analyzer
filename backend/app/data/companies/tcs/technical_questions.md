## Core CS Fundamentals

### Explain the four pillars of OOP with examples.
Cover encapsulation, abstraction, inheritance, and polymorphism — TCS interviewers commonly ask
for a real-world analogy for each, not just definitions.

### What is the difference between a process and a thread?
Cover memory isolation, context-switch cost, and when you'd choose multithreading over
multiprocessing.

### Explain normalization in DBMS up to 3NF.
Walk through 1NF, 2NF, and 3NF with a small example table, and explain why normalization reduces
redundancy and update anomalies.

### What is a deadlock, and how can it be prevented?
Cover the four necessary conditions (mutual exclusion, hold-and-wait, no preemption, circular
wait) and at least one prevention strategy.

### Explain the difference between TCP and UDP.
Cover reliability, connection-orientation, and typical use cases for each.

## Java / Backend

### What is the difference between an abstract class and an interface in Java?
Cover multiple inheritance support, default method behavior (Java 8+), and when to choose one
over the other.

### Explain exception handling in Java — checked vs unchecked exceptions.
Give examples of each category and explain try-catch-finally behavior.

### What is the difference between `==` and `.equals()` in Java?
Cover reference equality vs value/content equality, especially for String and custom objects.

### Explain the Java Collections Framework — List vs Set vs Map.
Cover ordering, duplicate handling, and when to use ArrayList vs LinkedList vs HashSet vs HashMap.

### What is garbage collection in Java, and why does it matter?
Cover automatic memory management, generational GC basics, and why manual memory management
isn't needed (contrast briefly with C/C++).

## Databases

### Write a SQL query to find the second-highest salary from an Employee table.
A common TCS favorite — expect a follow-up on using `LIMIT`/`OFFSET` vs a correlated subquery
vs `DENSE_RANK()`.

### What is the difference between `WHERE` and `HAVING` clauses?
Cover filtering before vs after aggregation (`GROUP BY`).

### Explain primary key vs foreign key vs unique key.
Cover uniqueness, nullability, and referential integrity.

## Web / Digital

### Explain the difference between REST and SOAP APIs.
Cover statelessness, payload format (JSON vs XML), and typical use cases.

### What is the difference between `let`, `const`, and `var` in JavaScript?
Cover scoping (block vs function) and reassignment/redeclaration rules.

### Explain the concept of responsive web design.
Cover media queries, flexible grids, and mobile-first design principles.

## Cloud (for cloud/digital track candidates)

### What is the difference between IaaS, PaaS, and SaaS?
Give one concrete example of each (e.g. EC2, Heroku/App Engine, Gmail).

### Explain the basic idea of auto-scaling in cloud computing.
Cover scaling in/out based on load, and why it reduces cost versus fixed-capacity provisioning.
