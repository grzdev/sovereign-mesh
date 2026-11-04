async function test() {
  const res = await fetch('http://localhost:3333/api/mesh/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Architect an async connection pool',
      codePayload: 'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";',
      preference: 'cloud'
    })
  });
  const data = await res.json();
  console.log('Keys in response:', Object.keys(data));
  console.log('finalContent length:', data.finalContent?.length);
  console.log('finalContent starts with:', data.finalContent?.slice(0, 300));
}
test();
