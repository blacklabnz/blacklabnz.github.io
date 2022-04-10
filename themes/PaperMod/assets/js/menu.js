var dropbtn = document.getElementsByClassName("dropbtn")[0];
if (dropbtn != null) {
  dropbtn.addEventListener("click", () => { document.getElementById("dropdonwBox").classList.toggle("show"); });
}

window.addEventListener("click", (event) => {
  if (event.target.matches("i.fas.fa-bars")) {
  }
  else {
    var dropdownMenu = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdownMenu.length; i++) {
      var openDropdown = dropdownMenu[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  } 
})