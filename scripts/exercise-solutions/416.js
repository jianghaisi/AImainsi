function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2,
    dp = Array(target + 1).fill(false);
  dp[0] = true;
  for (const value of nums) for (let sum = target; sum >= value; sum--) dp[sum] ||= dp[sum - value];
  return dp[target];
}
