
export async function Log(stack: string, level: string, pkg: string, message: string) {
  const logEntry = { stack, level, package: pkg, message, timestamp: new Date().toISOString() };

  console.log(JSON.stringify(logEntry));
  
  
}
