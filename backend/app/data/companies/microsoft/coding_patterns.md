## Coding Questions

Microsoft's coding bar is Medium, occasionally Medium-Hard, similar in spirit to Amazon/Google but
generally with slightly less relentless algorithmic depth and more room for a collaborative,
discussion-driven problem-solving style.

### Reverse a linked list, iteratively and recursively.
- **Difficulty**: Easy-Medium
- **Topic**: Linked Lists
- Common warm-up; expect a discussion of the trade-offs between the two approaches.

### Find the lowest common ancestor of two nodes in a binary tree.
- **Difficulty**: Medium
- **Topic**: Trees / Recursion
- Classic recursive tree problem, frequently seen in Microsoft loops.

### Implement a basic calculator that evaluates a string expression (e.g. "3 + 5 * 2").
- **Difficulty**: Medium-Hard
- **Topic**: Stacks / Parsing
- Tests operator-precedence handling and careful state management.

### Given a 2D grid, find the number of distinct islands (not just count, but shape-distinct).
- **Difficulty**: Medium-Hard
- **Topic**: Graphs / DFS-BFS / Matrices
- A step up from the basic "number of islands" problem — tests careful shape-normalization logic.

### Find all anagrams of a pattern string within a larger string.
- **Difficulty**: Medium
- **Topic**: Strings / Sliding Window
- Sliding-window with a frequency map is the expected efficient approach.

### Flatten a nested list (arbitrarily nested arrays) into a single-level list.
- **Difficulty**: Medium
- **Topic**: Recursion / Design
- Tests recursive/iterator design thinking, common in Microsoft's developer-tools-adjacent teams.

### Implement a basic text editor's undo/redo functionality (conceptually or in code).
- **Difficulty**: Medium
- **Topic**: Stacks / Design
- Reflects Microsoft's productivity-software domain — tests practical state-management design.

### Find the K closest points to the origin from a list of points.
- **Difficulty**: Medium
- **Topic**: Heaps / Arrays
- Expect a heap-based approach discussed against full sorting.

### Given a matrix, rotate it 90 degrees in place.
- **Difficulty**: Medium
- **Topic**: Arrays / Matrices
- Tests careful in-place manipulation without extra space.

### Write a SQL query to find the second-highest value per group (e.g. second-highest salary per
department).
- **Difficulty**: Medium
- **Topic**: SQL / Window Functions
- Expect a `RANK()`/`DENSE_RANK()` with `PARTITION BY` based solution.
