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
});

subtopics.then((all) => {
  Object.values(all).forEach((subtopic) => {
    subtopic.ratio = percent.format(subtopic.ratio);
  });
  app.subtopics = Object.entries(all);
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
