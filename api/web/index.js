import { setSubtopic } from "./subtopic/subtopic.js";
import "./subtopic-list/list.js";

const app = new Vue({
  el: "#app",
  data: {
    view: null,
  },
});

{
  // Set initial location.
  const initial = window.location.hash.replace("#", "");
  const nav = initial.split(":").shift().toLowerCase();
  switch (nav) {
    case "subtopic":
      app.view = "single_subtopic";
      setSubtopic(initial.split(":").pop());
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
      app.view = "single_subtopic";
      setSubtopic(hash.split(":").pop());
      break;
    default:
      app.view = "all_subtopics";
      break;
  }
});

document.getElementById("app").style.display = "block";
