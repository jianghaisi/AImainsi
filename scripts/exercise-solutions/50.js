function myPow(x, n) {
  if (n < 0) {
    x = 1 / x;
    n = -n;
  }
  let answer = 1;
  while (n) {
    if (n % 2) answer *= x;
    x *= x;
    n = Math.floor(n / 2);
  }
  return answer;
}
