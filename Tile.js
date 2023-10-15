export default class Tile {
  #tileElement;
  #x;
  #y;
  #value;

  constructor(tileContainer, value = Math.random() > 0.5 ? 1 : 2) {
    this.#tileElement = document.createElement("div");
    this.#tileElement.classList.add("tile");
    const img = document.createElement("img");
    this.#tileElement.append(img);
    tileContainer.append(this.#tileElement);
    this.value = value;
  }

  get value() {
    return this.#value;
  }
  set value(v) {
    this.#value = v;
    const img = this.#tileElement.querySelector("img");
    img.src = `imgs/${v}.jpg`;
    img.style.borderRadius = "1vmin";
    img.style.width = "100%";
    img.style.height = "100%";
  }
  set x(value) {
    this.#x = value;
    this.#tileElement.style.setProperty("--x", value);
  }
  set y(value) {
    this.#y = value;
    this.#tileElement.style.setProperty("--y", value);
  }

  remove() {
    this.#tileElement.remove();
  }

  waitForTransition(animation = false) {
    return new Promise((resolve) => {
      this.#tileElement.addEventListener(
        animation ? "animationend" : "transitionend",
        resolve,
        {
          once: true,
        }
      );
    });
  }
}
