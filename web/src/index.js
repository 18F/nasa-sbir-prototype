/* globals Vue */

import { subtopics, setSubtopic } from "./subtopic.js";

const percent = new Intl.NumberFormat("en-US", { style: "percent" });

const app = new Vue({
  el: "#app",
  data: {
    view: null,
    subtopics: null,
    subtopic: null,
  },
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

        app.subtopics.sort(({ [property]: a }, { [property]: b }) => {
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
});

subtopics.then((all) => {
  Object.values(all).forEach((subtopic) => {
    subtopic.ratio = percent.format(subtopic.ratio);
  });
  all.sort(({ id: a }, { id: b }) => {
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  });
  app.subtopics = all;
});

{
  // Set initial location.
  const initial = window.location.hash.replace("#", "");
  const nav = initial.split(":").shift().toLowerCase();
  switch (nav) {
    case "subtopic":
      setSubtopic(app, initial.split(":").pop());
      break;

    default:
      app.view = "all_subtopics";
      break;
  }
}

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  const nav = hash.split(":").shift().toLowerCase();

  switch (nav) {
    case "subtopic":
      setSubtopic(app, hash.split(":").pop());
      break;
    default:
      app.view = "all_subtopics";
      break;
  }
});

document.getElementById("app").style.display = "block";
