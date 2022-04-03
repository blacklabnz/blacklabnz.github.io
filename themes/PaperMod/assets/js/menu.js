window.onclick = function(event) {

  if (event.target.matches('.dropbtn') || 
     event.target.parentNode.matches('.dropbtn')
  ) {
   document.getElementById("dropdonwBox").classList.toggle("show");
  }
  else {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }  
}
