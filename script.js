// main ajax request function that chains all other functions together
function ajaxRequestSubject(subject, number, terms) {
	$.ajax({
		type: "GET",
		url: `https://api.uwaterloo.ca/v2/courses/${subject}/${number}.json`,
		dataType: "json",
		data: {key: apiKey},
		success: function(result) {

			if (jQuery.isEmptyObject(result.data)) {
				delLoader();
				console.log("Invalid course code");
				$("#error").css("display", "block");
				updateAutoComplete();
			}
			else if (terms[0][0] < terms[1][0]) {
				$("#courseInfo").css("display", "none");
				let restCall1 = `https://api.uwaterloo.ca/v2/terms/${terms[0][0]}/${subject}/${number}/schedule.json`;
				let restCall2 = `https://api.uwaterloo.ca/v2/terms/${terms[1][0]}/${subject}/${number}/schedule.json`;
				let restCall3 = `https://api.uwaterloo.ca/v2/courses/${subject}/${number}/examschedule.json`;

				$.when(
					ajaxCall(restCall1, parseCourseSchedule),
				).then(function() {
					return ajaxCall(restCall2, parseCourseSchedule);
				}).then(function() {
					return ajaxCall(restCall3, parseExamSchedule);
				}).done(function() {
					delLoader();
					$("#scheduleTable").children().each(function(index) {
						$(this).prepend(`<p>${terms[index][1]}</p>`);
					});
					updateCourseInfo(result.data);
					$("#courseInfo").css("display", "block");
					$(".overflow-container").each(function(index) {
						if ($(this).css("max-height") === `${$(this).innerHeight()}px`) {
							$(this).css("border-radius", "5px 0 0 0");
						}
					});
					updateAutoComplete();
				});
			}
			else {
				$("#courseInfo").css("display", "none");
				let restCall1 = `https://api.uwaterloo.ca/v2/terms/${terms[0][0]}/${subject}/${number}/schedule.json`;
				let restCall3 = `https://api.uwaterloo.ca/v2/courses/${subject}/${number}/examschedule.json`;

				$.when(
					ajaxCall(restCall1, parseCourseSchedule),
				).then(function() {
					return ajaxCall(restCall3, parseExamSchedule);
				}).done(function() {
					delLoader();
					$("#scheduleTable").children().each(function(index) {
						$(this).prepend(`<p>${terms[index][1]}</p>`);
					});
					updateCourseInfo(result.data);
					$("#courseInfo").css("display", "block");
					$(".overflow-container").each(function(index) {
						if ($(this).css("max-height") === `${$(this).innerHeight()}px`) {
							$(this).css("border-radius", "5px 0 0 0");
						}
					});
					updateAutoComplete();
				});
			}
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}


// general ajax call
function ajaxCall(url, onSuccess = (x) => x) {
	return $.ajax({
		type: "GET",
		url: url,
		dataType: "json",
		data: {key: apiKey},
		success: function(result) {
			onSuccess(result.data);
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}


// parses out the current term and next term
function currentTerm(data) {
	let terms = concatJsonObjectContent(data.listings)
	let current = data.current_term;
	let next = data.next_term;
	searchCourse([[current, termName(terms, current)], [next, termName(terms, next)]]);
}


// concatenates all values in an json object into a list
function concatJsonObjectContent(obj) {
	let list = [];
	Object.keys(obj).forEach(function(key) {
		list = list.concat(obj[key]);
	});
	return list;
}


// gets the actual name of the term
function termName(array, term) {
	let name = "";
	array.forEach(function(obj) {
		if (obj.id == term) {
			name = obj.name;
		}
	});
	return name;
}


// main function that parses the course schedule
function parseCourseSchedule(data) {
	let sections = data.length;
	let schedule = [];

	for (let i = 0; i < sections; i++) {

		let classes = data[i].classes.length;
		let time = [];
		for (let j = 0; j < classes; j++) {
			let dates = data[i].classes[j].date;
			let location = data[i].classes[j].location;
			time.push([dates.start_time, dates.end_time, dates.weekdays, dates.start_date, `${location.building} ${location.room}`]);
		}

		let instructors = [];

		for (let j = 0; j < classes; j++) {
			let name = data[i].classes[j].instructors[0];

			if (name === undefined) {
				instructors.push("N/A");
			}
			else {
				let lastFirst = name.split(",");
				instructors.push(`${lastFirst[1]} ${lastFirst[0]}`);
			}

		}

		let json =
		{"section": data[i].section, "class": data[i].class_number, "campus": data[i].campus,
		"enrollment": `${data[i].enrollment_total}/${data[i].enrollment_capacity}`, "date": time, 
		"instructors": instructors};
		schedule.push(json);
	}
	renderCourseSchedule(schedule);
}


// gets the type of a section (TUT, LEC, etc.)
function sectionType(section) {
	let name = section.split(" ");
	return name[0];
}


// adds the course schedule table to the html
function renderCourseSchedule(schedule) {
	let columns = schedule.length;

	let table = `<div><div class="overflow-container"><table>`;
	if (columns === 0) {
		table += 
		`<thead><tr class="table-caption">
			<th class="no-shadow">Section</th>
			<th class="no-shadow">Class</th>
			<th class="no-shadow">Campus</th>
			<th class="no-shadow">Enrolled</th>
			<th class="no-shadow">Time</th>
			<th class="no-shadow">Day(s)</th>
			<th class="no-shadow">Location</th>
			<th class="no-shadow">Instructor(s)</th>
		</tr></thead>`;
	}
	else {
		table += 
		`<thead><tr class="table-caption">
			<th>Section</th>
			<th>Class</th>
			<th>Campus</th>
			<th>Enrolled</th>
			<th>Time</th>
			<th>Day(s)</th>
			<th>Location</th>
			<th>Instructor(s)</th>
		</tr></thead>`;
	}

	for (let i = 0; i < columns; i++) {
		table +=
		`<tr>
		<td class="${sectionType(schedule[i].section)}">${nullCheck(schedule[i].section, "N/A")}</td>
		<td>${nullCheck(schedule[i].class, "N/A")}</td>
		<td>${nullCheck(schedule[i].campus, "N/A")}</td>
		<td>${nullCheck(schedule[i].enrollment, "N/A")}</td>
		<td>${nullCheck(schedule[i].date[0][0], "N/A")} - ${nullCheck(schedule[i].date[0][1], "N/A")}`

		// Time
		let classes = schedule[i].date.length;
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][0], "N/A")} - ${nullCheck(schedule[i].date[j][1], "N/A")}`;
		}
		table += `</td>`;

		// Days
		table += `<td>${nullCheck(schedule[i].date[0][2], "N/A")}`
		if (schedule[i].date[0][3] !== null) {
			table += ` (${nullCheck(formatDate('0/' + schedule[i].date[0][3], "/"), "")})`
		}
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][2], "N/A")}`;

			if (schedule[i].date[j][3] !== null) {
				table += ` (${nullCheck(formatDate('0/' + schedule[i].date[j][3], "/"), "")})`
			}
		}
		table += `</td>`;

		// Location
		table += `<td>${nullCheck(schedule[i].date[0][4], "N/A")}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][4], "N/A")}`;
		}
		table += `</td>`;

		// Instructor(s)
		table += `<td>${nullCheck(schedule[i].instructors[0], "N/A")}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].instructors[j], "N/A")}`;
		}
		table += `</td>`;
	}
	table += `</table></div></div>`;
	$("#scheduleTable").append(table);
}


