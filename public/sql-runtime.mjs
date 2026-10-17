// sql.js creates a separate in-memory database for each case; no filesystem or network SQL extensions.
export function runSQL(SQL,code,meta,input){
 const db=new SQL.Database();
 try{
  db.run(meta.sqlSchema);
  const rows=input[0];
  if(rows.length){const stmt=db.prepare(`INSERT INTO ${meta.sqlTable} VALUES (${rows[0].map(()=>'?').join(',')})`);try{for(const row of rows)stmt.run(row);}finally{stmt.free();}}
  const result=[];let count=0;
  for(const stmt of db.iterateStatements(code)){
   count++;if(count!==1||stmt.getColumnNames().length!==1)throw Error('请返回一个结果集，且只包含题目要求的一列');
   while(stmt.step())result.push(stmt.get()[0]);
  }
  if(!count)throw Error('请先编写 SELECT 查询');
  return result;
 }finally{db.close();}
}
