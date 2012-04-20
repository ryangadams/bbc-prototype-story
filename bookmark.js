	
function getPageData() {
	so = {
		"title" : "",
		"description" : "",
		"image" : "",
		"link" : "",
		"selection" : "",
		"created_at" : ""
	}
	console.log("Saving Bookmark");

	so.title = $("title").text();
	// some use description and some use Description
	so.description = $('meta[name$="escription"]').attr("content");
	if($('link[rel="canonical"]').length > 0) {
		so.link = $('link[rel="canonical"]').attr("href");
	}
	if(so.link == "") {
		so.link = window.location.href;
	}
	var news_re = /co\.uk\/news/;
	var programmes_re = /co\.uk\/programmes/;
	var iplayer_re = /^\/iplayer/;
	var wikipedia_re = /wikipedia/;
	var classclips_re = /\/learningzone\/clips/;
	var bitesize_re = /bitesize\//
	var food_re = /co\.uk\/food/;
	if(news_re.test(so.link)) {
		so.image = $('meta[property="og:image"]').attr("content");
	} else if(programmes_re.test(so.link)) {
		// programmes do some additional modifications
		so.description = $('div[property="dc:description"]').attr("content");
		so.image = $('span[rel="foaf:depiction"] img').attr("src");
		if(so.description == "" || so.description == undefined) {
			so.description = $("#synopsis").text();
		}
		if(so.image == "" || so.image == undefined) {
			so.image = $(".img-zoom img").attr("src");
		}
		if(so.image == "" || so.image == undefined) {
			//http://node2.bbcimg.co.uk/iplayer/images/clip/p00lk528_640_360.jpg
			// type = $("body").attr("id").split("-")[1];
			// pid = 
			// so.image = "http://node2.bbcimg.co.uk/iplayer/images/" + type + "/" + pid + "640_360.jpg";
			so.image = $('link[rel="image_src"]').attr("href").replace("126_71", "640_360");
		}
	} else if(iplayer_re.test(so.link)) {
		console.log("iplayer");
		// programmes do some additional modifications
		so.description = $('div.short-synopsis').text();
		so.image = $('meta[property="og:image"]').attr("content");
	} else if(wikipedia_re.test(so.link)) {
		so.image = $(".infobox img").filter(":first").attr("src");
		so.description = $(".mw-content-ltr p").filter(":first").text();
	} else if(classclips_re.test(so.link)) {
		console.log("classclips!");
		so.image = $("#my_dom_id embed").attr("flashvars").split("&")[3].split("=")[1].replace("/clips/s_medi", "/images/previews/s_medi").replace("_bb.xml", ".jpg").replace("/bb", "");
	} else if(bitesize_re.test(so.link)) {
		console.log("a bitesize bookmark");
		so.description = $(".abstract").text();
		if(!so.description) {
			so.description = $("title").text();
		}
		if($("#bs-bnr img").length > 0) {
			so.image = $("#bs-bnr img").filter(":first").attr("src");
		} else {
			so.image = $("#bs-bnr a img").css("background-image").substring(4).replace(".png)", ".png");
		}
	} else if(food_re.test(so.link)) {
		console.log("food!");
		so.image = $("#column-1 img").filter(":first").attr("src");
	}
	
	if(so.image == undefined || so.image == "") {
		console.log("an image hasn't been set, taking the first one");
		if($("#blq-content").length > 0) {
			so.image = $("#blq-content img").filter(":first").attr("src");
		} else if($("#bbcpageTableContent").length > 0) {
			//barley
			so.image = $('#bbcpageTableContent img').not('[alt=""]').filter(":first").attr("src");
		}
	}	
	if(so.image == undefined || so.image == "") {
		// old style news pages hack
		console.log("using storybody to get image");
		so.image = $(".storybody td div>img").filter(":first").attr("src");
	}
	
	if(so.image && /^http/.test(so.image) == false) {
		// not an absolute url
		if(so.image.charAt(0) == "/" && so.image.charAt(1) != "/") {
			so.image = 'http://www.bbc.co.uk' + so.image;
		} else if(so.image.substring(0,2) == "//") {
			so.image = "http:" + so.image;
		} else if(so.image.charAt(0) == ".") {
			currentURL = window.location.href;
			so.image = currentURL.substring(0, currentURL.lastIndexOf("/")) + "/" + so.image;
		}
		console.log("Fixed non absolute url to be " + so.image);
	}

	so.created_at = $.now();
	if(window.getSelection) {
		so.selection = window.getSelection().toString();
	}
	console.log("about to send the bookmark to the extension");
	chrome.extension.sendRequest({storageObject: so}, function(response) {
		console.log("bookmark saved");
		$("#bbc-prototype-story-bookmark-bar").remove();      
		getAndBuildBookmarks();
	});
}
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
	console.log("REQUEST IS " + request);
	if(request.bookmark && $("#bbc-prototype-story-bookmark-bar").length > 0) {
		// bookmarks are visible - bookmark this page
		console.log("getting data");
		getPageData();
	} else if(request.bookmark) {
		// bookmarks aren't visible - just show them
		getAndBuildBookmarks();
	}

    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
    else
      sendResponse({}); // snub them.
  });
function addBookmarkToBar(bookmark, bar) {
	bm = $('<li id="' + generateID(bookmark.link) + '"><a class="remove" href="#">REMOVE</a><a class="link" href="' + bookmark.link +'">' +
		'<span class="title">' + bookmark.title + '</span>' +
		'<img src="' + bookmark.image + '" alt="" /></a>' +
		'<span class="description">' + bookmark.description + '</span></li>');
	$("ul", bar).append(bm);
}
function buildBookmarksViewer(bookmarks) {
	console.log(bookmarks);
	$("#bbc-prototype-story-bookmark-bar").remove();
	bar = $('<div id="bbc-prototype-story-bookmark-bar"><ul></ul></div>');
	for(var i=0;i<bookmarks.length;i++) {
		addBookmarkToBar(bookmarks[i], bar);
	}
	background_page = chrome.extension.getURL("toggle-options.html");
	bar.prepend('<p><a href="' + background_page + '">View Story</a></p>');
	$("body").append(bar);
	$("ul", bar).width($("li", bar).length * 220 + 30);
	$("#bbc-prototype-story-bookmark-bar .remove").click(function(e){
		e.preventDefault();
		item_id = $(this).parent().find("a.link").attr("href");
		console.log("removing: " + item_id);
		removeItem(item_id)
	});
}
function generateID(item_id) {
	return encodeURIComponent(item_id).replace(/\%/g, '_').replace(/\./g, '_').replace(/\(/g, '_').replace(/\)/g, '_');
}
function getAndBuildBookmarks() {
	console.log("getting bookmarks");
	chrome.extension.sendRequest({bookmarks: "get"}, function(response) {
		buildBookmarksViewer(response.bookmarks);
	});
}
function removeItem(item_id) {
	chrome.extension.sendRequest({remove: "true", item: item_id}, function(response) {
	  if(response.success) {
		actual_id = generateID(item_id);
		$('#' + actual_id).fadeOut("slow", function(){
			$(this).remove();
		})
	  }
	});
}
$(document).ready(function(){
//	getAndBuildBookmarks();
});