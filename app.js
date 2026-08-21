/* =========================================================
   TELEGRAM
========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
"https://mshoftgubfbkvynndtnu.supabase.co";

const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaG9mdGd1YmZia3Z5bm5kdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDkwOTQsImV4cCI6MjEwMjIyNTA5fQ.vcebPtNubpl8s34D-YsZ6jQwH93-MA0wgyDZBiO0Hi4";

const POSTS_API =
`${SUPABASE_URL}/rest/v1/posts`;


/* =========================================================
   STATE
========================================================= */

const videos = [];

let selectedVideo = null;

let adsWatched = 0;

const requiredAds = 3;

let adLoading = false;


/* =========================================================
   DOM
========================================================= */

const videoGrid =
document.getElementById("videoGrid");

const modal =
document.getElementById("modal");

const modalTitle =
document.getElementById("modalTitle");

const modalText =
document.getElementById("modalText");

const preview =
document.getElementById("preview");

const watchAdBtn =
document.getElementById("watchAdBtn");

const videoBtn =
document.getElementById("videoBtn");

const progressBar =
document.getElementById("progressBar");

const adCount =
document.getElementById("adCount");

const closeModal =
document.getElementById("closeModal");

const tgUser =
document.getElementById("tgUser");


/* =========================================================
   USER
========================================================= */

if(
 tg?.initDataUnsafe?.user &&
 tgUser
){

 tgUser.textContent =
 tg.initDataUnsafe.user.first_name ||
 "Telegram User";

}


/* =========================================================
   LOAD VIDEOS FROM SUPABASE
========================================================= */

async function loadPosts(){

videoGrid.innerHTML=`

<div class="loading">
Loading videos...
</div>

`;


try{


const res =
await fetch(
`${POSTS_API}?select=*&order=created_at.desc`,
{

headers:{

apikey:
SUPABASE_ANON_KEY,

Authorization:
`Bearer ${SUPABASE_ANON_KEY}`

}

});


if(!res.ok){

throw new Error(
await res.text()
);

}


const data =
await res.json();


videos.length=0;


data.forEach(post=>{


videos.push({

id:
post.id,

title:
post.title ||
"Untitled Video",

category:
post.category ||
"Trending",

thumbnail:
post.thumbnail_url ||
"",

videoUrl:
post.video_url ||
""

});


});


render("All");


console.log(
"Videos:",
videos
);


}catch(err){


console.error(
err
);


videoGrid.innerHTML=`

<div class="error-box">

<h3>
Unable to load videos
</h3>

<p>
${err.message}
</p>

</div>

`;


}

}



/* =========================================================
   RENDER VIDEO CARD
========================================================= */

function render(category="All"){


videoGrid.innerHTML="";


let list =
category==="All"
?
videos
:
videos.filter(v=>
String(v.category).toLowerCase()
===
String(category).toLowerCase()
);



if(!list.length){

videoGrid.innerHTML=`

<div class="loading">
No videos found.
</div>

`;

return;

}



list.forEach(video=>{


const card =
document.createElement("article");


card.className =
"video-card";


card.innerHTML=`

<div class="thumb">

<img src="${video.thumbnail}">

</div>


<div class="card-body">

<h3>
${escapeHTML(video.title)}
</h3>


<div class="meta">
${escapeHTML(video.category)}
</div>


<button class="open-btn">
🔒 Watch Ad
</button>


</div>

`;



card.querySelector(".open-btn")
.onclick=()=>{

openVideo(video);

};



card.querySelector(".thumb")
.onclick=()=>{

openVideo(video);

};



videoGrid.appendChild(card);


});


}



/* =========================================================
   OPEN MODAL
========================================================= */

function openVideo(video){


selectedVideo =
video;


adsWatched=0;


modalTitle.textContent =
video.title;


modalText.textContent =
"Watch 3 ads to unlock video.";


preview.innerHTML=`

<img src="${video.thumbnail}">

`;


modal.classList.remove(
"hidden"
);


updateUnlockUI();


}

/* =========================================================
   UPDATE UNLOCK UI
========================================================= */

