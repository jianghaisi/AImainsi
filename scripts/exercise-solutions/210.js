function findOrder(numCourses, prerequisites) {
  const edges = Array.from({ length: numCourses }, () => []),
    degree = Array(numCourses).fill(0);
  for (const [to, from] of prerequisites) {
    edges[from].push(to);
    degree[to]++;
  }
  const queue = [];
  degree.forEach((d, i) => {
    if (!d) queue.push(i);
  });
  for (let i = 0; i < queue.length; i++)
    for (const next of edges[queue[i]]) if (--degree[next] === 0) queue.push(next);
  return queue.length === numCourses ? queue : [];
}
