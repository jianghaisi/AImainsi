function climbStairs(n) {
  let a = 1,
    b = 1;
  for (let step = 2; step <= n; step++) [a, b] = [b, a + b];
  return b;
}
