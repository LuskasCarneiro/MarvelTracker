/* gen_ecg.mjs — emits the ECG strip path for the Hulk 2008 opening (MASK_HTML.heartbeat).
   Output is spliced into index.html, never hand-edited. Run:
     node tools/gen_ecg.mjs

   The strip's beats get CLOSER together left→right; the strip then scrolls at a
   constant speed, so the on-screen pulse visibly accelerates. The final beat is the
   200 BPM spike — the film's verified transformation threshold ("whenever his heart
   rate rises above 200 beats per minute, he transforms", Wikipedia/MCU Wiki). */
/* beat spacing: 130 → 22, asymptotic; 18 beats. The strip then scrolls ~540
   viewBox units, so the 200 spike (built in below, around x≈790) is inside the
   LCD window just as the alarm hits. */
let x = 40;
const out = [];
const QRS = [
  [0.35, 0], [0.5, 6], [0.55, -4], [0.62, 17], [0.68, -8], [0.72, 5], [0.8, 0],
];
for (let b = 0; b < 18; b++) {
  const px = x;
  x += 130 * Math.pow(0.82, b);
  const q = QRS.map(([u, h]) => [px + u * (x - px), 58 - h]);
  out.push(`M${q[0][0]} ${q[0][1]}`);
  for (let i = 1; i < q.length; i++) out.push(`L${q[i][0].toFixed(1)} ${q[i][1]}`);
  out.push(`L${(x + 8).toFixed(1)} 58`);
}
/* the 200 spike: tall, thin, violent, off the top of the screen */
out.push(`M${(x + 12).toFixed(1)} 58 L${(x + 16).toFixed(1)} 58 L${(x + 20).toFixed(1)} -26 L${(x + 25).toFixed(1)} 84 L${(x + 29).toFixed(1)} 58 L${(x + 46).toFixed(1)} 58`);
console.log(`viewBox width: ${(x + 60).toFixed(0)}`);
console.log(out.join(' '));
