import { API_URL } from "../env.js";

const percent = new Intl.NumberFormat("en-US", { style: "percent" });

const data = {
  subtopics: [],
};

Vue.component("subtopic-list", async (resolve) => {
  const response = await fetch("subtopic-list/list.html");
  resolve({
    data: () => data,
    methods: {
      sortSubtopicsBy: (() => {
        let last;
        let ascending = true;

        return (property) => {
          if (property === last) {
            ascending = !ascending;
          } else {
            ascending = true;
          }
          last = property;

          data.subtopics.sort(({ [property]: a }, { [property]: b }) => {
            const aa = property === "ratio" ? Number.parseInt(a, 10) : a;
            const bb = property === "ratio" ? Number.parseInt(b, 10) : b;

            let result = 0;
            if (aa > bb) {
              result = 1;
            }
            if (aa < bb) {
              result = -1;
            }

            return ascending ? result : -result;
          });
        };
      })(),
    },
    props: ["show"],
    template: await response.text(),
  });
});

fetch(`${API_URL}/v1/subtopics/`)
  .then((response) => response.json())
  .then((subtopics) => {
    Object.values(subtopics).forEach((subtopic) => {
      subtopic.ratio = percent.format(subtopic.ratio);
    });
    subtopics.sort(({ id: a }, { id: b }) => {
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
      return 0;
    });

    data.subtopics = subtopics;
  });