function updateUnlockUI(){


watchAdBtn.textContent =
`▶ Watch Ad (${adsWatched}/${requiredAds})`;


adCount.textContent =
`${adsWatched} / ${requiredAds} Ads Completed`;


progressBar.style.width =
`${(adsWatched / requiredAds) * 100}%`;



if(
adsWatched >= requiredAds
){

videoBtn.disabled =
false;


videoBtn.textContent =
"▶ Watch Video";


modalText.textContent =
"🎉 All ads completed! Your video is unlocked.";


watchAdBtn.disabled =
true;


watchAdBtn.textContent =
"✓ Ads Completed";


}

else{


videoBtn.disabled =
true;


videoBtn.textContent =
"🔒 Video Locked";


}

}



/* =========================================================
   AD NOT COMPLETED MESSAGE
========================================================= */

function adNotCompleted(){


modalText.innerHTML = `

<div style="text-align:center">

<h3>
⚠️ বিজ্ঞাপন সম্পূর্ণ হয়নি
</h3>

<p>
আপনি বিজ্ঞাপনের ভিতরের
<b>Continue</b>
বাটনে ক্লিক করে বিজ্ঞাপনটি সম্পূর্ণ করুন।
</p>


<hr>


<h3>
⚠️ Ad Not Completed
</h3>

<p>
Please click the
<b>Continue</b>
button inside the ad
to complete the advertisement.
</p>


</div>

`;

}



/* =========================================================
   MONETAG REWARDED AD
========================================================= */

async function showRewardedAd(){


if(adLoading)
return;


if(adsWatched >= requiredAds)
return;



adLoading=true;


watchAdBtn.disabled=true;


watchAdBtn.textContent =
"⏳ Loading Ad...";



try{


if(
typeof window.show_11571866 !== "function"
){

throw new Error(
"Monetag SDK not loaded"
);

}



/*
  IMPORTANT

  Count only after SDK success
*/


const result =
await window.show_11571866();



console.log(
"Ad Result:",
result
);



/*
  Completed হলে count হবে

  না হলে warning
*/


if(
result === true ||
result?.completed === true ||
result?.reward === true
){


adsWatched++;


updateUnlockUI();


}

else{


adNotCompleted();


watchAdBtn.disabled=false;


watchAdBtn.textContent =
`▶ Watch Ad (${adsWatched}/${requiredAds})`;

}


}
catch(error){


console.error(
"Ad Error:",
error
);


adNotCompleted();



watchAdBtn.disabled=false;


watchAdBtn.textContent =
`▶ Watch Ad (${adsWatched}/${requiredAds})`;



}



adLoading=false;


}



/* =========================================================
   WATCH AD BUTTON
========================================================= */

watchAdBtn.onclick =
showRewardedAd;



/* =========================================================
   VIDEO UNLOCK BUTTON
========================================================= */

videoBtn.onclick=()=>{


if(!selectedVideo)
return;


if(
adsWatched < requiredAds
)
return;



window.location.href =
`video.html?id=${selectedVideo.id}`;


};




/* =========================================================
   CLOSE MODAL
========================================================= */

closeModal.onclick=()=>{

modal.classList.add(
"hidden"
);

};




modal.onclick=(e)=>{


if(e.target===modal){

modal.classList.add(
"hidden"
);

}

};




/* =========================================================
   CATEGORY
========================================================= */


document
.querySelectorAll(".category-btn")
.forEach(btn=>{


btn.onclick=()=>{


document
.querySelectorAll(".category-btn")
.forEach(b=>{

b.classList.remove("active");

});


btn.classList.add(
"active"
);



render(
btn.dataset.category
);


};


});





/* =========================================================
   BOTTOM NAV
========================================================= */


document
.querySelectorAll(".bottom-nav button")
.forEach(btn=>{


btn.onclick=()=>{


render(
btn.dataset.bottomCategory
);


};


});





/* =========================================================
   ESCAPE HTML
========================================================= */


function escapeHTML(str){


return String(str ?? "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");


}




/* =========================================================
   START APP
========================================================= */

loadPosts();
