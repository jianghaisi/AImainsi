const code = {
  attention: [
    `double[][] solve(double[][] Q,double[][] K,double[][] V) {
    double[][] out=new double[Q.length][V[0].length];
    for(int i=0;i<Q.length;i++) {
        double[] s=new double[K.length];double peak=-Double.MAX_VALUE,total=0;
        for(int j=0;j<K.length;j++){for(int d=0;d<Q[i].length;d++)s[j]+=Q[i][d]*K[j][d];s[j]/=Math.sqrt(Q[i].length);peak=Math.max(peak,s[j]);}
        for(int j=0;j<s.length;j++){s[j]=Math.exp(s[j]-peak);total+=s[j];}
        for(int d=0;d<V[0].length;d++)for(int j=0;j<K.length;j++)out[i][d]+=s[j]/total*V[j][d];
    }
    return out;
}`,
    `vector<vector<double>> solve(vector<vector<double>> Q,vector<vector<double>> K,vector<vector<double>> V) {
    vector<vector<double>> out(Q.size(),vector<double>(V[0].size()));
    for(size_t i=0;i<Q.size();i++) {
        vector<double> s(K.size());
        for(size_t j=0;j<K.size();j++){for(size_t d=0;d<Q[i].size();d++)s[j]+=Q[i][d]*K[j][d];s[j]/=sqrt(Q[i].size());}
        double peak=*max_element(s.begin(),s.end()),total=0;
        for(double &x:s){x=exp(x-peak);total+=x;}
        for(size_t d=0;d<V[0].size();d++)for(size_t j=0;j<K.size();j++)out[i][d]+=s[j]/total*V[j][d];
    }
    return out;
}`,
  ],
  substring: [
    `int solve(String s) {
    Map<Integer,Integer> seen=new HashMap<>();int left=0,best=0;int[] chars=s.codePoints().toArray();
    for(int r=0;r<chars.length;r++){left=Math.max(left,seen.getOrDefault(chars[r],-1)+1);seen.put(chars[r],r);best=Math.max(best,r-left+1);}
    return best;
}`,
    `int solve(string s) {
    // Decode UTF-8 so all language versions count code points.
    vector<unsigned int> chars;
    for(size_t i=0;i<s.size();) {
        unsigned char c=s[i++];unsigned int cp=c;int n=0;
        if(c>=240){cp=c&7;n=3;}else if(c>=224){cp=c&15;n=2;}else if(c>=192){cp=c&31;n=1;}
        while(n-- && i<s.size())cp=(cp<<6)|(static_cast<unsigned char>(s[i++])&63);
        chars.push_back(cp);
    }
    unordered_map<unsigned int,int> seen;int left=0,best=0;
    for(int r=0;r<(int)chars.size();r++){if(seen.count(chars[r]))left=max(left,seen[chars[r]]+1);seen[chars[r]]=r;best=max(best,r-left+1);}
    return best;
}`,
  ],
  brackets: [
    `boolean solve(String s) {
    Deque<Character> stack=new ArrayDeque<>();
    for(char ch:s.toCharArray()) {
        if(ch=='('||ch=='['||ch=='{')stack.push(ch);
        else {char expected=ch==')'?'(':ch==']'?'[':'{';if(stack.isEmpty()||stack.pop()!=expected)return false;}
    }
    return stack.isEmpty();
}`,
    `bool solve(string s) {
    vector<char> stack;
    for(char ch:s){if(ch=='('||ch=='['||ch=='{')stack.push_back(ch);else{char expected=ch==')'?'(':ch==']'?'[':'{';if(stack.empty()||stack.back()!=expected)return false;stack.pop_back();}}
    return stack.empty();
}`,
  ],
  binary: [
    `int solve(int[] nums,int target) {
    int l=0,r=nums.length-1;
    while(l<=r){int m=l+(r-l)/2;if(nums[m]==target)return m;if(nums[m]<target)l=m+1;else r=m-1;}
    return -1;
}`,
    `int solve(vector<int> nums,int target) {
    int l=0,r=(int)nums.size()-1;
    while(l<=r){int m=l+(r-l)/2;if(nums[m]==target)return m;if(nums[m]<target)l=m+1;else r=m-1;}
    return -1;
}`,
  ],
  softmax: [
    `double[] solve(double[] xs) {
    double peak=Arrays.stream(xs).max().getAsDouble(),total=0;double[] out=new double[xs.length];
    for(int i=0;i<xs.length;i++){out[i]=Math.exp(xs[i]-peak);total+=out[i];}
    for(int i=0;i<out.length;i++)out[i]/=total;
    return out;
}`,
    `vector<double> solve(vector<double> xs) {
    double peak=*max_element(xs.begin(),xs.end()),total=0;
    for(double &x:xs){x=exp(x-peak);total+=x;}for(double &x:xs)x/=total;
    return xs;
}`,
  ],
  merge: [
    `int[][] solve(int[][] intervals) {
    Arrays.sort(intervals,Comparator.comparingInt(a->a[0]));List<int[]> out=new ArrayList<>();
    for(int[] cur:intervals){if(!out.isEmpty()&&cur[0]<=out.get(out.size()-1)[1]){int[] last=out.get(out.size()-1);last[1]=Math.max(last[1],cur[1]);}else out.add(cur.clone());}
    return out.toArray(new int[0][]);
}`,
    `vector<vector<int>> solve(vector<vector<int>> intervals) {
    sort(intervals.begin(),intervals.end());vector<vector<int>> out;
    for(auto cur:intervals){if(!out.empty()&&cur[0]<=out.back()[1])out.back()[1]=max(out.back()[1],cur[1]);else out.push_back(cur);}
    return out;
}`,
  ],
  islands: [
    `int solve(String[][] grid) {
    if(grid.length==0)return 0;int rows=grid.length,cols=grid[0].length,count=0;int[][] dirs={{1,0},{-1,0},{0,1},{0,-1}};
    for(int r=0;r<rows;r++)for(int c=0;c<cols;c++){
        if(!grid[r][c].equals("1"))continue;count++;Deque<int[]> stack=new ArrayDeque<>();stack.push(new int[]{r,c});grid[r][c]="0";
        while(!stack.isEmpty()){int[] p=stack.pop();for(int[] d:dirs){int a=p[0]+d[0],b=p[1]+d[1];if(a>=0&&a<rows&&b>=0&&b<cols&&grid[a][b].equals("1")){grid[a][b]="0";stack.push(new int[]{a,b});}}}
    }return count;
}`,
    `int solve(vector<vector<string>> grid) {
    if(grid.empty())return 0;int rows=grid.size(),cols=grid[0].size(),count=0;int dx[]={1,-1,0,0},dy[]={0,0,1,-1};
    for(int r=0;r<rows;r++)for(int c=0;c<cols;c++){
        if(grid[r][c]!="1")continue;count++;vector<pair<int,int>> stack={{r,c}};grid[r][c]="0";
        while(!stack.empty()){auto [x,y]=stack.back();stack.pop_back();for(int i=0;i<4;i++){int a=x+dx[i],b=y+dy[i];if(a>=0&&a<rows&&b>=0&&b<cols&&grid[a][b]=="1"){grid[a][b]="0";stack.push_back({a,b});}}}
    }return count;
}`,
  ],
  coins: [
    `int solve(int[] coins,int amount) {
    int[] dp=new int[amount+1];Arrays.fill(dp,amount+1);dp[0]=0;
    for(int total=1;total<=amount;total++)for(int coin:coins)if(coin<=total)dp[total]=Math.min(dp[total],dp[total-coin]+1);
    return dp[amount]<=amount?dp[amount]:-1;
}`,
    `int solve(vector<int> coins,int amount) {
    vector<int> dp(amount+1,amount+1);dp[0]=0;
    for(int total=1;total<=amount;total++)for(int coin:coins)if(coin<=total)dp[total]=min(dp[total],dp[total-coin]+1);
    return dp[amount]<=amount?dp[amount]:-1;
}`,
  ],
};
const js = {
  islands: `function solve(grid) {
  if(!grid.length)return 0;
  const rows=grid.length,cols=grid[0].length;let count=0;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) {
    if(grid[r][c]!=='1')continue;
    count++;const stack=[[r,c]];grid[r][c]='0';
    while(stack.length){const [x,y]=stack.pop();for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
      if(a>=0&&a<rows&&b>=0&&b<cols&&grid[a][b]==='1'){grid[a][b]='0';stack.push([a,b]);}
    }}
  }return count;
}`,
  coins: `function solve(coins,amount) {
  const dp=Array(amount+1).fill(amount+1);dp[0]=0;
  for(let total=1;total<=amount;total++)for(const coin of coins)if(coin<=total)dp[total]=Math.min(dp[total],dp[total-coin]+1);
  return dp[amount]<=amount?dp[amount]:-1;
}`,
};
export function addLanguages(q) {
  if (!code[q.id]) return q;
  const [java, cpp] = code[q.id];
  return {
    ...q,
    solutions: {
      ...q.solutions,
      ...(js[q.id] ? { javascript: js[q.id] } : {}),
      java: 'import java.util.*;\nclass Solution {\n    public ' + java + '\n}',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\n' + cpp,
    },
    starters: {
      ...q.starters,
      java:
        'import java.util.*;\nclass Solution {\n    public ' +
        java.split('{')[0] +
        '{\n        // 在这里完成实现\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      cpp:
        '#include <bits/stdc++.h>\nusing namespace std;\n\n' +
        cpp.split('{')[0] +
        '{\n    // 在这里完成实现\n    throw runtime_error("TODO");\n}',
    },
  };
}
