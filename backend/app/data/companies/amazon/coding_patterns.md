## Coding Questions

Amazon's coding bar is Medium, occasionally Medium-Hard, LeetCode-style — correctness, clean code,
and precise complexity analysis are all scored, and every coding round is paired with Leadership
Principles behavioral follow-ups.

### Two Sum — find indices of two numbers that add up to a target.
- **Difficulty**: Easy-Medium
- **Topic**: Arrays / HashMaps
- Common warm-up; expect a follow-up asking for the O(n) HashMap solution over brute force.

### Find the K most frequent elements in an array.
- **Difficulty**: Medium
- **Topic**: HashMaps / Heaps
- Expect discussion of a heap-based O(n log k) approach vs full sorting.

### Merge K sorted linked lists.
- **Difficulty**: Hard
- **Topic**: Linked Lists / Heaps
- A recurring Amazon favorite that tests heap usage and linked-list manipulation together.

### Detect and remove a cycle in a linked list.
- **Difficulty**: Medium
- **Topic**: Linked Lists
- Floyd's cycle detection algorithm is the expected approach.

### Find the shortest path in a weighted graph (Dijkstra's algorithm).
- **Difficulty**: Hard
- **Topic**: Graphs
- Common in SDE II+ loops; expect a discussion of when Dijkstra's isn't appropriate (negative
  weights).

### Design and implement an LRU cache.
- **Difficulty**: Medium-Hard
- **Topic**: Design / HashMaps / Linked Lists
- Very frequently asked at Amazon — combines data-structure knowledge with system-design
  thinking.

### Given a list of intervals, merge all overlapping intervals.
- **Difficulty**: Medium
- **Topic**: Arrays / Sorting
- Expect a sort-then-sweep approach and careful edge-case handling.

### Word Ladder — find the shortest transformation sequence between two words.
- **Difficulty**: Hard
- **Topic**: Graphs / BFS
- Tests modeling a non-obvious problem as a graph traversal.

### Find the number of islands in a 2D grid.
- **Difficulty**: Medium
- **Topic**: Graphs / DFS-BFS / Matrices
- Expect a DFS or BFS flood-fill approach with careful boundary handling.

### Serialize and deserialize a binary tree.
- **Difficulty**: Hard
- **Topic**: Trees / Design
- Tests both tree traversal knowledge and practical encoding/decoding design.
