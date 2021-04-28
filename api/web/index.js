import { setSubtopic } from "./subtopic/subtopic.js";
import { loadList } from "./subtopic-list/list.js";

const app = new Vue({
  el: "#app",
  data: {
    view: null,
  },
});

const switchViews = () => {
  const hash = window.location.hash.replace("#", "");
  const nav = hash.split(":").shift().toLowerCase();

  switch (nav) {
    case "subtopic":
      app.view = "single_subtopic";
      setSubtopic(initial.split(":").pop());
      break;

    default:
      app.view = "all_subtopics";
      loadList();
      break;
  }
};

// Set initial location.
switchViews();

window.addEventListener("hashchange", switchViews);

document.getElementById("app").style.display = "block";
