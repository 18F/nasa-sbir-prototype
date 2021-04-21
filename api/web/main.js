const {
  subtopics: { getAllSubtopics },
} = require("../data");

let cached = null;
let cacheExpiry = 0;

const percent = new Intl.NumberFormat("en-US", { style: "percent" });

const getSubtopics = async () => {
  if (cacheExpiry < Date.now()) {
    const subtopics = await getAllSubtopics();
    cacheExpiry = Date.now() + 10 * 60 * 1000;
    cached = subtopics.map(({ ratio, ...rest }) => ({
      ...rest,
      ratio: percent.format(ratio),
    }));
  }
  return cached;
};

const getTemplateData = async (ctx) => {
  const subtopics = await getSubtopics();

  const { sort, order } = ctx.query;
  const sorting = { desc: null };

  if (subtopics.length) {
    const key = Object.keys(subtopics[0]).includes(sort) ? sort : "id";

    subtopics.sort(({ [key]: a }, { [key]: b }) => {
      const aa = key === "id" ? a : Number.parseInt(a, 10);
      const bb = key === "id" ? b : Number.parseInt(b, 10);

      let result = 0;
      if (aa > bb) {
        result = 1;
      }
      if (aa < bb) {
        result = -1;
      }

      if (order !== "desc") {
        sorting.desc = key;
      }

      return order === "desc" ? -result : result;
    });
  }

  return { sorting, subtopics };
};

module.exports = getTemplateData;