// main function that parses the exam schedule
function parseExamSchedule(data) {
	if (!jQuery.isEmptyObject(data) && !data.sections[0].section.includes("Online")) {
		let time = JSON.parse(JSON.stringify(data.sections[0]));

		let sections = time.section;
		let length = data.sections.length;

		for (let i = 1; i < length; i++) {
			if (!data.sections[i].section.includes("Online")) {
				sections += `, ${data.sections[i].section}`
			}
		}
		time.section = sections;
		time.date = formatDate(time.date, "-");
		renderExamSchedule(time);
	}
}


// adds the exam schedule table to the html
function renderExamSchedule(data) {
	let table = `<p>Final Exam</p><div><div class="overflow-container"><table>`;
	table += 
	`<thead><tr class="table-caption">
		<th>Section(s)</th>
		<th>Date</th>
		<th>Time</th>
		<th>Location</th>
	</tr></thead>`;
	table +=
	`<tr>
		<td class="EXAM">${data.section}</td>
		<td>${data.date} (${data.day})</td>
		<td>${data.start_time} - ${data.end_time}</td>
		<td>${data.location}</td>
	</tr></table></div></div>`
	$("#examTable").append(table);
}


// converts date into its english name (format must be year-month-day)
function formatDate(date, seperator) {
	let dateArray = date.split(seperator);
	if (dateArray.includes("null")) {
		return null;
	}
	let month = dateArray[1];
	let day = dateArray[2];
	return `${getMonth(month)} ${getDay(day)}`
}


