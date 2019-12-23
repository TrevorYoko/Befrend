function goBack() {
        window.location.replace("/maps");
}

$("button").click(function() {
    var aClass= this.className;
    if(aClass != "cancel") {
        //$.post("/maps/checkIn" + encodeURI("?_id=" + aClass) );
        window.location.replace("/maps/more_info" + encodeURI("?_id=" + aClass));
    }
});