class Solution:
    def zigzagLevelOrder(self, root):
        levels, level, reverse = [], [root] if root else [], False
        while level:
            values = [node.val for node in level]
            levels.append(values[::-1] if reverse else values)
            level = [child for node in level for child in (node.left, node.right) if child]
            reverse = not reverse
        return levels