// gets the day in english
function getDay(day) {
	let lastChar = parseInt(day[day.length - 1]);
	day = parseInt(day);
	if (4 <= day && day <= 20) {
		return `${day}th`;
	}
	switch(lastChar) {
		case 1:
			return `${day}st`;
		case 2:
			return `${day}nd`;
		case 3:
			return `${day}rd`;
		default:
			return `${day}th`;
	}
}


// gets the month in english
function getMonth(month) {
	switch(parseInt(month)) {
		case 1:
			return "Jan";
		case 2:
			return "Feb";
		case 3:
			return "Mar";
		case 4:
			return "Apr";
		case 5:
			return "May";
		case 6:
			return "June";
		case 7:
			return "July";
		case 8:
			return "Aug";
		case 9:
			return "Sept";
		case 10:
			return "Oct";
		case 11:
			return "Nov";
		case 12:
			return "Dec";
		default:
			return null;
	}
}


// checks if a string is null
function nullCheck(string, returnValue) {
	string = `${string}`

	if (string.includes("null")) {
		return returnValue;
	}
	else {
		return string;
	}
}


// document event bindings
$(document).ready(function() {

	$("#searchButton").click(function() {
		if ($("#searchBox").val() !== undefined) {
			clearCourseInfo();
			addLoader();
			ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		}
	});

	$("#searchBox").focus(function() {
		let value = $(this).val();
		if (value !== undefined) {
			autoComplete(value);
		}
	});

	$("#autocomplete").on("click", ".suggestion", function() {
		clearCourseInfo();
		addLoader();
		let value = $(this).attr("id");
		$("#searchBox").val(value);
		ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		$("#autocomplete").css("display", "none");
	});

	$(document).on('keypress', function(e) {
		let value = $("#searchBox").val();
		if (e.which == 13 && value !== undefined) {
			clearCourseInfo();
			addLoader();
			ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		}
	});

	$("#searchBox").on("input", function() {
		let value = $(this).val();
		if (value !== undefined) {
			autoComplete(value);
		}
	});

	$(document).click(function(e) { 
	    var $target = $(e.target);
	    if(!$target.closest('#searchBox').length && !$target.hasClass('#searchBox') && 
	       !$target.closest('#autocomplete').length && !$target.hasClass('#autocomplete')) {
	    	$("#autocomplete").css("display", "none");
	    }
	});

	$(window).resize(function () {
		setTableOverflowScroll();
	})

})


// adds the loading icon to the html
function addLoader() {
	$(".loader").css("display", "block");
}


// remove the loading icon from the html
function delLoader() {
	$(".loader").css("display", "none");
}


// retrives and displays all course info given the terms
function searchCourse(term) {
	let input = $("#searchBox").val().replace(/ /g, '').replace(/[^\w\s]/gi, '');

	if (input.length > 0 && !(/^\d+$/.test(input))) {
		let index = firstNumberIndex(input);
		let course = [input.substring(0, index), input.substring(index)];
		if (course[0] == "" || course[1] == "") {
			delLoader();
			console.log("Invalid course code");
			$("#error").css("display", "block");
			updateAutoComplete();
		}
		else {
			ajaxRequestSubject(course[0], course[1], term);
		}
	}
	else {
		ajaxRequestSubject("default", "default", term);
	}
}


// gets the index of the first number in a string
function firstNumberIndex(string) {
	let length = string.length;
	for (let i = 0; i < length; i++) {
		if (string.charAt(i) > 0 && string.charAt(i) < 10) {
			return i;
		}
	}
}


