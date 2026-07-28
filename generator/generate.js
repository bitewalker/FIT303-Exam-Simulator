const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "images");
const DATA_DIR = path.join(ROOT, "data");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getQuestions(folder, difficulty, paper) {

    if (!fs.existsSync(folder)) return [];

    return fs.readdirSync(folder)
        .filter(file => {

            return IMAGE_EXTENSIONS.includes(
                path.extname(file).toLowerCase()
            );

        })
        .map(file => {

            const number = parseInt(path.parse(file).name);

            return {
                number,
                image: `images/${paper}/${difficulty}/${file}`
            };

        })
        .filter(q => !isNaN(q.number))
        .sort((a, b) => a.number - b.number);

}

function formatUnitName(folder) {
    const chapter = folder.match(/^chap(.+)$/i);
    if (chapter) {
        const numbers = chapter[1].split(/[_-]+/)
            .map(part => /^\d+$/.test(part) ? Number(part) : part)
            .join(" & ");
        return `Chapter ${numbers}`;
    }
    return folder.replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function getUnitQuestions(folder, unit) {
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder)
        .filter(file => /^p.*\.png$/i.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((file, index) => ({ number: index + 1, image: `images/units/${unit}/${file}` }));
}

if (!fs.existsSync(IMAGES_DIR)) {

    console.log("Images folder not found.");
    process.exit();

}

const paperFolders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== "units")
    .map(d => d.name);

const papers = [];

for (const paper of paperFolders) {

    console.log("Generating", paper);

    const hard = getQuestions(
        path.join(IMAGES_DIR, paper, "hard"),
        "hard",
        paper
    );

    const easy = getQuestions(
        path.join(IMAGES_DIR, paper, "easy"),
        "easy",
        paper
    );

    const output = {
        paper,
        hard,
        easy
    };

    fs.writeFileSync(

        path.join(DATA_DIR, `${paper}.json`),

        JSON.stringify(output, null, 4)

    );

    papers.push({

        paper,

        hard: hard.length,

        easy: easy.length,

        total: hard.length + easy.length

    });

}

fs.writeFileSync(

    path.join(DATA_DIR, "papers.json"),

    JSON.stringify(papers, null, 4)

);

console.log();
console.log("Done.");
console.log(`${papers.length} paper(s) generated.`);

const unitsFolder = path.join(IMAGES_DIR, "units");
const units = fs.existsSync(unitsFolder)
    ? fs.readdirSync(unitsFolder, { withFileTypes: true })
        .filter(directory => directory.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map(directory => ({
            id: directory.name,
            title: formatUnitName(directory.name),
            questions: getUnitQuestions(path.join(unitsFolder, directory.name), directory.name)
        }))
    : [];

fs.writeFileSync(
    path.join(DATA_DIR, "units.json"),
    JSON.stringify({ units }, null, 4)
);

console.log(`${units.length} unit(s) generated.`);
