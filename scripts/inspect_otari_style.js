async function run() {
  const res = await fetch('https://otari.ai/devs-wilding');
  const html = await res.text();
  const cssMatches = html.match(/href="([^"]+\.css)"/g);
  console.log('CSS Links:', cssMatches);
  const inlineStyles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
  if (inlineStyles) {
    console.log('Inline style sample:', inlineStyles.join('\n').slice(0, 1500));
  }
}
run();
