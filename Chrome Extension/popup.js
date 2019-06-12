function ajaxRequestSubject(subject, number) {
	$.ajax({
		type: "GET",
		url: `https://api.uwaterloo.ca/v2/courses/${subject}/${number}.json`,
		dataType: "json",
		data: {key: "043f31a8bada20f13b879fea1e64af16"},
		success: function(result) {
			if (jQuery.isEmptyObject(result.data)) {
				console.log("Invalid course code");
			}
			else {
				//console.log(result);
				updateCourseInfo(result.data);
			}
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}

$(document).ready(function() {
	$("#searchButton").bind("click", function() {
		let input = $("#searchBox").val().replace(/ /g, '');

		if (input.length > 0) {
			let index = firstNumberIndex(input);
			let course = [input.substring(0, index), input.substring(index)];
			console.log(course);
			ajaxRequestSubject(course[0], course[1]);
		}
		else {
			ajaxRequestSubject("default", "default");
		}
	});
})

function firstNumberIndex(string) {
	let length = string.length;
	for (let i = 0; i < length; i++) {
		if (string.charAt(i) > 0 && string.charAt(i) < 10) {
			return i;
		}
	}
}

function updateCourseInfo(json) {
	//alert(json.title);
	$("#title").html(`${json.subject} ${json.catalog_number}: ${json.title}`);
	$("#description").html(json.description);
	$("#antirequisites").html(json.antirequisites);
	$("#corequisites").html(json.corequisites);
	$("#prerequisites").html(json.prerequisites);
}