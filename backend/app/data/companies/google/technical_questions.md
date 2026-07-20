## Core CS Fundamentals

### Explain the time and space complexity trade-offs of common sorting algorithms.
Google interviewers expect you to compare quicksort, mergesort, and heapsort's complexity and
stability characteristics fluently, not just recite one.

### What is the difference between BFS and DFS, and when would you use each?
Cover traversal order, use cases (shortest path vs exhaustive search), and space complexity
differences.

### Explain how a hash table achieves average O(1) lookup, and when it degrades.
Cover collision handling and load-factor-driven resizing, and worst-case degradation to O(n).

### What is dynamic programming, and how do you recognize when a problem needs it?
Cover overlapping subproblems and optimal substructure as the key signals.

## System Design (for higher levels)

### Design a distributed key-value store.
Cover partitioning/sharding, replication, and consistency model trade-offs (strong vs eventual).

### Design a web crawler at scale.
Cover URL frontier management, deduplication, politeness/rate-limiting per domain, and
distributed coordination.

### How would you design Google's autocomplete/search-suggestion feature?
Cover data structures like a trie, ranking signals, and latency constraints at massive scale.

### Explain the CAP theorem and give a real-world system that leans toward each side.
Cover Consistency, Availability, Partition tolerance trade-offs with concrete examples.

## Algorithms — General

### Explain the difference between greedy algorithms and dynamic programming.
Cover when greedy choices are provably optimal vs when you need to consider all subproblems.

### What is the difference between a balanced and unbalanced binary search tree, and why does
balance matter?
Cover O(log n) vs O(n) worst-case operations and why self-balancing trees (AVL, Red-Black) exist.

### Explain amortized time complexity with an example (e.g. dynamic array resizing).
Cover why occasional expensive operations don't dominate average-case complexity over a sequence
of operations.

## Project / Resume-depth questions

### Walk me through the architecture of a project on your resume and justify your key design
decisions.
Google interviewers frequently spend significant time here — be ready to defend specific choices
(e.g. why a particular framework, database, or AI provider) with real reasoning, not just
familiarity.
