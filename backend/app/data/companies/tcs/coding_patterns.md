## Coding Questions

TCS's coding bar (both in NQT and technical interviews) skews Easy-to-Medium, favoring clean,
correct solutions over highly optimized ones — clarity of approach matters more than shaving
milliseconds off runtime.

### Reverse a string without using a built-in reverse function.
- **Difficulty**: Easy
- **Topic**: Strings
- Classic warm-up; interviewers often follow up asking to do it in-place.

### Check if a given string is a palindrome.
- **Difficulty**: Easy
- **Topic**: Strings
- Expect a follow-up: how would you handle case-insensitivity and spaces/punctuation?

### Find the factorial of a number, iteratively and recursively.
- **Difficulty**: Easy
- **Topic**: Recursion / Basics
- Interviewers commonly ask you to compare the two approaches (stack usage, base case).

### Find the second-largest element in an array without sorting.
- **Difficulty**: Easy
- **Topic**: Arrays
- Tests whether you reach for a full sort unnecessarily (O(n log n)) vs a single O(n) pass.

### Remove duplicates from an array/list.
- **Difficulty**: Easy
- **Topic**: Arrays / HashMaps
- A good answer discusses at least two approaches: using a HashSet vs sorting + in-place removal.

### Check if two strings are anagrams of each other.
- **Difficulty**: Easy-Medium
- **Topic**: Strings / HashMaps
- Expect a frequency-count-based solution; sorting both strings is an acceptable alternative.

### Implement a basic linked list with insert and delete operations.
- **Difficulty**: Medium
- **Topic**: Linked Lists
- Common at TCS for candidates listing C/C++/Java on their resume — tests pointer/reference
  manipulation fundamentals.

### Find the missing number in an array of 1 to N.
- **Difficulty**: Easy-Medium
- **Topic**: Arrays / Math
- Sum-formula approach (`n(n+1)/2`) is the expected optimal answer.

### Write a program to check if a number is prime.
- **Difficulty**: Easy
- **Topic**: Math
- Follow-up: how would you optimize by checking only up to √n?

### Sort an array using bubble sort or selection sort, and explain its time complexity.
- **Difficulty**: Easy
- **Topic**: Sorting
- TCS interviewers often want you to trace through the algorithm by hand, not just recite code.