// updates course info in html aside from course and exam schedule
function updateCourseInfo(json) {
	$("#title").html(`<span>Course:</span> ${json.subject} ${json.catalog_number}: ${json.title}`);
	$("#description").html(`<span>Description:</span> ${nullCheck(json.description, "None")}`);
	$("#antirequisites").html(`<span>Antirequisites:</span> ${nullCheck(json.antirequisites, "None")}`);
	$("#corequisites").html(`<span>Corequisites:</span> ${nullCheck(json.corequisites, "None")}`);
	$("#prerequisites").html(`<span>Prerequisites:</span> ${nullCheck(json.prerequisites, "None")}`);
	$("#links").html(
		`<span>Links:</span> <a href=${json.url} target="_blank">UWCalender</a>
		<a href=https://uwflow.com/course/${json.subject.toLowerCase()}${json.catalog_number.toLowerCase()} target="_blank">UWflow</a>`);
	$("#notes").html(
		`<span>Note:</span> All data is retrivied using the University of Waterloo's
		<a href='https://github.com/uwaterloo/api-documentation#accessing-the-api' target="_blank">Open Data API</a>.`);
}


// clears all course info from html
function clearCourseInfo() {
	$("#error").css("display", "none");
	$("#courseInfo").css("display", "none");
	$("#title").html("");
	$("#description").html("");
	$("#antirequisites").html("");
	$("#corequisites").html("");
	$("#prerequisites").html("");
	$("#links").html("");
	$("#scheduleTable").html("");
	$("#examTable").html("");
	$("#notes").html("");
}


// autocomplete suggestion box for searching courses
function autoComplete(search) {
	if ($("#searchBox").is(":focus")) {
		$("#autocomplete").html("");
		$("#autocomplete").css("display", "block");
		search = search.replace(/ /g, "");
		if (search !== "") {
			search = search.toLowerCase();
			let possibleTerms = courses.filter(x => (includesFirst(search, x.toLowerCase())));
			let length = possibleTerms.length;
			let html = "";

			let windowHeight = $(window).height();
			let bottom = $("#search-field")[0].getBoundingClientRect().bottom + $(window)['scrollTop']();;

			for (let i = 0; i < length; i++) {
				let j = possibleTerms[i].indexOf(" ");
				let data = [possibleTerms[i].slice(0, j), possibleTerms[i].slice(j)];
				html +=
				`<div class="suggestion" id="${data[0]}"><div>${data[0]}</div><div>${data[1]}</div></div>`;
			}
			setMaxHeight();
			$("#autocomplete").html(html);
		}
	}
}


// sets the max height of autocomplete without it going off screen
function setMaxHeight() {
	let windowHeight = $(window).height();
	let bottom = $("#search-field")[0].getBoundingClientRect().bottom + $(window)['scrollTop']();
	$("#autocomplete").css("max-height", windowHeight - bottom - 10);
}


// updates the autocomplete suggestions
function updateAutoComplete() {
	let value = $("#searchBox").val();
	if (value !== undefined) {
		autoComplete(value);
	}
}


// check if a a string is a substring for the first few characters
function includesFirst(compare, string) {
	let compareLength = compare.length;

	if (string.substring(0, compareLength) === compare) {
		return true;
	}
	else {
		return false;
	}
}


// Adds scroll bars to the tables if it is overflowing (else otherwise)
function setTableOverflowScroll() {
	let tableWidth = Math.max.apply(Math, $("table").map(function(){ return $(this).width(); }).get());
	let maxWidth = $("#popup").width();
	if (maxWidth < tableWidth) {
		$(".overflow-container").attr("class", "overflow-container-scroll");
		$("table").css("border", "none");
	}
	else {
		$(".overflow-container-scroll").attr("class", "overflow-container");
		$("table").css("border", "1px solid #A9A9A9");
	}
}


// gets all course names from text file
function retriveAllCourses() {
	jQuery.get('courses.txt', function(data) {
    	courses = data.split("\n");
	});
}


// gets the api key
function retriveApiKey() {
	jQuery.get('apikey.txt', function(data) {
		apiKey = data;
	});
}


// global variables
var courses;
var apiKey;

window.onload = function() {
  retriveAllCourses();
  retriveApiKey();
}