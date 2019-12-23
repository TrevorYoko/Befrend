var name = "";
var age = "";
var instagramHandle = "";
var bio = "";
var loginJson = "";

//document.cookie = "";
$('#loginInfo').submit(function () {
    name = $('#name').val();
    age = $('#age').val();
    instagramHandle = $('#instagramHandle').val();
    bio = $('#bio').val();
    loginJson = {
        "name": name,
        "age": age,
        "instagramHandle": instagramHandle,
        "bio": bio
    };

    Cookies.remove();
    var cookieStr = JSON.stringify(loginJson);
    Cookies.set('login', cookieStr);


    window.location.replace("/maps");
    return false;
});



console.log(loginJson);
