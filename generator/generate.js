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

if (!fs.existsSync(IMAGES_DIR)) {

    console.log("Images folder not found.");
    process.exit();

}

const paperFolders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
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