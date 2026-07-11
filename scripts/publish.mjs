import { cp, mkdir, readdir, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const output = resolve(source, "../../outputs/bogobot-prototype")
const expectedOutput = resolve(source, "../../outputs/bogobot-prototype")

if (output !== expectedOutput) {
  throw new Error("Unsafe publication target")
}

await mkdir(output, { recursive: true })
for (const entry of await readdir(output)) {
  await rm(resolve(output, entry), { recursive: true, force: true })
}

for (const entry of ["index.html", "app.js", "styles.css", "README.md", "assets", "books", "experiences", ".nojekyll"]) {
  await cp(resolve(source, entry), resolve(output, entry), {
    recursive: true,
    force: true,
  })
}

console.log(`Published to ${output}`)
