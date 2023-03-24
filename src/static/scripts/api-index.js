$(document).ready(() => {
    $(".drawer").click(function () {
        if (this.classList.contains("closed")) {
            this.children[0].innerHTML = "keyboard_arrow_down";
            this.classList.remove("closed");
            this.classList.add("open");
            this.nextSibling.classList.remove("hidden");
        } else {
            this.children[0].innerHTML = "chevron_right";
            this.classList.remove("open");
            this.classList.add("closed");
            this.nextSibling.classList.add("hidden");
        }
    });
});
