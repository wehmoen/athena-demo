const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const phrase = "Hello Earth!".split("");

for (const letter of phrase) {
    process.stdout.write(letter);
    await sleep(500);
}
