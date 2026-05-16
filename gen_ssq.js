function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasConsecutive(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i-1] + 1) return true;
  }
  return false;
}

function generateSSQData() {
  const data = [];
  let period = 2025043;

  for (let i = 0; i < 800; i++) {
    let redBalls;

    if (Math.random() < 0.4) {
      // 有连号模式 (40%)
      const all = Array.from({ length: 33 }, (_, k) => k + 1);
      const seqLen = Math.random() < 0.7 ? 2 : 3; // 2连或3连
      const seqStart = Math.floor(Math.random() * (33 - seqLen)) + 1;
      const seqNums = [];
      for (let s = 0; s < seqLen; s++) seqNums.push(seqStart + s);

      const rest = all.filter(n => !seqNums.includes(n));
      const extra = shuffle(rest).slice(0, 6 - seqLen);
      redBalls = [...seqNums, ...extra];
    } else {
      // 无连号模式 (60%) - 随机选直到无连号
      let attempts = 0;
      do {
        const all = Array.from({ length: 33 }, (_, k) => k + 1);
        redBalls = shuffle(all).slice(0, 6);
        redBalls.sort((a, b) => a - b);
        attempts++;
      } while (hasConsecutive(redBalls) && attempts < 20);
    }

    redBalls.sort((a, b) => a - b);

    // 蓝球 1-16
    const blueBall = Math.floor(Math.random() * 16) + 1;

    data.push({
      p: String(period),
      r: redBalls,
      b: blueBall
    });

    period--;
  }

  return data;
}

function validate(data) {
  let sumOk = 0, oddOk = 0, seqOk = 0;
  for (const d of data) {
    const r = d.r;
    const sum = r.reduce((a, b) => a + b, 0);
    if (sum >= 60 && sum <= 180) sumOk++;
    const odd = r.filter(x => x % 2 === 1).length;
    if (odd >= 2 && odd <= 4) oddOk++;
    let hasSeq = false;
    for (let i = 1; i < r.length; i++) {
      if (r[i] === r[i-1] + 1) { hasSeq = true; break; }
    }
    if (hasSeq) seqOk++;
  }
  console.log(`和值60-180: ${sumOk}/800 = ${(sumOk/800*100).toFixed(1)}%`);
  console.log(`奇偶均衡(2-4奇): ${oddOk}/800 = ${(oddOk/800*100).toFixed(1)}%`);
  console.log(`连号: ${seqOk}/800 = ${(seqOk/800*100).toFixed(1)}%`);
}

const data = generateSSQData();
validate(data);

let content = 'const SSQ_DATA = [\n';
for (const d of data) {
  content += `  {p:"${d.p}",r:[${d.r.join(',')}],b:${d.b}},\n`;
}
content += '];\n';
content += `export default SSQ_DATA;`;

require('fs').writeFileSync('/home/admin/hermes/projects/million-life/ssq_data.js', content);
console.log('文件已写入，共' + data.length + '期');
