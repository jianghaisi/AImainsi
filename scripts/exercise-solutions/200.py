class Solution:
    def numIslands(self, grid):
        if not grid:
            return 0
        count, rows, cols = 0, len(grid), len(grid[0])
        for row in range(rows):
            for col in range(cols):
                if grid[row][col] != '1':
                    continue
                count += 1
                stack = [(row, col)]
                grid[row][col] = '0'
                while stack:
                    r, c = stack.pop()
                    for nr, nc in ((r-1,c),(r+1,c),(r,c-1),(r,c+1)):
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == '1':
                            grid[nr][nc] = '0'
                            stack.append((nr,nc))
        return count
