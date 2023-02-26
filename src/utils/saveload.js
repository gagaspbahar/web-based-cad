// save shape in gl canvas to a txt file
function saveConfig() {
    console.log(shapes)
    var textToWrite = JSON.stringify(shapes);
    var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
    var fileNameToSaveAs = "config.txt";
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    } else {
        // Firefox requires the link to be added to the DOM before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }
    downloadLink.click();
}

// load shape from a txt file to gl canvas
function loadConfig() {
    var file = document.getElementById("load").files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var text = reader.result;
        shapes = JSON.parse(text);
        console.log(shapes);
    }
    reader.readAsText(file);
    drawcanvas();
}